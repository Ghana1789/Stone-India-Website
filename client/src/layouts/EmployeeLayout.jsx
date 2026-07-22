import { useState, useEffect } from 'react';
import NotificationsDrawer from '../components/NotificationsDrawer';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatWidget from '../components/ChatWidget';
import api from '../services/api';
import {
  FiHome, FiCheckSquare, FiClock, FiBriefcase,
  FiCalendar, FiDollarSign, FiFileText, FiMessageCircle,
  FiBarChart2, FiUser, FiMenu, FiLogOut, FiPlus, FiAlertTriangle,
  FiBell, FiX, FiChevronRight, FiZap, FiActivity, FiBook,
  FiShield, FiTrendingUp, FiCpu
} from 'react-icons/fi';

const sidebarGroups = [
  {
    label: 'WORKSPACE',
    items: [
      { to: '/employee/dashboard',   icon: FiHome,          label: 'Dashboard',         color: '#22c55e' },
      { to: '/employee/tasks',       icon: FiCheckSquare,   label: 'My Tasks',          color: '#6366f1' },
      { to: '/employee/schedule',    icon: FiCalendar,      label: 'My Schedule',       color: '#3b82f6' },
      { to: '/employee/timesheet',   icon: FiClock,         label: 'Timesheet',         color: '#f59e0b' },
      { to: '/employee/projects',    icon: FiBriefcase,     label: 'Projects',          color: '#a855f7' },
    ]
  },
  {
    label: 'MANUFACTURING',
    items: [
      { to: '/employee/batches',     icon: FiCpu,           label: 'Batch Logs',        color: '#06b6d4' },
      { to: '/employee/issues',      icon: FiAlertTriangle, label: 'Report Issue',      color: '#ef4444', badge: '!' },
    ]
  },
  {
    label: 'HR & PAYROLL',
    items: [
      { to: '/employee/leave',       icon: FiShield,        label: 'Leave & Attendance',color: '#10b981' },
      { to: '/employee/payslips',    icon: FiDollarSign,    label: 'Payslips',          color: '#22c55e' },
      { to: '/employee/expenses',    icon: FiFileText,      label: 'Expense Claims',    color: '#f59e0b' },
      { to: '/employee/finance',     icon: FiTrendingUp,    label: 'Finance',           color: '#8b5cf6' },
    ]
  },
  {
    label: 'GROWTH',
    items: [
      { to: '/employee/training',    icon: FiBook,          label: 'Training',          color: '#a855f7' },
      { to: '/employee/performance', icon: FiBarChart2,     label: 'Performance',       color: '#f97316' },
      { to: '/employee/chat',        icon: FiMessageCircle, label: 'Team Chat',         color: '#10b981' },
      { to: '/employee/profile',     icon: FiUser,          label: 'My Profile',        color: '#94a3b8' },
    ]
  }
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EMP';

  const handleClock = async () => {
    setClockLoading(true);
    try {
      if (!clockedIn) {
        await api.post('/employee/timesheets/clock-in');
      } else {
        await api.put('/employee/timesheets/clock-out');
      }
      setClockedIn(prev => !prev);
    } catch {
      setClockedIn(prev => !prev); // toggle anyway in demo mode
    } finally {
      setClockLoading(false);
    }
  };

  // Find current page info
  const allItems = sidebarGroups.flatMap(g => g.items);
  const currentPage = allItems.find(i => pathname === i.to || (i.to !== '/employee/dashboard' && pathname.startsWith(i.to)));

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="relative px-5 py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/15 via-teal-600/8 to-transparent" />
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/8 rounded-full blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50 flex-shrink-0">
            <FiActivity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight tracking-wide">Stone India</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-300 font-semibold tracking-widest uppercase">Employee Portal</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent mx-4" />

      {/* User Card */}
      <div className="px-4 py-4">
        <Link to="/employee/profile" className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/40 hover:border-emerald-500/30 hover:bg-slate-800/60 transition-all duration-200 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-900/30">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d0f1a]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate group-hover:text-emerald-200 transition-colors">{user?.name || 'Employee'}</div>
            <div className="text-slate-500 text-xs truncate">{user?.designation || user?.department || 'Staff'}</div>
          </div>
          <div className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
            {user?.department?.slice(0, 3) || 'EMP'}
          </div>
        </Link>

        {/* Clock In/Out inside sidebar */}
        <button
          onClick={handleClock}
          disabled={clockLoading}
          className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border ${
            clockedIn
              ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${clockedIn ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
          {clockLoading ? 'Processing...' : clockedIn ? '⏹  Clock Out' : '▶  Clock In'}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-4 pb-4">
        {sidebarGroups.map(group => (
          <div key={group.label}>
            <div className="text-[9px] font-black text-slate-600 tracking-[0.2em] px-3 mb-1.5 uppercase">{group.label}</div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = pathname === item.to || (item.to !== '/employee/dashboard' && pathname.startsWith(item.to));
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
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      active ? '' : 'group-hover:bg-slate-700/50'
                    }`}
                      style={active ? { backgroundColor: `${item.color}25` } : {}}>
                      <item.icon className="w-4 h-4" style={{ color: active ? item.color : undefined }} />
                    </div>
                    <span className="flex-1 leading-none">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400">
                        {item.badge}
                      </span>
                    )}
                    {active && <FiChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0a0c14 0%, #0c0f1a 50%, #0a0c14 100%)' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed h-full z-20" style={{
        background: 'rgba(12,15,26,0.96)',
        borderRight: '1px solid rgba(16,185,129,0.08)',
        backdropFilter: 'blur(20px)',
      }}>
        {renderSidebarContent()}
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 flex flex-col h-full" style={{
            background: 'rgba(12,15,26,0.98)',
            borderRight: '1px solid rgba(16,185,129,0.12)',
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

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-3.5" style={{
          background: 'rgba(12,15,26,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(16,185,129,0.07)',
        }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm hidden sm:flex">
            <span className="text-slate-600 font-medium">Employee</span>
            <FiChevronRight className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-slate-300 font-semibold">{currentPage?.label || 'Dashboard'}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Live Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 text-xs text-slate-500 font-mono">
              <FiZap className="w-3 h-3 text-emerald-400" />
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>

            {/* Quick Clock-in button in topbar */}
            <button
              onClick={handleClock}
              disabled={clockLoading}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                clockedIn
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${clockedIn ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
              {clockedIn ? 'Clock Out' : 'Clock In'}
            </button>

            {/* Quick New Request */}
            <Link
              to="/employee/issues"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
            >
              <FiPlus className="w-3.5 h-3.5" /> Report
            </Link>

            {/* Notifications */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2.5 rounded-xl text-slate-400 hover:text-white transition-all hover:bg-slate-800/60 border border-transparent hover:border-slate-700/30"
            >
              <FiBell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0c0f1a] animate-pulse" />
            </button>

            <div className="w-px h-6 bg-slate-700/40" />

            {/* Avatar */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-emerald-900/30">
                  {initials}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-[#0c0f1a] ${clockedIn ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              </div>
              <div className="hidden sm:block">
                <div className="text-white text-xs font-semibold leading-none">{user?.name?.split(' ')[0]}</div>
                <div className="text-emerald-400 text-[10px] font-medium mt-0.5 leading-none">{user?.designation || 'Employee'}</div>
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
            <FiActivity className="w-3 h-3 text-emerald-500/40" /> Employee Portal v2.0
          </span>
        </footer>
      </div>

      <ChatWidget />
      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
