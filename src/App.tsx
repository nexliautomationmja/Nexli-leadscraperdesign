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
} from 'lucide-react';
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
  orgSize?: string;
  orgIndustry?: string;
  seniority?: string;
  functional?: string;
  score: number;
  generatedEmail?: { subject: string; body: string };
  emailSendStatus?: 'draft' | 'sent' | 'failed';
}

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
  const size = lead.orgSize || '';
  if (size.includes('1-10') || size.includes('11-20') || size.includes('21-50')) score += 20;
  const sen = (lead.seniority || '').toLowerCase();
  if (['c-suite', 'owner', 'partner', 'founder'].some((s) => sen.includes(s))) score += 25;
  if (lead.orgWebsite) score += 10;
  const fn = (lead.functional || '').toLowerCase();
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
  const headers = ['Name', 'Email', 'Company', 'Role', 'Status', 'Score', 'LinkedIn', 'Phone', 'City', 'State', 'Country', 'Website', 'Company Size', 'Industry'];
  const rows = leads.map((l) => [
    l.name, l.email, l.company, l.role, l.status, l.score,
    l.linkedin, l.phone || '', l.city || '', l.state || '', l.country || '',
    l.orgWebsite || '', l.orgSize || '', l.orgIndustry || '',
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

// Map Apify output to our Lead format
function mapApifyLead(item: any, index: number): Lead {
  const seniority = item.seniority || '';
  const functional = item.personFunction || '';
  const lead: Lead = {
    id: `lead-${Date.now()}-${index}`,
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
  canSend,
  isSending,
}: {
  lead: Lead;
  email: { subject: string; body: string } | null;
  isGenerating: boolean;
  error: string;
  onClose: () => void;
  onSend: () => void;
  canSend: boolean;
  isSending: boolean;
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl nexli-gradient-bg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold font-display" style={{ color: 'var(--text-primary)' }}>
              AI Email for {lead.name}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {lead.role} at {lead.company}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="gradient-spinner"></div>
            <p className="text-sm font-medium animate-nexli-pulse" style={{ color: 'var(--text-muted)' }}>
              Generating personalized email with AI...
            </p>
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: 'var(--status-failed-bg)', color: 'var(--status-failed-text)' }}>
            {error}
          </div>
        )}
        {email && !isGenerating && (
          <>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Subject
              </label>
              <div
                className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >
                {email.subject}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Body
              </label>
              <div
                className="px-4 py-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >
                {email.body}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      {email && !isGenerating && (
        <div
          className="flex items-center justify-between p-5 gap-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={() => {
              navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
            >
              Close
            </button>
            {canSend && (
              <button
                onClick={onSend}
                disabled={isSending}
                className="nexli-btn-gradient px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSending ? 'Sending...' : 'Send Email'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  </div>
);

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
const Navbar = ({ isDark, onToggleTheme }: { isDark: boolean; onToggleTheme: () => void }) => {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 justify-between backdrop-blur-xl transition-colors duration-300"
      style={{
        background: isDark ? 'rgba(11, 17, 33, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        borderBottom: `1px solid var(--border-subtle)`,
      }}
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <NexliIcon className="w-8 h-8" />
          <NexliWordmark />
        </div>

        <div className="hidden md:flex items-center gap-1">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(6, 182, 212, 0.1))',
              color: '#2563EB',
            }}
          >
            Lead Scraper
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

        <button
          className="p-2 rounded-xl transition-all duration-200 relative"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-nexli-blue" style={{ boxShadow: '0 0 0 2px var(--bg-primary)' }}></span>
        </button>

        <div className="h-8 w-px mx-1" style={{ background: 'var(--border-color)' }}></div>

        <button className="nexli-btn-gradient px-5 py-2 rounded-full text-sm font-bold shadow-lg">
          <span>Book a Session</span>
        </button>
      </div>
    </nav>
  );
};

const Sidebar = ({
  activeTab,
  setActiveTab,
  isDark,
}: {
  activeTab: string;
  setActiveTab: (t: string) => void;
  isDark: boolean;
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scraper', label: 'Lead Scraper', icon: Search },
    { id: 'leads', label: 'My Leads', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 w-64 p-4 flex flex-col justify-between transition-colors duration-300"
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

      {/* Plan Usage Card */}
      <div
        className="p-4 rounded-2xl nexli-gradient-border transition-colors duration-300"
        style={{
          background: 'var(--bg-elevated)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center nexli-gradient-bg"
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              Premium Plan
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              842 / 1,000 leads left
            </p>
          </div>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--border-color)' }}
        >
          <div
            className="h-full w-[84%] rounded-full nexli-gradient-bg"
            style={{ transition: 'width 0.5s ease' }}
          ></div>
        </div>
      </div>

      <div className="mt-auto pt-4 text-center">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Powered by Nexli AI
        </p>
      </div>
    </aside>
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

const DashboardView = ({ recentLeads, isDark }: { recentLeads: Lead[]; isDark: boolean }) => {
  // Calculate lead tier breakdown
  const hotLeads = recentLeads.filter((l) => l.score >= 60).length;
  const warmLeads = recentLeads.filter((l) => l.score >= 30 && l.score < 60).length;
  const coldLeads = recentLeads.filter((l) => l.score < 30).length;
  const totalLeads = recentLeads.length;

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
        <StatCard title="Total Leads" value="12,482" icon={Users} trend={12} gradientIcon />
        <StatCard title="Verified Emails" value="8,921" icon={Mail} trend={8} />
        <StatCard title="LinkedIn Profiles" value="4,201" icon={Linkedin} trend={15} />
        <StatCard title="Success Rate" value="94.2%" icon={Target} trend={2} />
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
          <div className="h-[300px] w-full">
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
          </div>
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
}: {
  onLeadsFound: (leads: Lead[]) => void;
  isDark: boolean;
}) => {
  const [query, setQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [scrapingStep, setScrapingStep] = useState('');
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(100);
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>('verified');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');

  // Email generation state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Filtering and sorting state
  const [scoreFilter, setScoreFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'company'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

    try {
      // TODO: Optionally fetch LinkedIn posts first for better personalization
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, posts: [] }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const email = await response.json();
      setGeneratedEmail(email);
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
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [results, scoreFilter, sortBy, sortOrder]);

  // Build Apify filters from user query + settings
  const buildFilters = () => {
    const filters: any = {
      totalResults,
      emailStatus: emailStatusFilter,
      hasEmail: true,
      companyIndustryIncludes: ['Accounting'],
      companyLocationCountryIncludes: ['United States'],
      companyEmployeeSizeIncludes: ['1-10', '11-20', '21-50'],
      seniorityIncludes: ['C-Suite', 'VP', 'Director', 'Manager', 'Owner', 'Founder', 'Partner'],
      personFunctionIncludes: ['Accounting', 'Finance'],
    };

    // Parse the query for keywords
    if (query) {
      filters.companyKeywordIncludes = query.split(',').map((k: string) => k.trim()).filter(Boolean);
    }

    // State filter
    if (stateFilter) {
      filters.companyLocationStateIncludes = [stateFilter];
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

    while (true) {
      const res = await fetch(`/api/scrape/${runId}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Rotate through status messages while polling
      setScrapingStep(statusSteps[stepIdx % statusSteps.length]);
      stepIdx++;

      if (data.status === 'SUCCEEDED') {
        return data;
      } else if (data.status === 'FAILED' || data.status === 'ABORTED') {
        throw new Error(`Scrape ${data.status.toLowerCase()}. Please try again.`);
      }

      // Poll every 3 seconds
      await new Promise((r) => setTimeout(r, 3000));
    }
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
        throw new Error(startData.error);
      }

      // Step 2: Poll until complete
      setScrapingStep('Scrape started — querying database...');
      await pollRunStatus(startData.runId);

      // Step 3: Fetch results
      setScrapingStep('Fetching results...');
      const resultsRes = await fetch(`/api/scrape/${startData.runId}/results?limit=100`);
      const resultsData = await resultsRes.json();

      if (resultsData.error) {
        throw new Error(resultsData.error);
      }

      const mapped = resultsData.items.map(mapApifyLead);
      setResults(mapped);
      onLeadsFound(mapped);
    } catch (err: any) {
      console.error('Scraping failed:', err);
      setError(err.message || 'Scraping failed. Check your API configuration.');
    } finally {
      setIsScraping(false);
      setScrapingStep('');
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
                State
              </label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none cursor-pointer"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: 'none' }}
              >
                <option value="">All States</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
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
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {lead.company}
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
            canSend={!!generatedEmail && !isGeneratingEmail}
            isSending={isSendingEmail}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('nexli-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleLeadsFound = (newLeads: Lead[]) => {
    setAllLeads((prev) => [...newLeads, ...prev]);
  };

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Email generation handlers for My Leads view
  const handleGenerateEmailForLead = async (lead: Lead) => {
    setSelectedLeadForEmail(lead);
    setGeneratedEmailForLead(null);
    setEmailErrorForLead('');
    setIsGeneratingEmailForLead(true);

    try {
      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, posts: [] }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const email = await response.json();
      setGeneratedEmailForLead(email);
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

  const handleCloseEmailModalForLead = () => {
    setSelectedLeadForEmail(null);
    setGeneratedEmailForLead(null);
    setEmailErrorForLead('');
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Navbar isDark={isDark} onToggleTheme={toggleTheme} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} />

      <main className="pl-64 pt-16 min-h-screen">
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
                <DashboardView recentLeads={allLeads} isDark={isDark} />
              )}
              {activeTab === 'scraper' && (
                <ScraperView onLeadsFound={handleLeadsFound} isDark={isDark} />
              )}
              {activeTab === 'leads' && (
                <div className="space-y-8">
                  <header className="flex items-center justify-between">
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
                    <button
                      onClick={() => exportLeadsToCSV(allLeads)}
                      className="nexli-btn-gradient px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>
                  </header>

                  {allLeads.length > 0 ? (
                    <div className="glass-card rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr
                            className="text-[10px] uppercase tracking-[0.15em] font-bold"
                            style={{
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <th className="px-5 py-3.5">Lead</th>
                            <th className="px-5 py-3.5">Role</th>
                            <th className="px-5 py-3.5">Company</th>
                            <th className="px-5 py-3.5">Status</th>
                            <th className="px-5 py-3.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {allLeads.map((lead, idx) => (
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
                              <td
                                className="px-5 py-4 text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {lead.role}
                              </td>
                              <td
                                className="px-5 py-4 text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {lead.company}
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
            canSend={!!generatedEmailForLead && !isGeneratingEmailForLead}
            isSending={isSendingEmailForLead}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
