import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiClock, FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiRefreshCw, FiMail, FiCalendar, FiChevronDown } from 'react-icons/fi';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'client_acquisition', name: 'Client Acquisition' },
  { id: 'order_fulfillment', name: 'Order Fulfillment' },
  { id: 'employee_productivity', name: 'Employee Productivity' },
  { id: 'revenue_summary', name: 'Revenue Summary' },
  { id: 'inventory_turnover', name: 'Inventory Turnover' },
  { id: 'full_business_summary', name: 'Full Business Summary' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily', desc: 'Sent every day at 7:00 AM IST' },
  { value: 'weekly', label: 'Weekly', desc: 'Sent every Monday at 7:00 AM IST' },
  { value: 'monthly', label: 'Monthly', desc: 'Sent on 1st of every month at 7:00 AM IST' },
];

const DATE_PRESETS = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
];

const STATUS_BADGE = {
  success: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/20 text-red-400',
  never: 'bg-slate-500/20 text-slate-400',
};

function ScheduleForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', templateId: '', frequency: 'weekly',
    dateRangePreset: 'last_30_days', recipients: '', isActive: true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.templateId || !form.recipients) return toast.error('Please fill all required fields.');
    const recipientList = form.recipients.split(',').map(r => r.trim()).filter(Boolean);
    if (!recipientList.length) return toast.error('Please enter at least one email recipient.');
    setSaving(true);
    try {
      await api.post('/admin/reports/schedules', { ...form, recipients: recipientList });
      toast.success('Schedule created!');
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create schedule.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500';
  const selectCls = inputCls + ' appearance-none';

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/60 border border-blue-500/30 rounded-2xl p-6 space-y-4">
      <h3 className="text-slate-200 font-semibold">New Schedule</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Schedule Name *</label>
          <input className={inputCls} placeholder="e.g., Weekly Revenue Report" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Report Template *</label>
          <div className="relative">
            <select className={selectCls} value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}>
              <option value="">— Select —</option>
              {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Frequency *</label>
          <div className="flex gap-2">
            {FREQUENCIES.map(f => (
              <button key={f.value} type="button" onClick={() => setForm(ff => ({ ...ff, frequency: f.value }))}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${form.frequency === f.value ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-slate-200 border border-slate-600/50'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-1">{FREQUENCIES.find(f => f.value === form.frequency)?.desc}</p>
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Date Range in Report</label>
          <div className="relative">
            <select className={selectCls} value={form.dateRangePreset} onChange={e => setForm(f => ({ ...f, dateRangePreset: e.target.value }))}>
              {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <FiChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-slate-400 text-xs block mb-1.5">Email Recipients * <span className="text-slate-600">(comma-separated)</span></label>
        <input className={inputCls} placeholder="admin@company.com, finance@company.com"
          value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))} />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
          {saving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiPlus size={14} />}
          Create Schedule
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 text-slate-400 hover:text-slate-200 text-sm transition-colors">Cancel</button>
      </div>
    </form>
  );
}

export default function ScheduledReports() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/reports/schedules');
      setSchedules(r.data.data);
    } catch { toast.error('Failed to load schedules.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSchedules(); }, []);

  const toggleActive = async (schedule) => {
    try {
      await api.put(`/admin/reports/schedules/${schedule._id}`, { isActive: !schedule.isActive });
      setSchedules(prev => prev.map(s => s._id === schedule._id ? { ...s, isActive: !s.isActive } : s));
      toast.success(`Schedule ${!schedule.isActive ? 'activated' : 'paused'}.`);
    } catch { toast.error('Failed to update schedule.'); }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await api.delete(`/admin/reports/schedules/${id}`);
      setSchedules(prev => prev.filter(s => s._id !== id));
      toast.success('Schedule deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  return (
    <>
      <Helmet><title>Scheduled Reports — Stone India Analytics</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Scheduled Reports</h1>
            <p className="text-slate-400 text-sm mt-1">Automate report delivery to your team via email</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
            <FiPlus size={16} />
            New Schedule
          </button>
        </div>

        {showForm && (
          <ScheduleForm onSave={() => { setShowForm(false); loadSchedules(); }} onCancel={() => setShowForm(false)} />
        )}

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
          <FiMail size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-300 text-sm font-medium">Email Delivery Setup</p>
            <p className="text-slate-400 text-xs mt-1">Reports are delivered via SMTP. Configure <code className="text-blue-300">SMTP_HOST</code>, <code className="text-blue-300">SMTP_USER</code>, and <code className="text-blue-300">SMTP_PASS</code> in your server <code className="text-blue-300">.env</code> file to enable email delivery.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-16">
            <FiCalendar size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No scheduled reports yet</p>
            <p className="text-slate-600 text-sm mt-1">Click "New Schedule" to automate report delivery</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(s => (
              <div key={s._id} className={`bg-slate-800/50 border rounded-2xl p-5 transition-all ${s.isActive ? 'border-slate-700/50' : 'border-slate-800 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-slate-100 font-semibold">{s.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                        {s.isActive ? 'Active' : 'Paused'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[s.lastRunStatus]}`}>
                        Last: {s.lastRunStatus}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><FiFileText size={11} /> {TEMPLATES.find(t => t.id === s.templateId)?.name || s.templateId}</span>
                      <span className="flex items-center gap-1"><FiClock size={11} /> {s.frequency}</span>
                      <span className="flex items-center gap-1"><FiCalendar size={11} /> {s.dateRangePreset?.replace(/_/g, ' ')}</span>
                      <span className="flex items-center gap-1"><FiMail size={11} /> {s.recipients?.join(', ')}</span>
                    </div>
                    {s.lastRunAt && (
                      <p className="text-slate-600 text-xs mt-1.5">Last run: {new Date(s.lastRunAt).toLocaleString('en-IN')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(s)} className={`p-2 rounded-lg transition-colors ${s.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700'}`} title={s.isActive ? 'Pause' : 'Activate'}>
                      {s.isActive ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                    </button>
                    <button onClick={() => deleteSchedule(s._id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
