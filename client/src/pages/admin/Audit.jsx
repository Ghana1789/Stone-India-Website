import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiFilter, FiRefreshCw, FiClipboard } from 'react-icons/fi';

const ACTION_CONFIG = {
  CREATE:          { label: 'Created',          dot: '#22c55e', badge: 'bg-green-500/20 text-green-400' },
  UPDATE:          { label: 'Updated',          dot: '#3b82f6', badge: 'bg-blue-500/20 text-blue-400' },
  DELETE:          { label: 'Deleted',          dot: '#ef4444', badge: 'bg-red-500/20 text-red-400' },
  LOGIN:           { label: 'Login',            dot: '#a855f7', badge: 'bg-purple-500/20 text-purple-400' },
  LOGOUT:          { label: 'Logout',           dot: '#6b7280', badge: 'bg-slate-500/20 text-slate-400' },
  RESET_PASSWORD:  { label: 'Pwd Reset',        dot: '#f59e0b', badge: 'bg-amber-500/20 text-amber-400' },
  TOGGLE_STATUS:   { label: 'Status Toggle',    dot: '#14b8a6', badge: 'bg-teal-500/20 text-teal-400' },
  BACKUP:          { label: 'Backup',           dot: '#22c55e', badge: 'bg-green-500/20 text-green-400' },
  SETTINGS_UPDATE: { label: 'Settings',         dot: '#f97316', badge: 'bg-orange-500/20 text-orange-400' },
  OTHER:           { label: 'Other',            dot: '#6b7280', badge: 'bg-slate-500/20 text-slate-400' },
};

function formatDateTime(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 30;

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get('/admin/audit', { params });
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, entityFilter, startDate, endDate]);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, entityFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FiClipboard className="w-6 h-6 text-blue-400" /> Audit Logs
          </h1>
          <p className="text-slate-400 mt-1">
            Every admin action logged in real-time — {total} total records
          </p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-all">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input className="input pl-11" placeholder="Search description or user..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} title="From date" />
        <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} title="To date" />
      </div>

      {/* Log List */}
      <div className="bg-[#13161e] border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiClipboard className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-white font-semibold text-lg mb-1">No audit logs found</h3>
            <p className="text-slate-500 text-sm">
              {search || actionFilter || startDate || endDate
                ? 'No logs match your filters.'
                : 'Actions performed in the admin portal will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {logs.map(log => {
              const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.OTHER;
              return (
                <div key={log._id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                  {/* Dot */}
                  <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: cfg.dot }} />

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">{log.entity}</span>
                    </div>
                    <div className="text-slate-200 text-sm leading-snug">{log.description}</div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-slate-500 text-xs">
                        By: <span className="text-slate-400">{log.performedBy?.name || 'System'}</span>
                        {log.performedBy?.email && <span className="text-slate-600"> ({log.performedBy.email})</span>}
                      </span>
                      {log.ip && <span className="text-slate-600 text-xs">IP: {log.ip}</span>}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-slate-500 text-xs whitespace-nowrap shrink-0 text-right">
                    {formatDateTime(log.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm">
            Page {page} of {pages} · {total} total entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm disabled:opacity-40 hover:bg-slate-800 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm disabled:opacity-40 hover:bg-slate-800 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
