import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FiSearch, FiFilter, FiArrowUpRight, FiArrowDownRight,
  FiChevronLeft, FiChevronRight, FiArrowUp, FiArrowDown, FiActivity
} from 'react-icons/fi';

const TYPE_COLORS = {
  Payment: 'bg-emerald-500/10 text-emerald-400',
  Invoice: 'bg-blue-500/10 text-blue-400',
  Salary: 'bg-purple-500/10 text-purple-400',
  Expense: 'bg-amber-500/10 text-amber-400',
  Refund: 'bg-red-500/10 text-red-400',
  Adjustment: 'bg-slate-500/10 text-slate-400'
};

const STATUS_COLORS = {
  Completed: 'text-emerald-400',
  Pending: 'text-amber-400',
  Failed: 'text-red-400',
  Processing: 'text-blue-400',
  Cancelled: 'text-slate-400'
};

export default function TransactionsSection() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20, sortBy, sortOrder };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (directionFilter) params.direction = directionFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/finance/transactions', { params });
      setTransactions(res.data.data);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter, directionFilter, sortBy, sortOrder, startDate, endDate]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Transactions Ledger</h2>
          <p className="text-slate-400 text-sm mt-1">Complete financial transaction history — {total} records</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#13161e] border border-slate-800">
          <FiActivity className="text-emerald-500 w-4 h-4" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-Time Ledger</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-[#13161e] border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search by ID, description, reference..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-emerald-500 outline-none placeholder-slate-500" />
          </div>

          {/* Type filter */}
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs font-bold uppercase tracking-widest focus:border-emerald-500 outline-none">
            <option value="">All Types</option>
            {['Payment', 'Invoice', 'Salary', 'Expense', 'Refund'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs font-bold uppercase tracking-widest focus:border-emerald-500 outline-none">
            <option value="">All Status</option>
            {['Pending', 'Completed', 'Failed', 'Processing'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Direction filter */}
          <select value={directionFilter} onChange={e => { setDirectionFilter(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-300 text-xs font-bold uppercase tracking-widest focus:border-emerald-500 outline-none">
            <option value="">All Directions</option>
            <option value="Incoming">Incoming</option>
            <option value="Outgoing">Outgoing</option>
          </select>

          {/* Date range */}
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:border-emerald-500 outline-none" />
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:border-emerald-500 outline-none" />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center">
            <FiActivity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No transactions match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/30">
                  <th className="px-5 py-4 text-left">
                    <button onClick={() => toggleSort('transactionId')} className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                      ID <SortIcon field="transactionId" />
                    </button>
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                  <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Direction</th>
                  <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                  <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                  <th className="px-5 py-4 text-right">
                    <button onClick={() => toggleSort('amount')} className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors ml-auto">
                      Amount <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="px-5 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-right">
                    <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors ml-auto">
                      Date <SortIcon field="createdAt" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.map(txn => (
                  <tr key={txn._id} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-5 py-4 text-xs font-bold text-slate-400 whitespace-nowrap">{txn.transactionId}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[txn.type] || TYPE_COLORS.Payment}`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1 text-xs font-bold ${txn.direction === 'Incoming' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {txn.direction === 'Incoming' ? <FiArrowDownRight className="w-3.5 h-3.5" /> : <FiArrowUpRight className="w-3.5 h-3.5" />}
                        {txn.direction}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-white max-w-[200px] truncate">{txn.description}</td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-300 font-medium">{txn.user?.name || '—'}</div>
                      <div className="text-[10px] text-slate-600">{txn.user?.email || ''}</div>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-black text-white whitespace-nowrap">
                      ₹{txn.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold ${STATUS_COLORS[txn.status] || 'text-slate-400'}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-slate-500 whitespace-nowrap">
                      {txn.createdAt ? format(new Date(txn.createdAt), 'dd MMM yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <span className="text-xs text-slate-500">Showing page {page} of {totalPages} ({total} total)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                <FiChevronLeft className="w-4 h-4" />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-emerald-600 text-white' : 'border border-slate-700 text-slate-400 hover:text-white'}`}>
                    {p}
                  </button>
                );
              })}
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
