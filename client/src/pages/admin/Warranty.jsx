import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiBox } from 'react-icons/fi';

const statusColors = { Submitted: 'badge-yellow', UnderReview: 'badge-blue', Approved: 'badge-green', Rejected: 'badge-red', InService: 'badge-purple', Resolved: 'badge-green' };
const resolutions = ['Pending', 'Replacement', 'Repair', 'Refund', 'Rejected'];

export default function AdminWarranty() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/admin/warranty-claims').then(r => setClaims(r.data.data)).finally(() => setLoading(false));
  }, []);

  const updateClaim = async (id, updates) => {
    setUpdating(id);
    try {
      const { data } = await api.put(`/admin/warranty-claims/${id}`, updates);
      setClaims(prev => prev.map(c => c._id === id ? data.data : c));
      toast.success('Warranty claim updated!');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Warranty Claims</h1>
        <p className="text-slate-400 mt-1">Review and resolve client warranty submissions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Submitted', 'UnderReview', 'Approved', 'Resolved'].map(s => (
          <div key={s} className="card text-center">
            <div className="text-2xl font-bold text-white">{claims.filter(c => c.status === s).length}</div>
            <div className="text-slate-400 text-xs mt-1">{s}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : claims.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-500">No warranty claims yet.</p>
          </div>
        ) : claims.map(c => (
          <div key={c._id} className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-red-400 font-bold">{c.claimId}</span>
                  <span className={statusColors[c.status] || 'badge-gray'}>{c.status}</span>
                </div>
                <h3 className="text-white font-semibold">{c.issueType}</h3>
                <div className="flex gap-3 text-xs text-slate-400 mt-1">
                  <span>Client: <span className="text-white">{c.client?.name}</span></span>
                  {c.order && <span>Order: <span className="text-brand-400">{c.order.orderId}</span></span>}
                  <span>Filed: {new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-4">{c.issueDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">Update Status</label>
                <select className="input py-2 text-sm" value={c.status}
                  disabled={updating === c._id}
                  onChange={e => updateClaim(c._id, { status: e.target.value })}>
                  {['Submitted', 'UnderReview', 'Approved', 'Rejected', 'InService', 'Resolved'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Resolution</label>
                <select className="input py-2 text-sm" value={c.resolution || 'Pending'}
                  disabled={updating === c._id}
                  onChange={e => updateClaim(c._id, { resolution: e.target.value })}>
                  {resolutions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Admin Notes</label>
                <input className="input py-2 text-sm" placeholder="Add review note..." defaultValue={c.reviewNotes || ''}
                  onBlur={e => { if (e.target.value !== c.reviewNotes) updateClaim(c._id, { reviewNotes: e.target.value }); }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
