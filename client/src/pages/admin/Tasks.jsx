import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiX, FiCheckSquare } from 'react-icons/fi';

const priorityColors = { Low: 'badge-gray', Medium: 'badge-blue', High: 'badge-yellow', Critical: 'badge-red' };
const statusColors = { Assigned: 'badge-blue', InProgress: 'badge-yellow', Completed: 'badge-green', OnHold: 'badge-gray', Cancelled: 'badge-red' };

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', taskType: 'Production', priority: 'Medium',
    assignedTo: [], dueDate: '', relatedBatch: '',
    checklist: []
  });
  const [checklistInput, setChecklistInput] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/tasks'),
      api.get('/admin/users', { params: { role: 'employee' } }),
      api.get('/admin/batches')
    ]).then(([t, e, b]) => {
      setTasks(t.data.data);
      setEmployees(e.data.data);
      setBatches(b.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/admin/tasks', form);
      setTasks(prev => [data.data, ...prev]);
      toast.success('Task created and assigned!');
      setShowForm(false);
      setForm({ title: '', description: '', taskType: 'Production', priority: 'Medium', assignedTo: [], dueDate: '', relatedBatch: '', checklist: [] });
      setChecklistInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setSaving(false); }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/admin/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Delete failed'); }
  };

  const addChecklist = () => {
    if (!checklistInput.trim()) return;
    setForm(prev => ({ ...prev, checklist: [...prev.checklist, { item: checklistInput, done: false }] }));
    setChecklistInput('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Assign Tasks</h1>
          <p className="text-slate-400 mt-1">Create and assign production tasks to employees</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <FiX /> : <FiPlus />} {showForm ? 'Cancel' : 'Assign Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card border-red-500/20 space-y-4">
          <h2 className="text-white font-semibold">Create New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="label">Task Title *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="label">Task Type</label>
              <select className="input" value={form.taskType} onChange={e => setForm({ ...form, taskType: e.target.value })}>
                {['Production', 'QC', 'Packaging', 'Dispatch', 'Maintenance', 'Documentation', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Due Date</label><input type="date" className="input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
            <div><label className="label">Related Batch</label>
              <select className="input" value={form.relatedBatch} onChange={e => setForm({ ...form, relatedBatch: e.target.value })}>
                <option value="">None</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.batchId} – {b.batteryName}</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><label className="label">Assign To (employees)</label>
              <select multiple className="input h-28" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: [...e.target.selectedOptions].map(o => o.value) })}>
                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} – {emp.department}</option>)}
              </select>
              <p className="text-slate-500 text-xs mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
            <div className="md:col-span-2"><label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="md:col-span-2">
              <label className="label">Checklist Items</label>
              <div className="flex gap-2 mb-2">
                <input className="input flex-1 py-2" placeholder="Add checklist item..." value={checklistInput} onChange={e => setChecklistInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklist(); } }} />
                <button type="button" onClick={addChecklist} className="btn-secondary px-4">Add</button>
              </div>
              {form.checklist.map((c, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 text-sm text-slate-400">
                  <FiCheckSquare className="w-3 h-3 text-slate-600" />{c.item}
                  <button type="button" onClick={() => setForm(p => ({ ...p, checklist: p.checklist.filter((_, j) => j !== i) }))} className="ml-auto text-red-400 hover:text-red-300"><FiX className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <FiCheckSquare />}
            {saving ? 'Creating...' : 'Create & Assign Task'}
          </button>
        </form>
      )}

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Title</th><th>Type</th><th>Priority</th><th>Assigned To</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t._id}>
                    <td className="text-white font-medium">{t.title}</td>
                    <td className="text-xs text-slate-400">{t.taskType}</td>
                    <td><span className={priorityColors[t.priority] || 'badge-gray'}>{t.priority}</span></td>
                    <td className="text-xs text-slate-400">{t.assignedTo?.map(e => e.name).join(', ') || '—'}</td>
                    <td className="text-xs text-slate-400">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className={statusColors[t.status] || 'badge-gray'}>{t.status}</span></td>
                    <td>
                      <button onClick={() => deleteTask(t._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
