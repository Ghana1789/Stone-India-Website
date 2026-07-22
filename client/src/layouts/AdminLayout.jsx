import { useState, useEffect } from 'react';
import NotificationsDrawer from '../components/NotificationsDrawer';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';
import {
  FiHome, FiUsers, FiFileText, FiClipboard, FiSettings, FiHardDrive,
  FiMenu, FiLogOut, FiBell, FiDownload, FiPlus, FiX, FiUser, FiDollarSign,
  FiGrid, FiTrendingUp, FiActivity, FiAlertTriangle, FiGitBranch,
  FiChevronRight, FiZap, FiShield, FiDatabase, FiCpu, FiPackage,
  FiBarChart2, FiSearch
} from 'react-icons/fi';

const sidebarGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/admin/dashboard',    icon: FiHome,          label: 'Dashboard',          color: '#ef4444' },
    ]
  },
  {
    label: 'EV MANUFACTURING',
    items: [
      { to: '/admin/ev-dashboard',                    icon: FiActivity,      label: 'Executive Overview',  color: '#3b82f6' },
      { to: '/admin/ev-dashboard/production',         icon: FiCpu,           label: 'Production Mgmt',     color: '#8b5cf6' },
      { to: '/admin/ev-dashboard/cell-manufacturing', icon: FiGitBranch,     label: 'Cell Manufacturing',   color: '#10b981' },
      { to: '/admin/ev-dashboard/traceability',       icon: FiZap,           label: 'Pack Traceability',   color: '#f59e0b' },
      { to: '/admin/ev-dashboard/quality',            icon: FiShield,        label: 'Quality Control',     color: '#ef4444' },
      { to: '/admin/ev-dashboard/testing',            icon: FiActivity,      label: 'Testing Lab',         color: '#ec4899' },
      { to: '/admin/ev-dashboard/bms',                icon: FiCpu,           label: 'BMS Analytics',       color: '#06b6d4' },
      { to: '/admin/ev-dashboard/inventory',          icon: FiPackage,       label: 'EV Inventory',        color: '#14b8a6' },
      { to: '/admin/ev-dashboard/supply-chain',       icon: FiUsers,         label: 'Supply Chain',        color: '#f97316' },
      { to: '/admin/ev-dashboard/maintenance',        icon: FiSettings,      label: 'Predictive Maint',    color: '#84cc16' },
      { to: '/admin/ev-dashboard/sustainability',     icon: FiZap,           label: 'Sustainability ESG',  color: '#22c55e' },
      { to: '/admin/ev-dashboard/finance',            icon: FiDollarSign,    label: 'Finance Analytics',   color: '#eab308' },
      { to: '/admin/ev-dashboard/compliance',         icon: FiClipboard,     label: 'Compliance & Reg',    color: '#6366f1' },
      { to: '/admin/ev-dashboard/ai-insights',        icon: FiTrendingUp,    label: 'AI Insights',         color: '#a855f7' },
      { to: '/admin/ev-dashboard/roles-permissions',  icon: FiShield,        label: 'Roles & Perms',       color: '#64748b' }
    ]
  },
  {
    label: 'MANUFACTURING',
    items: [
      { to: '/admin/departments',  icon: FiGrid,          label: 'Departments',        color: '#3b82f6' },
      { to: '/admin/process-flow', icon: FiGitBranch,     label: 'Process Flow',       color: '#8b5cf6' },
      { to: '/admin/kpis',         icon: FiTrendingUp,    label: 'KPI Reports',        color: '#f97316' },
      { to: '/admin/incidents',    icon: FiAlertTriangle, label: 'Incidents',          color: '#ef4444', badge: null },
      { to: '/admin/batches',      icon: FiCpu,           label: 'Batch Logs',         color: '#f59e0b' },
    ]
  },
  {
    label: 'MANAGEMENT',
    items: [
      { to: '/admin/users',        icon: FiUsers,         label: 'User Management',    color: '#a855f7' },
      { to: '/admin/employees',    icon: FiUsers,         label: 'Employees',          color: '#06b6d4' },
      { to: '/admin/orders',       icon: FiPackage,       label: 'Orders',             color: '#f59e0b' },
      { to: '/admin/billing',      icon: FiFileText,      label: 'Billing & Invoices', color: '#10b981' },
      { to: '/admin/finance',      icon: FiDollarSign,    label: 'Finance',            color: '#22c55e' },
    ]
  },
  {
    label: 'ANALYTICS & INTELLIGENCE',
    items: [
      { to: '/admin/analytics',             icon: FiBarChart2,     label: 'Analytics Hub',      color: '#06b6d4' },
      { to: '/admin/analytics/clients',     icon: FiUsers,         label: 'Client Acquisition', color: '#a855f7' },
      { to: '/admin/analytics/fulfillment', icon: FiPackage,       label: 'Order Fulfillment',  color: '#3b82f6' },
      { to: '/admin/analytics/productivity',icon: FiActivity,      label: 'Productivity',       color: '#10b981' },
      { to: '/admin/analytics/revenue',     icon: FiDollarSign,    label: 'Revenue Analytics',  color: '#22c55e' },
      { to: '/admin/analytics/inventory',   icon: FiPackage,       label: 'Inventory Turnover', color: '#f59e0b' },
      { to: '/admin/analytics/reports',     icon: FiBarChart2,     label: 'Report Builder',     color: '#f97316' },
      { to: '/admin/analytics/schedules',   icon: FiTrendingUp,    label: 'Scheduled Reports',  color: '#8b5cf6' },
      { to: '/admin/analytics/alerts',      icon: FiAlertTriangle, label: 'Alerts Center',      color: '#ef4444' },
    ]
  },
  {
    label: 'ADVANCED',
    items: [
      { to: '/admin/audit',        icon: FiClipboard,     label: 'Audit Logs',         color: '#94a3b8' },
      { to: '/admin/settings',     icon: FiSettings,      label: 'System Settings',    color: '#64748b' },
      { to: '/admin/backup',       icon: FiDatabase,      label: 'Backup & Security',  color: '#475569' },
      { to: '/admin/profile',      icon: FiUser,          label: 'Profile',            color: '#3b82f6' },
    ]
  }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';
  const allItems = sidebarGroups.flatMap(g => g.items);
  const currentPage = allItems.find(i => pathname === i.to || (i.to !== '/admin/dashboard' && pathname.startsWith(i.to)));

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-3xl relative z-10 overflow-hidden rounded-[2rem]">
      {/* Decorative Glow inside sidebar */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-red-600/20 rounded-full blur-[80px] pointer-events-none" />

      {/* Logo Area */}
      <div className="relative px-6 py-8 flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0 relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          <FiShield className="w-5 h-5 text-white relative z-10" />
        </div>
        <div>
          <div className="font-black text-white text-base tracking-wide">STONE INDIA</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Admin Mode</span>
          </div>
        </div>
      </div>

      <div className="mx-6 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6 scrollbar-hide relative z-10">
        {sidebarGroups.map(group => (
          <div key={group.label}>
            <div className="text-[10px] font-black text-slate-500 tracking-[0.2em] px-3 mb-3 uppercase">{group.label}</div>
            <div className="space-y-1">
              {group.items.map(item => {
                const active = pathname === item.to || (item.to !== '/admin/dashboard' && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 group overflow-hidden ${
                      active ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    style={active ? {
                      background: `linear-gradient(90deg, ${item.color}15 0%, transparent 100%)`,
                    } : {}}
                  >
                    {active && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ backgroundColor: item.color }} />
                    )}
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                      style={active ? { backgroundColor: `${item.color}25`, color: item.color } : { backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 leading-none tracking-wide">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-800/50 relative z-10">
        <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group mb-2" onClick={() => navigate('/admin/profile')}>
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:border-slate-500 transition-colors">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-bold truncate">{user?.name || 'Admin User'}</div>
            <div className="text-slate-400 text-[10px] uppercase tracking-wider truncate font-semibold">Administrator</div>
          </div>
        </div>
        
        <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300">
          <FiLogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#030407] relative overflow-x-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />

      {/* Desktop Sidebar (Floating) */}
      <aside className="hidden lg:flex flex-col w-[280px] fixed h-[calc(100vh-2rem)] my-4 ml-4 z-20 rounded-[2rem] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-[280px] flex flex-col h-full bg-[#0a0c10] border-r border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 relative z-20">
              <span className="text-white font-bold text-sm tracking-widest uppercase">Admin Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[312px] flex flex-col min-h-screen relative z-10">
        
        {/* Floating Header */}
        <header className="sticky top-4 z-30 mx-4 lg:mx-6 flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <FiMenu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 text-sm font-semibold">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Overview</span>
              <span className="text-slate-600">/</span>
              <span className="text-white tracking-wide">{currentPage?.label || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Search / Command Palette Mock */}
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 text-slate-400 hover:border-white/20 transition-all group w-48 lg:w-64">
              <FiSearch className="w-4 h-4 group-hover:text-white transition-colors" />
              <span className="text-xs flex-1 text-left">Search...</span>
              <div className="flex items-center gap-1 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded opacity-60">
                <span>Ctrl</span><span>K</span>
              </div>
            </button>

            {/* Time */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 font-mono font-medium tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>

            <button onClick={() => setNotifOpen(true)} className="relative p-2 rounded-xl text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/5">
              <FiBell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#13161e] shadow-[0_0_8px_rgba(239,68,68,1)] animate-pulse" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 lg:pt-8 animate-fade-in-up">
          <Outlet />
        </main>
      </div>

      <ChatWidget />
      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
