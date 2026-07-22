import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FiBell, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiRefreshCw,
  FiAlertTriangle, FiCheckCircle, FiInfo, FiEdit2, FiX, FiFilter, FiChevronDown
} from 'react-icons/fi';
import api from '../../../services/api';
import socket from '../../../services/socket';
import toast from 'react-hot-toast';

const METRICS = [
  { value: 'revenue_daily', label: 'Revenue (Daily)' },
  { value: 'revenue_weekly', label: 'Revenue (Weekly)' },
  { value: 'revenue_monthly', label: 'Revenue (Monthly)' },
  { value: 'order_volume_daily', label: 'Order Volume (Daily)' },
  { value: 'pending_orders_count', label: 'Pending Orders Count' },
  { value: 'warranty_claims_count', label: 'Warranty Claims Count' },
  { value: 'inventory_level', label: 'Minimum Inventory Level' },
  { value: 'batch_failure_rate', label: 'Batch Failure Rate (%)' },
  { value: 'employee_productivity_index', label: 'Productivity Index (%)' },
  { value: 'defect_rate_percent', label: 'Defect Rate (%)' },
];

const OPERATORS = [
  { value: 'gt', label: '> Greater than' },
  { value: 'lt', label: '< Less than' },
  { value: 'gte', label: '>= At least' },
  { value: 'lte', label: '<= At most' },
];

const SEVERITIES = [
  { value: 'info', label: 'Info', color: '#3b82f6' },
  { value: 'warning', label: 'Warning', color: '#f59e0b' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

const SEVERITY_STYLES = {
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: '#3b82f6' },
  warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', dot: '#f59e0b' },
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: '#ef4444' },
};

function AlertConfigForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', metric: '', operator: 'lt', threshold: '', severity: 'warning',
    isActive: true, cooldownMinutes: 60,
    channels: { dashboard: true, email: false },
    emailRecipients: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.metric || form.threshold === '') return toast.error('Fill all required fields.');
    setSaving(true);
    const payload = {
      ...form,
      threshold: Number(form.threshold),
      emailRecipients: form.emailRecipients
        ? form.emailRecipients.split(',').map(r => r.trim()).filter(Boolean)
        : []
    };
    try {
      if (initial?._id) {
        await api.put(`/admin/alerts/config/${initial._id}`, payload);
        toast.success('Alert rule updated!');
      } else {
        await api.post('/admin/alerts/config', payload);
        toast.success('Alert rule created!');
      }
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save alert rule.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500';

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-blue-500/30 rounded-2xl p-6 space-y-4">
      <h3 className="text-slate-200 font-semibold">{initial ? 'Edit Alert Rule' : 'New Alert Rule'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Rule Name *</label>
          <input className={inputCls} placeholder="e.g., Low Revenue Alert" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Metric *</label>
          <div className="relative">
            <select className={inputCls + ' appearance-none pr-8'} value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
              <option value="">— Select metric —</option>
              {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Condition *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select className={inputCls + ' appearance-none pr-8'} value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}>
                {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <input type="number" className={inputCls} placeholder="Value" style={{ maxWidth: 120 }}
              value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Severity</label>
          <div className="flex gap-2">
            {SEVERITIES.map(s => (
              <button key={s.value} type="button" onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors border ${form.severity === s.value ? '' : 'border-slate-600/50 bg-slate-700/50 text-slate-400'}`}
                style={form.severity === s.value ? { background: `${s.color}22`, borderColor: `${s.color}44`, color: s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Cooldown (minutes)</label>
          <input type="number" className={inputCls} min={5} value={form.cooldownMinutes}
            onChange={e => setForm(f => ({ ...f, cooldownMinutes: Number(e.target.value) }))} />
          <p className="text-slate-600 text-xs mt-1">Minimum time between repeated firings of this alert</p>
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-2">Delivery Channels</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.channels.dashboard} onChange={e => setForm(f => ({ ...f, channels: { ...f.channels, dashboard: e.target.checked } }))} className="accent-blue-500 w-4 h-4" />
              <span className="text-slate-300 text-sm">Dashboard Notification</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.channels.email} onChange={e => setForm(f => ({ ...f, channels: { ...f.channels, email: e.target.checked } }))} className="accent-blue-500 w-4 h-4" />
              <span className="text-slate-300 text-sm">Email</span>
            </label>
          </div>
        </div>
      </div>

      {form.channels.email && (
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Email Recipients <span className="text-slate-600">(comma-separated)</span></label>
          <input className={inputCls} placeholder="admin@company.com, ops@company.com"
            value={typeof form.emailRecipients === 'string' ? form.emailRecipients : (form.emailRecipients || []).join(', ')}
            onChange={e => setForm(f => ({ ...f, emailRecipients: e.target.value }))} />
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
          {saving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiPlus size={14} />}
          {initial ? 'Update Rule' : 'Create Rule'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm transition-colors">Cancel</button>
      </div>
    </form>
  );
}

export default function AlertsCenter() {
  const [configs, setConfigs] = useState([]);
  const [events, setEvents] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');
  const [filterResolved, setFilterResolved] = useState('false');
  const [liveAlerts, setLiveAlerts] = useState([]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/alerts/config');
      setConfigs(r.data.data);
    } catch { toast.error('Failed to load alert rules.'); }
    finally { setLoading(false); }
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const params = {};
      if (filterResolved !== 'all') params.isResolved = filterResolved;
      const r = await api.get('/admin/alerts/events', { params });
      setEvents(r.data.data);
      setUnresolvedCount(r.data.unresolvedCount || 0);
    } catch { }
    finally { setEventsLoading(false); }
  };

  useEffect(() => { loadConfigs(); loadEvents(); }, []);
  useEffect(() => { loadEvents(); }, [filterResolved]);

  // Real-time alert listener
  useEffect(() => {
    const handleAlert = (alert) => {
      setLiveAlerts(prev => [alert, ...prev].slice(0, 5));
      setUnresolvedCount(c => c + 1);
      const sev = alert.severity;
      const toastFn = sev === 'critical' ? toast.error : sev === 'warning' ? toast : toast;
      toastFn(`🔔 ${alert.alertName}: ${alert.message}`, { duration: 8000 });
    };
    const handleResolved = ({ id }) => {
      setEvents(prev => prev.map(e => e._id === id ? { ...e, isResolved: true } : e));
      setUnresolvedCount(c => Math.max(0, c - 1));
    };
    socket.on('admin_alert', handleAlert);
    socket.on('admin_alert_resolved', handleResolved);
    return () => { socket.off('admin_alert', handleAlert); socket.off('admin_alert_resolved', handleResolved); };
  }, []);

  const toggleConfig = async (config) => {
    try {
      const r = await api.put(`/admin/alerts/config/${config._id}`, { isActive: !config.isActive });
      setConfigs(prev => prev.map(c => c._id === config._id ? r.data.data : c));
      toast.success(`Alert ${!config.isActive ? 'activated' : 'paused'}.`);
    } catch { toast.error('Failed to update.'); }
  };

  const deleteConfig = async (id) => {
    if (!window.confirm('Delete this alert rule?')) return;
    try {
      await api.delete(`/admin/alerts/config/${id}`);
      setConfigs(prev => prev.filter(c => c._id !== id));
      toast.success('Alert rule deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const resolveEvent = async (id) => {
    try {
      await api.patch(`/admin/alerts/events/${id}/resolve`);
      setEvents(prev => prev.map(e => e._id === id ? { ...e, isResolved: true } : e));
      setUnresolvedCount(c => Math.max(0, c - 1));
      toast.success('Alert resolved.');
    } catch { toast.error('Failed to resolve.'); }
  };

  const fmtTime = (d) => {
    const diff = Date.now() - new Date(d);
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(d).toLocaleDateString('en-IN');
  };

  const SeverityIcon = ({ sev }) => {
    if (sev === 'critical') return <FiAlertTriangle size={14} className="text-red-400" />;
    if (sev === 'warning') return <FiAlertTriangle size={14} className="text-yellow-400" />;
    return <FiInfo size={14} className="text-blue-400" />;
  };

  return (
    <>
      <Helmet><title>Alerts Center — Stone India Analytics</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-3">
              Alerts Center
              {unresolvedCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-medium">
                  {unresolvedCount} active
                </span>
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Configure threshold alerts and manage alert history</p>
          </div>
          {activeTab === 'rules' && (
            <button onClick={() => { setShowForm(true); setEditingConfig(null); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
              <FiPlus size={16} />
              New Alert Rule
            </button>
          )}
        </div>

        {/* Live alerts banner */}
        {liveAlerts.length > 0 && (
          <div className="space-y-2">
            {liveAlerts.map((a, i) => {
              const s = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.info;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${s.bg} ${s.border}`}>
                  <SeverityIcon sev={a.severity} />
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium text-sm ${s.text}`}>{a.alertName}</span>
                    <span className="text-slate-400 text-xs ml-2">{a.message}</span>
                  </div>
                  <button onClick={() => setLiveAlerts(p => p.filter((_, j) => j !== i))} className="text-slate-500 hover:text-slate-300 ml-2 flex-shrink-0">
                    <FiX size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 gap-1">
          {[['rules', '⚙️ Alert Rules'], ['events', `📋 Event History${unresolvedCount > 0 ? ` (${unresolvedCount})` : ''}`]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* RULES TAB */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {(showForm || editingConfig) && (
              <AlertConfigForm
                initial={editingConfig}
                onSave={() => { setShowForm(false); setEditingConfig(null); loadConfigs(); }}
                onCancel={() => { setShowForm(false); setEditingConfig(null); }}
              />
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
            ) : configs.length === 0 && !showForm ? (
              <div className="text-center py-16">
                <FiBell size={40} className="text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No alert rules configured</p>
                <p className="text-slate-600 text-sm mt-1">Click "New Alert Rule" to start monitoring key metrics</p>
              </div>
            ) : (
              configs.map(c => {
                const sev = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.info;
                const op = OPERATORS.find(o => o.value === c.operator);
                const metric = METRICS.find(m => m.value === c.metric);
                return (
                  <div key={c._id} className={`bg-slate-800/50 border rounded-2xl p-5 transition-all ${c.isActive ? 'border-slate-700/50' : 'border-slate-800 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sev.bg} ${sev.border} border`}>
                          <SeverityIcon sev={c.severity} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-slate-100 font-semibold">{c.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sev.bg} ${sev.text} border ${sev.border}`}>{c.severity}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                              {c.isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs mt-1">
                            When <span className="text-slate-300 font-medium">{metric?.label || c.metric}</span>{' '}
                            <span className="text-slate-300">{op?.label?.split(' ')[0]} {c.threshold}</span>
                            <span className="ml-2 text-slate-600">· Cooldown: {c.cooldownMinutes}min</span>
                          </p>
                          <p className="text-slate-600 text-xs mt-0.5">
                            Channels: {[c.channels?.dashboard && 'Dashboard', c.channels?.email && 'Email'].filter(Boolean).join(', ') || 'None'}
                            {c.lastFiredAt && ` · Last fired: ${fmtTime(c.lastFiredAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { setEditingConfig(c); setShowForm(false); }} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => toggleConfig(c)} className={`p-2 rounded-lg transition-colors ${c.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700'}`}>
                          {c.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                        </button>
                        <button onClick={() => deleteConfig(c._id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <FiFilter size={14} className="text-slate-400" />
              {[['false', 'Active'], ['true', 'Resolved'], ['all', 'All']].map(([val, label]) => (
                <button key={val} onClick={() => setFilterResolved(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterResolved === val ? 'bg-blue-600 text-white' : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200'}`}>
                  {label}
                </button>
              ))}
              <button onClick={loadEvents} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/50 border border-slate-700/50">
                <FiRefreshCw size={13} className={eventsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {eventsLoading ? (
              <div className="flex items-center justify-center py-16"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
            ) : events.length === 0 ? (
              <div className="text-center py-16">
                <FiCheckCircle size={40} className="text-emerald-600 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No alert events{filterResolved === 'false' ? ' active' : ''}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.map(e => {
                  const sev = SEVERITY_STYLES[e.severity] || SEVERITY_STYLES.info;
                  return (
                    <div key={e._id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${sev.bg} ${sev.border} ${e.isResolved ? 'opacity-50' : ''}`}>
                      <SeverityIcon sev={e.severity} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${sev.text}`}>{e.alertName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${e.isResolved ? 'bg-slate-700 text-slate-400' : `${sev.bg} ${sev.text}`}`}>
                            {e.isResolved ? '✓ Resolved' : e.severity}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">{e.message}</p>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {fmtTime(e.createdAt)}
                          {e.isResolved && e.resolvedBy?.name && ` · Resolved by ${e.resolvedBy.name}`}
                        </p>
                      </div>
                      {!e.isResolved && (
                        <button onClick={() => resolveEvent(e._id)}
                          className="flex-shrink-0 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                          <FiCheckCircle size={12} /> Resolve
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
