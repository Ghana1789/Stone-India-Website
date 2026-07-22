import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColors = { Pending: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red' };

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/admin/leave-requests').then(r => setLeaves(r.data.data)).finally(() => setLoading(false));
  }, []);

  const updateLeave = async (id, status, reviewNote = '') => {
    setUpdating(id);
    try {
      const { data } = await api.put(`/admin/leave-requests/${id}`, { status, reviewNote });
      setLeaves(prev => prev.map(l => l._id === id ? data.data : l));
      toast.success(`Leave ${status.toLowerCase()}!`);
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  const filtered = filter ? leaves.filter(l => l.status === filter) : leaves;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Leave Requests</h1>
        <p className="text-slate-400 mt-1">Review and approve employee leave applications</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: leaves.filter(l => l.status === 'Pending').length, color: 'text-yellow-400' },
          { label: 'Approved', count: leaves.filter(l => l.status === 'Approved').length, color: 'text-brand-400' },
          { label: 'Rejected', count: leaves.filter(l => l.status === 'Rejected').length, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="card text-center cursor-pointer" onClick={() => setFilter(filter === s.label ? '' : s.label)}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-slate-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10 text-slate-500">No leave requests found.</div>
        ) : filtered.map(l => (
          <div key={l._id} className={`card border transition-all ${
            l.status === 'Approved' ? 'border-brand-500/20 bg-brand-500/5' :
            l.status === 'Rejected' ? 'border-red-500/20 bg-red-500/5' : 'border-slate-700/50'
          }`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-white font-semibold">{l.employee?.name}</span>
                  <span className="text-slate-500 text-xs font-mono">{l.employee?.employeeId}</span>
                  <span className="badge badge-blue text-xs">{l.employee?.department}</span>
                  <span className={statusColors[l.status] || 'badge-gray'}>{l.status}</span>
                </div>
                <div className="text-brand-400 font-semibold">{l.leaveType}</div>
                <div className="text-slate-400 text-sm mt-1">{l.reason}</div>
                <div className="text-slate-500 text-xs mt-2">
                  {new Date(l.fromDate).toLocaleDateString('en-IN')} → {new Date(l.toDate).toLocaleDateString('en-IN')} •{' '}
                  <span className="text-yellow-400 font-semibold">{l.totalDays} days</span>
                </div>
              </div>

              {l.status === 'Pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    disabled={updating === l._id}
                    onClick={() => updateLeave(l._id, 'Approved')}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-50">
                    ✓ Approve
                  </button>
                  <button
                    disabled={updating === l._id}
                    onClick={() => updateLeave(l._id, 'Rejected', 'Not approved at this time')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg font-semibold transition-colors disabled:opacity-50">
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
            {l.reviewNote && (
              <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
                Admin: {l.reviewNote}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
