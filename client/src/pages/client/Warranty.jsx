import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiShield, FiX } from 'react-icons/fi';

const statusColors = { Submitted: 'badge-yellow', UnderReview: 'badge-blue', Approved: 'badge-green', Rejected: 'badge-red', InService: 'badge-purple', Resolved: 'badge-green' };

export default function Warranty() {
  const [claims, setClaims] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ order: '', issueType: '', issueDescription: '', issueDate: '', batchId: '' });

  const issueTypes = ['Capacity Degradation', 'Physical Damage', 'Charging Issue', 'BMS Fault', 'Overheating', 'Short Circuit', 'Other'];

  useEffect(() => {
    Promise.all([
      api.get('/client/warranty-claims'),
      api.get('/client/orders')
    ]).then(([c, o]) => {
      setClaims(c.data.data);
      setOrders(o.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/client/warranty-claims', form);
      setClaims(prev => [data.data, ...prev]);
      toast.success('Warranty claim submitted!');
      setShowForm(false);
      setForm({ order: '', issueType: '', issueDescription: '', issueDate: '', batchId: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Warranty Claims</h1>
          <p className="text-slate-400 mt-1">Submit and track battery warranty issues</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <FiX /> : <FiPlus />} {showForm ? 'Cancel' : 'New Claim'}
        </button>
      </div>

      {/* New Claim Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 border-brand-500/30">
          <h2 className="text-white font-semibold">Submit Warranty Claim</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Related Order</label>
              <select className="input" value={form.order} onChange={e => setForm({ ...form, order: e.target.value })}>
                <option value="">Select order (optional)</option>
                {orders.map(o => <option key={o._id} value={o._id}>{o.orderId}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Issue Type *</label>
              <select className="input" value={form.issueType} onChange={e => setForm({ ...form, issueType: e.target.value })} required>
                <option value="">Select issue type</option>
                {issueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Issue Date *</label>
              <input type="date" className="input" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} required max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">Batch ID (if known)</label>
              <input className="input" placeholder="SI-BATCH-2024-0001" value={form.batchId} onChange={e => setForm({ ...form, batchId: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Issue Description *</label>
            <textarea className="input resize-none" rows={3} placeholder="Describe the issue in detail..." value={form.issueDescription} onChange={e => setForm({ ...form, issueDescription: e.target.value })} required />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <FiShield />}
            {submitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </form>
      )}

      {/* Claims List */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : claims.length === 0 ? (
          <div className="text-center py-12">
            <FiShield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No warranty claims submitted.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map(c => (
              <div key={c._id} className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-brand-500/30 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div>
                    <span className="font-mono text-xs text-brand-400 font-bold">{c.claimId}</span>
                    <h3 className="text-white font-semibold mt-0.5">{c.issueType}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className={statusColors[c.status] || 'badge-gray'}>{c.status}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-2">{c.issueDescription}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Issue on: {new Date(c.issueDate).toLocaleDateString('en-IN')}</span>
                  <span>Filed: {new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                  {c.resolution && c.resolution !== 'Pending' && <span className="text-brand-400">Resolution: {c.resolution}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
