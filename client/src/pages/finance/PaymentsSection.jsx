import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiDollarSign, FiSearch, FiFilter, FiCheckCircle,
  FiClock, FiXCircle, FiArrowUpRight, FiArrowDownRight,
  FiChevronLeft, FiChevronRight, FiPlus
} from 'react-icons/fi';

const STATUS_COLORS = {
  Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

export default function PaymentsSection() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ direction: 'Incoming', amount: '', description: '', paymentMethod: 'Bank Transfer', notes: '' });
  const role = user?.role;

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      if (directionFilter) params.direction = directionFilter;
      const res = await api.get('/finance/payments', { params });
      setPayments(res.data.data);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, directionFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/payments', {
        ...form,
        amount: Number(form.amount),
        status: 'Pending',
        category: form.direction === 'Incoming' ? 'Client Payment' : 'Other'
      });
      toast.success('Payment recorded!');
      setShowCreate(false);
      setForm({ direction: 'Incoming', amount: '', description: '', paymentMethod: 'Bank Transfer', notes: '' });
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payment.');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/finance/payments/${id}/status`, { status: newStatus });
      toast.success(`Payment ${newStatus}.`);
      fetchPayments();
    } catch (err) {
      toast.error('Failed to update payment.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Payments</h2>
          <p className="text-slate-400 text-sm mt-1">Track all incoming and outgoing payments</p>
        </div>
        {(role === 'admin' || role === 'manager') && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
          >
            <FiPlus className="w-4 h-4" /> Record Payment
          </button>
        )}
      </div>

      {/* Create Payment Modal */}
      {showCreate && (
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">New Payment</h3>
          <form onSubmit={handleCreatePayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none">
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
            </select>
            <input type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none" required />
            <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none md:col-span-2" required />
            <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none">
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Razorpay">Razorpay</option>
            </select>
            <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none" />
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:text-white hover:bg-slate-800 transition-all">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all">Save Payment</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 text-xs font-bold uppercase tracking-widest focus:border-emerald-500 outline-none">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
          <option value="Processing">Processing</option>
        </select>
        <select value={directionFilter} onChange={e => { setDirectionFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 text-xs font-bold uppercase tracking-widest focus:border-emerald-500 outline-none">
          <option value="">All Direction</option>
          <option value="Incoming">Incoming</option>
          <option value="Outgoing">Outgoing</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-16 text-center">
            <FiDollarSign className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/30">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Direction</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Method</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  {(role === 'admin' || role === 'manager') && (
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{p.transactionId}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 text-xs font-bold ${p.direction === 'Incoming' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.direction === 'Incoming' ? <FiArrowDownRight className="w-3.5 h-3.5" /> : <FiArrowUpRight className="w-3.5 h-3.5" />}
                        {p.direction}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-medium truncate max-w-[200px]">{p.description}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.user?.name || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">{p.paymentMethod || '—'}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-white">₹{p.amount?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[p.status] || STATUS_COLORS.Pending}`}>
                        {p.status}
                      </span>
                    </td>
                    {(role === 'admin' || role === 'manager') && (
                      <td className="px-6 py-4 text-center">
                        {p.status === 'Pending' && (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleStatusUpdate(p._id, 'Completed')}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Approve">
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleStatusUpdate(p._id, 'Failed')}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Reject">
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
