import { useState, useEffect } from 'react';
import NotificationsDrawer from '../components/NotificationsDrawer';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';
import {
  FiBatteryCharging, FiHome, FiShoppingCart, FiFileText,
  FiMessageSquare, FiMenu, FiLogOut, FiBell, FiUser,
  FiFolder, FiCreditCard, FiDollarSign, FiLayers, FiX,
  FiChevronRight, FiZap, FiPackage, FiHeadphones, FiBarChart2,
  FiShield, FiStar
} from 'react-icons/fi';

const navItems = [
  { to: '/client/dashboard',       icon: FiHome,         label: 'Dashboard',         color: '#6366f1', badge: null },
  { to: '/client/process-tracker', icon: FiLayers,        label: 'Production Tracker', color: '#22c55e', badge: 'LIVE' },
  { to: '/client/projects',        icon: FiFolder,        label: 'My Projects',        color: '#3b82f6', badge: null },
  { to: '/client/orders',          icon: FiShoppingCart,  label: 'Order Tracking',     color: '#f59e0b', badge: null },
  { to: '/client/catalogue',       icon: FiPackage,       label: 'Product Catalogue',  color: '#8b5cf6', badge: null },
  { to: '/client/invoices',        icon: FiCreditCard,    label: 'Invoices & Billing', color: '#10b981', badge: null },
  { to: '/client/warranty',        icon: FiShield,        label: 'Warranty Claims',    color: '#f97316', badge: null },
  { to: '/client/reports',         icon: FiBarChart2,     label: 'Reports',            color: '#06b6d4', badge: null },
  { to: '/client/tickets',         icon: FiMessageSquare, label: 'Support Tickets',    color: '#ec4899', badge: null },
  { to: '/client/support',         icon: FiHeadphones,    label: 'Live Chat',          color: '#22c55e', badge: null },
  { to: '/client/finance',         icon: FiDollarSign,    label: 'Finance',            color: '#a855f7', badge: null },
  { to: '/client/profile',         icon: FiUser,          label: 'My Profile',         color: '#94a3b8', badge: null },
];

export default function ClientLayout() {
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

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';

  // Current page label
  const currentPage = navItems.find(i => pathname === i.to || (i.to !== '/client/dashboard' && pathname.startsWith(i.to)));

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Header */}
      <div className="relative px-5 py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/50 flex-shrink-0">
            <FiBatteryCharging className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight tracking-wide">Stone India</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] text-indigo-300 font-semibold tracking-widest uppercase">Client Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent mx-4" />

      {/* User Card */}
      <div className="px-4 py-4">
        <Link to="/client/profile" className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/40 hover:border-indigo-500/30 hover:bg-slate-800/60 transition-all duration-200 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-900/30">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d0f1a]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate group-hover:text-indigo-200 transition-colors">{user?.name || 'Client'}</div>
            <div className="text-slate-500 text-xs truncate">{user?.company || user?.email}</div>
          </div>
          <FiStar className="w-3.5 h-3.5 text-indigo-400/60 shrink-0" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5 pb-4">
        {navItems.map(item => {
          const active = pathname === item.to || (item.to !== '/client/dashboard' && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              style={active ? {
                background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                borderLeft: `2px solid ${item.color}`,
              } : {}}
            >
              {active && (
                <div className="absolute inset-0 rounded-xl opacity-5"
                  style={{ background: `radial-gradient(circle at left, ${item.color}, transparent)` }} />
              )}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                active ? 'shadow-sm' : 'group-hover:bg-slate-700/50'
              }`}
                style={active ? { backgroundColor: `${item.color}25` } : {}}>
                <item.icon className="w-4 h-4" style={{ color: active ? item.color : undefined }} />
              </div>
              <span className="flex-1 leading-none">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 tracking-wider">
                  {item.badge}
                </span>
              )}
              {active && <FiChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/60 group-hover:bg-red-500/10 transition-all">
            <FiLogOut className="w-4 h-4" />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0a0c14 0%, #0d0f1a 50%, #0a0c14 100%)' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed h-full z-20" style={{
        background: 'rgba(13,15,26,0.95)',
        borderRight: '1px solid rgba(99,102,241,0.1)',
        backdropFilter: 'blur(20px)',
      }}>
        {renderSidebarContent()}
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 flex flex-col h-full" style={{
            background: 'rgba(13,15,26,0.98)',
            borderRight: '1px solid rgba(99,102,241,0.15)',
            backdropFilter: 'blur(20px)',
          }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
              <span className="text-white font-bold text-sm">Navigation</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-3.5" style={{
          background: 'rgba(13,15,26,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99,102,241,0.08)',
        }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm hidden sm:flex">
            <span className="text-slate-600 font-medium">Client</span>
            <FiChevronRight className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-slate-300 font-semibold">{currentPage?.label || 'Dashboard'}</span>
          </div>

          <div className="flex-1" />

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Live Time */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 text-xs text-slate-500 font-mono">
              <FiZap className="w-3 h-3 text-indigo-400" />
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            {/* Notifications */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2.5 rounded-xl text-slate-400 hover:text-white transition-all hover:bg-slate-800/60 border border-transparent hover:border-slate-700/30"
            >
              <FiBell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0d0f1a] animate-pulse" />
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-slate-700/40" />

            {/* Avatar */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-900/30">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[1.5px] border-[#0d0f1a]" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white text-xs font-semibold leading-none">{user?.name?.split(' ')[0]}</div>
                <div className="text-indigo-400 text-[10px] font-medium mt-0.5 leading-none">Client</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-slate-800/40 flex items-center justify-between">
          <span className="text-slate-700 text-xs">© 2026 Stone India Pvt. Ltd.</span>
          <span className="text-slate-700 text-xs flex items-center gap-1">
            <FiZap className="w-3 h-3 text-indigo-500/50" /> Client Portal v2.0
          </span>
        </footer>
      </div>

      <ChatWidget />
      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
