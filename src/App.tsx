import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Mail,
  Linkedin,
  LayoutDashboard,
  Settings,
  Bell,
  CheckCircle2,
  Globe,
  Plus,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Sun,
  Moon,
  Download,
  Filter,
  ArrowUpRight,
  Shield,
  TrendingUp,
  Target,
  Copy,
  X,
  Sparkles,
  Send,
  Loader2,
  Zap,
  Upload,
  Eye,
  MousePointer,
  Reply,
  Menu,
  Play,
  Pause,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Trash2,
  Clock,
  Edit,
  Edit2,
  LogOut,
  Camera,
  Check,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import type { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  status: 'verified' | 'pending' | 'failed';
  linkedin: string;
  role: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  orgWebsite?: string;
  website?: string; // Company website URL (from Google search or manual entry)
  googleRating?: number; // Google star rating (1-5)
  googleReviewCount?: number; // Number of Google reviews
  orgSize?: string;
  orgIndustry?: string;
  seniority?: string;
  functional?: string;
  score: number;
  tags?: string[];
  generatedEmail?: { subject: string; body: string };
  emailSendStatus?: 'draft' | 'sent' | 'failed';
  isFavorite?: boolean;
  createdAt?: string; // When lead was added to database
}

interface Campaign {
  id: string;
  name: string;
  createdAt: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
  leadIds: string[];
  emailTemplate?: { subject: string; body: string };
  senderName: string;
  senderEmail: string;
  metrics: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  };
  schedule?: {
    startDate: string;
    dailyLimit: number;
  };
  followUpSequence?: FollowUpSequence;
  abTest?: {
    variantA: { subject: string; recipientCount: number; opens: number };
    variantB: { subject: string; recipientCount: number; opens: number };
    testSize: number;
    winner?: 'A' | 'B';
  };
  scheduledSend?: {
    scheduledFor: string;
    timezone: string;
  };
}

interface EmailLog {
  id: string;
  campaignId: string;
  leadId: string;
  leadName: string;
  leadEmail: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  subject: string;
  body?: string;
  errorMessage?: string;
  senderName?: string; // For A/B/C/D testing sender performance
  senderEmail?: string;
}

interface ScheduledEmail {
  id: string;
  lead: Lead;
  subject: string;
  body: string;
  scheduledFor: string; // ISO datetime
  senderName: string; // Auto-assigned via rotation
  senderEmail: string;
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon?: 'lead' | 'email' | 'campaign' | 'reply' | 'error';
}

interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  usageCount: number;
}

interface FollowUpSequence {
  steps: Array<{
    delayDays: number;
    condition: 'no_reply' | 'no_open' | 'always';
    subject: string;
    body: string;
  }>;
}

// --- Constants ---
const LEAD_TAGS = [
  { id: 'test', label: 'Test', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  { id: 'hot', label: 'Hot', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { id: 'warm', label: 'Warm', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'cold', label: 'Cold', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' },
  { id: 'follow-up', label: 'Follow-up', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  { id: 'replied', label: 'Replied', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'closed-won', label: 'Closed Won', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
  { id: 'not-interested', label: 'Not Interested', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)' },
];

// Sender Email Rotation - A/B/C/D Testing with Unique Personalities
const SENDER_EMAILS = [
  {
    name: 'Marcel',
    email: 'Marcel@nexlioutreach.net',
    color: '#3B82F6',
    photo: '/sender-photos/marcel.png',
    role: 'Founder',
    personality: 'Founder of Nexli Automation who BUILT the Digital Rainmaker System specifically for CPA firms. Expert on the complete 3-part system: (1) Premium custom websites for CPAs, (2) 24/7 AI automation that responds to leads in under 60 seconds (the "78% choose first responder" stat is personal to you), and (3) Google review amplification engine. You understand CPA pain points deeply—tool overload, missed leads from slow response, manual admin work. Speaks from vision and passion for solving these problems. Direct, authentic, entrepreneurial. You built this because you saw firms losing clients to faster competitors. Conversational and genuine—not salesy.'
  },
  {
    name: 'Justine',
    email: 'Justine@nexlioutreach.net',
    color: '#8B5CF6',
    photo: '/sender-photos/justine.png',
    role: 'COO',
    personality: 'Chief Operating Officer who RUNS the Digital Rainmaker operations and sees results daily. Expert on the client portal (engagement letters with e-sign, tax organizers, invoicing, client messaging, CRM—all in one). Sees how firms save 12-18 hours/week by automating intake, document collection, and follow-ups. Sweet but gritty—goes above and beyond for clients. Action-oriented and reliable. Knows the operational wins: firms going from 6 disconnected tools to 1 unified platform, cutting costs 60-70%, never missing a lead. Balances warmth with no-nonsense efficiency. Speaks from operational excellence and real client transformations.'
  },
  {
    name: 'Bernice',
    email: 'Bernice@nexlioutreach.net',
    color: '#EC4899',
    photo: '/sender-photos/bernice.png',
    role: 'Client Success Lead',
    personality: 'Client Success expert who helps CPA firms WIN with the Digital Rainmaker System. Master persuader who knows how to move prospects to action. Deeply understands the review amplification engine (taking firms from 4-12 reviews to 80+ for local dominance) and the AI automation that never lets a lead slip through. Gives genuine compliments and uses positive reinforcement. Warm, encouraging, motivational. Creates urgency through enthusiasm, not pressure. Knows the stats cold: 78% choose first responder, most firms take 4+ hours (that\'s why they lose). Sells the OUTCOME (never miss a lead, scale without hiring, dominate local search) not the features. Conversational and authentic.'
  },
  {
    name: 'Jian',
    email: 'Jian@nexlioutreach.net',
    color: '#10B981',
    photo: '/sender-photos/jian.png',
    role: 'Solutions Architect',
    personality: 'The silent killer. Solutions Architect who designed the technical backbone of the Digital Rainmaker System. Breaks down complex automation (missed-call text-back, AI chat, auto-booking, nurture sequences, quantum-resistant encryption) into simple outcomes a 60-year-old CPA partner can understand. Emphasizes RESULTS over features: "You respond to every lead in 60 seconds, even at 2am" not "We have AI automation." Sells the destination (never lose a lead, save 18 hours/week, cut software costs 60%) not the flights (how the tech works). Clear, simple, results-focused. Makes technical concepts relatable. Conversational and straight to the point.'
  },
];

// --- Lead Scoring ---
function calculateLeadScore(lead: {
  email: string;
  status: string;
  linkedin: string;
  orgSize?: string;
  seniority?: string;
  orgWebsite?: string;
  functional?: string;
}): number {
  let score = 0;
  if (lead.status === 'verified') score += 20;
  if (lead.linkedin) score += 10;

  // Safe string conversion with type checking
  const size = String(lead.orgSize || '');
  if (size.includes('1-10') || size.includes('11-20') || size.includes('21-50')) score += 20;

  const sen = String(lead.seniority || '').toLowerCase();
  if (['c-suite', 'owner', 'partner', 'founder'].some((s) => sen.includes(s))) score += 25;

  if (lead.orgWebsite) score += 10;

  const fn = String(lead.functional || '').toLowerCase();
  if (fn.includes('accounting') || fn.includes('finance')) score += 10;

  return Math.min(score, 95);
}

function getScoreTier(score: number): { label: string; color: string; bg: string } {
  if (score >= 60) return { label: 'Hot', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
  if (score >= 30) return { label: 'Warm', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
  return { label: 'Cold', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' };
}

// --- CSV Export ---
function exportLeadsToCSV(leads: Lead[]) {
  const headers = ['Name', 'Email', 'Company', 'Role', 'Status', 'Score', 'Google Rating', 'Review Count', 'LinkedIn', 'Phone', 'City', 'State', 'Country', 'Website', 'Company Size', 'Industry'];
  const rows = leads.map((l) => [
    l.name, l.email, l.company, l.role, l.status, l.score,
    l.googleRating || '', l.googleReviewCount || '',
    l.linkedin, l.phone || '', l.city || '', l.state || '', l.country || '',
    l.website || l.orgWebsite || '', l.orgSize || '', l.orgIndustry || '',
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexli-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Sender Email Rotation - Get next sender in round-robin fashion
function getNextSender(currentIndex: number): { name: string; email: string; color: string; index: number } {
  const nextIndex = (currentIndex + 1) % SENDER_EMAILS.length;
  return { ...SENDER_EMAILS[nextIndex], index: nextIndex };
}

// Fill email template with lead data
function fillTemplate(template: EmailTemplate, lead: Lead): { subject: string; body: string } {
  const variables: Record<string, string> = {
    '{{firstName}}': lead.name.split(' ')[0] || lead.name,
    '{{lastName}}': lead.name.split(' ').slice(1).join(' ') || '',
    '{{fullName}}': lead.name,
    '{{company}}': lead.company,
    '{{role}}': lead.role,
    '{{email}}': lead.email,
    '{{city}}': lead.city || '',
    '{{state}}': lead.state || '',
    '{{country}}': lead.country || '',
    '{{phone}}': lead.phone || '',
  };

  let subject = template.subject;
  let body = template.body;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });

  return { subject, body };
}

// Look up company website using Google Custom Search API
async function lookupWebsite(companyName: string, city?: string, state?: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.warn('Google Custom Search API credentials not configured');
    return null;
  }

  try {
    // Build search query: "Company Name City State"
    const query = [companyName, city, state].filter(Boolean).join(' ');
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Return the first result's URL
      const websiteUrl = data.items[0].link;
      console.log(`Found website for ${companyName}: ${websiteUrl}`);
      return websiteUrl;
    }

    return null;
  } catch (error) {
    console.error('Error looking up website:', error);
    return null;
  }
}

// Look up Google rating and review count using Google Places API
async function lookupGoogleRating(companyName: string, city?: string, state?: string): Promise<{ rating: number; reviewCount: number } | null> {
  try {
    // Call serverless API endpoint (avoids CORS issues)
    const response = await fetch('/api/lookup-google-rating', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, city, state }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API error:', error);
      return null;
    }

    const data = await response.json();

    if (data.rating) {
      console.log(`Found rating for ${companyName}: ${data.rating}⭐ (${data.reviewCount} reviews)`);
      return { rating: data.rating, reviewCount: data.reviewCount };
    }

    return null;
  } catch (error) {
    console.error('Error looking up Google rating:', error);
    return null;
  }
}

// Batch process website lookups to avoid rate limits and timeouts
async function batchLookupWebsites<T extends { company?: string; city?: string; state?: string; orgWebsite?: string; website?: string }>(
  leads: T[],
  batchSize: number = 5,
  delayMs: number = 500
): Promise<T[]> {
  const results = [...leads];

  // Find leads that need website lookup
  const needsLookup = leads
    .map((lead, index) => ({ lead, index }))
    .filter(({ lead }) => !lead.orgWebsite && lead.company && (lead.city || lead.state));

  console.log(`Looking up websites for ${needsLookup.length} leads (batched in groups of ${batchSize})...`);

  // Process in batches
  for (let i = 0; i < needsLookup.length; i += batchSize) {
    const batch = needsLookup.slice(i, i + batchSize);

    // Process batch in parallel
    await Promise.all(
      batch.map(async ({ lead, index }) => {
        const website = await lookupWebsite(lead.company!, lead.city, lead.state);
        if (website) {
          results[index].website = website;
        }
      })
    );

    // Delay between batches to respect rate limits
    if (i + batchSize < needsLookup.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // Set orgWebsite as website for leads that already have it
  results.forEach(lead => {
    if (lead.orgWebsite && !lead.website) {
      lead.website = lead.orgWebsite;
    }
  });

  return results;
}

// Background enrichment for websites AND ratings with progress tracking
async function enrichDataInBackground<T extends {
  company?: string;
  city?: string;
  state?: string;
  orgWebsite?: string;
  website?: string;
  googleRating?: number;
  googleReviewCount?: number;
}>(
  leads: T[],
  options: {
    enrichWebsites: boolean;
    enrichRatings: boolean;
    onProgress: (websites: { current: number; total: number }, ratings: { current: number; total: number }) => void;
  },
  batchSize: number = 5,
  delayMs: number = 500
): Promise<T[]> {
  const results = [...leads];

  // Find leads that need website lookup
  const needsWebsite = options.enrichWebsites
    ? leads.map((lead, index) => ({ lead, index })).filter(({ lead }) => !lead.orgWebsite && !lead.website && lead.company && (lead.city || lead.state))
    : [];

  // Find leads that need rating lookup
  const needsRating = options.enrichRatings
    ? leads.map((lead, index) => ({ lead, index })).filter(({ lead }) => !lead.googleRating && lead.company && (lead.city || lead.state))
    : [];

  console.log(`Background enrichment: ${needsWebsite.length} websites, ${needsRating.length} ratings to find...`);

  let websiteCompleted = 0;
  let ratingCompleted = 0;

  options.onProgress(
    { current: 0, total: needsWebsite.length },
    { current: 0, total: needsRating.length }
  );

  // Process websites and ratings in parallel batches
  const maxItems = Math.max(needsWebsite.length, needsRating.length);

  for (let i = 0; i < maxItems; i += batchSize) {
    const websiteBatch = needsWebsite.slice(i, i + batchSize);
    const ratingBatch = needsRating.slice(i, i + batchSize);

    // Process both batches in parallel
    await Promise.all([
      // Website lookups
      ...websiteBatch.map(async ({ lead, index }) => {
        try {
          const website = await lookupWebsite(lead.company!, lead.city, lead.state);
          if (website) {
            results[index].website = website;
          }
        } catch (error) {
          console.error(`Failed to lookup website for ${lead.company}:`, error);
        }
        websiteCompleted++;
        options.onProgress(
          { current: websiteCompleted, total: needsWebsite.length },
          { current: ratingCompleted, total: needsRating.length }
        );
      }),
      // Rating lookups
      ...ratingBatch.map(async ({ lead, index }) => {
        try {
          const ratingData = await lookupGoogleRating(lead.company!, lead.city, lead.state);
          if (ratingData) {
            results[index].googleRating = ratingData.rating;
            results[index].googleReviewCount = ratingData.reviewCount;
          }
        } catch (error) {
          console.error(`Failed to lookup rating for ${lead.company}:`, error);
        }
        ratingCompleted++;
        options.onProgress(
          { current: websiteCompleted, total: needsWebsite.length },
          { current: ratingCompleted, total: needsRating.length }
        );
      })
    ]);

    // Delay between batches to respect rate limits
    if (i + batchSize < maxItems) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // Set orgWebsite as website for leads that already have it
  results.forEach(lead => {
    if (lead.orgWebsite && !lead.website) {
      lead.website = lead.orgWebsite;
    }
  });

  return results;
}

// Parse CSV and convert to leads
function parseCSVToLeads(csvText: string): Lead[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const leads: Lead[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || [];

    const getColumn = (names: string[]): string => {
      for (const name of names) {
        const index = headers.findIndex(h => h.includes(name));
        if (index !== -1 && values[index]) return values[index];
      }
      return '';
    };

    const name = getColumn(['name', 'full name', 'fullname']);
    const email = getColumn(['email', 'email address']);

    if (!name || !email) continue;

    const websiteUrl = getColumn(['website', 'company website', 'org website']);
    const lead: Lead = {
      id: crypto.randomUUID(),
      name,
      email,
      company: getColumn(['company', 'company name', 'organization']),
      role: getColumn(['role', 'title', 'job title', 'position']),
      status: 'pending',
      linkedin: getColumn(['linkedin', 'linkedin url', 'linkedin profile']),
      phone: getColumn(['phone', 'phone number', 'mobile']),
      city: getColumn(['city', 'location']),
      state: getColumn(['state', 'province']),
      country: getColumn(['country']),
      orgWebsite: websiteUrl,
      website: websiteUrl, // Also set website field
      orgSize: getColumn(['company size', 'org size', 'size']),
      orgIndustry: getColumn(['industry', 'sector']),
      seniority: getColumn(['seniority', 'level']),
      functional: getColumn(['function', 'department']),
      score: 0,
    };

    lead.score = calculateLeadScore(lead);
    leads.push(lead);
  }

  return leads;
}

// Map Apify output to our Lead format
function mapApifyLead(item: any, index: number): Lead {
  const seniority = item.seniority || '';
  const functional = item.personFunction || '';
  const lead: Lead = {
    id: crypto.randomUUID(),
    name: item.fullName || 'Unknown',
    email: item.email || '',
    company: item.orgName || '',
    status: item.emailStatus?.toLowerCase() === 'verified' ? 'verified' : item.email ? 'pending' : 'failed',
    linkedin: item.linkedinUrl || '',
    role: item.position || '',
    phone: item.phone || '',
    city: item.city || '',
    state: item.state || '',
    country: item.country || '',
    orgWebsite: item.orgWebsite || '',
    orgSize: item.orgSize || '',
    orgIndustry: item.orgIndustry || '',
    seniority,
    functional,
    score: 0,
  };
  lead.score = calculateLeadScore(lead);
  return lead;
}

// --- Nexli Logo SVG Component ---
const NexliIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="nexli-icon-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M4 36L20 24L4 12L4 20L12 24L4 28L4 36Z" fill="#2563EB" />
    <path d="M12 36L28 24L12 12L12 18L18 24L12 30L12 36Z" fill="url(#nexli-icon-grad)" />
    <path d="M20 36L44 24L20 12L20 18L32 24L20 30L20 36Z" fill="#06B6D4" />
  </svg>
);

const NexliWordmark = ({ className = '' }: { className?: string }) => (
  <span
    className={cn(
      'font-display text-xl font-extrabold tracking-tight',
      className
    )}
    style={{ color: 'var(--text-primary)' }}
  >
    NEXLI
  </span>
);

// --- Score Badge ---
const ScoreBadge = ({ score }: { score: number }) => {
  const tier = getScoreTier(score);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: tier.bg, color: tier.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.color }}></span>
      {tier.label} {score}
    </span>
  );
};

// --- Email Generation Modal ---
const EmailGenerationModal = ({
  lead,
  email,
  isGenerating,
  error,
  onClose,
  onSend,
  onSchedule,
  canSend,
  isSending,
}: {
  lead: Lead;
  email: { subject: string; body: string; sender?: any } | null;
  isGenerating: boolean;
  error: string;
  onClose: () => void;
  onSend: () => void;
  onSchedule?: (scheduledFor: string, subject: string, body: string) => void;
  canSend: boolean;
  isSending: boolean;
}) => {
  const [editedSubject, setEditedSubject] = React.useState(email?.subject || '');
  const [editedBody, setEditedBody] = React.useState(email?.body || '');
  const [isEditing, setIsEditing] = React.useState(false);
  const [showScheduler, setShowScheduler] = React.useState(false);
  const [scheduledDateTime, setScheduledDateTime] = React.useState('');

  React.useEffect(() => {
    if (email) {
      setEditedSubject(email.subject);
      setEditedBody(email.body);
    }
  }, [email]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className="relative nexli-gradient-bg p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white rounded-full blur-2xl"></div>
          </div>
          <div className="relative flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display text-white mb-1">
                  AI-Generated Email
                </h3>
                <p className="text-white/80 text-sm">
                  Personalized for {lead.name}
                </p>
                {email?.sender && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm w-fit">
                    <img
                      src={email.sender.photo}
                      alt={email.sender.name}
                      className="w-5 h-5 rounded-full object-cover border border-white/30"
                    />
                    <span className="text-white/90 text-xs font-medium">
                      From: {email.sender.name}, {email.sender.role}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-all hover:bg-white/20"
              style={{ color: 'white' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lead Info Card */}
        <div className="px-8 -mt-4 relative z-10">
          <div className="glass-card p-5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold nexli-gradient-bg text-white shadow-lg"
              >
                {lead.name[0]}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {lead.name}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {lead.role} at {lead.company}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Mail className="w-3 h-3" />
                    {lead.email}
                  </span>
                  {lead.linkedin && (
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Linkedin className="w-3 h-3" />
                      LinkedIn
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: lead.status === 'verified' ? 'var(--status-verified-bg)' : 'var(--bg-elevated)',
                    color: lead.status === 'verified' ? 'var(--status-verified-text)' : 'var(--text-muted)',
                  }}
                >
                  {lead.status}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: getScoreTier(lead.score).bg,
                    color: getScoreTier(lead.score).color,
                  }}
                >
                  {lead.score} Score
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="px-8 py-6 space-y-5 max-h-[50vh] overflow-y-auto">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="relative">
                <div className="gradient-spinner w-16 h-16 border-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Crafting Your Perfect Email...
                </p>
                <p className="text-sm animate-nexli-pulse" style={{ color: 'var(--text-muted)' }}>
                  AI is analyzing {lead.name}'s profile and composing a personalized message
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-5 rounded-2xl text-sm flex items-start gap-3" style={{ background: 'var(--status-failed-bg)', color: 'var(--status-failed-text)' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Error Generating Email</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {email && !isGenerating && (
            <div className="space-y-5">
              {/* Subject Line */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Mail className="w-3 h-3" />
                    Subject Line
                  </label>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                    style={{
                      color: isEditing ? 'var(--gradient-start)' : 'var(--text-muted)',
                      background: isEditing ? 'var(--status-verified-bg)' : 'transparent',
                    }}
                  >
                    <Edit className="w-3 h-3" />
                    {isEditing ? 'Editing' : 'Edit'}
                  </button>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border-2 transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--gradient-start)',
                    }}
                  />
                ) : (
                  <div
                    className="px-5 py-4 rounded-xl text-sm font-bold leading-relaxed"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                  >
                    {editedSubject}
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Send className="w-3 h-3" />
                  Email Body
                </label>
                {isEditing ? (
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed outline-none border-2 transition-all resize-none"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--gradient-start)',
                    }}
                  />
                ) : (
                  <div
                    className="px-5 py-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                  >
                    {editedBody}
                  </div>
                )}
              </div>

              {/* Email Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Words</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {editedBody.split(/\s+/).length}
                  </p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Characters</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {editedBody.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Read Time</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {Math.ceil(editedBody.split(/\s+/).length / 200)}min
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        {email && !isGenerating && (
          <div
            className="px-8 py-6 flex items-center justify-between gap-3"
            style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}
          >
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Subject: ${editedSubject}\n\n${editedBody}`);
                // Could add a toast notification here
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
            >
              <Copy className="w-4 h-4" />
              Copy to Clipboard
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
              >
                Cancel
              </button>
              {canSend && (
                <>
                  {onSchedule && (
                    <div className="relative">
                      <button
                        onClick={() => setShowScheduler(!showScheduler)}
                        className="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                        style={{
                          background: showScheduler ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-surface)',
                          color: showScheduler ? '#F59E0B' : 'var(--text-secondary)',
                          border: showScheduler ? '1px solid #F59E0B' : '1px solid var(--border-color)'
                        }}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Schedule</span>
                      </button>
                      {showScheduler && (
                        <div
                          className="absolute bottom-full right-0 mb-2 glass-card rounded-2xl p-5 shadow-2xl z-50 min-w-[320px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                              <Clock className="w-3.5 h-3.5" />
                              Schedule Send
                            </label>
                            <button
                              onClick={() => {
                                setShowScheduler(false);
                                setScheduledDateTime('');
                              }}
                              className="p-1 rounded-lg transition-all hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                              <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                            </button>
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="space-y-2 mb-4">
                            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Quick Select</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: 'In 1 Hour', getTime: () => new Date(Date.now() + 60 * 60 * 1000) },
                                { label: 'In 3 Hours', getTime: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
                                { label: 'Tomorrow 9 AM', getTime: () => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  tomorrow.setHours(9, 0, 0, 0);
                                  return tomorrow;
                                }},
                                { label: 'Tomorrow 2 PM', getTime: () => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  tomorrow.setHours(14, 0, 0, 0);
                                  return tomorrow;
                                }},
                              ].map((preset) => (
                                <button
                                  key={preset.label}
                                  onClick={() => {
                                    const time = preset.getTime();
                                    setScheduledDateTime(time.toISOString().slice(0, 16));
                                  }}
                                  className="px-3 py-2.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                                  style={{
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full" style={{ borderTop: '1px solid var(--border-subtle)' }}></div>
                            </div>
                            <div className="relative flex justify-center">
                              <span className="px-2 text-xs font-semibold" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>or custom</span>
                            </div>
                          </div>

                          {/* Custom DateTime Picker */}
                          <div className="mb-4">
                            <input
                              type="datetime-local"
                              value={scheduledDateTime}
                              onChange={(e) => setScheduledDateTime(e.target.value)}
                              min={(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; })()}
                              className="w-full px-4 py-3 rounded-lg text-sm font-medium outline-none border-2 transition-all"
                              style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                borderColor: scheduledDateTime ? '#F59E0B' : 'var(--border-color)',
                              }}
                            />
                            {scheduledDateTime && (
                              <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                <CheckCircle2 className="w-3 h-3 text-amber-500" />
                                Scheduled for {new Date(scheduledDateTime).toLocaleString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            )}
                          </div>

                          {/* Confirm Button */}
                          <button
                            onClick={() => {
                              if (scheduledDateTime && onSchedule) {
                                onSchedule(scheduledDateTime, editedSubject, editedBody);
                                setShowScheduler(false);
                                setScheduledDateTime('');
                              }
                            }}
                            disabled={!scheduledDateTime}
                            className="w-full px-4 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105"
                            style={{
                              background: scheduledDateTime ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-elevated)',
                              color: scheduledDateTime ? '#F59E0B' : 'var(--text-muted)',
                              border: `2px solid ${scheduledDateTime ? '#F59E0B' : 'var(--border-color)'}`,
                            }}
                          >
                            <Clock className="w-4 h-4" />
                            <span>{scheduledDateTime ? 'Confirm Schedule' : 'Select Time First'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      // Update the email with edited content before sending
                      onSend();
                    }}
                    disabled={isSending}
                    className="nexli-btn-gradient px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 hover:scale-105"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Now</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- Mock Data ---
const MOCK_DATA = [
  { name: 'Mon', leads: 40, verified: 32 },
  { name: 'Tue', leads: 55, verified: 41 },
  { name: 'Wed', leads: 38, verified: 30 },
  { name: 'Thu', leads: 67, verified: 52 },
  { name: 'Fri', leads: 48, verified: 39 },
  { name: 'Sat', leads: 33, verified: 28 },
  { name: 'Sun', leads: 44, verified: 37 },
];

// --- Theme Toggle ---
const ThemeToggle = ({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className="relative p-2 rounded-xl transition-all duration-300"
    style={{
      background: isDark ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
    }}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    <AnimatePresence mode="wait">
      {isDark ? (
        <motion.div
          key="sun"
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Sun className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </motion.div>
      ) : (
        <motion.div
          key="moon"
          initial={{ rotate: 90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: -90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Moon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </motion.div>
      )}
    </AnimatePresence>
  </button>
);

// --- Components ---
const NotificationPanel = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  isDark,
}: {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  isDark: boolean;
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (iconType?: string) => {
    switch (iconType) {
      case 'lead':
        return <Users className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'campaign':
        return <Send className="w-4 h-4" />;
      case 'reply':
        return <Reply className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500 bg-green-500/10';
      case 'info':
        return 'text-blue-500 bg-blue-500/10';
      case 'warning':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'error':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div
      className="absolute top-full right-0 mt-2 w-80 md:w-96 rounded-2xl shadow-2xl border overflow-hidden z-50"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h3 className="font-bold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium mb-1">No notifications</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
                className={cn(
                  'p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                )}
              >
                <div className="flex gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', getIconColor(notification.type))}>
                    {getIcon(notification.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {notification.message}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(notification.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Navbar = ({
  isDark,
  onToggleTheme,
  sidebarOpen,
  setSidebarOpen,
  notifications,
  onMarkAsRead,
  onClearAll,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 md:px-6 justify-between backdrop-blur-xl transition-colors duration-300"
      style={{
        background: isDark ? 'rgba(11, 17, 33, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderBottom: `1px solid var(--border-subtle)`,
      }}
    >
      <div className="flex items-center gap-4 md:gap-8">
        {/* Hamburger Menu - Mobile Only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2.5">
          <NexliIcon className="w-8 h-8" />
          <NexliWordmark />
        </div>

        <div className="hidden md:flex items-center gap-1">
          <div className="relative p-[2px] rounded-full overflow-hidden">
            {/* Gradient Border */}
            <div className="absolute inset-0 rounded-full" style={{
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            }} />

            {/* Inner Button */}
            <div
              className="relative px-5 py-2.5 rounded-full font-bold text-sm tracking-wide flex items-center gap-2.5 overflow-hidden text-white"
              style={{
                background: 'rgba(11, 17, 33, 0.9)',
              }}
            >
              {/* Shimmer Effect */}
              <div
                className="absolute blur-md opacity-40"
                style={{
                  inset: '-100%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.9) 50%, rgba(6, 182, 212, 0.9) 100%, transparent 100%)',
                  animation: 'shimmer 8s linear infinite',
                }}
              />

              <Search className="w-4 h-4 relative z-10 text-white" />
              <span className="relative z-10 whitespace-nowrap">
                LEAD SCRAPER
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl transition-all duration-200 relative hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--text-muted)' }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center" style={{ boxShadow: '0 0 0 2px var(--bg-primary)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onClearAll={onClearAll}
                isDark={isDark}
              />
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const Sidebar = ({
  activeTab,
  setActiveTab,
  isDark,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  allLeads,
  campaigns,
  userProfile,
  user,
  setUserProfile,
  addNotification,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  isDark: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  allLeads: Lead[];
  campaigns: Campaign[];
  userProfile: { full_name: string; profile_photo_url: string | null } | null;
  user: any;
  setUserProfile: React.Dispatch<React.SetStateAction<{ full_name: string; profile_photo_url: string | null } | null>>;
  addNotification: (type: string, title: string, message: string) => void;
}) => {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scraper', label: 'Lead Scraper', icon: Search },
    { id: 'leads', label: 'My Leads', icon: Users },
    { id: 'campaigns', label: 'Email Campaigns', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSaveName = async () => {
    if (!user || !tempName.trim()) {
      setEditingName(false);
      return;
    }

    try {
      // Use upsert to insert if not exists, update if exists
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: tempName.trim(),
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      setUserProfile((prev) => prev ? { ...prev, full_name: tempName.trim() } : null);
      addNotification('success', 'Name Updated', 'Your name has been updated successfully');
      setEditingName(false);
    } catch (error: any) {
      addNotification('error', 'Update Failed', error.message);
      setEditingName(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 bottom-0 w-64 p-4 flex flex-col justify-between z-40',
          'transition-all duration-300 ease-in-out',
          // Mobile: controlled by sidebarOpen
          // Desktop: controlled by sidebarCollapsed
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed ? 'md:-translate-x-full' : 'md:translate-x-0'
        )}
        style={{
          background: 'var(--bg-surface)',
          borderRight: `1px solid var(--border-subtle)`,
        }}
      >
      <div className="space-y-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200'
              )}
              style={{
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <tab.icon
                className="w-5 h-5 transition-colors"
                style={{
                  color: isActive ? '#2563EB' : 'var(--text-muted)',
                }}
              />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Productivity Tracker */}
      <div
        className="p-4 rounded-2xl nexli-gradient-border transition-colors duration-300"
        style={{
          background: 'var(--bg-elevated)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center nexli-gradient-bg"
          >
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Productivity Tracker
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Your daily metrics
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Total Leads */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Total Leads
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {allLeads.length}
            </span>
          </div>

          {/* Active Campaigns */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Campaigns
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {campaigns.filter((c) => c.status === 'active').length} / {campaigns.length}
            </span>
          </div>

          {/* Emails Sent */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Emails Sent
              </span>
            </div>
            <span className="text-sm font-bold text-blue-500">
              {campaigns.reduce((sum, c) => sum + c.metrics.sent, 0)}
            </span>
          </div>

          {/* Reply Rate */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Replies
              </span>
            </div>
            <span className="text-sm font-bold text-green-500">
              {campaigns.reduce((sum, c) => sum + c.metrics.replied, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div
        className="p-4 rounded-2xl transition-colors duration-300 mt-6"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Profile
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            {userProfile?.profile_photo_url ? (
              <img
                src={userProfile.profile_photo_url}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--border-color)' }}
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
              >
                {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <label
              htmlFor="sidebar-profile-photo-upload"
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full nexli-gradient-bg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg border-2"
              style={{ borderColor: 'var(--bg-elevated)' }}
            >
              <Camera className="w-3 h-3 text-white" />
            </label>
            <input
              id="sidebar-profile-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user) return;

                try {
                  const fileExt = file.name.split('.').pop();
                  const filePath = `${user.id}/avatar.${fileExt}`;

                  const { error: uploadError } = await supabase.storage
                    .from('profile-photos')
                    .upload(filePath, file, { upsert: true });

                  if (uploadError) throw uploadError;

                  const { data } = supabase.storage
                    .from('profile-photos')
                    .getPublicUrl(filePath);

                  // Use upsert to insert if not exists, update if exists
                  const { error: updateError } = await supabase
                    .from('users')
                    .upsert({
                      id: user.id,
                      email: user.email,
                      profile_photo_url: data.publicUrl,
                    }, {
                      onConflict: 'id'
                    });

                  if (updateError) throw updateError;

                  setUserProfile((prev) => prev ? { ...prev, profile_photo_url: data.publicUrl } : null);
                  addNotification('success', 'Photo Updated', 'Profile photo uploaded successfully');
                } catch (error: any) {
                  addNotification('error', 'Upload Failed', error.message);
                }

                e.target.value = '';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  autoFocus
                  className="text-xs font-bold flex-1 px-2 py-1 rounded border"
                  style={{
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 rounded hover:opacity-70 transition-opacity"
                  style={{ color: '#10B981' }}
                  title="Save name"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p
                className="text-xs font-bold truncate cursor-pointer hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => {
                  setTempName(userProfile?.full_name || '');
                  setEditingName(true);
                }}
                title="Click to edit name"
              >
                {userProfile?.full_name || 'Click to set name'}
              </p>
            )}
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 text-center">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Nexli Automation
        </p>
      </div>
    </aside>
    </>
  );
};

// Performance Tracker Component for Email A/B Testing
const PerformanceTracker = () => {
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch performance data from Instantly
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/instantly-performance');

        if (!response.ok) {
          throw new Error('Failed to fetch performance data');
        }

        const data = await response.json();
        setVariations(data.variations || []);
        setLastUpdated(data.lastUpdated || new Date().toISOString());
        setError('');
      } catch (err: any) {
        console.error('Performance fetch error:', err);
        setError(err.message);
        // Fallback to mock data if API fails
        setVariations([
          {
            id: 'ai_disruption',
            name: 'AI Disruption & Ownership',
            icon: '🤖',
            color: '#2563EB',
            bgColor: 'rgba(37, 99, 235, 0.08)',
            sent: 0,
            opens: 0,
            replies: 0,
            positiveReplies: 0,
            openRate: 0,
            replyRate: 0,
            positiveReplyRate: 0,
          },
          {
            id: 'cost_savings',
            name: 'Cost Savings Focus',
            icon: '💰',
            color: '#10B981',
            bgColor: 'rgba(16, 185, 129, 0.08)',
            sent: 0,
            opens: 0,
            replies: 0,
            positiveReplies: 0,
            openRate: 0,
            replyRate: 0,
            positiveReplyRate: 0,
          },
          {
            id: 'time_efficiency',
            name: 'Time & Efficiency Focus',
            icon: '⚡',
            color: '#F59E0B',
            bgColor: 'rgba(245, 158, 11, 0.08)',
            sent: 0,
            opens: 0,
            replies: 0,
            positiveReplies: 0,
            openRate: 0,
            replyRate: 0,
            positiveReplyRate: 0,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPerformanceData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const winner = variations.length > 0 ? variations.reduce((prev, current) =>
    current.openRate > prev.openRate ? current : prev
  ) : null;

  const minSendsForSignificance = 50;
  const hasEnoughData = variations.every((v) => v.sent >= minSendsForSignificance);

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-2xl">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>
            Email Performance Tracker
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            A/B testing 3 email variations • {hasEnoughData ? '✅ Statistically significant' : `⏳ Need ${minSendsForSignificance}+ sends per variation`}
          </p>
        </div>
        {hasEnoughData && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: winner.bgColor }}>
            <span className="text-lg">{winner.icon}</span>
            <span className="text-xs font-bold" style={{ color: winner.color }}>
              {winner.name} Leading
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {variations.map((variation) => {
          const isWinner = hasEnoughData && variation.id === winner.id;

          return (
            <div
              key={variation.id}
              className={cn(
                'p-5 rounded-xl transition-all duration-300',
                isWinner ? 'ring-2 scale-105' : 'hover:scale-102'
              )}
              style={{
                background: variation.bgColor,
                ringColor: isWinner ? variation.color : 'transparent',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{variation.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                      {variation.name}
                    </h4>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {variation.sent} sent
                    </p>
                  </div>
                </div>
                {isWinner && (
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: variation.color,
                      color: 'white',
                    }}
                  >
                    👑 Winner
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                {/* Open Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Open Rate
                    </span>
                    <span className="text-lg font-bold font-display" style={{ color: variation.color }}>
                      {variation.openRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${variation.openRate}%`,
                        background: variation.color,
                      }}
                    ></div>
                  </div>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {variation.opens} / {variation.sent} opened
                  </p>
                </div>

                {/* Reply Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Reply Rate
                    </span>
                    <span className="text-sm font-bold" style={{ color: variation.color }}>
                      {variation.replyRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${variation.replyRate}%`,
                        background: variation.color,
                      }}
                    ></div>
                  </div>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {variation.replies} replies
                  </p>
                </div>

                {/* Positive Reply Rate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Positive Replies
                    </span>
                    <span className="text-sm font-bold" style={{ color: variation.color }}>
                      {variation.positiveReplyRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${variation.positiveReplyRate}%`,
                        background: variation.color,
                      }}
                    ></div>
                  </div>
                  <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {variation.positiveReplies} interested
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note about data source */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        {error ? (
          <p className="text-[10px] text-center" style={{ color: 'var(--status-failed-text)' }}>
            ⚠️ {error} • Showing fallback data
          </p>
        ) : (
          <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
            📊 Live data from Instantly.ai {lastUpdated && `• Updated ${new Date(lastUpdated).toLocaleTimeString()}`}
          </p>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  gradientIcon,
}: {
  title: string;
  value: string;
  icon: any;
  trend?: number;
  gradientIcon?: boolean;
}) => (
  <div className="glass-card p-6 rounded-2xl group transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div
        className={cn('p-2.5 rounded-xl transition-colors', gradientIcon ? 'nexli-gradient-bg' : '')}
        style={!gradientIcon ? { background: 'var(--bg-elevated)' } : {}}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: gradientIcon ? 'white' : 'var(--text-secondary)' }}
        />
      </div>
      {trend !== undefined && (
        <span
          className={cn('text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1')}
          style={{
            background: trend > 0 ? 'var(--status-verified-bg)' : 'var(--status-failed-bg)',
            color: trend > 0 ? 'var(--status-verified-text)' : 'var(--status-failed-text)',
          }}
        >
          <TrendingUp className="w-3 h-3" />
          {trend > 0 ? '+' : ''}
          {trend}%
        </span>
      )}
    </div>
    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
      {title}
    </p>
    <h3
      className="text-2xl font-bold tracking-tight font-display"
      style={{ color: 'var(--text-primary)' }}
    >
      {value}
    </h3>
  </div>
);

const DashboardView = ({
  recentLeads,
  isDark,
  emailLogs,
  senderInstantlyMetrics = {},
}: {
  recentLeads: Lead[];
  isDark: boolean;
  emailLogs: EmailLog[];
  senderInstantlyMetrics: Record<string, { sent: number; opened: number; clicked: number; replied: number; bounced: number }>;
}) => {
  // Calculate lead tier breakdown
  const hotLeads = recentLeads.filter((l) => l.score >= 60).length;
  const warmLeads = recentLeads.filter((l) => l.score >= 30 && l.score < 60).length;
  const coldLeads = recentLeads.filter((l) => l.score < 30).length;
  const totalLeads = recentLeads.length;

  // Calculate real analytics
  const verifiedEmails = recentLeads.filter((l) => l.email && l.email.length > 0).length;
  const linkedinProfiles = recentLeads.filter((l) => l.linkedin && l.linkedin.length > 0).length;
  const successRate = totalLeads > 0 ? ((verifiedEmails / totalLeads) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8">
      <header>
        <h2
          className="text-3xl font-bold tracking-tight font-display mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Welcome back
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Here's what's happening with your lead generation today.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Leads"
          value={totalLeads.toLocaleString()}
          icon={Users}
          gradientIcon
        />
        <StatCard
          title="Verified Emails"
          value={verifiedEmails.toLocaleString()}
          icon={Mail}
        />
        <StatCard
          title="LinkedIn Profiles"
          value={linkedinProfiles.toLocaleString()}
          icon={Linkedin}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          icon={Target}
        />
      </div>

      {/* Lead Quality Breakdown */}
      {totalLeads > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              Lead Quality Score Breakdown
            </h3>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {totalLeads} total leads
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Hot Leads */}
            <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#EF4444' }}>
                  🔥 Hot Leads
                </span>
                <span className="text-2xl font-bold font-display" style={{ color: '#EF4444' }}>
                  {hotLeads}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalLeads > 0 ? (hotLeads / totalLeads) * 100 : 0}%`,
                    background: '#EF4444',
                  }}
                ></div>
              </div>
              <p className="text-xs mt-2" style={{ color: '#EF4444' }}>
                Score 60+ • Ready to convert
              </p>
            </div>

            {/* Warm Leads */}
            <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F59E0B' }}>
                  ⚡ Warm Leads
                </span>
                <span className="text-2xl font-bold font-display" style={{ color: '#F59E0B' }}>
                  {warmLeads}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalLeads > 0 ? (warmLeads / totalLeads) * 100 : 0}%`,
                    background: '#F59E0B',
                  }}
                ></div>
              </div>
              <p className="text-xs mt-2" style={{ color: '#F59E0B' }}>
                Score 30-59 • Good potential
              </p>
            </div>

            {/* Cold Leads */}
            <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ background: 'rgba(107, 114, 128, 0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  ❄️ Cold Leads
                </span>
                <span className="text-2xl font-bold font-display" style={{ color: '#6B7280' }}>
                  {coldLeads}
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(107, 114, 128, 0.15)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalLeads > 0 ? (coldLeads / totalLeads) * 100 : 0}%`,
                    background: '#6B7280',
                  }}
                ></div>
              </div>
              <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
                Score &lt;30 • Needs nurturing
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sender Performance A/B/C/D Testing */}
      {(() => {
        // Calculate metrics for each sender using real Instantly data
        const senderMetrics = SENDER_EMAILS.map(sender => {
          const instantlyData = senderInstantlyMetrics[sender.email];
          const senderLogs = emailLogs.filter(log => log.senderEmail === sender.email);

          // Use real Instantly metrics if available, otherwise fall back to email logs
          const totalSent = instantlyData?.sent || senderLogs.length;
          const opened = instantlyData?.opened || senderLogs.filter(log => log.status === 'opened').length;
          const clicked = instantlyData?.clicked || senderLogs.filter(log => log.status === 'clicked').length;
          const replied = instantlyData?.replied || senderLogs.filter(log => log.status === 'replied').length;

          return {
            name: sender.name,
            email: sender.email,
            color: sender.color,
            photo: sender.photo,
            totalSent,
            openRate: totalSent > 0 ? ((opened / totalSent) * 100).toFixed(1) : '0.0',
            clickRate: totalSent > 0 ? ((clicked / totalSent) * 100).toFixed(1) : '0.0',
            replyRate: totalSent > 0 ? ((replied / totalSent) * 100).toFixed(1) : '0.0',
            hasRealData: !!instantlyData,
          };
        });

        const bestPerformer = senderMetrics.reduce((best, current) =>
          parseFloat(current.replyRate) > parseFloat(best.replyRate) ? current : best
        , senderMetrics[0]);

        const minSendsForSignificance = 10;
        const hasEnoughData = senderMetrics.every((s) => s.totalSent >= minSendsForSignificance);

        return (
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold font-display mb-1" style={{ color: 'var(--text-primary)' }}>
                  Sender Performance Tracker
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  A/B/C/D testing {SENDER_EMAILS.length} sender personas • {hasEnoughData ? '✅ Statistically significant' : `⏳ Need ${minSendsForSignificance}+ sends per sender`}
                </p>
              </div>
              {hasEnoughData && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${bestPerformer.color}15` }}>
                  <img
                    src={bestPerformer.photo}
                    alt={bestPerformer.name}
                    className="w-6 h-6 rounded-full object-cover"
                    style={{ border: `2px solid ${bestPerformer.color}` }}
                  />
                  <span className="text-xs font-bold" style={{ color: bestPerformer.color }}>
                    {bestPerformer.name} Leading
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {senderMetrics.map((sender) => {
                const isWinner = hasEnoughData && sender.name === bestPerformer.name;

                return (
                  <div
                    key={sender.email}
                    className={cn(
                      'p-5 rounded-xl transition-all duration-300',
                      isWinner ? 'ring-2 scale-105' : 'hover:scale-102'
                    )}
                    style={{
                      background: `${sender.color}08`,
                      ringColor: isWinner ? sender.color : 'transparent',
                    }}
                  >
                    {/* Header with Profile Photo */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {/* Profile Photo */}
                        <img
                          src={sender.photo}
                          alt={sender.name}
                          className="w-10 h-10 rounded-full object-cover"
                          style={{
                            border: `2px solid ${sender.color}`,
                          }}
                        />
                        <div>
                          <h4 className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                            {sender.name}
                          </h4>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {sender.totalSent} sent
                          </p>
                        </div>
                      </div>
                      {isWinner && (
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{
                            background: sender.color,
                            color: 'white',
                          }}
                        >
                          👑 Winner
                        </span>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="space-y-3">
                      {/* Open Rate */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            Open Rate
                          </span>
                          <span className="text-lg font-bold font-display" style={{ color: sender.color }}>
                            {sender.openRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${sender.openRate}%`,
                              background: sender.color,
                            }}
                          ></div>
                        </div>
                        <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {Math.round((parseFloat(sender.openRate) / 100) * sender.totalSent)} / {sender.totalSent} opened
                        </p>
                      </div>

                      {/* Reply Rate */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            Reply Rate
                          </span>
                          <span className="text-sm font-bold" style={{ color: sender.color }}>
                            {sender.replyRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${sender.replyRate}%`,
                              background: sender.color,
                            }}
                          ></div>
                        </div>
                        <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {Math.round((parseFloat(sender.replyRate) / 100) * sender.totalSent)} replies
                        </p>
                      </div>

                      {/* Click Rate */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            Click Rate
                          </span>
                          <span className="text-sm font-bold" style={{ color: sender.color }}>
                            {sender.clickRate}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${sender.clickRate}%`,
                              background: sender.color,
                            }}
                          ></div>
                        </div>
                        <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {Math.round((parseFloat(sender.clickRate) / 100) * sender.totalSent)} clicked
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note about auto-rotation */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                🔄 Auto-rotating senders • Emails distributed evenly across all {SENDER_EMAILS.length} personas
              </p>
            </div>
          </div>
        );
      })()}

      {/* Email Performance Tracker */}
      <PerformanceTracker />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              Scraping Performance
            </h3>
            <select
              className="text-sm rounded-xl px-3 py-1.5 font-medium outline-none cursor-pointer transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: 'none',
              }}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {totalLeads === 0 ? (
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  No data yet
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Start scraping leads to see your performance analytics
                </p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#1E293B' : '#F1F5F9'}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: isDark ? '#64748B' : '#94A3B8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: isDark ? '#64748B' : '#94A3B8' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    background: isDark ? '#1E293B' : '#FFFFFF',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorLeads)"
                />
                <Area
                  type="monotone"
                  dataKey="verified"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVerified)"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
          {totalLeads > 0 && (
          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: `1px solid var(--border-subtle)` }}>
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              <div className="w-3 h-0.5 rounded-full bg-nexli-blue"></div>
              Total Leads
            </div>
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              <div className="w-3 h-0.5 rounded-full bg-nexli-cyan" style={{ borderStyle: 'dashed' }}></div>
              Verified
            </div>
          </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold font-display mb-6" style={{ color: 'var(--text-primary)' }}>
            Recent Activity
          </h3>
          <div className="space-y-5">
            {recentLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {lead.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {lead.name}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {lead.company}
                    </p>
                  </div>
                </div>
                <div
                  className={cn('w-2 h-2 rounded-full')}
                  style={{
                    background:
                      lead.status === 'verified'
                        ? 'var(--status-verified-text)'
                        : lead.status === 'pending'
                          ? 'var(--status-pending-text)'
                          : 'var(--status-failed-text)',
                  }}
                ></div>
              </div>
            ))}
            {recentLeads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <Users className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                  No recent activity
                </p>
              </div>
            )}
          </div>
          {recentLeads.length > 0 && (
            <button
              className="w-full mt-6 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2"
              style={{
                color: 'var(--text-secondary)',
                borderTop: `1px solid var(--border-subtle)`,
              }}
            >
              View all activity
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ScraperView = ({
  onLeadsFound,
  isDark,
  senderRotationIndex,
  setSenderRotationIndex,
  setScheduledEmails,
  addNotification,
}: {
  onLeadsFound: (leads: Lead[]) => void;
  isDark: boolean;
  senderRotationIndex: number;
  setSenderRotationIndex: (index: number) => void;
  setScheduledEmails: React.Dispatch<React.SetStateAction<ScheduledEmail[]>>;
  addNotification: (type: string, title: string, message: string, icon: string) => void;
}) => {
  const [query, setQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [scrapingStep, setScrapingStep] = useState('');
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(100);
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>('verified');
  const [stateFilter, setStateFilter] = useState<string[]>([]); // Changed to array for multi-select
  const [cityFilter, setCityFilter] = useState<string>('');

  // Website enrichment state
  const [enrichWebsites, setEnrichWebsites] = useState(true);
  const [enrichRatings, setEnrichRatings] = useState(true);
  const [enrichmentProgress, setEnrichmentProgress] = useState({
    websites: { current: 0, total: 0 },
    ratings: { current: 0, total: 0 },
    isEnriching: false
  });

  // Email generation state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Filtering and sorting state
  const [scoreFilter, setScoreFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'company' | 'date'>('date'); // Default to newest first
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Decision Maker Filters (NEW)
  const [decisionMakersOnly, setDecisionMakersOnly] = useState(true);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>(['1-10', '11-20', '21-50']); // Default: Small firms
  // TIGHTENED CRITERIA: Only Owner and President titles (matches CPA Owner, Business Owner, President, etc.)
  const [includedTitles] = useState([
    'owner',      // Matches: Owner, CPA Owner, Business Owner, Co-Owner, etc.
    'president'   // Matches: President, Vice President, etc.
  ]);
  const [excludedTitles] = useState([
    'staff accountant', 'senior accountant', 'associate', 'junior', 'analyst',
    'specialist', 'coordinator', 'assistant', 'bookkeeper', 'controller',
    'manager', 'supervisor', 'team lead', 'director', 'vice president'  // Added more exclusions
  ]);

  const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
    'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
    'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming',
  ];

  // Email generation handlers
  const handleGenerateEmail = async (lead: Lead) => {
    setSelectedLead(lead);
    setGeneratedEmail(null);
    setEmailError('');
    setIsGeneratingEmail(true);

    // Get next sender via rotation
    const sender = getNextSender(senderRotationIndex);
    setSenderRotationIndex(sender.index);

    try {
      // TODO: Optionally fetch LinkedIn posts first for better personalization
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          posts: [],
          sender: {
            name: sender.name,
            email: sender.email,
            role: sender.role,
            personality: sender.personality,
            photo: sender.photo,
            color: sender.color,
          }
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('API Error - Status:', response.status);
        console.error('API Error - Response:', text);

        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } catch {
          throw new Error(`Server error ${response.status}: ${text.substring(0, 100)}`);
        }
      }

      const email = await response.json();
      // Include sender info with the generated email
      setGeneratedEmail({ ...email, sender });
    } catch (err: any) {
      setEmailError(err.message || 'Failed to generate email');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedLead || !generatedEmail) return;

    setIsSendingEmail(true);
    try {
      // For now, just copy to clipboard - you'll need to configure Zapier webhook URL
      const emailText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
      await navigator.clipboard.writeText(emailText);

      // Update lead status
      const updatedResults = results.map((l) =>
        l.id === selectedLead.id ? { ...l, emailSendStatus: 'sent' as const, generatedEmail } : l
      );
      setResults(updatedResults);

      alert('Email copied to clipboard! Configure Zapier webhook in Settings to send automatically.');
      setSelectedLead(null);
      setGeneratedEmail(null);
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleScheduleEmail = (scheduledFor: string, subject: string, body: string) => {
    if (!selectedLead) return;

    // Get next sender via auto-rotation
    const sender = getNextSender(senderRotationIndex);
    setSenderRotationIndex(sender.index);

    const newScheduledEmail: ScheduledEmail = {
      id: `scheduled-${Date.now()}-${Math.random()}`,
      lead: selectedLead,
      subject,
      body,
      scheduledFor,
      senderName: sender.name,
      senderEmail: sender.email,
      createdAt: new Date().toISOString(),
    };

    setScheduledEmails(prev => [...prev, newScheduledEmail]);
    addNotification(
      'success',
      'Email Scheduled',
      `Email to ${selectedLead.name} scheduled for ${new Date(scheduledFor).toLocaleString()} (from ${sender.name})`,
      'email'
    );

    // Close modal
    setSelectedLead(null);
    setGeneratedEmail(null);
  };

  const handleCloseEmailModal = () => {
    setSelectedLead(null);
    setGeneratedEmail(null);
    setEmailError('');
  };

  // Filter and sort results
  const filteredAndSortedResults = React.useMemo(() => {
    let filtered = [...results];

    // Apply score filter
    if (scoreFilter === 'hot') {
      filtered = filtered.filter((l) => l.score >= 60);
    } else if (scoreFilter === 'warm') {
      filtered = filtered.filter((l) => l.score >= 30 && l.score < 60);
    } else if (scoreFilter === 'cold') {
      filtered = filtered.filter((l) => l.score < 30);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'score') {
        comparison = a.score - b.score;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'company') {
        comparison = a.company.localeCompare(b.company);
      } else if (sortBy === 'date') {
        // Sort by createdAt if available, otherwise by ID (which contains timestamp)
        const aDate = a.createdAt || a.id;
        const bDate = b.createdAt || b.id;
        comparison = aDate.localeCompare(bDate);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [results, scoreFilter, sortBy, sortOrder]);

  // Build Apify filters from user query + settings
  const buildFilters = () => {
    // Use selected company sizes (checkboxes)
    const companySizeFilters = selectedCompanySizes.length > 0
      ? selectedCompanySizes
      : ['1-10', '11-20', '21-50']; // Default if none selected

    const filters: any = {
      totalResults,
      emailStatus: emailStatusFilter,
      hasEmail: true,
      companyIndustryIncludes: ['Accounting'],
      companyLocationCountryIncludes: ['United States'],
      companyEmployeeSizeIncludes: companySizeFilters,
      seniorityIncludes: ['C-Suite', 'VP', 'Director', 'Owner', 'Founder', 'Partner'],
      personFunctionIncludes: ['Accounting', 'Finance'],
    };

    // Enhanced query for decision makers
    let searchQuery = query;
    if (decisionMakersOnly && query) {
      // Append "owner" or "managing partner" to target decision makers
      const decisionMakerKeywords = ['owner', 'managing partner', 'founder'];
      const randomKeyword = decisionMakerKeywords[Math.floor(Math.random() * decisionMakerKeywords.length)];
      searchQuery = `${query} ${randomKeyword}`;
    }

    // Parse the query for keywords
    if (searchQuery) {
      filters.companyKeywordIncludes = searchQuery.split(',').map((k: string) => k.trim()).filter(Boolean);
    }

    // State filter (now supports multiple states)
    if (stateFilter.length > 0) {
      filters.companyLocationStateIncludes = stateFilter;
    }

    // City filter
    if (cityFilter.trim()) {
      filters.companyLocationCityIncludes = cityFilter.split(',').map((c: string) => c.trim()).filter(Boolean);
    }

    return filters;
  };

  const pollRunStatus = async (runId: string): Promise<{ status: string; datasetId: string }> => {
    const statusSteps = [
      'Starting Apify actor run...',
      'Querying 90M+ professional records...',
      'Filtering CPA firm decision makers...',
      'Verifying email addresses...',
      'Extracting LinkedIn profile URLs...',
      'Compiling lead quality scores...',
    ];
    let stepIdx = 0;
    const maxPolls = 100; // 5 minutes max (100 * 3 seconds)
    let pollCount = 0;

    while (pollCount < maxPolls) {
      const res = await fetch(`/api/scrape/${runId}`);
      const data = await res.json();

      if (data.error) {
        const errorMsg = String(data.error);
        throw new Error(errorMsg);
      }

      // Rotate through status messages while polling
      setScrapingStep(statusSteps[stepIdx % statusSteps.length]);
      stepIdx++;
      pollCount++;

      if (data.status === 'SUCCEEDED') {
        return data;
      } else if (data.status === 'FAILED' || data.status === 'ABORTED') {
        const status = String(data.status || 'UNKNOWN').toLowerCase();
        throw new Error(`Scrape ${status}. Please try again.`);
      }

      // Poll every 3 seconds
      await new Promise((r) => setTimeout(r, 3000));
    }

    throw new Error('Scraping timeout - the operation took longer than expected. The Apify actor may still be running. Check your Apify dashboard.');
  };

  const handleScrape = async () => {
    if (!query) return;
    setIsScraping(true);
    setResults([]);
    setError('');
    setScrapingStep('Initializing Nexli scraper...');

    try {
      // Step 1: Start the Apify run
      const filters = buildFilters();
      const startRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });
      const startData = await startRes.json();

      if (startData.error) {
        console.log('API Error Response:', startData);

        // Check for the errorType property first (most reliable)
        if (startData.errorType === 'actor-is-not-rented') {
          throw new Error('⚠️ Apify Free Trial Expired\n\nThe lead scraping actor needs to be rented. Options:\n\n1. Rent the actor at https://console.apify.com/actors/VYRyEF4ygTTkaIghe\n2. Use a different free Apify actor\n3. Contact support for alternatives');
        }

        // Safely convert error to string
        const errorMessage = String(startData.error);
        throw new Error(errorMessage);
      }

      // Step 2: Poll until complete
      setScrapingStep('Scrape started — querying database...');
      await pollRunStatus(startData.runId);

      // Step 3: Fetch results
      setScrapingStep('Fetching results...');
      const resultsRes = await fetch(`/api/scrape/${startData.runId}/results?limit=${totalResults}`);
      const resultsData = await resultsRes.json();

      if (resultsData.error) {
        throw new Error(resultsData.error);
      }

      const mapped = resultsData.items.map(mapApifyLead);

      // Set orgWebsite as website for leads that already have it
      mapped.forEach((lead: Lead) => {
        if (lead.orgWebsite && !lead.website) {
          lead.website = lead.orgWebsite;
        }
      });

      let enrichedLeads = mapped;

      // Conditionally enrich data based on settings
      if ((enrichWebsites || enrichRatings) && totalResults <= 100) {
        // For small batches (≤100), enrich immediately
        const tasks = [];
        if (enrichWebsites) tasks.push('websites');
        if (enrichRatings) tasks.push('ratings');
        setScrapingStep(`Finding ${tasks.join(' and ')} (batched)...`);

        enrichedLeads = await batchLookupWebsites(mapped, 5, 500);

        // Also lookup ratings if enabled
        if (enrichRatings) {
          setScrapingStep('Finding Google ratings (batched)...');
          const needsRating = enrichedLeads.filter((l: Lead) => !l.googleRating && l.company && (l.city || l.state));
          let ratingCount = 0;

          for (let i = 0; i < needsRating.length; i += 5) {
            const batch = needsRating.slice(i, i + 5);
            await Promise.all(
              batch.map(async (lead: Lead) => {
                try {
                  const ratingData = await lookupGoogleRating(lead.company!, lead.city, lead.state);
                  if (ratingData) {
                    lead.googleRating = ratingData.rating;
                    lead.googleReviewCount = ratingData.reviewCount;
                    ratingCount++;
                  }
                } catch (error) {
                  console.error(`Failed to lookup rating for ${lead.company}:`, error);
                }
              })
            );
            if (i + 5 < needsRating.length) {
              await new Promise(r => setTimeout(r, 500));
            }
          }
          console.log(`Found ${ratingCount} Google ratings for ${needsRating.length} leads`);
        }
      } else if (!enrichWebsites && !enrichRatings) {
        // Skip enrichment entirely
        console.log(`All enrichment disabled. Using Apify data only.`);
      } else {
        // For large batches (>100), show results immediately and enrich in background
        console.log(`Large batch detected (${totalResults} leads). Showing results immediately. Enrichment will run in background.`);
      }

      // Filter for decision makers only (title filtering)
      setScrapingStep('Filtering decision makers...');
      const filteredLeads = enrichedLeads.filter((lead: Lead) => {
        // Safety check: skip leads without a role
        if (!lead.role || typeof lead.role !== 'string' || lead.role.trim() === '') {
          // If decision makers only mode is ON, exclude leads without roles
          // Otherwise, include them (they just won't match any filters)
          return !decisionMakersOnly;
        }

        const role = lead.role.toLowerCase();

        // Check if title contains any excluded keywords
        const hasExcludedTitle = excludedTitles.some(excluded => {
          if (typeof excluded !== 'string') return false;
          return role.includes(excluded);
        });
        if (hasExcludedTitle) {
          return false; // Exclude this lead
        }

        // If decision makers only, check if title contains included keywords
        if (decisionMakersOnly) {
          const hasIncludedTitle = includedTitles.some(included => {
            if (typeof included !== 'string') return false;
            return role.includes(included);
          });
          return hasIncludedTitle; // Only include if matches decision maker titles
        }

        return true; // Include all other leads
      });

      console.log(`Filtered ${enrichedLeads.length} leads → ${filteredLeads.length} decision makers`);

      setResults(filteredLeads);
      onLeadsFound(filteredLeads);

      // Start background enrichment for large batches
      if ((enrichWebsites || enrichRatings) && totalResults > 100) {
        startBackgroundEnrichment(filteredLeads);
      }
    } catch (err: any) {
      console.error('Scraping failed:', err);
      setError(err.message || 'Scraping failed. Check your API configuration.');
    } finally {
      setIsScraping(false);
      setScrapingStep('');
    }
  };

  // Background enrichment handler
  const startBackgroundEnrichment = async (leads: Lead[]) => {
    setEnrichmentProgress({
      websites: { current: 0, total: 0 },
      ratings: { current: 0, total: 0 },
      isEnriching: true
    });

    try {
      const enriched = await enrichDataInBackground(
        leads,
        {
          enrichWebsites: enrichWebsites,
          enrichRatings: enrichRatings,
          onProgress: (websites, ratings) => {
            setEnrichmentProgress({
              websites,
              ratings,
              isEnriching: true
            });
          }
        },
        5, // batch size
        500 // delay between batches
      );

      // Update results with enriched data
      setResults(enriched);
      onLeadsFound(enriched);

      const websiteCount = enriched.filter(l => l.website).length;
      const ratingCount = enriched.filter(l => l.googleRating).length;
      console.log(`Background enrichment complete! ${websiteCount}/${enriched.length} websites, ${ratingCount}/${enriched.length} ratings found.`);
    } catch (error) {
      console.error('Background enrichment failed:', error);
    } finally {
      setEnrichmentProgress({
        websites: { current: 0, total: 0 },
        ratings: { current: 0, total: 0 },
        isEnriching: false
      });
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2
          className="text-3xl font-bold tracking-tight font-display mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Lead Scraper
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Find verified emails and LinkedIn profiles of CPA firm owners and decision-makers.
        </p>
      </header>

      {/* Search Card */}
      <div className="glass-card p-8 rounded-2xl nexli-glow">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search by firm name, industry, location, or keywords..."
              className="w-full pl-12 pr-4 py-4 rounded-xl outline-none transition-all text-base font-medium"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '2px solid transparent',
              }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Popular:
            </span>
            {[
              'CPA Firm Owners',
              'Accounting Firm CEOs',
              'Tax Practice Partners',
              'Bookkeeping Firms',
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB, #06B6D4)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Scrape Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Max Results
              </label>
              <select
                value={totalResults}
                onChange={(e) => setTotalResults(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none cursor-pointer"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: 'none' }}
              >
                <option value={50}>50 leads</option>
                <option value={100}>100 leads</option>
                <option value={500}>500 leads</option>
                <option value={1000}>1,000 leads</option>
                <option value={5000}>5,000 leads</option>
                <option value={10000}>10,000 leads</option>
                <option value={50000}>50,000 leads (max)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Email Status
              </label>
              <select
                value={emailStatusFilter}
                onChange={(e) => setEmailStatusFilter(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none cursor-pointer"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: 'none' }}
              >
                <option value="verified">Verified only</option>
                <option value="unverified">All (including unverified)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                States (Multi-Select)
              </label>
              <details className="relative">
                <summary
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer list-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  {stateFilter.length === 0 ? 'All States' : `${stateFilter.length} selected`}
                </summary>
                <div
                  className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-xl p-2 shadow-lg"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-2 p-2 mb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <button
                      onClick={() => setStateFilter([])}
                      className="text-xs font-bold px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => setStateFilter([...US_STATES])}
                      className="text-xs font-bold px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Select All
                    </button>
                  </div>
                  {US_STATES.map((state) => (
                    <label
                      key={state}
                      className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={stateFilter.includes(state)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStateFilter([...stateFilter, state]);
                          } else {
                            setStateFilter(stateFilter.filter((s) => s !== state));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {state}
                      </span>
                    </label>
                  ))}
                </div>
              </details>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                City
              </label>
              <input
                type="text"
                placeholder="e.g. Miami, Dallas, Atlanta"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: 'none' }}
              />
            </div>
          </div>

          {/* Website Enrichment Toggle */}
          <div
            className="glass-card p-4 rounded-xl"
            style={{ border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  🌐 Enrich Company Websites
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {totalResults > 100
                    ? `Auto-disabled for ${totalResults.toLocaleString()}+ leads. Results will show instantly. Websites enrich in background.`
                    : 'Use Google to find missing company websites (adds ~30-60s for 100 leads)'
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enrichWebsites}
                  onChange={(e) => setEnrichWebsites(e.target.checked)}
                  disabled={totalResults > 100}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer transition-all ${totalResults > 100 ? 'opacity-50 cursor-not-allowed' : ''}`} style={{
                  background: enrichWebsites ? 'var(--nexli-primary)' : 'var(--bg-input)',
                }}>
                  <div
                    className="absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all"
                    style={{
                      transform: enrichWebsites ? 'translateX(20px)' : 'translateX(0)',
                    }}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Google Ratings Enrichment Toggle */}
          <div
            className="glass-card p-4 rounded-xl"
            style={{ border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  ⭐ Enrich Google Ratings
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {totalResults > 100
                    ? `Auto-disabled for ${totalResults.toLocaleString()}+ leads. Ratings will enrich in background.`
                    : 'Pull star ratings and review counts from Google Maps (adds ~30-60s for 100 leads)'
                  }
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={enrichRatings}
                  onChange={(e) => setEnrichRatings(e.target.checked)}
                  disabled={totalResults > 100}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 rounded-full peer transition-all ${totalResults > 100 ? 'opacity-50 cursor-not-allowed' : ''}`} style={{
                  background: enrichRatings ? 'var(--nexli-primary)' : 'var(--bg-input)',
                }}>
                  <div
                    className="absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all"
                    style={{
                      transform: enrichRatings ? 'translateX(20px)' : 'translateX(0)',
                    }}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Decision Maker Filters */}
          <div
            className="glass-card p-4 rounded-xl space-y-4"
            style={{ border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  🎯 Decision Makers Only
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Filter for owners, partners, and C-suite executives
                </p>
              </div>
              <button
                onClick={() => setDecisionMakersOnly(!decisionMakersOnly)}
                className={`relative w-12 h-6 rounded-full transition-all ${
                  decisionMakersOnly ? 'nexli-gradient-bg' : ''
                }`}
                style={
                  decisionMakersOnly
                    ? {}
                    : {
                        background: 'var(--bg-elevated)',
                        border: '2px solid var(--border-color)',
                      }
                }
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    decisionMakersOnly ? 'translate-x-6' : ''
                  }`}
                ></div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Company Size (Select Multiple)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: '1-10', label: '1-10 employees' },
                    { value: '11-20', label: '11-20 employees' },
                    { value: '21-50', label: '21-50 employees' },
                    { value: '51-100', label: '51-100 employees' },
                    { value: '101-500', label: '101-500 employees' },
                  ].map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: selectedCompanySizes.includes(value) ? 'var(--nexli-primary-light)' : 'var(--bg-input)',
                        border: selectedCompanySizes.includes(value) ? '1px solid var(--nexli-primary)' : '1px solid transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCompanySizes.includes(value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCompanySizes([...selectedCompanySizes, value]);
                          } else {
                            setSelectedCompanySizes(selectedCompanySizes.filter(s => s !== value));
                          }
                        }}
                        className="w-4 h-4 rounded accent-[var(--nexli-primary)]"
                      />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                  Filter Summary
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {decisionMakersOnly ? '✅ Owners & decision makers' : '⚠️ All roles'}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {selectedCompanySizes.length === 0 ? '⚠️ No sizes selected' :
                     selectedCompanySizes.every(s => ['1-10', '11-20', '21-50'].includes(s)) ? '🏢 Small firms only' :
                     '🏭 Multiple sizes'}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {stateFilter.length === 0 ? '🌎 All states' :
                     stateFilter.length === 1 ? `📍 ${stateFilter[0]}` :
                     `📍 ${stateFilter.length} states`}
                  </span>
                </div>
              </div>
            </div>

            {/* Title Filters Info */}
            <details className="text-xs">
              <summary
                className="cursor-pointer font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                View Title Filters
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <p className="font-bold text-[10px] mb-1" style={{ color: 'var(--gradient-start)' }}>
                    ✅ Included Titles:
                  </p>
                  <ul className="text-[10px] space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                    {includedTitles.slice(0, 6).map(title => (
                      <li key={title}>• {title}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-[10px] mb-1" style={{ color: '#EF4444' }}>
                    ❌ Excluded Titles:
                  </p>
                  <ul className="text-[10px] space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                    {excludedTitles.slice(0, 6).map(title => (
                      <li key={title}>• {title}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          </div>

          {error && (
            <div
              className="p-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--status-failed-bg)', color: 'var(--status-failed-text)' }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleScrape}
            disabled={isScraping || !query}
            className="w-full nexli-btn-gradient py-4 rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            {isScraping ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="gradient-spinner"></div>
                  <span>Scraping the web...</span>
                </div>
                <span className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.2em] animate-nexli-pulse">
                  {scrapingStep}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <NexliIcon className="w-5 h-5" />
                <span>Start Scraping</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <AnimatePresence>
        {results.length > 0 && (
          <>
            {/* Enrichment Progress Banner */}
            {enrichmentProgress.isEnriching && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-xl mb-4"
                style={{ background: 'var(--nexli-primary-light)', border: '1px solid var(--nexli-primary)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="var(--nexli-primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="30" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        Enriching data in background...
                      </p>
                      <div className="flex gap-4 mt-1">
                        {enrichWebsites && enrichmentProgress.websites.total > 0 && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            🌐 Websites: {enrichmentProgress.websites.current}/{enrichmentProgress.websites.total}
                          </p>
                        )}
                        {enrichRatings && enrichmentProgress.ratings.total > 0 && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            ⭐ Ratings: {enrichmentProgress.ratings.current}/{enrichmentProgress.ratings.total}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--nexli-primary)' }}>
                    {(() => {
                      const websiteTotal = enrichmentProgress.websites.total || 0;
                      const ratingTotal = enrichmentProgress.ratings.total || 0;
                      const total = websiteTotal + ratingTotal;
                      const completed = enrichmentProgress.websites.current + enrichmentProgress.ratings.current;
                      return total > 0 ? Math.round((completed / total) * 100) : 0;
                    })()}%
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl overflow-hidden"
            >
            <div
              className="p-5 flex items-center justify-between"
              style={{ borderBottom: `1px solid var(--border-subtle)` }}
            >
              <div className="flex items-center gap-3">
                <h3 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                  Scrape Results
                </h3>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full nexli-gradient-bg text-white"
                >
                  {filteredAndSortedResults.length} of {results.length} leads
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Score Filter */}
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value as any)}
                    className="text-xs font-bold outline-none cursor-pointer"
                    style={{ background: 'transparent', color: 'var(--text-secondary)' }}
                  >
                    <option value="all">All Scores</option>
                    <option value="hot">🔥 Hot (60+)</option>
                    <option value="warm">⚡ Warm (30-59)</option>
                    <option value="cold">❄️ Cold (&lt;30)</option>
                  </select>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs font-bold outline-none cursor-pointer"
                    style={{ background: 'transparent', color: 'var(--text-secondary)' }}
                  >
                    <option value="date">Date Added</option>
                    <option value="score">Score</option>
                    <option value="name">Name</option>
                    <option value="company">Company</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <ArrowUpRight className={`w-3.5 h-3.5 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <button
                  onClick={() => exportLeadsToCSV(filteredAndSortedResults)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--bg-elevated)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr
                  className="text-[10px] uppercase tracking-[0.15em] font-bold"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  <th className="px-5 py-3.5">Lead</th>
                  <th className="px-5 py-3.5">Email Status</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">LinkedIn</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedResults.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className="group transition-colors"
                    style={{
                      borderBottom: idx < filteredAndSortedResults.length - 1 ? `1px solid var(--border-subtle)` : 'none',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--bg-surface-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold"
                          style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {lead.name[0]}
                        </div>
                        <div>
                          <p
                            className="text-sm font-bold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {lead.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {lead.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background:
                            lead.status === 'verified'
                              ? 'var(--status-verified-bg)'
                              : lead.status === 'pending'
                                ? 'var(--status-pending-bg)'
                                : 'var(--status-failed-bg)',
                          color:
                            lead.status === 'verified'
                              ? 'var(--status-verified-text)'
                              : lead.status === 'pending'
                                ? 'var(--status-pending-text)'
                                : 'var(--status-failed-text)',
                        }}
                      >
                        {lead.status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                        {lead.status}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="px-5 py-4">
                      {lead.googleRating ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold" style={{
                            color: lead.googleRating >= 4.5 ? '#10B981' :
                                   lead.googleRating >= 3.5 ? '#F59E0B' : '#EF4444'
                          }}>
                            ⭐ {lead.googleRating.toFixed(1)}
                          </span>
                          {lead.googleReviewCount && lead.googleReviewCount > 0 && (
                            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                              ({lead.googleReviewCount})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          No rating
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {lead.company}
                        </span>
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-1 rounded-lg transition-all"
                            style={{
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-muted)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                              e.currentTarget.style.color = 'var(--gradient-start)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--bg-elevated)';
                              e.currentTarget.style.color = 'var(--text-muted)';
                            }}
                            title={`Visit ${lead.website}`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={lead.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#0077B5')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = 'var(--text-muted)')
                        }
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleGenerateEmail(lead)}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg transition-all text-xs font-bold nexli-gradient-bg text-white flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3 h-3" />
                          Generate Email
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Email Generation Modal */}
      <AnimatePresence>
        {selectedLead && (
          <EmailGenerationModal
            lead={selectedLead}
            email={generatedEmail}
            isGenerating={isGeneratingEmail}
            error={emailError}
            onClose={handleCloseEmailModal}
            onSend={handleSendEmail}
            onSchedule={handleScheduleEmail}
            canSend={!!generatedEmail && !isGeneratingEmail}
            isSending={isSendingEmail}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Campaigns View ---
function CampaignsView({
  isDark,
  campaigns,
  setCampaigns,
  emailLogs,
  setEmailLogs,
  allLeads,
  emailTemplates,
  scheduledCampaigns,
  setScheduledCampaigns,
  scheduledEmails,
  setScheduledEmails,
  addNotification,
  senderInstantlyMetrics,
  setSenderInstantlyMetrics,
}: {
  isDark: boolean;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  emailLogs: EmailLog[];
  setEmailLogs: React.Dispatch<React.SetStateAction<EmailLog[]>>;
  allLeads: Lead[];
  emailTemplates: EmailTemplate[];
  scheduledCampaigns: string[];
  setScheduledCampaigns: React.Dispatch<React.SetStateAction<string[]>>;
  scheduledEmails: ScheduledEmail[];
  setScheduledEmails: React.Dispatch<React.SetStateAction<ScheduledEmail[]>>;
  addNotification: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string, icon?: 'lead' | 'email' | 'campaign' | 'reply' | 'error') => void;
  senderInstantlyMetrics: Record<string, { sent: number; opened: number; clicked: number; replied: number; bounced: number }>;
  setSenderInstantlyMetrics: React.Dispatch<React.SetStateAction<Record<string, { sent: number; opened: number; clicked: number; replied: number; bounced: number }>>>;
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Scheduled emails management state
  const [selectedScheduledEmail, setSelectedScheduledEmail] = useState<ScheduledEmail | null>(null);
  const [showEditScheduledModal, setShowEditScheduledModal] = useState(false);
  const [showPreviewScheduledModal, setShowPreviewScheduledModal] = useState(false);

  // Campaign creation form state
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedLeadsForCampaign, setSelectedLeadsForCampaign] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Feature toggles
  const [enableABTest, setEnableABTest] = useState(false);
  const [abVariantA, setAbVariantA] = useState('');
  const [abVariantB, setAbVariantB] = useState('');
  const [abTestSize, setAbTestSize] = useState(20);

  const [enableScheduled, setEnableScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledHour, setScheduledHour] = useState('9');
  const [scheduledMinute, setScheduledMinute] = useState('00');
  const [scheduledPeriod, setScheduledPeriod] = useState('AM');
  const [scheduledTimezone, setScheduledTimezone] = useState('PST');

  const [enableFollowUp, setEnableFollowUp] = useState(false);
  const [followUpSteps, setFollowUpSteps] = useState<Array<{
    delayDays: number;
    condition: 'no_reply' | 'no_open' | 'always';
    subject: string;
    body: string;
  }>>([]);

  // Refresh campaign metrics from Instantly.ai API v2
  const refreshAllMetrics = async () => {
    setIsRefreshing(true);
    try {
      // Fetch real metrics for all 4 sender campaigns
      const response = await fetch('/api/instantly-metrics');
      if (response.ok) {
        const data = await response.json();

        // Update sender-level metrics
        if (data.senders) {
          const metricsMap: Record<string, any> = {};
          const senderEmailMap: Record<string, string> = {
            marcel: 'Marcel@nexlioutreach.net',
            justine: 'Justine@nexlioutreach.net',
            bernice: 'Bernice@nexlioutreach.net',
            jian: 'Jian@nexlioutreach.net',
          };

          for (const [senderKey, metrics] of Object.entries(data.senders) as [string, any][]) {
            const email = senderEmailMap[senderKey];
            if (email && !metrics.error) {
              metricsMap[email] = {
                sent: metrics.sent || 0,
                opened: metrics.opened || 0,
                clicked: metrics.clicked || 0,
                replied: metrics.replied || 0,
                bounced: metrics.bounced || 0,
              };
            }
          }
          setSenderInstantlyMetrics(metricsMap);
        }

        // Update campaign cards with aggregated totals
        if (data.totals && campaigns.length > 0) {
          const updatedCampaigns = campaigns.map(campaign => ({
            ...campaign,
            metrics: {
              ...campaign.metrics,
              sent: data.totals.sent,
              opened: data.totals.opened,
              clicked: data.totals.clicked,
              replied: data.totals.replied,
              bounced: data.totals.bounced,
              total: data.totals.total,
              delivered: data.totals.sent,
            },
          }));
          setCampaigns(updatedCampaigns);
        }

        setLastRefreshed(new Date());
      } else {
        console.error('Failed to fetch metrics');
      }

      // Also refresh email_logs from Supabase (so Recent Activity updates)
      if (user) {
        const { data: logsData } = await supabase
          .from('email_logs')
          .select(`
            *,
            leads:lead_id (name, email)
          `)
          .eq('user_id', user.id)
          .order('sent_at', { ascending: false });

        if (logsData && logsData.length > 0) {
          setEmailLogs(logsData.map((log: any) => ({
            id: log.id,
            campaignId: log.campaign_id || '',
            leadId: log.lead_id,
            leadName: (log.leads as any)?.name || log.lead_name || '',
            leadEmail: (log.leads as any)?.email || log.lead_email || '',
            sentAt: log.sent_at,
            status: log.status as any,
            subject: log.subject,
            body: log.body,
            senderName: log.sender_name,
            senderEmail: log.sender_email,
          })));
        }
      }

      addNotification('success', 'Metrics Updated', 'Real-time metrics and activity loaded', 'campaign');
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Scheduled email management functions
  const handleCancelScheduledEmail = async (emailId: string) => {
    if (confirm('Are you sure you want to cancel this scheduled email?')) {
      // Delete from Supabase so it doesn't come back on refresh
      const { error } = await supabase
        .from('scheduled_emails')
        .delete()
        .eq('id', emailId);

      if (error) {
        console.error('Failed to delete scheduled email from Supabase:', error);
        // Try updating status instead (in case delete policy is missing)
        await supabase
          .from('scheduled_emails')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', emailId);
      }

      setScheduledEmails((prev) => prev.filter((e) => e.id !== emailId));
      addNotification('success', 'Email Cancelled', 'Scheduled email has been cancelled', 'email');
    }
  };

  const handleEditScheduledEmail = (updatedEmail: ScheduledEmail) => {
    setScheduledEmails((prev) =>
      prev.map((e) => (e.id === updatedEmail.id ? updatedEmail : e))
    );
    addNotification('success', 'Email Updated', 'Scheduled email has been updated', 'email');
    setShowEditScheduledModal(false);
    setSelectedScheduledEmail(null);
  };

  const getTimeUntilScheduled = (scheduledFor: string) => {
    const now = new Date().getTime();
    const scheduled = new Date(scheduledFor).getTime();
    const diffMs = scheduled - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) return { text: 'Overdue', urgency: 'red' as const };
    if (diffHours < 1) {
      const diffMins = Math.round(diffMs / (1000 * 60));
      return { text: `${diffMins}m`, urgency: 'red' as const };
    }
    if (diffHours < 24) {
      return { text: `${Math.round(diffHours)}h`, urgency: 'yellow' as const };
    }
    const diffDays = Math.round(diffHours / 24);
    return { text: `${diffDays}d`, urgency: 'green' as const };
  };

  // Calculate total metrics across all campaigns
  const totalMetrics = campaigns.reduce(
    (acc, campaign) => ({
      sent: acc.sent + campaign.metrics.sent,
      opened: acc.opened + campaign.metrics.opened,
      clicked: acc.clicked + campaign.metrics.clicked,
      replied: acc.replied + campaign.metrics.replied,
    }),
    { sent: 0, opened: 0, clicked: 0, replied: 0 }
  );

  // Calculate rates
  const openRate = totalMetrics.sent > 0 ? Math.round((totalMetrics.opened / totalMetrics.sent) * 100) : 0;
  const clickRate = totalMetrics.opened > 0 ? Math.round((totalMetrics.clicked / totalMetrics.opened) * 100) : 0;
  const replyRate = totalMetrics.sent > 0 ? Math.round((totalMetrics.replied / totalMetrics.sent) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Mail className="w-7 h-7 md:w-8 md:h-8 text-blue-500" />
            Email Campaigns
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage bulk email outreach and track sender performance
            {lastRefreshed && (
              <span className="ml-2 text-xs">
                • Last updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshAllMetrics}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 justify-center border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--bg-surface)',
            }}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="nexli-btn-gradient px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 justify-center"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Overview Stats - Justine's Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="glass-card p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl nexli-gradient-bg flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Total Sent
            </p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{totalMetrics.sent}</p>
          </div>
        </div>

        <div className="glass-card p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-xs font-bold text-purple-500">{openRate}%</span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Opened
            </p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{totalMetrics.opened}</p>
          </div>
        </div>

        <div className="glass-card p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-xs font-bold text-orange-500">{clickRate}%</span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Clicked
            </p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{totalMetrics.clicked}</p>
          </div>
        </div>

        <div className="glass-card p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Reply className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs font-bold text-green-500">{replyRate}%</span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Replied
            </p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{totalMetrics.replied}</p>
          </div>
        </div>
      </div>

      {/* Scheduled Emails Section */}
      {scheduledEmails.length > 0 && (
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Scheduled Emails ({scheduledEmails.length})
            </h2>
            <button
              onClick={async () => {
                try {
                  // Step 1: Check what the CLIENT sees in Supabase
                  let clientMsg = '';
                  if (user) {
                    const { data: clientPending, error: clientErr } = await supabase
                      .from('scheduled_emails')
                      .select('id, status, scheduled_for, lead_email, sender_email')
                      .eq('user_id', user.id)
                      .order('created_at', { ascending: false })
                      .limit(10);

                    if (clientErr) {
                      clientMsg = `CLIENT DB ERROR: ${clientErr.message}`;
                    } else {
                      clientMsg = `CLIENT sees ${clientPending?.length || 0} emails:\n${(clientPending || []).map(e => `  ${e.status} | ${e.lead_email} | ${e.scheduled_for}`).join('\n') || '  (none)'}`;
                    }
                  } else {
                    clientMsg = 'CLIENT: No user logged in!';
                  }

                  // Step 2: Call server to check and send
                  const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ checkScheduled: true }),
                  });
                  const result = await response.json();
                  console.log('Manual check result:', JSON.stringify(result, null, 2));

                  const serverPending = result.diagnostics?.find((d: any) => d.step === 'supabase_query');
                  const serverTime = result.diagnostics?.find((d: any) => d.step === 'query_time');
                  const allRecent = serverPending?.all_recent_emails || [];

                  let serverMsg = `SERVER time: ${serverTime?.now || 'unknown'}\n`;
                  serverMsg += `SERVER sees ${serverPending?.pending_due_count || 0} pending due\n`;
                  serverMsg += `SERVER all recent (${allRecent.length}):\n${allRecent.map((e: any) => `  ${e.status} | ${e.lead_email} | ${e.scheduled_for}`).join('\n') || '  (none)'}`;

                  if (result.sent > 0) {
                    alert(`SENT ${result.sent} email(s)!\n\n${clientMsg}\n\n${serverMsg}`);
                    addNotification('success', 'Emails Sent!', `${result.sent} email(s) sent successfully`);
                  } else {
                    alert(`${clientMsg}\n\n${serverMsg}`);
                  }

                  // Reload scheduled emails
                  if (user) {
                    const { data } = await supabase
                      .from('scheduled_emails')
                      .select('*')
                      .eq('user_id', user.id)
                      .eq('status', 'pending')
                      .order('scheduled_for', { ascending: true });
                    if (data) {
                      setScheduledEmails(data.map((email: any) => ({
                        id: email.id,
                        lead: { id: email.lead_id, name: email.lead_name, email: email.lead_email, company: email.lead_company || '', role: email.lead_role || '', linkedin: '', status: 'verified' as const, score: 0 },
                        subject: email.subject, body: email.body, scheduledFor: email.scheduled_for,
                        senderName: email.sender_name, senderEmail: email.sender_email, createdAt: email.created_at,
                      })));
                    }
                  }
                } catch (error: any) {
                  alert(`Error: ${error.message}`);
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all hover:shadow-md"
              style={{ borderColor: '#F59E0B', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.08)' }}
            >
              <Send className="w-3 h-3" />
              Check & Send Now
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Scheduled For
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Sender
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Time Until
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {scheduledEmails
                  .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                  .map((email) => {
                    const timeInfo = getTimeUntilScheduled(email.scheduledFor);
                    const urgencyColors = {
                      red: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' },
                      yellow: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B' },
                      green: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: '#10B981' },
                    };
                    const colors = urgencyColors[timeInfo.urgency];

                    return (
                      <tr
                        key={email.id}
                        className="border-b transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-sm">{email.lead.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {email.lead.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium line-clamp-1">{email.subject}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm">
                            {new Date(email.scheduledFor).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium">{email.senderName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {email.senderEmail}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: colors.bg,
                              color: colors.text,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            {timeInfo.text}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedScheduledEmail(email);
                                setShowPreviewScheduledModal(true);
                              }}
                              className="p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Preview Email"
                            >
                              <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedScheduledEmail(email);
                                setShowEditScheduledModal(true);
                              }}
                              className="p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Edit Email"
                            >
                              <Edit2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            </button>
                            <button
                              onClick={() => handleCancelScheduledEmail(email.id)}
                              className="p-2 rounded-lg transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Cancel Email"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Campaigns Progress */}
      {campaigns.filter((c) => c.status === 'active').length > 0 && (
        <div className="glass-card p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Justine's Active Campaigns
          </h2>
          <div className="space-y-4">
            {campaigns
              .filter((c) => c.status === 'active')
              .map((campaign) => {
                const progress = campaign.metrics.total > 0
                  ? Math.round((campaign.metrics.sent / campaign.metrics.total) * 100)
                  : 0;
                return (
                  <div key={campaign.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{campaign.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {campaign.metrics.sent} / {campaign.metrics.total} sent ({progress}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full nexli-gradient-bg transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Campaign List */}
      <div className="glass-card p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4">All Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">No campaigns yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Create your first email campaign to start sending
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="nexli-btn-gradient px-4 py-2 rounded-xl font-medium"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="glass-card p-4 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{campaign.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold',
                      campaign.status === 'active' && 'bg-green-500/20 text-green-500',
                      campaign.status === 'draft' && 'bg-gray-500/20 text-gray-500',
                      campaign.status === 'paused' && 'bg-yellow-500/20 text-yellow-500',
                      campaign.status === 'completed' && 'bg-blue-500/20 text-blue-500'
                    )}
                  >
                    {campaign.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{campaign.metrics.sent}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sent</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-500">{campaign.metrics.opened}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Opens</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-500">{campaign.metrics.clicked}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Clicks</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-500">{campaign.metrics.replied}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Replies</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Email Activity */}
      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">Recent Activity</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {emailLogs.length} total
            </span>
            <button
              onClick={refreshAllMetrics}
              disabled={isRefreshing}
              className="text-xs font-medium flex items-center gap-1 hover:opacity-100 transition-opacity disabled:opacity-30"
              style={{ color: 'var(--text-muted)' }}
            >
              <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        {emailLogs.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No emails sent yet
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left py-2 font-medium w-8" style={{ color: 'var(--text-muted)' }}></th>
                    <th className="text-left py-2 font-medium" style={{ color: 'var(--text-muted)' }}>Sender</th>
                    <th className="text-left py-2 font-medium" style={{ color: 'var(--text-muted)' }}>Recipient</th>
                    <th className="text-left py-2 font-medium hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Subject</th>
                    <th className="text-left py-2 font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-left py-2 font-medium hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.slice(0, showAllLogs ? 50 : 20).map((log) => {
                    const senderInfo = SENDER_EMAILS.find(s => s.email.toLowerCase() === (log.senderEmail || '').toLowerCase());
                    const isExpanded = expandedLogId === log.id;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className="border-b cursor-pointer hover:bg-white/5 transition-colors"
                          style={{ borderColor: 'var(--border-color)' }}
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          <td className="py-3">
                            <ChevronRight
                              className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')}
                              style={{ color: 'var(--text-muted)' }}
                            />
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: senderInfo?.color || '#6B7280' }}
                              />
                              <span className="font-medium text-xs">
                                {log.senderName || senderInfo?.name || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-sm">{log.leadName}</p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.leadEmail}</p>
                            </div>
                          </td>
                          <td className="py-3 hidden lg:table-cell">
                            <p className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
                              {log.subject || 'No subject'}
                            </p>
                          </td>
                          <td className="py-3">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-xs font-bold',
                                log.status === 'sent' && 'bg-blue-500/20 text-blue-500',
                                log.status === 'delivered' && 'bg-blue-500/20 text-blue-500',
                                log.status === 'opened' && 'bg-purple-500/20 text-purple-500',
                                log.status === 'clicked' && 'bg-orange-500/20 text-orange-500',
                                log.status === 'replied' && 'bg-green-500/20 text-green-500',
                                log.status === 'failed' && 'bg-red-500/20 text-red-500',
                                log.status === 'bounced' && 'bg-red-500/20 text-red-500',
                                log.status === 'pending' && 'bg-gray-500/20 text-gray-500'
                              )}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 text-xs hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>
                            {log.sentAt ? new Date(log.sentAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            }) : '-'}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="p-0">
                              <div
                                className="p-4 mx-2 mb-2 rounded-xl"
                                style={{ background: 'var(--bg-input)' }}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                                      From
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: senderInfo?.color || '#6B7280' }}
                                      />
                                      <span className="text-sm font-medium">
                                        {log.senderName || 'Unknown'} ({log.senderEmail || 'N/A'})
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                                      To
                                    </p>
                                    <span className="text-sm font-medium">
                                      {log.leadName} ({log.leadEmail})
                                    </span>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                                    Subject
                                  </p>
                                  <p className="text-sm font-medium">{log.subject || 'No subject'}</p>
                                </div>
                                {log.body && (
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                      Body
                                    </p>
                                    <div
                                      className="text-sm rounded-lg p-3 max-h-[300px] overflow-y-auto"
                                      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                      dangerouslySetInnerHTML={{ __html: log.body }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {emailLogs.length > 20 && !showAllLogs && (
              <button
                onClick={() => setShowAllLogs(true)}
                className="w-full mt-3 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-80"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}
              >
                Show More ({emailLogs.length - 20} remaining)
              </button>
            )}
          </>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display">Create Campaign</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Q1 Tax Season Outreach"
                  className="w-full rounded-xl px-4 py-3 outline-none text-sm"
                  style={{
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  Email Template (Feature 2)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 outline-none text-sm"
                  style={{
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <option value="">Custom Email (No Template)</option>
                  {emailTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.subject}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Variables will be filled automatically: {emailTemplates.find(t => t.id === selectedTemplate)?.variables.join(', ')}
                  </p>
                )}
              </div>

              {/* Lead Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  Select Leads ({selectedLeadsForCampaign.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-elevated)' }}>
                  <label className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-black/5">
                    <input
                      type="checkbox"
                      checked={selectedLeadsForCampaign.length === allLeads.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeadsForCampaign(allLeads.map(l => l.id));
                        } else {
                          setSelectedLeadsForCampaign([]);
                        }
                      }}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--gradient-start)' }}
                    />
                    <span className="text-sm font-bold">Select All ({allLeads.length} leads)</span>
                  </label>
                  {allLeads.slice(0, 20).map((lead) => (
                    <label key={lead.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-black/5">
                      <input
                        type="checkbox"
                        checked={selectedLeadsForCampaign.includes(lead.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadsForCampaign([...selectedLeadsForCampaign, lead.id]);
                          } else {
                            setSelectedLeadsForCampaign(selectedLeadsForCampaign.filter(id => id !== lead.id));
                          }
                        }}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: 'var(--gradient-start)' }}
                      />
                      <span className="text-sm">{lead.name} ({lead.email})</span>
                    </label>
                  ))}
                  {allLeads.length > 20 && (
                    <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                      + {allLeads.length - 20} more leads (use Select All)
                    </p>
                  )}
                </div>
              </div>

              {/* A/B Testing (Feature 7) */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableABTest}
                    onChange={(e) => setEnableABTest(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--gradient-start)' }}
                  />
                  <div>
                    <span className="text-sm font-bold">Enable A/B Testing (Feature 7)</span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Test 2 subject lines to optimize open rates
                    </p>
                  </div>
                </label>
                {enableABTest && (
                  <div className="space-y-3 mt-4 pl-7">
                    <input
                      type="text"
                      value={abVariantA}
                      onChange={(e) => setAbVariantA(e.target.value)}
                      placeholder="Subject Line A"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                    <input
                      type="text"
                      value={abVariantB}
                      onChange={(e) => setAbVariantB(e.target.value)}
                      placeholder="Subject Line B"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                    <div>
                      <label className="text-xs font-bold mb-2 block">Test Size: {abTestSize}%</label>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={abTestSize}
                        onChange={(e) => setAbTestSize(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Send to {abTestSize}% ({Math.round(selectedLeadsForCampaign.length * abTestSize / 100)} leads), then send winner to remaining {100 - abTestSize}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scheduled Sending (Feature 8) */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableScheduled}
                    onChange={(e) => setEnableScheduled(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--gradient-start)' }}
                  />
                  <div>
                    <span className="text-sm font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Schedule Send (Feature 8)
                    </span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Send campaign at a specific date and time
                    </p>
                  </div>
                </label>
                {enableScheduled && (
                  <div className="space-y-4 mt-4 pl-7">
                    {/* Quick Presets */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                        Quick Presets
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'Tomorrow 9 AM', days: 1, hour: '9', minute: '00', period: 'AM' },
                          { label: 'Tomorrow 2 PM', days: 1, hour: '2', minute: '00', period: 'PM' },
                          { label: 'Next Week Mon', days: 7, hour: '10', minute: '00', period: 'AM' },
                          { label: 'In 3 Days 9 AM', days: 3, hour: '9', minute: '00', period: 'AM' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => {
                              const date = new Date();
                              date.setDate(date.getDate() + preset.days);
                              setScheduledDate(date.toISOString().split('T')[0]);
                              setScheduledHour(preset.hour);
                              setScheduledMinute(preset.minute);
                              setScheduledPeriod(preset.period);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                            style={{
                              background: 'var(--bg-input)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Selector */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                        📅 Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-lg px-4 py-2.5 text-sm outline-none border-2 transition-all"
                        style={{
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          borderColor: scheduledDate ? 'var(--gradient-start)' : 'var(--border-color)',
                        }}
                      />
                    </div>

                    {/* Time Selector */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                        🕐 Time
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={scheduledHour}
                          onChange={(e) => setScheduledHour(e.target.value)}
                          className="rounded-lg px-3 py-2.5 text-sm font-bold outline-none border-2 transition-all"
                          style={{
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--gradient-start)',
                          }}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                            <option key={hour} value={hour}>
                              {hour}
                            </option>
                          ))}
                        </select>
                        <select
                          value={scheduledMinute}
                          onChange={(e) => setScheduledMinute(e.target.value)}
                          className="rounded-lg px-3 py-2.5 text-sm font-bold outline-none border-2 transition-all"
                          style={{
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--gradient-start)',
                          }}
                        >
                          {['00', '15', '30', '45'].map((min) => (
                            <option key={min} value={min}>
                              {min}
                            </option>
                          ))}
                        </select>
                        <select
                          value={scheduledPeriod}
                          onChange={(e) => setScheduledPeriod(e.target.value)}
                          className="rounded-lg px-3 py-2.5 text-sm font-bold outline-none border-2 transition-all"
                          style={{
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--gradient-start)',
                          }}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                      <p className="text-xs mt-2 text-center font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {scheduledHour}:{scheduledMinute} {scheduledPeriod}
                      </p>
                    </div>

                    {/* Timezone Selector */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-muted)' }}>
                        🌎 Timezone
                      </label>
                      <select
                        value={scheduledTimezone}
                        onChange={(e) => setScheduledTimezone(e.target.value)}
                        className="w-full rounded-lg px-4 py-2.5 text-sm font-bold outline-none border-2 transition-all"
                        style={{
                          background: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--gradient-start)',
                        }}
                      >
                        <option value="PST">🌅 Pacific Time (PST)</option>
                        <option value="MST">🏔️ Mountain Time (MST)</option>
                        <option value="CST">🌾 Central Time (CST)</option>
                        <option value="EST">🗽 Eastern Time (EST)</option>
                      </select>
                    </div>

                    {/* Preview */}
                    {scheduledDate && (
                      <div className="p-3 rounded-lg text-center" style={{ background: 'var(--status-verified-bg)' }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                          Scheduled For
                        </p>
                        <p className="text-sm font-bold" style={{ color: 'var(--status-verified-text)' }}>
                          {(() => {
                            const date = new Date(scheduledDate);
                            const hour24 = scheduledPeriod === 'PM' && scheduledHour !== '12'
                              ? parseInt(scheduledHour) + 12
                              : scheduledPeriod === 'AM' && scheduledHour === '12'
                              ? 0
                              : parseInt(scheduledHour);

                            const formattedDate = date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });

                            return `${formattedDate} at ${scheduledHour}:${scheduledMinute} ${scheduledPeriod} ${scheduledTimezone}`;
                          })()}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Campaign will be sent automatically
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Follow-Up Sequences (Feature 6) */}
              <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableFollowUp}
                    onChange={(e) => setEnableFollowUp(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: 'var(--gradient-start)' }}
                  />
                  <div>
                    <span className="text-sm font-bold">Auto Follow-Up Sequence (Feature 6)</span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Automatically send follow-ups based on conditions
                    </p>
                  </div>
                </label>
                {enableFollowUp && (
                  <div className="space-y-3 mt-4 pl-7">
                    <button
                      onClick={() => setFollowUpSteps([...followUpSteps, {
                        delayDays: 3,
                        condition: 'no_reply',
                        subject: 'Following up on my previous email',
                        body: 'Hi {{firstName}},\n\nJust wanted to follow up on my last email...'
                      }])}
                      className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    >
                      <Plus className="w-3 h-3" />
                      Add Follow-Up Step
                    </button>
                    {followUpSteps.map((step, idx) => (
                      <div key={idx} className="p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-input)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Follow-up #{idx + 1}</span>
                          <button
                            onClick={() => setFollowUpSteps(followUpSteps.filter((_, i) => i !== idx))}
                            className="p-1 rounded"
                            style={{ color: 'var(--status-failed-text)' }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={step.delayDays}
                            onChange={(e) => {
                              const updated = [...followUpSteps];
                              updated[idx].delayDays = Number(e.target.value);
                              setFollowUpSteps(updated);
                            }}
                            placeholder="Days"
                            className="rounded px-2 py-1 text-xs outline-none"
                            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                          />
                          <select
                            value={step.condition}
                            onChange={(e) => {
                              const updated = [...followUpSteps];
                              updated[idx].condition = e.target.value as any;
                              setFollowUpSteps(updated);
                            }}
                            className="rounded px-2 py-1 text-xs outline-none"
                            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                          >
                            <option value="no_reply">If No Reply</option>
                            <option value="no_open">If Not Opened</option>
                            <option value="always">Always Send</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          value={step.subject}
                          onChange={(e) => {
                            const updated = [...followUpSteps];
                            updated[idx].subject = e.target.value;
                            setFollowUpSteps(updated);
                          }}
                          placeholder="Follow-up subject"
                          className="w-full rounded px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => {
                    if (selectedLeadsForCampaign.length === 0) {
                      alert('Please select at least one lead');
                      return;
                    }
                    setShowPreview(true);
                  }}
                  disabled={selectedLeadsForCampaign.length === 0}
                  className="flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Preview Emails (Feature 5)
                </button>
                <button
                  onClick={() => {
                    if (!campaignName || selectedLeadsForCampaign.length === 0) {
                      alert('Please fill in campaign name and select leads');
                      return;
                    }

                    // Combine date and time into ISO datetime string
                    let scheduledDateTimeISO = '';
                    if (enableScheduled && scheduledDate) {
                      const hour24 = scheduledPeriod === 'PM' && scheduledHour !== '12'
                        ? parseInt(scheduledHour) + 12
                        : scheduledPeriod === 'AM' && scheduledHour === '12'
                        ? 0
                        : parseInt(scheduledHour);

                      const dateTime = new Date(scheduledDate);
                      dateTime.setHours(hour24, parseInt(scheduledMinute), 0, 0);
                      scheduledDateTimeISO = dateTime.toISOString();
                    }

                    // Create campaign
                    const newCampaign: Campaign = {
                      id: `campaign-${Date.now()}`,
                      name: campaignName,
                      createdAt: new Date().toISOString(),
                      status: enableScheduled ? 'scheduled' : 'draft',
                      leadIds: selectedLeadsForCampaign,
                      senderName: 'Your Name',
                      senderEmail: 'you@example.com',
                      metrics: {
                        total: selectedLeadsForCampaign.length,
                        sent: 0,
                        delivered: 0,
                        opened: 0,
                        clicked: 0,
                        replied: 0,
                        bounced: 0,
                      },
                      followUpSequence: enableFollowUp ? { steps: followUpSteps } : undefined,
                      abTest: enableABTest ? {
                        variantA: { subject: abVariantA, recipientCount: 0, opens: 0 },
                        variantB: { subject: abVariantB, recipientCount: 0, opens: 0 },
                        testSize: abTestSize,
                      } : undefined,
                      scheduledSend: enableScheduled && scheduledDateTimeISO ? {
                        scheduledFor: scheduledDateTimeISO,
                        timezone: scheduledTimezone,
                      } : undefined,
                    };

                    setCampaigns([...campaigns, newCampaign]);
                    if (enableScheduled && scheduledDateTimeISO) {
                      setScheduledCampaigns([...scheduledCampaigns, newCampaign.id]);
                    }

                    // Reset form
                    setCampaignName('');
                    setSelectedTemplate('');
                    setSelectedLeadsForCampaign([]);
                    setScheduledDate('');
                    setScheduledHour('9');
                    setScheduledMinute('00');
                    setScheduledPeriod('AM');
                    setEnableABTest(false);
                    setEnableScheduled(false);
                    setEnableFollowUp(false);
                    setFollowUpSteps([]);
                    setShowCreateModal(false);

                    addNotification('success', 'Campaign Created', `"${campaignName}" is ready!`, 'campaign');
                  }}
                  disabled={!campaignName || selectedLeadsForCampaign.length === 0}
                  className="flex-1 nexli-btn-gradient px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal (Feature 5) */}
      {showPreview && selectedLeadsForCampaign.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="glass-card p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display">Email Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg transition-all"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Preview Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="p-2 rounded-lg transition-all disabled:opacity-30"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold">
                  Preview {previewIndex + 1} of {Math.min(5, selectedLeadsForCampaign.length)}
                </span>
                <button
                  onClick={() => setPreviewIndex(Math.min(Math.min(4, selectedLeadsForCampaign.length - 1), previewIndex + 1))}
                  disabled={previewIndex >= Math.min(4, selectedLeadsForCampaign.length - 1)}
                  className="p-2 rounded-lg transition-all disabled:opacity-30"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const lead = allLeads.find(l => l.id === selectedLeadsForCampaign[previewIndex]);
                if (!lead) return null;

                const template = selectedTemplate ? emailTemplates.find(t => t.id === selectedTemplate) : null;
                const email = template ? fillTemplate(template, lead) : {
                  subject: enableABTest ? (previewIndex % 2 === 0 ? abVariantA : abVariantB) : 'Your Email Subject',
                  body: 'Your email body here...'
                };

                return (
                  <div className="space-y-4">
                    {/* Lead Info */}
                    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        Recipient
                      </p>
                      <p className="font-bold">{lead.name}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{lead.email}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {lead.role} at {lead.company}
                      </p>
                    </div>

                    {/* Email Preview */}
                    <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-elevated)' }}>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                          Subject
                        </p>
                        <p className="font-bold">{email.subject}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                          Body
                        </p>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                          {email.body}
                        </p>
                      </div>
                    </div>

                    {enableABTest && (
                      <div className="p-3 rounded-lg text-center text-xs" style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending-text)' }}>
                        This lead will receive: <strong>{previewIndex % 2 === 0 ? 'Variant A' : 'Variant B'}</strong>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    // User can now proceed to create the campaign
                  }}
                  className="flex-1 nexli-btn-gradient px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Looks Good!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Scheduled Email Modal */}
      {showEditScheduledModal && selectedScheduledEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Edit2 className="w-6 h-6 text-blue-500" />
                Edit Scheduled Email
              </h2>
              <button
                onClick={() => {
                  setShowEditScheduledModal(false);
                  setSelectedScheduledEmail(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Recipient Info */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Recipient
                </p>
                <p className="font-bold mt-1">{selectedScheduledEmail.lead.name}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {selectedScheduledEmail.lead.email}
                </p>
              </div>

              {/* Edit Subject */}
              <div>
                <label className="block text-sm font-medium mb-2">Subject Line</label>
                <input
                  type="text"
                  defaultValue={selectedScheduledEmail.subject}
                  id="edit-subject"
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Edit Body */}
              <div>
                <label className="block text-sm font-medium mb-2">Email Body</label>
                <textarea
                  defaultValue={selectedScheduledEmail.body}
                  id="edit-body"
                  rows={12}
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all resize-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Edit Schedule Time */}
              <div>
                <label className="block text-sm font-medium mb-2">Scheduled Time</label>
                <input
                  type="datetime-local"
                  defaultValue={new Date(selectedScheduledEmail.scheduledFor).toISOString().slice(0, 16)}
                  id="edit-schedule-time"
                  min={(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; })()}
                  className="w-full px-4 py-3 rounded-lg border-2 transition-all"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditScheduledModal(false);
                    setSelectedScheduledEmail(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium border-2 transition-all"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const subject = (document.getElementById('edit-subject') as HTMLInputElement)?.value;
                    const body = (document.getElementById('edit-body') as HTMLTextAreaElement)?.value;
                    const scheduleTime = (document.getElementById('edit-schedule-time') as HTMLInputElement)?.value;

                    if (subject && body && scheduleTime) {
                      const updatedEmail: ScheduledEmail = {
                        ...selectedScheduledEmail,
                        subject,
                        body,
                        scheduledFor: new Date(scheduleTime).toISOString(),
                      };
                      handleEditScheduledEmail(updatedEmail);
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium nexli-btn-gradient"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Scheduled Email Modal */}
      {showPreviewScheduledModal && selectedScheduledEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 text-purple-500" />
                Preview Scheduled Email
              </h2>
              <button
                onClick={() => {
                  setShowPreviewScheduledModal(false);
                  setSelectedScheduledEmail(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email Header Info */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      FROM
                    </p>
                    <p className="font-medium">{selectedScheduledEmail.senderName}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {selectedScheduledEmail.senderEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      TO
                    </p>
                    <p className="font-medium">{selectedScheduledEmail.lead.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {selectedScheduledEmail.lead.email}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                    SCHEDULED FOR
                  </p>
                  <p className="font-medium">
                    {new Date(selectedScheduledEmail.scheduledFor).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {(() => {
                      const timeInfo = getTimeUntilScheduled(selectedScheduledEmail.scheduledFor);
                      return `Sends in ${timeInfo.text}`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  SUBJECT
                </p>
                <p className="font-bold text-lg">{selectedScheduledEmail.subject}</p>
              </div>

              {/* Email Body */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  MESSAGE
                </p>
                <div
                  className="p-4 rounded-lg whitespace-pre-wrap"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {selectedScheduledEmail.body}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPreviewScheduledModal(false);
                    setSelectedScheduledEmail(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium border-2 transition-all"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPreviewScheduledModal(false);
                    setShowEditScheduledModal(true);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 nexli-btn-gradient"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main App ---
export default function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string; profile_photo_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('nexli-active-tab');
    return stored || 'dashboard';
  });
  const [allLeads, setAllLeads] = useState<Lead[]>([]);

  // Campaign state with localStorage persistence
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const stored = localStorage.getItem('nexli-campaigns');
    return stored ? JSON.parse(stored) : [];
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    const stored = localStorage.getItem('nexli-email-logs');
    return stored ? JSON.parse(stored) : [];
  });

  // Real Instantly metrics per sender (shared between Dashboard and Campaigns)
  const [senderInstantlyMetrics, setSenderInstantlyMetrics] = useState<Record<string, { sent: number; opened: number; clicked: number; replied: number; bounced: number }>>({});

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop sidebar collapse state with localStorage persistence
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('nexli-sidebar-collapsed');
    return stored === 'true';
  });

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('nexli-sidebar-collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Notifications state with localStorage persistence
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('nexli-notifications');
    return stored ? JSON.parse(stored) : [];
  });

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('nexli-theme');
    if (stored) return stored === 'dark';
    return true; // Default to dark mode
  });

  // Email generation state for My Leads view
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null);
  const [generatedEmailForLead, setGeneratedEmailForLead] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmailForLead, setIsGeneratingEmailForLead] = useState(false);
  const [emailErrorForLead, setEmailErrorForLead] = useState('');
  const [isSendingEmailForLead, setIsSendingEmailForLead] = useState(false);

  // Scheduled emails state
  // Scheduled emails are now stored in Supabase (loaded on auth)
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);

  // Sender rotation index for A/B/C/D testing
  const [senderRotationIndex, setSenderRotationIndex] = useState(() => {
    const stored = localStorage.getItem('nexli-sender-rotation-index');
    return stored ? parseInt(stored) : 0;
  });

  // Feature states (8 advanced features)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'has-website' | 'no-website'>('all');
  const [favoritesFilter, setFavoritesFilter] = useState<'all' | 'favorites-only' | 'exclude-favorites'>('all');
  const [isEnrichingRatings, setIsEnrichingRatings] = useState(false);
  const [ratingEnrichmentProgress, setRatingEnrichmentProgress] = useState({ current: 0, total: 0 });

  // Bulk email generation state
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState({ current: 0, total: 0 });
  const [showBulkScheduleModal, setShowBulkScheduleModal] = useState(false);
  const [bulkScheduleDateTime, setBulkScheduleDateTime] = useState('');

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => {
    const stored = localStorage.getItem('nexli-email-templates');
    return stored ? JSON.parse(stored) : [
      {
        id: 'template-1',
        name: 'Tax Season Outreach',
        description: 'General tax season outreach template',
        subject: 'Quick question about {{company}}\'s tax prep',
        body: 'Hi {{firstName}},\n\nI noticed {{company}} and wanted to reach out. As tax season approaches, many {{role}}s are looking for ways to streamline their accounting processes.\n\nWould you be open to a quick 15-minute call to discuss how we can help?\n\nBest,\nYour Name',
        variables: ['{{firstName}}', '{{company}}', '{{role}}'],
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: 'template-2',
        name: 'LinkedIn Connection Follow-up',
        description: 'Follow up after LinkedIn connection',
        subject: 'Great connecting with you, {{firstName}}',
        body: 'Hi {{firstName}},\n\nThanks for connecting! I see you\'re a {{role}} at {{company}}.\n\nI help businesses like yours optimize their financial operations. Would love to learn more about your current setup and see if we can add value.\n\nAre you available for a brief call this week?\n\nCheers,\nYour Name',
        variables: ['{{firstName}}', '{{company}}', '{{role}}'],
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: 'template-3',
        name: 'Cold Outreach - Value Prop',
        description: 'Direct value proposition cold email',
        subject: 'Helping {{company}} save time on accounting',
        body: 'Hi {{firstName}},\n\nI noticed {{company}} is in {{city}}, {{state}}. We\'ve helped similar businesses in your area reduce their accounting workload by 40%.\n\nInterested in learning how we can help {{company}}?\n\nLet me know if you\'d like to see a quick demo.\n\nBest regards,\nYour Name',
        variables: ['{{firstName}}', '{{company}}', '{{city}}', '{{state}}'],
        createdAt: new Date().toISOString(),
        usageCount: 0,
      },
    ];
  });

  const [scheduledCampaigns, setScheduledCampaigns] = useState<string[]>(() => {
    const stored = localStorage.getItem('nexli-scheduled-campaigns');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('nexli-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('nexli-active-tab', activeTab);
  }, [activeTab]);

  // Persist campaigns to localStorage
  useEffect(() => {
    localStorage.setItem('nexli-campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  // Persist email logs to localStorage
  useEffect(() => {
    localStorage.setItem('nexli-email-logs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  // Persist notifications to localStorage
  useEffect(() => {
    localStorage.setItem('nexli-notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Scheduled emails are persisted to Supabase (no localStorage needed)

  // Persist email templates to localStorage
  useEffect(() => {
    localStorage.setItem('nexli-email-templates', JSON.stringify(emailTemplates));
  }, [emailTemplates]);

  // Persist scheduled campaigns to localStorage
  useEffect(() => {
    localStorage.setItem('nexli-scheduled-campaigns', JSON.stringify(scheduledCampaigns));
  }, [scheduledCampaigns]);

  // Persist sender rotation index to localStorage
  useEffect(() => {
    localStorage.setItem('nexli-sender-rotation-index', String(senderRotationIndex));
  }, [senderRotationIndex]);

  // Server-Side Email Scheduler - Calls API endpoint to send scheduled emails
  useEffect(() => {
    // Function to trigger server-side email sending
    const checkAndSendEmails = async () => {
      try {
        console.log(`📧 Triggering server-side email check at ${new Date().toLocaleTimeString()}`);

        // Call the server endpoint to check and send overdue emails
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkScheduled: true }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Server response:`, JSON.stringify(result, null, 2));

          if (result.sent > 0) {
            addNotification(
              'success',
              'Scheduled Emails Sent',
              `${result.sent} email${result.sent > 1 ? 's' : ''} sent successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
              'email'
            );

            // Reload scheduled emails from Supabase
            if (user) {
              const { data } = await supabase
                .from('scheduled_emails')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .order('scheduled_for', { ascending: true });

              if (data) {
                // Convert to ScheduledEmail format
                const emails: ScheduledEmail[] = data.map((email: any) => ({
                  id: email.id,
                  lead: {
                    id: email.lead_id,
                    name: email.lead_name,
                    email: email.lead_email,
                    company: email.lead_company || '',
                    role: email.lead_role || '',
                    linkedin: '',
                    status: 'verified' as const,
                    score: 0,
                  },
                  subject: email.subject,
                  body: email.body,
                  scheduledFor: email.scheduled_for,
                  senderName: email.sender_name,
                  senderEmail: email.sender_email,
                  createdAt: email.created_at,
                }));
                setScheduledEmails(emails);
              }

              // Also reload email_logs so Recent Activity updates
              const { data: logsData } = await supabase
                .from('email_logs')
                .select(`
                  *,
                  leads:lead_id (name, email)
                `)
                .eq('user_id', user.id)
                .order('sent_at', { ascending: false });

              if (logsData && logsData.length > 0) {
                setEmailLogs(logsData.map((log: any) => ({
                  id: log.id,
                  campaignId: log.campaign_id || '',
                  leadId: log.lead_id,
                  leadName: (log.leads as any)?.name || '',
                  leadEmail: (log.leads as any)?.email || '',
                  sentAt: log.sent_at,
                  status: log.status as any,
                  subject: log.subject,
                  body: log.body,
                  senderName: log.sender_name,
                  senderEmail: log.sender_email,
                })));
              }
            }
          }
        } else {
          console.error('Failed to trigger server-side sending:', await response.text());
        }
      } catch (error) {
        console.error('Error triggering server-side email sending:', error);
      }
    };

    // Run immediately on mount to send any overdue emails
    checkAndSendEmails();

    // Then check every minute
    const interval = setInterval(checkAndSendEmails, 60000);

    return () => clearInterval(interval);
  }, [user]);

  // Authentication check and data loading
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);

          // Load user profile
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, profile_photo_url')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUserProfile(profile);
          }

          // Load leads from database
          const { data: leadsData } = await supabase
            .from('leads')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (leadsData) {
            setAllLeads(leadsData.map(lead => ({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              company: lead.company,
              role: lead.role,
              linkedin: lead.linkedin || '',
              location: lead.location || '',
              score: lead.score,
              tags: lead.tags || [],
              status: 'verified' as const,
            })));
          }

          // Load campaigns from database
          const { data: campaignsData } = await supabase
            .from('campaigns')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (campaignsData) {
            setCampaigns(campaignsData.map(campaign => ({
              id: campaign.id,
              name: campaign.name,
              createdAt: campaign.created_at,
              status: campaign.status as any,
              leadIds: [],
              senderName: '',
              senderEmail: '',
              metrics: {
                total: campaign.total_leads,
                sent: campaign.emails_sent,
                delivered: 0,
                opened: campaign.opens,
                clicked: 0,
                replied: campaign.replies,
                bounced: 0,
              },
              followUpSequence: campaign.follow_up_sequence,
              abTest: campaign.ab_test,
              scheduledSend: campaign.scheduled_send,
            })));
          }

          // Load email templates from database
          const { data: templatesData } = await supabase
            .from('email_templates')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (templatesData) {
            setEmailTemplates(templatesData.map(template => ({
              id: template.id,
              name: template.name,
              description: template.description || undefined,
              subject: template.subject,
              body: template.body,
              variables: template.variables,
              createdAt: template.created_at,
              usageCount: template.usage_count,
            })));
          }

          // Load email logs from database
          const { data: logsData } = await supabase
            .from('email_logs')
            .select(`
              *,
              leads:lead_id (name, email)
            `)
            .eq('user_id', session.user.id)
            .order('sent_at', { ascending: false });

          if (logsData) {
            setEmailLogs(logsData.map(log => ({
              id: log.id,
              campaignId: log.campaign_id || '',
              leadId: log.lead_id,
              leadName: (log.leads as any)?.name || '',
              leadEmail: (log.leads as any)?.email || '',
              sentAt: log.sent_at,
              status: log.status as any,
              subject: log.subject,
              body: log.body,
              senderName: log.sender_name,
              senderEmail: log.sender_email,
            })));
          }

          // Load scheduled emails from database
          const { data: scheduledData } = await supabase
            .from('scheduled_emails')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('status', 'pending')
            .order('scheduled_for', { ascending: true });

          if (scheduledData) {
            setScheduledEmails(scheduledData.map((email: any) => ({
              id: email.id,
              lead: {
                id: email.lead_id,
                name: email.lead_name,
                email: email.lead_email,
                company: email.lead_company || '',
                role: email.lead_role || '',
                linkedin: '',
                status: 'verified' as const,
                score: 0,
              },
              subject: email.subject,
              body: email.body,
              scheduledFor: email.scheduled_for,
              senderName: email.sender_name,
              senderEmail: email.sender_email,
              createdAt: email.created_at,
            })));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only update user state if the user ID actually changed (prevents unnecessary re-renders on tab switch)
      setUser(prevUser => {
        const newUserId = session?.user?.id;
        const prevUserId = prevUser?.id;

        // If user IDs are the same, don't update state (prevents loading screen on tab switch)
        if (newUserId === prevUserId) {
          return prevUser;
        }

        // User changed (login/logout), update state and clear data if logged out
        if (!session?.user) {
          setUserProfile(null);
          setAllLeads([]);
          setCampaigns([]);
          setEmailTemplates([]);
          setEmailLogs([]);
        }

        return session?.user || null;
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user data from Supabase when user logs in
  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      try {
        setLoading(true);

        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, profile_photo_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }

        // Fetch leads
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;

        if (leads) {
          // Map database fields to Lead interface
          const mappedLeads: Lead[] = leads.map((dbLead: any) => ({
            id: dbLead.id,
            name: dbLead.name,
            email: dbLead.email,
            company: dbLead.company,
            role: dbLead.role,
            linkedin: dbLead.linkedin,
            phone: dbLead.phone,
            city: dbLead.city,
            state: dbLead.state,
            country: dbLead.country,
            location: dbLead.location,
            website: dbLead.website,
            orgWebsite: dbLead.org_website,
            orgSize: dbLead.org_size,
            orgIndustry: dbLead.org_industry,
            score: dbLead.score,
            status: dbLead.status || 'new',
            tags: dbLead.tags || [],
            isFavorite: dbLead.is_favorite || false,
            googleRating: dbLead.google_rating,
            googleReviewCount: dbLead.google_review_count,
            createdAt: dbLead.created_at,
          }));

          setAllLeads(mappedLeads);
        }
      } catch (error: any) {
        console.error('Error loading user data:', error);
        addNotification('error', 'Load Failed', 'Could not load your data from database');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  // DISABLED: Auto-reload on tab visibility change
  // User needs to freely navigate to lead websites without page refreshing
  // Data can be manually refreshed if needed
  // useEffect(() => {
  //   if (!user) return;
  //   let lastActiveTime = Date.now();
  //   const handleVisibilityChange = async () => {
  //     if (document.visibilityState === 'visible') {
  //       const inactiveMinutes = (Date.now() - lastActiveTime) / 1000 / 60;
  //       if (inactiveMinutes >= 30) {
  //         console.log(`Tab was inactive for ${Math.round(inactiveMinutes)} minutes, refreshing data...`);
  //         try {
  //           const { data: leads } = await supabase
  //             .from('leads')
  //             .select('*')
  //             .eq('user_id', user.id)
  //             .order('created_at', { ascending: false });
  //           if (leads) {
  //             const mappedLeads: Lead[] = leads.map((dbLead: any) => ({
  //               id: dbLead.id,
  //               name: dbLead.name,
  //               email: dbLead.email,
  //               company: dbLead.company,
  //               role: dbLead.role,
  //               linkedin: dbLead.linkedin,
  //               phone: dbLead.phone,
  //               city: dbLead.city,
  //               state: dbLead.state,
  //               country: dbLead.country,
  //               location: dbLead.location,
  //               website: dbLead.website,
  //               orgWebsite: dbLead.org_website,
  //               orgSize: dbLead.org_size,
  //               orgIndustry: dbLead.org_industry,
  //               score: dbLead.score,
  //               status: dbLead.status || 'new',
  //               tags: dbLead.tags || [],
  //             }));
  //             setAllLeads(mappedLeads);
  //             addNotification('info', 'Data Refreshed', 'Loaded latest data from database');
  //           }
  //         } catch (error) {
  //           console.error('Error refreshing data:', error);
  //         }
  //       }
  //       lastActiveTime = Date.now();
  //     }
  //   };
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // }, [user]);

  // Scheduled campaign scheduler - runs every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      campaigns.forEach((campaign) => {
        if (
          campaign.status === 'scheduled' &&
          campaign.scheduledSend?.scheduledFor
        ) {
          const scheduledTime = new Date(campaign.scheduledSend.scheduledFor);

          // Check if it's time to send
          if (now >= scheduledTime) {
            // Update campaign status to active
            setCampaigns((prev) =>
              prev.map((c) =>
                c.id === campaign.id
                  ? { ...c, status: 'active' as const }
                  : c
              )
            );

            // Remove from scheduled campaigns
            setScheduledCampaigns((prev) => prev.filter((id) => id !== campaign.id));

            // Send notification
            addNotification(
              'success',
              'Campaign Sent',
              `"${campaign.name}" was sent as scheduled`,
              'campaign'
            );
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [campaigns]);

  // Follow-up scheduler - runs every minute (simplified version)
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would:
      // 1. Check email logs for campaigns with follow-up sequences
      // 2. Determine if conditions are met (no reply, no open, etc.)
      // 3. Send follow-up emails
      // 4. Update email logs

      // For now, this is a placeholder for the scheduler logic
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [emailLogs, campaigns]);

  // Notification helper functions
  const addNotification = (
    type: 'success' | 'info' | 'warning' | 'error',
    title: string,
    message: string,
    icon?: 'lead' | 'email' | 'campaign' | 'reply' | 'error'
  ) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      icon,
    };
    setNotifications((prev) => [notification, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleLeadsFound = async (newLeads: Lead[]) => {
    if (!user) return;

    // First, ensure user row exists in public.users table
    try {
      await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
        }, {
          onConflict: 'id'
        });
    } catch (error: any) {
      console.error('Error creating user row:', error);
    }

    // DUPLICATE DETECTION: Check for existing leads by email
    const existingEmails = new Set(allLeads.map(l => l.email.toLowerCase()));
    const uniqueLeads = newLeads.filter(lead => !existingEmails.has(lead.email.toLowerCase()));
    const duplicateCount = newLeads.length - uniqueLeads.length;

    if (duplicateCount > 0) {
      console.log(`Skipped ${duplicateCount} duplicate leads`);
    }

    // Only save unique leads to Supabase
    if (uniqueLeads.length > 0) {
      try {
        const { error } = await supabase
          .from('leads')
          .insert(
            uniqueLeads.map((lead) => ({
              id: lead.id,
              user_id: user.id,
              name: lead.name,
              email: lead.email,
              company: lead.company,
              role: lead.role,
              linkedin: lead.linkedin || null,
              phone: lead.phone || null,
              city: lead.city || null,
              state: lead.state || null,
              country: lead.country || null,
              location: lead.location || null,
              website: lead.website || null,
              org_website: lead.orgWebsite || null,
              org_size: lead.orgSize || null,
              org_industry: lead.orgIndustry || null,
              score: lead.score,
              status: lead.status || 'new',
              tags: lead.tags || [],
            }))
          );

        if (error) {
          console.error('Supabase error details:', error);
          console.error('Error message:', error.message);
          console.error('Error code:', error.code);
          console.error('Error hint:', error.hint);
          console.error('Error details:', error.details);
          throw error;
        }
      } catch (error: any) {
        console.error('Error saving leads:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        addNotification('error', 'Sync Failed', error.message || 'Could not save leads to database');
        return;
      }

      setAllLeads((prev) => [...uniqueLeads, ...prev]);
    }

    // Add notification with duplicate info
    if (uniqueLeads.length > 0 || duplicateCount > 0) {
      const message = duplicateCount > 0
        ? `Added ${uniqueLeads.length} new lead${uniqueLeads.length !== 1 ? 's' : ''}, skipped ${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''}`
        : `Successfully scraped ${uniqueLeads.length} new lead${uniqueLeads.length !== 1 ? 's' : ''} and saved to your account`;

      addNotification(
        'success',
        uniqueLeads.length > 0 ? 'New Leads Found!' : 'Duplicates Skipped',
        message,
        'lead'
      );
    }
  };

  // Remove duplicate leads from database (keep most recent)
  const handleRemoveDuplicates = async () => {
    if (!user) return;
    if (!confirm('This will remove duplicate leads (same email), keeping only the most recent copy. Continue?')) return;

    try {
      // Group leads by email (case-insensitive)
      const emailGroups = new Map<string, Lead[]>();
      allLeads.forEach(lead => {
        const email = lead.email.toLowerCase();
        if (!emailGroups.has(email)) {
          emailGroups.set(email, []);
        }
        emailGroups.get(email)!.push(lead);
      });

      // Find duplicates (emails with more than one lead)
      const duplicatesToDelete: string[] = [];
      emailGroups.forEach((leads, email) => {
        if (leads.length > 1) {
          // Sort by ID (newer IDs are larger) and keep the first (newest), delete the rest
          const sorted = leads.sort((a, b) => b.id.localeCompare(a.id));
          const toDelete = sorted.slice(1); // All except the first (newest)
          toDelete.forEach(lead => duplicatesToDelete.push(lead.id));
        }
      });

      if (duplicatesToDelete.length === 0) {
        addNotification('info', 'No Duplicates', 'No duplicate leads found in your database', 'lead');
        return;
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', duplicatesToDelete)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setAllLeads(prev => prev.filter(lead => !duplicatesToDelete.includes(lead.id)));

      addNotification(
        'success',
        'Duplicates Removed',
        `Successfully removed ${duplicatesToDelete.length} duplicate lead${duplicatesToDelete.length !== 1 ? 's' : ''}`,
        'lead'
      );
    } catch (error: any) {
      console.error('Error removing duplicates:', error);
      addNotification('error', 'Cleanup Failed', error.message || 'Could not remove duplicates');
    }
  };

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Email generation handlers for My Leads view
  const handleGenerateEmailForLead = async (lead: Lead) => {
    setSelectedLeadForEmail(lead);
    setGeneratedEmailForLead(null);
    setEmailErrorForLead('');
    setIsGeneratingEmailForLead(true);

    // Get next sender via rotation
    const sender = getNextSender(senderRotationIndex);
    setSenderRotationIndex(sender.index);

    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          posts: [],
          sender: {
            name: sender.name,
            email: sender.email,
            role: sender.role,
            personality: sender.personality,
            photo: sender.photo,
            color: sender.color,
          }
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('API Error - Status:', response.status);
        console.error('API Error - Response:', text);

        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } catch {
          throw new Error(`Server error ${response.status}: ${text.substring(0, 100)}`);
        }
      }

      const email = await response.json();
      // Include sender info with the generated email
      setGeneratedEmailForLead({ ...email, sender });
    } catch (err: any) {
      setEmailErrorForLead(err.message || 'Failed to generate email');
    } finally {
      setIsGeneratingEmailForLead(false);
    }
  };

  const handleSendEmailForLead = async () => {
    if (!selectedLeadForEmail || !generatedEmailForLead) return;

    setIsSendingEmailForLead(true);
    try {
      const emailText = `Subject: ${generatedEmailForLead.subject}\n\n${generatedEmailForLead.body}`;
      await navigator.clipboard.writeText(emailText);

      // Update lead status
      const updatedLeads = allLeads.map((l) =>
        l.id === selectedLeadForEmail.id
          ? { ...l, emailSendStatus: 'sent' as const, generatedEmail: generatedEmailForLead }
          : l
      );
      setAllLeads(updatedLeads);

      alert('Email copied to clipboard! Configure Zapier webhook in Settings to send automatically.');
      setSelectedLeadForEmail(null);
      setGeneratedEmailForLead(null);
    } catch (err: any) {
      setEmailErrorForLead(err.message || 'Failed to send email');
    } finally {
      setIsSendingEmailForLead(false);
    }
  };

  const handleScheduleEmailForLead = (scheduledFor: string, subject: string, body: string) => {
    if (!selectedLeadForEmail) return;

    // Get next sender via auto-rotation
    const sender = getNextSender(senderRotationIndex);
    setSenderRotationIndex(sender.index);

    const newScheduledEmail: ScheduledEmail = {
      id: `scheduled-${Date.now()}-${Math.random()}`,
      lead: selectedLeadForEmail,
      subject,
      body,
      scheduledFor,
      senderName: sender.name,
      senderEmail: sender.email,
      createdAt: new Date().toISOString(),
    };

    setScheduledEmails(prev => [...prev, newScheduledEmail]);
    addNotification(
      'success',
      'Email Scheduled',
      `Email to ${selectedLeadForEmail.name} scheduled for ${new Date(scheduledFor).toLocaleString()} (from ${sender.name})`,
      'email'
    );

    // Close modal
    setSelectedLeadForEmail(null);
    setGeneratedEmailForLead(null);
  };

  const handleCloseEmailModalForLead = () => {
    setSelectedLeadForEmail(null);
    setGeneratedEmailForLead(null);
    setEmailErrorForLead('');
  };

  // Bulk action handlers
  const handleToggleSelectLead = (leadId: string) => {
    setSelectedLeads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Get filtered leads based on active filters
  const getFilteredLeads = () => {
    return allLeads.filter((lead) => {
      // Tag filter
      const tagMatch = !activeTagFilter || lead.tags?.includes(activeTagFilter);
      // Website filter
      const websiteMatch =
        websiteFilter === 'all' ||
        (websiteFilter === 'has-website' && lead.website) ||
        (websiteFilter === 'no-website' && !lead.website);
      // Favorites filter (3 states: all, favorites-only, exclude-favorites)
      const favoriteMatch =
        favoritesFilter === 'all' ||
        (favoritesFilter === 'favorites-only' && lead.isFavorite) ||
        (favoritesFilter === 'exclude-favorites' && !lead.isFavorite);
      return tagMatch && websiteMatch && favoriteMatch;
    });
  };

  const handleToggleSelectAll = () => {
    const filteredLeads = getFilteredLeads();
    const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every(lead => selectedLeads.has(lead.id));

    if (allFilteredSelected) {
      // Deselect all filtered leads
      setSelectedLeads(prev => {
        const newSet = new Set(prev);
        filteredLeads.forEach(lead => newSet.delete(lead.id));
        return newSet;
      });
    } else {
      // Select all filtered leads
      setSelectedLeads(prev => {
        const newSet = new Set(prev);
        filteredLeads.forEach(lead => newSet.add(lead.id));
        return newSet;
      });
    }
  };

  // Toggle favorite status
  const handleToggleFavorite = async (leadId: string) => {
    if (!user) return;

    // Find the lead to get current favorite status
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    const newFavoriteStatus = !lead.isFavorite;

    // Update UI immediately (optimistic update)
    setAllLeads(prev => prev.map(l =>
      l.id === leadId
        ? { ...l, isFavorite: newFavoriteStatus }
        : l
    ));

    // Persist to Supabase
    try {
      const { error } = await supabase
        .from('leads')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', leadId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update favorite status:', error);
        // Revert optimistic update on error
        setAllLeads(prev => prev.map(l =>
          l.id === leadId
            ? { ...l, isFavorite: !newFavoriteStatus }
            : l
        ));
        addNotification('error', 'Update Failed', 'Could not update favorite status', 'alert-circle');
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  // Enrich existing leads with Google ratings
  const handleEnrichRatings = async (leadsToEnrich?: Lead[]) => {
    const targetLeads = leadsToEnrich || allLeads;
    const leadsNeedingRatings = targetLeads.filter(l => !l.googleRating && l.company && (l.city || l.state));

    if (leadsNeedingRatings.length === 0) {
      addNotification('info', 'No Enrichment Needed', 'All leads already have ratings!', 'info');
      return;
    }

    setIsEnrichingRatings(true);
    setRatingEnrichmentProgress({ current: 0, total: leadsNeedingRatings.length });

    try {
      let completed = 0;

      // Process in batches of 2 (reduced to avoid overwhelming API)
      for (let i = 0; i < leadsNeedingRatings.length; i += 2) {
        const batch = leadsNeedingRatings.slice(i, i + 2);

        await Promise.all(
          batch.map(async (lead) => {
            try {
              const ratingData = await lookupGoogleRating(lead.company!, lead.city, lead.state);
              if (ratingData && user) {
                // Update UI immediately
                setAllLeads(prev => prev.map(l =>
                  l.id === lead.id
                    ? { ...l, googleRating: ratingData.rating, googleReviewCount: ratingData.reviewCount }
                    : l
                ));

                // Persist to Supabase
                const { error: updateError } = await supabase
                  .from('leads')
                  .update({
                    google_rating: ratingData.rating,
                    google_review_count: ratingData.reviewCount
                  })
                  .eq('id', lead.id)
                  .eq('user_id', user.id);

                if (updateError) {
                  console.error('❌ DATABASE UPDATE FAILED:', updateError.message);
                  console.error('Lead:', lead.company);
                  console.error('Error details:', updateError);
                } else {
                  console.log(`✅ Saved to DB: ${lead.company} = ${ratingData.rating}⭐`);
                }
              }
            } catch (error) {
              console.error(`Failed to lookup rating for ${lead.company}:`, error);
            }
            completed++;
            setRatingEnrichmentProgress({ current: completed, total: leadsNeedingRatings.length });
          })
        );

        // Delay between batches (increased to 1 second to avoid rate limits)
        if (i + 2 < leadsNeedingRatings.length) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      addNotification('success', 'Ratings Enriched', `Found ${completed} Google ratings!`, 'star');
    } catch (error: any) {
      addNotification('error', 'Enrichment Failed', error.message, 'alert-circle');
    } finally {
      setIsEnrichingRatings(false);
      setRatingEnrichmentProgress({ current: 0, total: 0 });
    }
  };

  const handleBulkExport = () => {
    const leadsToExport = allLeads.filter((l) => selectedLeads.has(l.id));
    exportLeadsToCSV(leadsToExport);
    addNotification('success', 'Leads Exported', `Exported ${leadsToExport.length} leads to CSV`, 'lead');
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedLeads.size} selected leads?`)) return;
    if (!user) return;

    const leadIds = Array.from(selectedLeads);

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);

      if (error) throw error;

      setAllLeads((prev) => prev.filter((l) => !selectedLeads.has(l.id)));
      addNotification('success', 'Leads Deleted', `Deleted ${selectedLeads.size} leads`, 'lead');
      setSelectedLeads(new Set());
    } catch (error: any) {
      console.error('Error deleting leads:', error);
      addNotification('error', 'Delete Failed', 'Could not delete leads from database');
    }
  };

  const handleBulkAddTag = async (tagId: string) => {
    if (!user) return;

    const updatedLeadsMap = new Map<string, string[]>();

    allLeads.forEach((lead) => {
      if (selectedLeads.has(lead.id)) {
        updatedLeadsMap.set(lead.id, [...new Set([...(lead.tags || []), tagId])]);
      }
    });

    try {
      // Update each lead in database
      for (const [leadId, tags] of updatedLeadsMap.entries()) {
        await supabase
          .from('leads')
          .update({ tags })
          .eq('id', leadId)
          .eq('user_id', user.id);
      }

      setAllLeads((prev) =>
        prev.map((l) =>
          selectedLeads.has(l.id)
            ? { ...l, tags: [...new Set([...(l.tags || []), tagId])] }
            : l
        )
      );
      addNotification('success', 'Tags Added', `Added tag to ${selectedLeads.size} leads`, 'lead');
    } catch (error: any) {
      console.error('Error updating tags:', error);
      addNotification('error', 'Tag Update Failed', 'Could not update tags in database');
    }
  };

  // Bulk email generation with sender + email type rotation
  const handleBulkGenerateEmails = async (scheduleFor?: string) => {
    const leadsToGenerate = allLeads.filter((l) => selectedLeads.has(l.id));
    if (leadsToGenerate.length === 0) return;

    setIsBulkGenerating(true);
    setBulkGenerationProgress({ current: 0, total: leadsToGenerate.length });

    const emailTypes = ['ai_disruption', 'cost_savings', 'time_efficiency'];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < leadsToGenerate.length; i++) {
      const lead = leadsToGenerate[i];

      try {
        // Get next sender via rotation
        const sender = getNextSender(senderRotationIndex + i);

        // Randomize email type
        const randomEmailType = emailTypes[Math.floor(Math.random() * emailTypes.length)];

        // Generate email
        const response = await fetch('/api/generate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead: {
              name: lead.name,
              company: lead.company,
              role: lead.role,
              linkedin: lead.linkedin,
              location: lead.location || `${lead.city || ''} ${lead.state || ''}`.trim(),
            },
            sender: {
              name: sender.name,
              email: sender.email,
              role: sender.role,
              personality: sender.personality,
            },
            emailType: randomEmailType,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate email: ${response.statusText}`);
        }

        const data = await response.json();

        // If scheduling, add to scheduled emails at the selected time
        if (scheduleFor) {
          const newScheduledEmail: ScheduledEmail = {
            id: crypto.randomUUID(),
            lead,
            subject: data.subject,
            body: data.body,
            scheduledFor: new Date(scheduleFor).toISOString(),
            senderName: sender.name,
            senderEmail: sender.email,
            createdAt: new Date().toISOString(),
          };

          // Save to Supabase for server-side sending
          let savedToSupabase = false;
          console.log('📝 Saving scheduled email - user:', user?.id || 'NO USER', '| lead:', lead.name, lead.email);
          if (user) {
            const insertPayload = {
              id: newScheduledEmail.id,
              user_id: user.id,
              lead_id: lead.id,
              lead_name: lead.name,
              lead_email: lead.email,
              lead_company: lead.company || '',
              lead_role: lead.role || '',
              subject: newScheduledEmail.subject,
              body: newScheduledEmail.body,
              scheduled_for: newScheduledEmail.scheduledFor,
              sender_name: newScheduledEmail.senderName,
              sender_email: newScheduledEmail.senderEmail,
              status: 'pending',
            };
            console.log('Inserting scheduled email to Supabase:', JSON.stringify(insertPayload, null, 2));

            const { error: insertError } = await supabase.from('scheduled_emails').insert(insertPayload);

            if (insertError) {
              console.error('Supabase insert error:', insertError);
              addNotification('error', 'Schedule Save Failed', `Could not save to database for ${lead.name}: ${insertError.message}. Email will NOT be sent by cron.`);
            } else {
              // Verify the email was actually saved
              const { data: verify, error: verifyError } = await supabase
                .from('scheduled_emails')
                .select('id, status')
                .eq('id', newScheduledEmail.id)
                .single();

              if (verifyError || !verify) {
                console.error('Supabase verify failed:', verifyError);
                addNotification('error', 'Schedule Save Failed', `Email for ${lead.name} did not save to database. Check Supabase RLS policies.`);
              } else {
                console.log('Verified scheduled email saved:', verify.id, verify.status);
                savedToSupabase = true;
              }
            }
          } else {
            console.error('No user session - cannot save scheduled email to Supabase');
            addNotification('error', 'Not Logged In', 'Please log in to schedule emails');
          }

          // Only add to local state if saved to Supabase (otherwise cron won't find it)
          if (savedToSupabase) {
            setScheduledEmails(prev => [...prev, newScheduledEmail]);
          }
        }

        successCount++;
      } catch (error: any) {
        console.error(`Failed to generate email for ${lead.name}:`, error);
        failCount++;
      }

      setBulkGenerationProgress({ current: i + 1, total: leadsToGenerate.length });

      // Small delay to avoid overwhelming the API
      if (i < leadsToGenerate.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setIsBulkGenerating(false);
    setBulkGenerationProgress({ current: 0, total: 0 });
    setSelectedLeads(new Set());

    // Update sender rotation index
    setSenderRotationIndex((senderRotationIndex + leadsToGenerate.length) % SENDER_PERSONAS.length);

    if (scheduleFor) {
      const savedCount = scheduledEmails.length; // Compare with previous length to see how many actually saved
      addNotification(
        'success',
        'Emails Scheduled!',
        `Generated and scheduled ${successCount} emails for ${new Date(scheduleFor).toLocaleString()}${failCount > 0 ? ` • ${failCount} failed` : ''}. Server will auto-send at scheduled time.`,
        'email'
      );
    } else {
      addNotification(
        'success',
        'Emails Generated!',
        `Generated ${successCount} emails${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        'email'
      );
    }
  };

  const handleAddTestLeads = async () => {
    console.log('handleAddTestLeads called');
    console.log('User:', user);

    if (!user) {
      console.error('No user logged in');
      addNotification('error', 'Not Logged In', 'Please log in to add test leads');
      return;
    }

    const now = new Date().toISOString();
    const testLeads: Lead[] = [
      {
        id: crypto.randomUUID(),
        name: 'Gravy Burner',
        email: 'mallen3211@gmail.com',
        company: 'Test Company',
        role: 'Owner',
        linkedin: '',
        status: 'verified',
        score: 75,
        tags: ['test'],
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        name: 'Hammy Banks',
        email: 'allenmarcel34@gmail.com',
        company: 'Test Company',
        role: 'President',
        linkedin: '',
        status: 'verified',
        score: 80,
        tags: ['test'],
        createdAt: now,
      },
    ];

    console.log('Test leads to add:', testLeads);

    try {
      console.log('Inserting to Supabase...');
      // Save to Supabase
      const { data, error } = await supabase
        .from('leads')
        .insert(
          testLeads.map((lead) => ({
            id: lead.id,
            user_id: user.id,
            name: lead.name,
            email: lead.email,
            company: lead.company,
            role: lead.role,
            linkedin: lead.linkedin || null,
            score: lead.score,
            status: lead.status,
            tags: lead.tags || [],
            created_at: lead.createdAt,
          }))
        )
        .select();

      console.log('Supabase response:', { data, error });

      if (error) throw error;

      console.log('Successfully inserted to Supabase');

      // Add to local state
      setAllLeads((prev) => [...testLeads, ...prev]);

      console.log('Added to local state');

      addNotification(
        'success',
        'Test Leads Added!',
        '2 test leads added with "test" tag. Filter by "test" tag to see them.',
        'lead'
      );
    } catch (error: any) {
      console.error('Error adding test leads:', error);
      addNotification('error', 'Failed', `Could not add test leads: ${error.message}`);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const leads = parseCSVToLeads(text);

      if (leads.length > 0) {
        if (user) {
          try {
            // Save to Supabase
            const { error } = await supabase
              .from('leads')
              .insert(
                leads.map((lead) => ({
                  id: lead.id,
                  user_id: user.id,
                  name: lead.name,
                  email: lead.email,
                  company: lead.company,
                  role: lead.role,
                  linkedin: lead.linkedin,
                  location: lead.city && lead.state ? `${lead.city}, ${lead.state}` : null,
                  score: lead.score,
                  tags: lead.tags || [],
                }))
              );

            if (error) throw error;

            setAllLeads((prev) => [...leads, ...prev]);
            addNotification('success', 'CSV Imported', `Imported ${leads.length} leads and saved to your account`, 'lead');
          } catch (error: any) {
            console.error('Error saving CSV leads:', error);
            addNotification('error', 'Import Failed', 'Could not save leads to database');
          }
        }
      } else {
        addNotification('error', 'Import Failed', 'No valid leads found in CSV', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ background: 'var(--bg-primary)' }}
      >
        <style>{`
          @keyframes dashOffset {
            0% {
              stroke-dashoffset: 500;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          @keyframes rotateLoader {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          .nexli-loader-path {
            stroke-dasharray: 500;
            stroke-dashoffset: 500;
            animation: dashOffset 2s ease-in-out infinite alternate;
          }
          .nexli-loader-container {
            animation: rotateLoader 3s linear infinite;
          }
        `}</style>
        <div className="text-center">
          {/* Nexli Logo Outline Loader */}
          <div className="relative mb-8">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-3xl opacity-40">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-cyan-400"></div>
            </div>

            {/* Animated logo outline */}
            <div className="relative nexli-loader-container">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-24 h-24 mx-auto"
              >
                <defs>
                  <linearGradient id="nexli-breakthrough-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>

                {/* Logo outline paths with stroke animation */}
                <path
                  d="M12 36L28 24L12 12L12 18L18 24L12 30L12 36Z"
                  stroke="url(#nexli-breakthrough-gradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="nexli-loader-path"
                />
                <path
                  d="M20 36L44 24L20 12L20 18L32 24L20 30L20 36Z"
                  stroke="#06B6D4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="nexli-loader-path"
                  style={{ animationDelay: '0.2s' }}
                />
              </svg>
            </div>
          </div>

          {/* Loading text */}
          <div className="space-y-3">
            <h2
              className="text-3xl font-display font-extrabold tracking-tight nexli-gradient-text"
            >
              NEXLI
            </h2>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Loading your dashboard...
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-8">
            <div
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                animationDelay: '0ms',
                animationDuration: '1s'
              }}
            ></div>
            <div
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                animationDelay: '200ms',
                animationDuration: '1s'
              }}
            ></div>
            <div
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                animationDelay: '400ms',
                animationDuration: '1s'
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onAuthSuccess={() => setLoading(true)} />;
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Navbar
        isDark={isDark}
        onToggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        notifications={notifications}
        onMarkAsRead={markNotificationAsRead}
        onClearAll={clearAllNotifications}
      />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        allLeads={allLeads}
        campaigns={campaigns}
        userProfile={userProfile}
        user={user}
        setUserProfile={setUserProfile}
        addNotification={addNotification}
      />

      {/* Sidebar collapse toggle button (desktop only) */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden md:flex fixed left-0 top-20 z-40 items-center justify-center w-6 h-12 rounded-r-lg transition-all hover:w-8"
        style={{
          left: sidebarCollapsed ? '0px' : '256px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderLeft: 'none',
          color: 'var(--text-muted)',
        }}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <main className={`pt-16 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'md:pl-0' : 'md:pl-64'}`}>
        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {activeTab === 'dashboard' && (
                <DashboardView recentLeads={allLeads} isDark={isDark} emailLogs={emailLogs} senderInstantlyMetrics={senderInstantlyMetrics} />
              )}
              {activeTab === 'scraper' && (
                <ScraperView
                  onLeadsFound={handleLeadsFound}
                  isDark={isDark}
                  senderRotationIndex={senderRotationIndex}
                  setSenderRotationIndex={setSenderRotationIndex}
                  setScheduledEmails={setScheduledEmails}
                  addNotification={addNotification}
                />
              )}
              {activeTab === 'leads' && (
                <div className="space-y-8">
                  <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2
                        className="text-3xl font-bold tracking-tight font-display mb-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        My Leads
                      </h2>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Manage and export your collected leads.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold flex items-center gap-2 cursor-pointer transition-all text-xs sm:text-sm"
                        style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Import CSV</span>
                        <span className="sm:hidden">Import</span>
                      </label>
                      <button
                        onClick={() => handleEnrichRatings()}
                        disabled={isEnrichingRatings}
                        className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold flex items-center gap-2 transition-all text-xs sm:text-sm"
                        style={{
                          background: isEnrichingRatings ? 'var(--bg-elevated)' : 'rgba(245, 158, 11, 0.1)',
                          color: isEnrichingRatings ? 'var(--text-muted)' : '#F59E0B',
                          border: '1px solid #F59E0B',
                          opacity: isEnrichingRatings ? 0.5 : 1,
                          cursor: isEnrichingRatings ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isEnrichingRatings ? (
                          <>
                            <div className="animate-spin">⭐</div>
                            <span className="hidden sm:inline">Enriching {ratingEnrichmentProgress.current}/{ratingEnrichmentProgress.total}</span>
                            <span className="sm:hidden">{ratingEnrichmentProgress.current}/{ratingEnrichmentProgress.total}</span>
                          </>
                        ) : (
                          <>
                            <span>⭐</span>
                            <span className="hidden sm:inline">Enrich Ratings</span>
                            <span className="sm:hidden">Enrich</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => exportLeadsToCSV(allLeads)}
                        className="nexli-btn-gradient px-3 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg text-xs sm:text-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export All</span>
                        <span className="sm:hidden">Export</span>
                      </button>
                      <button
                        onClick={handleRemoveDuplicates}
                        className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg text-xs sm:text-sm border-2"
                        style={{
                          borderColor: '#EF4444',
                          color: '#EF4444',
                          background: 'rgba(239, 68, 68, 0.1)',
                        }}
                        title="Remove duplicate leads (same email)"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Remove Duplicates</span>
                        <span className="sm:hidden">Duplicates</span>
                      </button>
                      <button
                        onClick={handleAddTestLeads}
                        className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg text-xs sm:text-sm border-2"
                        style={{
                          borderColor: '#3B82F6',
                          color: '#3B82F6',
                          background: 'rgba(59, 130, 246, 0.1)',
                        }}
                        title="Add 2 test leads with 'test' tag"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Test Leads</span>
                        <span className="sm:hidden">Test Leads</span>
                      </button>
                    </div>
                  </header>

                  {/* Scheduled Emails Banner */}
                  {scheduledEmails.length > 0 && (
                    <div
                      className="glass-card rounded-2xl p-4 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row"
                      style={{
                        background: 'rgba(245, 158, 11, 0.05)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#F59E0B',
                          }}
                        >
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                            {scheduledEmails.length} Email{scheduledEmails.length > 1 ? 's' : ''} Scheduled
                          </h3>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {(() => {
                              const nextEmail = scheduledEmails.sort((a, b) =>
                                new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
                              )[0];
                              const scheduledTime = new Date(nextEmail.scheduledFor);
                              const now = new Date();
                              const diffMs = scheduledTime.getTime() - now.getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMins / 60);
                              const diffDays = Math.floor(diffHours / 24);

                              let timeText = '';
                              if (diffMins < 0) {
                                timeText = 'Sending now...';
                              } else if (diffMins < 60) {
                                timeText = `in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
                              } else if (diffHours < 24) {
                                timeText = `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
                              } else {
                                timeText = `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                              }

                              return `Next: ${nextEmail.lead.name} ${timeText} (${scheduledTime.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })})`;
                            })()}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {scheduledEmails.slice(0, 3).map((email) => (
                              <span
                                key={email.id}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  color: '#F59E0B',
                                }}
                              >
                                {email.lead.name}
                              </span>
                            ))}
                            {scheduledEmails.length > 3 && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  color: '#F59E0B',
                                }}
                              >
                                +{scheduledEmails.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const message = scheduledEmails
                            .map((email, idx) => {
                              const time = new Date(email.scheduledFor).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              });
                              return `${idx + 1}. ${email.lead.name} - ${time}`;
                            })
                            .join('\n');
                          alert(`Scheduled Emails:\n\n${message}`);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
                        style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#F59E0B',
                          border: '1px solid #F59E0B',
                        }}
                      >
                        View All
                      </button>
                    </div>
                  )}

                  {/* Bulk Action Toolbar */}
                  {selectedLeads.size > 0 && (
                    <div
                      className="glass-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      style={{ borderColor: 'var(--gradient-start)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full nexli-gradient-bg flex items-center justify-center text-white font-bold"
                        >
                          {selectedLeads.size}
                        </div>
                        <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                          {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} selected
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative group">
                          <button
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-xs sm:text-sm"
                            style={{
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <Plus className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="hidden sm:inline">Add Tag</span>
                            <span className="sm:hidden">Tag</span>
                          </button>
                          <div
                            className="absolute top-full right-0 mt-2 glass-card rounded-xl p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[180px]"
                          >
                            {LEAD_TAGS.map((tag) => (
                              <button
                                key={tag.id}
                                onClick={() => handleBulkAddTag(tag.id)}
                                className="w-full px-3 py-2 rounded-lg text-left text-sm font-bold transition-all flex items-center gap-2"
                                style={{
                                  color: tag.color,
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = tag.bg)
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = 'transparent')
                                }
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: tag.color }}
                                />
                                {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={handleBulkExport}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-xs sm:text-sm"
                          style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <Download className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span>Export</span>
                        </button>
                        <button
                          onClick={() => setShowBulkScheduleModal(true)}
                          disabled={isBulkGenerating}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-xs sm:text-sm nexli-btn-gradient disabled:opacity-50"
                        >
                          <Mail className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="hidden sm:inline">
                            {isBulkGenerating ? `Generating ${bulkGenerationProgress.current}/${bulkGenerationProgress.total}...` : 'Generate Emails'}
                          </span>
                          <span className="sm:hidden">
                            {isBulkGenerating ? `${bulkGenerationProgress.current}/${bulkGenerationProgress.total}` : 'Emails'}
                          </span>
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-xs sm:text-sm"
                          style={{
                            background: 'var(--status-failed-bg)',
                            color: 'var(--status-failed-text)',
                          }}
                        >
                          <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span>Delete</span>
                        </button>
                        <button
                          onClick={() => setSelectedLeads(new Set())}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold flex items-center gap-2 transition-all text-xs sm:text-sm"
                          style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <X className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tag Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                      Filter:
                    </span>
                    <button
                      onClick={() => {
                        setActiveTagFilter(null);
                        setWebsiteFilter('all');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTagFilter === null && websiteFilter === 'all' ? 'nexli-gradient-bg text-white' : ''
                      }`}
                      style={
                        activeTagFilter === null && websiteFilter === 'all'
                          ? {}
                          : {
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-muted)',
                            }
                      }
                    >
                      All ({allLeads.length})
                    </button>
                    {LEAD_TAGS.map((tag) => {
                      const count = allLeads.filter((l) => l.tags?.includes(tag.id)).length;
                      return (
                        <button
                          key={tag.id}
                          onClick={() => setActiveTagFilter(tag.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                          style={{
                            background: activeTagFilter === tag.id ? tag.bg : 'var(--bg-elevated)',
                            color: activeTagFilter === tag.id ? tag.color : 'var(--text-muted)',
                            border: activeTagFilter === tag.id ? `1px solid ${tag.color}` : 'none',
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: tag.color }}
                          />
                          {tag.label} ({count})
                        </button>
                      );
                    })}

                    {/* Divider */}
                    <div className="h-6 w-px" style={{ background: 'var(--border-color)' }} />

                    {/* Website Filters */}
                    <button
                      onClick={() => setWebsiteFilter('has-website')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                      style={{
                        background: websiteFilter === 'has-website' ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-elevated)',
                        color: websiteFilter === 'has-website' ? 'var(--gradient-start)' : 'var(--text-muted)',
                        border: websiteFilter === 'has-website' ? '1px solid var(--gradient-start)' : 'none',
                      }}
                    >
                      <Globe className="w-3 h-3" />
                      Has Website ({allLeads.filter(l => l.website).length})
                    </button>
                    <button
                      onClick={() => setWebsiteFilter('no-website')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                      style={{
                        background: websiteFilter === 'no-website' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)',
                        color: websiteFilter === 'no-website' ? '#EF4444' : 'var(--text-muted)',
                        border: websiteFilter === 'no-website' ? '1px solid #EF4444' : 'none',
                      }}
                    >
                      <Globe className="w-3 h-3" />
                      No Website ({allLeads.filter(l => !l.website).length})
                    </button>
                  </div>

                  {/* Favorites Filter (3-state cycle) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFavoritesFilter(prev =>
                          prev === 'all' ? 'favorites-only' :
                          prev === 'favorites-only' ? 'exclude-favorites' : 'all'
                        );
                      }}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2"
                      style={{
                        background: favoritesFilter !== 'all' ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-elevated)',
                        color: favoritesFilter !== 'all' ? '#FBBF24' : 'var(--text-muted)',
                        border: favoritesFilter !== 'all' ? '1px solid #FBBF24' : '1px solid var(--border-color)',
                      }}
                      title={
                        favoritesFilter === 'all' ? 'Click to show favorites only' :
                        favoritesFilter === 'favorites-only' ? 'Click to exclude favorites' :
                        'Click to show all'
                      }
                    >
                      <span className="text-base sm:text-lg">
                        {favoritesFilter === 'favorites-only' ? '⭐' : favoritesFilter === 'exclude-favorites' ? '⛔' : '☆'}
                      </span>
                      <span className="hidden sm:inline">
                        {favoritesFilter === 'all' && `All Leads (${allLeads.filter(l => l.isFavorite).length} ⭐)`}
                        {favoritesFilter === 'favorites-only' && `Favorites Only (${allLeads.filter(l => l.isFavorite).length})`}
                        {favoritesFilter === 'exclude-favorites' && `Exclude Favorites (${allLeads.filter(l => !l.isFavorite).length})`}
                      </span>
                      <span className="sm:hidden">
                        {favoritesFilter === 'all' && 'All'}
                        {favoritesFilter === 'favorites-only' && '⭐ Only'}
                        {favoritesFilter === 'exclude-favorites' && '⛔ Exclude'}
                      </span>
                    </button>
                  </div>

                  {allLeads.length > 0 ? (
                    <div className="glass-card rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                        <thead>
                          <tr
                            className="text-[10px] uppercase tracking-[0.15em] font-bold"
                            style={{
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <th className="px-5 py-3.5 w-12">
                              <input
                                type="checkbox"
                                checked={(() => {
                                  const filteredLeads = getFilteredLeads();
                                  return filteredLeads.length > 0 && filteredLeads.every(lead => selectedLeads.has(lead.id));
                                })()}
                                onChange={handleToggleSelectAll}
                                className="w-4 h-4 rounded cursor-pointer"
                                style={{ accentColor: 'var(--gradient-start)' }}
                              />
                            </th>
                            <th className="px-5 py-3.5">Lead</th>
                            <th className="px-5 py-3.5">Role</th>
                            <th className="px-5 py-3.5">Company</th>
                            <th className="px-5 py-3.5">Rating</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredLeads().map((lead, idx) => (
                            <tr
                              key={lead.id}
                              className="group transition-colors"
                              style={{
                                borderBottom:
                                  idx < allLeads.length - 1
                                    ? `1px solid var(--border-subtle)`
                                    : 'none',
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = 'var(--bg-surface-hover)')
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = 'transparent')
                              }
                            >
                              <td className="px-5 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedLeads.has(lead.id)}
                                  onChange={() => handleToggleSelectLead(lead.id)}
                                  className="w-4 h-4 rounded cursor-pointer"
                                  style={{ accentColor: 'var(--gradient-start)' }}
                                />
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold"
                                    style={{
                                      background: 'var(--bg-elevated)',
                                      color: 'var(--text-muted)',
                                    }}
                                  >
                                    {lead.name[0]}
                                  </div>
                                  <div>
                                    <p
                                      className="text-sm font-bold"
                                      style={{ color: 'var(--text-primary)' }}
                                    >
                                      {lead.name}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {lead.email}
                                    </p>
                                    {(lead.city || lead.state) && (
                                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        📍 {[lead.city, lead.state].filter(Boolean).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td
                                className="px-5 py-4 text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {lead.role}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                      {lead.company}
                                    </span>
                                    {lead.linkedin && (
                                      <a
                                        href={lead.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1 rounded-lg transition-all"
                                        style={{
                                          background: 'var(--bg-elevated)',
                                          color: 'var(--text-muted)',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = 'rgba(10, 102, 194, 0.1)';
                                          e.currentTarget.style.color = '#0A66C2';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'var(--bg-elevated)';
                                          e.currentTarget.style.color = 'var(--text-muted)';
                                        }}
                                        title="View LinkedIn Profile"
                                      >
                                        <Linkedin className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    {lead.website && (
                                      <a
                                        href={lead.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1 rounded-lg transition-all"
                                        style={{
                                          background: 'var(--bg-elevated)',
                                          color: 'var(--text-muted)',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
                                          e.currentTarget.style.color = 'var(--gradient-start)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = 'var(--bg-elevated)';
                                          e.currentTarget.style.color = 'var(--text-muted)';
                                        }}
                                        title={`Visit ${lead.website}`}
                                      >
                                        <Globe className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <button
                                      onClick={() => handleToggleFavorite(lead.id)}
                                      className="inline-flex items-center justify-center p-1 rounded-lg transition-all cursor-pointer"
                                      style={{
                                        background: lead.isFavorite ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-elevated)',
                                        color: lead.isFavorite ? '#FBBF24' : 'var(--text-muted)',
                                      }}
                                      title={lead.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                    >
                                      <span className="text-base">{lead.isFavorite ? '⭐' : '☆'}</span>
                                    </button>
                                  </div>
                                  {lead.tags && lead.tags.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {lead.tags.map((tagId) => {
                                        const tag = LEAD_TAGS.find((t) => t.id === tagId);
                                        if (!tag) return null;
                                        return (
                                          <span
                                            key={tagId}
                                            className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                                            style={{
                                              background: tag.bg,
                                              color: tag.color,
                                            }}
                                          >
                                            <div
                                              className="w-1.5 h-1.5 rounded-full"
                                              style={{ background: tag.color }}
                                            />
                                            {tag.label}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                {lead.googleRating ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold" style={{
                                      color: lead.googleRating >= 4.5 ? '#10B981' :
                                             lead.googleRating >= 3.5 ? '#F59E0B' : '#EF4444'
                                    }}>
                                      ⭐ {lead.googleRating.toFixed(1)}
                                    </span>
                                    {lead.googleReviewCount && lead.googleReviewCount > 0 && (
                                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                        ({lead.googleReviewCount})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                  style={{
                                    background:
                                      lead.status === 'verified'
                                        ? 'var(--status-verified-bg)'
                                        : 'var(--bg-elevated)',
                                    color:
                                      lead.status === 'verified'
                                        ? 'var(--status-verified-text)'
                                        : 'var(--text-muted)',
                                  }}
                                >
                                  {lead.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  {lead.emailSendStatus === 'sent' ? (
                                    <span
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                                      style={{
                                        background: 'var(--status-verified-bg)',
                                        color: 'var(--status-verified-text)',
                                      }}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Email Sent
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleGenerateEmailForLead(lead)}
                                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg transition-all text-xs font-bold nexli-gradient-bg text-white flex items-center gap-1.5"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      Generate Email
                                    </button>
                                  )}
                                  <button
                                    className="p-2 rounded-lg transition-all"
                                    style={{ color: 'var(--text-muted)' }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background = 'var(--bg-elevated)')
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background = 'transparent')
                                    }
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-5">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        <Users className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div>
                        <h3
                          className="text-xl font-bold font-display mb-2"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          No leads found yet
                        </h3>
                        <p
                          className="max-w-xs text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Start scraping to find verified CPA firm owners and decision-makers.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('scraper')}
                        className="nexli-btn-gradient px-6 py-2.5 rounded-full font-bold shadow-lg"
                      >
                        <span>Go to Scraper</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'campaigns' && (
                <CampaignsView
                  isDark={isDark}
                  campaigns={campaigns}
                  setCampaigns={setCampaigns}
                  emailLogs={emailLogs}
                  setEmailLogs={setEmailLogs}
                  allLeads={allLeads}
                  emailTemplates={emailTemplates}
                  scheduledCampaigns={scheduledCampaigns}
                  setScheduledCampaigns={setScheduledCampaigns}
                  scheduledEmails={scheduledEmails}
                  setScheduledEmails={setScheduledEmails}
                  addNotification={addNotification}
                  senderInstantlyMetrics={senderInstantlyMetrics}
                  setSenderInstantlyMetrics={setSenderInstantlyMetrics}
                />
              )}

              {/* Bulk Email Schedule Modal */}
              {showBulkScheduleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="glass-card p-6 max-w-lg w-full">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="w-6 h-6 text-blue-500" />
                        Bulk Generate Emails
                      </h2>
                      <button
                        onClick={() => setShowBulkScheduleModal(false)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="p-4 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                        <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                          Generating emails for {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}
                        </p>
                        <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                          <li>✨ Auto-rotates through Marcel, Justine, Bernice, and Jian</li>
                          <li>🎲 Randomizes email types (AI, Cost Savings, Time Efficiency)</li>
                          <li>📧 Personalized for each lead</li>
                          <li>⏰ Spreads sends over 2-3 min intervals (avoids spam filters)</li>
                        </ul>
                      </div>

                      {/* Schedule Option */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Schedule for later (optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={bulkScheduleDateTime}
                          onChange={(e) => setBulkScheduleDateTime(e.target.value)}
                          min={(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; })()}
                          className="w-full px-4 py-3 rounded-lg border-2 transition-all"
                          style={{
                            background: 'var(--bg-elevated)',
                            borderColor: bulkScheduleDateTime ? '#F59E0B' : 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        {bulkScheduleDateTime && (
                          <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <Clock className="w-3 h-3 text-amber-500" />
                            Emails will start sending at {new Date(bulkScheduleDateTime).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}, spread over 2-3 minute intervals
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => {
                            setShowBulkScheduleModal(false);
                            setBulkScheduleDateTime('');
                          }}
                          className="flex-1 px-4 py-3 rounded-lg font-medium border-2 transition-all"
                          style={{
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            setShowBulkScheduleModal(false);
                            await handleBulkGenerateEmails(bulkScheduleDateTime || undefined);
                            setBulkScheduleDateTime('');
                          }}
                          className="flex-1 px-4 py-3 rounded-lg font-medium nexli-btn-gradient flex items-center justify-center gap-2"
                        >
                          {bulkScheduleDateTime ? (
                            <>
                              <Clock className="w-4 h-4" />
                              <span>Schedule All</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              <span>Generate Now</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <header>
                    <h2
                      className="text-3xl font-bold tracking-tight font-display mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Settings
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Manage your account and integrations.
                    </p>
                  </header>

                  <div className="glass-card p-8 rounded-2xl max-w-2xl space-y-8">
                    {/* Profile */}
                    <div>
                      <h3
                        className="text-sm font-bold uppercase tracking-wider mb-4"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Profile
                      </h3>
                      <div className="space-y-6">
                        {/* Profile Photo */}
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            {userProfile?.profile_photo_url ? (
                              <img
                                src={userProfile.profile_photo_url}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-4"
                                style={{ borderColor: 'var(--border-color)' }}
                              />
                            ) : (
                              <div
                                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                              >
                                {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <label
                              htmlFor="profile-photo-upload"
                              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg border-2 border-white dark:border-gray-900"
                            >
                              <Camera className="w-4 h-4 text-white" />
                            </label>
                            <input
                              id="profile-photo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !user) return;

                                try {
                                  // Upload to Supabase storage
                                  const fileExt = file.name.split('.').pop();
                                  const filePath = `${user.id}/avatar.${fileExt}`;

                                  const { error: uploadError } = await supabase.storage
                                    .from('profile-photos')
                                    .upload(filePath, file, { upsert: true });

                                  if (uploadError) throw uploadError;

                                  // Get public URL
                                  const { data } = supabase.storage
                                    .from('profile-photos')
                                    .getPublicUrl(filePath);

                                  // Update user profile
                                  const { error: updateError } = await supabase
                                    .from('users')
                                    .update({ profile_photo_url: data.publicUrl })
                                    .eq('id', user.id);

                                  if (updateError) throw updateError;

                                  setUserProfile((prev) => prev ? { ...prev, profile_photo_url: data.publicUrl } : null);
                                  addNotification('success', 'Photo Updated', 'Profile photo uploaded successfully');
                                } catch (error: any) {
                                  addNotification('error', 'Upload Failed', error.message);
                                }

                                e.target.value = '';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                              {userProfile?.full_name || 'User'}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              {user?.email}
                            </p>
                          </div>
                        </div>

                        {/* Sign Out Button */}
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut();
                            setUser(null);
                            setUserProfile(null);
                            setAllLeads([]);
                            setCampaigns([]);
                            setEmailTemplates([]);
                            setEmailLogs([]);
                          }}
                          className="w-full px-4 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80 flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                            color: 'white',
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>

                    {/* Appearance */}
                    <div>
                      <h3
                        className="text-sm font-bold uppercase tracking-wider mb-4"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Appearance
                      </h3>
                      <div
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        <div className="flex items-center gap-3">
                          {isDark ? (
                            <Moon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                          ) : (
                            <Sun className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                          )}
                          <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                              {isDark ? 'Dark Mode' : 'Light Mode'}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              Toggle between light and dark themes
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className="relative w-11 h-6 rounded-full transition-colors duration-300"
                          style={{
                            background: isDark
                              ? 'linear-gradient(135deg, #2563EB, #06B6D4)'
                              : 'var(--border-color)',
                          }}
                        >
                          <div
                            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
                            style={{
                              transform: isDark ? 'translateX(22px)' : 'translateX(2px)',
                            }}
                          ></div>
                        </button>
                      </div>
                    </div>

                    {/* API Key */}
                    <div>
                      <h3
                        className="text-sm font-bold uppercase tracking-wider mb-4"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        API Configuration
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            API Key
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              value="••••••••••••••••"
                              readOnly
                              className="flex-1 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                              style={{
                                background: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                border: 'none',
                              }}
                            />
                            <button
                              className="px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                              style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              Reveal
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Webhook URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://your-webhook.com"
                            className="w-full rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                            style={{
                              background: 'var(--bg-input)',
                              color: 'var(--text-primary)',
                              border: 'none',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email Templates */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3
                          className="text-sm font-bold uppercase tracking-wider"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Email Templates
                        </h3>
                        <button
                          onClick={() => {
                            const name = prompt('Template name:');
                            if (!name) return;
                            const subject = prompt('Email subject:');
                            if (!subject) return;
                            const body = prompt('Email body (use {{firstName}}, {{company}}, {{role}} for variables):');
                            if (!body) return;

                            const variables: string[] = [];
                            const varPattern = /\{\{(\w+)\}\}/g;
                            let match;
                            while ((match = varPattern.exec(subject + body)) !== null) {
                              if (!variables.includes(`{{${match[1]}}}`)) {
                                variables.push(`{{${match[1]}}}`);
                              }
                            }

                            const newTemplate: EmailTemplate = {
                              id: `template-${Date.now()}`,
                              name,
                              subject,
                              body,
                              variables,
                              createdAt: new Date().toISOString(),
                              usageCount: 0,
                            };
                            setEmailTemplates((prev) => [...prev, newTemplate]);
                            addNotification('success', 'Template Created', `"${name}" template created`, 'email');
                          }}
                          className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 nexli-gradient-bg text-white"
                        >
                          <Plus className="w-3 h-3" />
                          New Template
                        </button>
                      </div>
                      <div className="space-y-3">
                        {emailTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="p-4 rounded-xl transition-colors"
                            style={{ background: 'var(--bg-elevated)' }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                    {template.name}
                                  </p>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                                    style={{
                                      background: 'var(--status-verified-bg)',
                                      color: 'var(--status-verified-text)',
                                    }}
                                  >
                                    Used {template.usageCount}x
                                  </span>
                                </div>
                                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                                  {template.subject}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {template.variables.map((v) => (
                                    <span
                                      key={v}
                                      className="px-2 py-0.5 rounded text-[9px] font-mono"
                                      style={{
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-secondary)',
                                      }}
                                    >
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${template.name}" template?`)) {
                                    setEmailTemplates((prev) =>
                                      prev.filter((t) => t.id !== template.id)
                                    );
                                    addNotification('success', 'Template Deleted', `"${template.name}" deleted`, 'email');
                                  }
                                }}
                                className="p-2 rounded-lg transition-all"
                                style={{ color: 'var(--status-failed-text)' }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = 'var(--status-failed-bg)')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = 'transparent')
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {emailTemplates.length === 0 && (
                          <div
                            className="p-8 rounded-xl text-center"
                            style={{ background: 'var(--bg-elevated)' }}
                          >
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              No templates yet. Create your first template to get started.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="nexli-btn-gradient px-6 py-3 rounded-xl font-bold w-full shadow-lg">
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Email Generation Modal for My Leads view */}
      <AnimatePresence>
        {selectedLeadForEmail && (
          <EmailGenerationModal
            lead={selectedLeadForEmail}
            email={generatedEmailForLead}
            isGenerating={isGeneratingEmailForLead}
            error={emailErrorForLead}
            onClose={handleCloseEmailModalForLead}
            onSend={handleSendEmailForLead}
            onSchedule={handleScheduleEmailForLead}
            canSend={!!generatedEmailForLead && !isGeneratingEmailForLead}
            isSending={isSendingEmailForLead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
