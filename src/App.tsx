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
}

// Map Apify output to our Lead format
function mapApifyLead(item: any, index: number): Lead {
  return {
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
  };
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
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-nexli-blue ring-2" style={{ ringColor: 'var(--bg-primary)' }}></span>
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
                  {results.length} found
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--bg-elevated)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <Filter className="w-4 h-4" />
                </button>
                <button
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
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">LinkedIn</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className="group transition-colors"
                    style={{
                      borderBottom: idx < results.length - 1 ? `1px solid var(--border-subtle)` : 'none',
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
                      <button
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('nexli-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleLeadsFound = (newLeads: Lead[]) => {
    setAllLeads((prev) => [...newLeads, ...prev]);
  };

  const toggleTheme = () => setIsDark((prev) => !prev);

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
                    <button className="nexli-btn-gradient px-6 py-2.5 rounded-full font-bold flex items-center gap-2 shadow-lg">
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
    </div>
  );
}
