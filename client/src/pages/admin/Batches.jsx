import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiBox } from 'react-icons/fi';

const statusColors = {
  Scheduled: 'badge-gray', InProduction: 'badge-blue', QCPending: 'badge-yellow',
  QCPassed: 'badge-green', QCFailed: 'badge-red', Packed: 'badge-purple', Dispatched: 'badge-green'
};

export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ battery: '', quantity: '', productionStartDate: '', assignedEmployees: [], notes: '' });

  useEffect(() => {
    Promise.all([
      api.get('/admin/batches'),
      api.get('/batteries'),
      api.get('/admin/users', { params: { role: 'employee' } })
    ]).then(([b, bat, emp]) => {
      setBatches(b.data.data);
      setBatteries(bat.data.data);
      setEmployees(emp.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const sel = batteries.find(b => b._id === form.battery);
      const { data } = await api.post('/admin/batches', { ...form, batteryName: sel?.name, quantity: Number(form.quantity) });
      setBatches(prev => [data.data, ...prev]);
      toast.success(`Batch ${data.data.batchId} created!`);
      setShowForm(false);
      setForm({ battery: '', quantity: '', productionStartDate: '', assignedEmployees: [], notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create batch');
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/admin/batches/${id}`, { status });
      setBatches(prev => prev.map(b => b._id === id ? { ...b, status: data.data.status } : b));
      toast.success('Batch status updated!');
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Battery Batch Logs</h1>
          <p className="text-slate-400 mt-1">Create and manage production batch records</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <FiX /> : <FiPlus />} {showForm ? 'Cancel' : 'New Batch'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card border-red-500/20 space-y-4">
          <h2 className="text-white font-semibold">Create Production Batch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Battery Product *</label>
              <select className="input" value={form.battery} onChange={e => setForm({ ...form, battery: e.target.value })} required>
                <option value="">Select battery</option>
                {batteries.map(b => <option key={b._id} value={b._id}>{b.name} ({b.sku})</option>)}
              </select>
            </div>
            <div><label className="label">Quantity (units) *</label>
              <input type="number" className="input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required min="1" />
            </div>
            <div><label className="label">Production Start Date</label>
              <input type="date" className="input" value={form.productionStartDate} onChange={e => setForm({ ...form, productionStartDate: e.target.value })} />
            </div>
            <div><label className="label">Assign Employees</label>
              <select multiple className="input h-24" value={form.assignedEmployees}
                onChange={e => setForm({ ...form, assignedEmployees: [...e.target.selectedOptions].map(o => o.value) })}>
                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} – {emp.department}</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><label className="label">Notes</label>
              <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <FiBox />}
            {saving ? 'Creating...' : 'Create Batch'}
          </button>
        </form>
      )}

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Batch ID</th><th>Battery</th><th>Qty</th><th>QC Status</th><th>Score</th><th>Assigned To</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b._id}>
                    <td><span className="font-mono text-xs text-red-400 font-bold">{b.batchId}</span></td>
                    <td className="text-white text-sm">{b.batteryName || b.battery?.name}</td>
                    <td className="text-slate-300">{b.quantity}</td>
                    <td><span className={`badge ${b.qcStatus === 'Passed' ? 'badge-green' : b.qcStatus === 'Failed' ? 'badge-red' : 'badge-gray'}`}>{b.qcStatus || 'Pending'}</span></td>
                    <td className={b.qcScore != null ? (b.qcScore >= 80 ? 'text-brand-400 font-bold' : 'text-red-400 font-bold') : 'text-slate-500'}>
                      {b.qcScore != null ? `${b.qcScore}%` : '—'}
                    </td>
                    <td className="text-xs text-slate-400">{b.assignedEmployees?.map(e => e.name).join(', ') || '—'}</td>
                    <td><span className={statusColors[b.status] || 'badge-gray'}>{b.status}</span></td>
                    <td>
                      <select className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                        value={b.status}
                        onChange={e => updateStatus(b._id, e.target.value)}>
                        {['Scheduled', 'InProduction', 'QCPending', 'QCPassed', 'QCFailed', 'Packed', 'Dispatched'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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
