import { useState, useEffect } from 'react';
import NotificationsDrawer from '../components/NotificationsDrawer';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';
import {
  FiHome, FiUsers, FiCheckSquare, FiCalendar, FiUser,
  FiMenu, FiLogOut, FiBell, FiPlus, FiTrendingUp, FiBook,
  FiDollarSign, FiAlertTriangle, FiX, FiChevronRight,
  FiZap, FiActivity, FiTarget, FiAward, FiLayers
} from 'react-icons/fi';

const sidebarGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/manager/dashboard', icon: FiHome,          label: 'Dashboard',          color: '#f97316' },
      { to: '/manager/projects',  icon: FiLayers,        label: 'Projects (Live)',     color: '#ef4444', badge: 'LIVE' },
    ]
  },
  {
    label: 'TEAM MANAGEMENT',
    items: [
      { to: '/manager/employees',  icon: FiUsers,        label: 'My Team',            color: '#3b82f6' },
      { to: '/manager/tasks',      icon: FiCheckSquare,  label: 'Task Assignment',    color: '#a855f7' },
      { to: '/manager/approvals',  icon: FiCalendar,     label: 'Approvals Center',   color: '#f59e0b', badge: null },
      { to: '/manager/incidents',  icon: FiAlertTriangle,label: 'Incident Tracker',   color: '#ef4444' },
    ]
  },
  {
    label: 'PERFORMANCE',
    items: [
      { to: '/manager/performance', icon: FiTrendingUp,  label: 'Performance',        color: '#f59e0b' },
      { to: '/manager/training',    icon: FiBook,         label: 'Training Oversight', color: '#10b981' },
      { to: '/manager/finance',     icon: FiDollarSign,   label: 'Finance',            color: '#22c55e' },
    ]
  },
  {
    label: 'ACCOUNT',
    items: [
      { to: '/manager/profile', icon: FiUser, label: 'My Profile', color: '#94a3b8' },
    ]
  }
];

export default function ManagerLayout() {
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
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MGR';
  const allItems = sidebarGroups.flatMap(g => g.items);
  const currentPage = allItems.find(i => pathname === i.to || (i.to !== '/manager/dashboard' && pathname.startsWith(i.to)));

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="relative px-5 py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/15 via-red-600/8 to-transparent" />
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-500/8 rounded-full blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/50 flex-shrink-0">
            <FiTarget className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight tracking-wide">Stone India</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-[10px] text-orange-300 font-semibold tracking-widest uppercase">Manager Portal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent mx-4" />

      {/* User Card */}
      <div className="px-4 py-4">
        <Link to="/manager/profile" className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/40 hover:border-orange-500/30 hover:bg-slate-800/60 transition-all duration-200 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-orange-900/30">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d0f1a]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate group-hover:text-orange-200 transition-colors">{user?.name || 'Manager'}</div>
            <div className="text-slate-500 text-xs truncate">{user?.department || 'Department Head'}</div>
          </div>
          <div className="shrink-0 px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/20 text-[9px] font-bold text-orange-400 uppercase tracking-wider">
            MGR
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-4 pb-4">
        {sidebarGroups.map(group => (
          <div key={group.label}>
            <div className="text-[9px] font-black text-slate-600 tracking-[0.2em] px-3 mb-1.5 uppercase">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = pathname === item.to || (item.to !== '/manager/dashboard' && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      active ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                    style={active ? {
                      background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                      borderLeft: `2px solid ${item.color}`,
                    } : {}}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:bg-slate-700/50"
                      style={active ? { backgroundColor: `${item.color}25` } : {}}>
                      <item.icon className="w-4 h-4" style={{ color: active ? item.color : undefined }} />
                    </div>
                    <span className="flex-1 leading-none">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        item.badge === 'LIVE' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>{item.badge}</span>
                    )}
                    {active && <FiChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/60">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/60 group-hover:bg-red-500/10 transition-all">
            <FiLogOut className="w-4 h-4" />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0a0c14 0%, #0f0c12 50%, #0a0c14 100%)' }}>
      <aside className="hidden lg:flex flex-col w-64 fixed h-full z-20" style={{
        background: 'rgba(13,11,18,0.96)',
        borderRight: '1px solid rgba(249,115,22,0.08)',
        backdropFilter: 'blur(20px)',
      }}>
        {renderSidebarContent()}
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 flex flex-col h-full" style={{
            background: 'rgba(13,11,18,0.98)',
            borderRight: '1px solid rgba(249,115,22,0.12)',
            backdropFilter: 'blur(20px)',
          }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
              <span className="text-white font-bold text-sm">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-3.5" style={{
          background: 'rgba(13,11,18,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(249,115,22,0.07)',
        }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
            <FiMenu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm hidden sm:flex">
            <span className="text-slate-600 font-medium">Manager</span>
            <FiChevronRight className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-slate-300 font-semibold">{currentPage?.label || 'Dashboard'}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 text-xs text-slate-500 font-mono">
              <FiZap className="w-3 h-3 text-orange-400" />
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            <Link to="/manager/tasks" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition-all">
              <FiPlus className="w-3.5 h-3.5" /> New Task
            </Link>

            <button onClick={() => setNotifOpen(true)} className="relative p-2.5 rounded-xl text-slate-400 hover:text-white transition-all hover:bg-slate-800/60 border border-transparent hover:border-slate-700/30">
              <FiBell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0d0f1a] animate-pulse" />
            </button>

            <div className="w-px h-6 bg-slate-700/40" />

            <div className="flex items-center gap-2.5 pl-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-orange-900/30">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[1.5px] border-[#0d0f1a]" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white text-xs font-semibold leading-none">{user?.name?.split(' ')[0]}</div>
                <div className="text-orange-400 text-[10px] font-medium mt-0.5 leading-none">{user?.department || 'Manager'}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>

        <footer className="px-6 py-3 border-t border-slate-800/40 flex items-center justify-between">
          <span className="text-slate-700 text-xs">© 2026 Stone India Pvt. Ltd.</span>
          <span className="text-slate-700 text-xs flex items-center gap-1">
            <FiActivity className="w-3 h-3 text-orange-500/40" /> Manager Portal v2.0
          </span>
        </footer>
      </div>

      <ChatWidget />
      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
