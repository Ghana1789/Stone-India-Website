import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FiBell, FiX, FiCheckCircle, FiAlertTriangle, FiPackage,
  FiCalendar, FiCheckSquare, FiMessageSquare, FiRefreshCw
} from 'react-icons/fi';

const TYPE_META = {
  incident:   { icon: FiAlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10',     label: 'Incident' },
  order:      { icon: FiPackage,       color: 'text-blue-400', bg: 'bg-blue-500/10',    label: 'Order Update' },
  leave:      { icon: FiCalendar,      color: 'text-yellow-400', bg: 'bg-yellow-500/10',label: 'Leave Request' },
  task:       { icon: FiCheckSquare,   color: 'text-purple-400', bg: 'bg-purple-500/10',label: 'Task Assigned' },
  message:    { icon: FiMessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Message' },
  general:    { icon: FiBell,          color: 'text-slate-400', bg: 'bg-slate-700',      label: 'Notification' },
};

const ROLE_MOCK = {
  admin: [
    { _id: 'n1', type: 'incident', title: 'Critical: Mixer M-3 Overheating', body: 'Production dept reported a critical machine failure. Immediate action required.', link: '/admin/incidents', time: new Date(Date.now() - 300000), read: false },
    { _id: 'n2', type: 'leave', title: '3 leave requests pending', body: 'Manager Rajan Mehta and 2 employees are awaiting leave approval.', link: '/admin/leaves', time: new Date(Date.now() - 3600000), read: false },
    { _id: 'n3', type: 'order', title: 'New order from GreenDrive Motors', body: 'Order ORD-2026-005 placed for 1× StoneFleet 72V 100Ah. Review and confirm.', link: '/admin/orders', time: new Date(Date.now() - 7200000), read: true },
    { _id: 'n4', type: 'incident', title: 'High: QC Sensor Calibration Drift', body: 'Quality Control department flagged a sensor drift issue on Batch #062.', link: '/admin/incidents', time: new Date(Date.now() - 86400000), read: true },
  ],
  manager: [
    { _id: 'n1', type: 'incident', title: 'Open incident in your department', body: 'Chemical spill reported near Bay 5. Requires manager acknowledgement.', link: '/manager/incidents', time: new Date(Date.now() - 600000), read: false },
    { _id: 'n2', type: 'task', title: '2 tasks overdue', body: 'QC Check Batch #042 and Assembly alignment report are past their deadlines.', link: '/manager/tasks', time: new Date(Date.now() - 7200000), read: false },
    { _id: 'n3', type: 'leave', title: 'Leave request from Priya Sharma', body: 'Priya Sharma requested 2 days of casual leave. Approve or reject.', link: '/manager/approvals', time: new Date(Date.now() - 86400000), read: true },
  ],
  employee: [
    { _id: 'n1', type: 'task', title: 'New task assigned: QC Check Batch #071', body: 'Rajan Mehta assigned you a High priority QC task. Due: 16 Apr 2026.', link: '/employee/tasks', time: new Date(Date.now() - 1800000), read: false },
    { _id: 'n2', type: 'leave', title: 'Leave approved', body: 'Your leave request for 14 Apr 2026 has been approved by your manager.', link: '/employee/leave', time: new Date(Date.now() - 43200000), read: false },
    { _id: 'n3', type: 'message', title: 'Manager sent you a message', body: 'Rajan Mehta: "Please fill in the batch log for this morning shift."', link: '/employee/chat', time: new Date(Date.now() - 86400000), read: true },
  ],
  client: [
    { _id: 'n1', type: 'order', title: 'Order ORD-2026-001 entered Testing stage', body: 'Your battery pack has moved from Assembly to QC Testing. Est. 3 days to Packaging.', link: '/client/process-tracker', time: new Date(Date.now() - 3600000), read: false },
    { _id: 'n2', type: 'message', title: 'New message from Stone India team', body: 'Your production query has been answered. Click to read.', link: '/client/support', time: new Date(Date.now() - 7200000), read: false },
    { _id: 'n3', type: 'order', title: 'Invoice INV-2026-0002 due in 7 days', body: '₹2,18,300 payment due on 20 Apr 2026. Click to view invoice.', link: '/client/invoices', time: new Date(Date.now() - 86400000), read: true },
  ],
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsDrawer({ open, onClose }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  const loadNotifications = () => {
    setLoading(true);
    // Use role-specific mock, fallback to admin
    const mocks = ROLE_MOCK[user?.role] || ROLE_MOCK.admin;
    setTimeout(() => {
      setNotifications(mocks);
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    if (open) loadNotifications();
  }, [open, user?.role]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div ref={drawerRef} className="w-full max-w-sm bg-[#0f1117] border-l border-slate-800 flex flex-col h-full shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <FiBell className="w-5 h-5 text-white" />
            <h2 className="text-white font-black text-base">Notifications</h2>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all">
                Mark all read
              </button>
            )}
            <button onClick={loadNotifications} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
              <FiRefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
              <FiCheckCircle className="w-8 h-8 opacity-30" />
              <p className="text-sm font-bold">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {notifications.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.general;
                return (
                  <Link
                    key={n._id}
                    to={n.link || '#'}
                    onClick={() => { markRead(n._id); onClose(); }}
                    className={`flex items-start gap-3 px-5 py-4 hover:bg-slate-800/30 transition-all group ${!n.read ? 'bg-slate-800/20' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                      <meta.icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold leading-snug ${n.read ? 'text-slate-300' : 'text-white'}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                      <p className="text-slate-600 text-[10px] font-bold mt-1.5 uppercase tracking-widest">{timeAgo(n.time)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4">
          <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            {unreadCount === 0 ? 'All notifications read' : `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
    </div>
  );
}
