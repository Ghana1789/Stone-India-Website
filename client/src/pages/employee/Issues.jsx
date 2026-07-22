import { useState, useEffect, useCallback } from 'react';
import socket from '../../services/socket';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle, FiTool, FiShield, FiZap, FiPackage, FiClock,
  FiPlus, FiX, FiCheckCircle
} from 'react-icons/fi';

const ISSUE_TYPES = ['Machine Failure', 'Safety Concern', 'Quality Issue', 'Environmental', 'Process Delay', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const TYPE_ICONS = {
  'Machine Failure': FiTool,
  'Safety Concern': FiShield,
  'Quality Issue': FiZap,
  'Environmental': FiPackage,
  'Process Delay': FiClock,
  'Other': FiAlertTriangle,
};

const STATUS_STYLES = {
  Open: { cls: 'bg-red-500/20 text-red-400', dot: '#ef4444' },
  Investigating: { cls: 'bg-yellow-500/20 text-yellow-400', dot: '#f59e0b' },
  Resolved: { cls: 'bg-emerald-500/20 text-emerald-400', dot: '#22c55e' },
  Closed: { cls: 'bg-slate-700 text-slate-400', dot: '#6b7280' },
};

const INITIAL_FORM = { title: '', type: 'Machine Failure', description: '', priority: 'Medium', location: '', affectedMachine: '' };

export default function EmployeeIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/employee/issues');
      setIssues(r.data.data || []);
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchIssues(); 

    socket.on('incident_resolved', (incident) => {
      fetchIssues();
      toast.success(`Issue Resolved: ${incident.title}`, { icon: '✅' });
    });

    socket.on('incident_reported', (incident) => {
       fetchIssues();
    });

    return () => {
      socket.off('incident_resolved');
      socket.off('incident_reported');
    };
  }, [fetchIssues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.post('/employee/issues', form);
      setIssues(prev => [r.data.data, ...prev]);
      toast.success('Issue reported! Your manager will be notified.');
      setShowForm(false);
      setForm(INITIAL_FORM);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = issues.filter(i => i.status === 'Open').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Report Issue</h1>
          <p className="text-slate-400 mt-1 font-medium">Report machine problems or safety concerns</p>
        </div>
        <button onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all">
          {showForm ? <><FiX className="w-4 h-4" /> Cancel</> : <><FiPlus className="w-4 h-4" /> Report New Issue</>}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total Reported', value: issues.length, color: 'blue' },
          { label: 'Open / Active', value: openCount, color: 'red' },
          { label: 'Resolved', value: resolvedCount, color: 'emerald' },
        ].map(s => (
          <div key={s.label} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5">
            <div className={`text-3xl font-black italic text-${s.color}-400`}>{s.value}</div>
            <div className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Report Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#13161e] border border-emerald-500/30 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold text-lg">New Issue Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">Issue Title *</label>
              <input required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                placeholder="Brief, descriptive title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">Issue Type *</label>
              <select required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">Priority</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">Location</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                placeholder="e.g. Line 3, Bay 2..." value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">Affected Machine</label>
              <input className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                placeholder="Machine ID or name..." value={form.affectedMachine} onChange={e => setForm({ ...form, affectedMachine: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-1.5">Description *</label>
              <textarea required rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50 transition-all">
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(INITIAL_FORM); }}
              className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Issues List */}
      <div>
        <h2 className="text-white font-bold text-lg mb-4">My Reported Issues</h2>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : issues.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-[#13161e] border border-slate-800 rounded-2xl">
            <FiCheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold uppercase text-sm tracking-widest">No issues reported yet.</p>
            <p className="text-xs mt-1">Use the button above to report a problem.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => {
              const Icon = TYPE_ICONS[issue.type] || FiAlertTriangle;
              const st = STATUS_STYLES[issue.status] || STATUS_STYLES.Open;
              return (
                <div key={issue._id} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-bold">{issue.title}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${st.cls}`}>
                            {issue.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{issue.priority}</span>
                        </div>
                        <p className="text-slate-400 text-sm">{issue.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                          <span>{issue.type}</span>
                          {issue.location && <span>📍 {issue.location}</span>}
                          {issue.affectedMachine && <span>⚙️ {issue.affectedMachine}</span>}
                          <span>🕐 {new Date(issue.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        {issue.resolution && (
                          <div className="mt-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
                            ✅ {issue.resolution}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
