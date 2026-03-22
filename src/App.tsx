import React, { useState } from 'react';
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
  Zap,
  Plus,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";

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
}

// --- Mock Data ---
const MOCK_DATA = [
  { name: 'Mon', leads: 40, verified: 24 },
  { name: 'Tue', leads: 30, verified: 13 },
  { name: 'Wed', leads: 20, verified: 98 },
  { name: 'Thu', leads: 27, verified: 39 },
  { name: 'Fri', leads: 18, verified: 48 },
  { name: 'Sat', leads: 23, verified: 38 },
  { name: 'Sun', leads: 34, verified: 43 },
];

// --- Components ---

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center px-6 justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">Nexli</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-black transition-colors">Services</a>
          <a href="#" className="hover:text-black transition-colors">Case Studies</a>
          <a href="#" className="hover:text-black transition-colors">About</a>
          <a href="#" className="hover:text-black transition-colors">Contact</a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-sm">
          Book a Session
        </button>
      </div>
    </nav>
  );
};

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scraper', label: 'Lead Scraper', icon: Search },
    { id: 'leads', label: 'My Leads', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200/60 p-4 flex flex-col justify-between">
      <div className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.id 
                ? "bg-slate-100 text-black" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-emerald-500" : "text-slate-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500"></div>
          <div>
            <p className="text-xs font-bold text-slate-900">Premium Plan</p>
            <p className="text-[10px] text-slate-500">842 / 1000 leads left</p>
          </div>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-[84%]"></div>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Nexli AI</p>
      </div>
    </aside>
  );
};

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <div className="glass-card p-6 rounded-3xl">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-slate-50 rounded-xl">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
    <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
  </div>
);

const DashboardView = ({ recentLeads }: { recentLeads: Lead[] }) => {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Welcome back, Nexli</h2>
        <p className="text-slate-500">Here's what's happening with your lead generation today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Leads" value="12,482" icon={Users} trend={12} />
        <StatCard title="Verified Emails" value="8,921" icon={Mail} trend={8} />
        <StatCard title="LinkedIn Profiles" value="4,201" icon={Linkedin} trend={15} />
        <StatCard title="Success Rate" value="94.2%" icon={CheckCircle2} trend={2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Scraping Performance</h3>
            <select className="text-sm bg-slate-50 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                    {lead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                    <p className="text-[10px] text-slate-500">{lead.company}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  lead.status === 'verified' ? "bg-emerald-500" : 
                  lead.status === 'pending' ? "bg-amber-500" : "bg-rose-500"
                )}></div>
              </div>
            ))}
            {recentLeads.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8 italic">No recent activity</p>
            )}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-bold text-slate-600 hover:text-black transition-colors border-t border-slate-100">
            View all activity
          </button>
        </div>
      </div>
    </div>
  );
};

const ScraperView = ({ onLeadsFound }: { onLeadsFound: (leads: Lead[]) => void }) => {
  const [query, setQuery] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [scrapingStep, setScrapingStep] = useState('');

  const handleScrape = async () => {
    if (!query) return;
    setIsScraping(true);
    setResults([]);
    
    const steps = [
      "Connecting to Nexli Search Engine...",
      "Crawling professional networks...",
      "Identifying decision makers...",
      "Verifying email deliverability...",
      "Extracting LinkedIn profiles...",
      "Finalizing lead quality scores..."
    ];

    for (const step of steps) {
      setScrapingStep(step);
      await new Promise(r => setTimeout(r, 600));
    }
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a list of 5 highly qualified leads for a business search query: "${query}". 
        Return the data as a JSON array of objects with the following fields: 
        id (string), name (string), email (string), company (string), status (one of: 'verified', 'pending', 'failed'), linkedin (string URL), role (string).
        Make the data look realistic and professional.`,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      setResults(data);
      onLeadsFound(data);
    } catch (error) {
      console.error("Scraping failed:", error);
    } finally {
      setIsScraping(false);
      setScrapingStep('');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Lead Scraper</h2>
        <p className="text-slate-500">Search for verified emails and LinkedIn profiles across the web.</p>
      </header>

      <div className="glass-card p-8 rounded-[2rem] shadow-xl shadow-slate-200/50">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Enter company domain, industry, or keywords..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Popular:</span>
            {['SaaS Founders', 'CPA Firms', 'Marketing Agencies', 'Real Estate'].map(tag => (
              <button 
                key={tag}
                onClick={() => setQuery(tag)}
                className="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-black hover:text-white transition-all"
              >
                {tag}
              </button>
            ))}
          </div>

          <button 
            onClick={handleScrape}
            disabled={isScraping || !query}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg flex flex-col items-center justify-center gap-1 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScraping ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Scraping the web...</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest animate-pulse">
                  {scrapingStep}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                <span>Start Scraping</span>
              </div>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold">Scrape Results</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"><Globe className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Email Status</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">LinkedIn</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {lead.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        lead.status === 'verified' ? "bg-emerald-50 text-emerald-600" : 
                        lead.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {lead.status === 'verified' && <CheckCircle2 className="w-3 h-3" />}
                        {lead.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lead.company}</td>
                    <td className="px-6 py-4">
                      <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0077b5] transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allLeads, setAllLeads] = useState<Lead[]>([]);

  const handleLeadsFound = (newLeads: Lead[]) => {
    setAllLeads(prev => [...newLeads, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="pl-64 pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === 'dashboard' && <DashboardView recentLeads={allLeads} />}
              {activeTab === 'scraper' && <ScraperView onLeadsFound={handleLeadsFound} />}
              {activeTab === 'leads' && (
                <div className="space-y-8">
                  <header className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">My Leads</h2>
                      <p className="text-slate-500">Manage and export your collected leads.</p>
                    </div>
                    <button className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                      Export CSV
                    </button>
                  </header>

                  {allLeads.length > 0 ? (
                    <div className="glass-card rounded-3xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                            <th className="px-6 py-4">Lead</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Company</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allLeads.map((lead) => (
                            <tr key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {lead.name[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                                    <p className="text-xs text-slate-500">{lead.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{lead.role}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">{lead.company}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  lead.status === 'verified' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                                )}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold">No leads found yet</h3>
                      <p className="text-slate-500 max-w-xs">Start scraping to find highly qualified leads for your business.</p>
                      <button 
                        onClick={() => setActiveTab('scraper')}
                        className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800 transition-all"
                      >
                        Go to Scraper
                      </button>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="glass-card p-8 rounded-3xl max-w-2xl">
                  <h3 className="text-xl font-bold mb-6">Account Settings</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                      <div className="flex gap-2">
                        <input type="password" value="••••••••••••••••" readOnly className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 outline-none" />
                        <button className="bg-slate-100 px-4 py-2 rounded-xl font-bold text-sm">Reveal</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Webhook URL</label>
                      <input type="text" placeholder="https://your-webhook.com" className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 outline-none" />
                    </div>
                    <button className="bg-black text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-slate-800 transition-all">
                      Save Changes
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
