import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FiFileText, FiPlus, FiCheckCircle, FiClock, FiAlertTriangle,
  FiDownload, FiCreditCard, FiX, FiChevronLeft, FiChevronRight, FiTrash2
} from 'react-icons/fi';

const STATUS_MAP = {
  Paid: { icon: FiCheckCircle, class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  Pending: { icon: FiClock, class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  Overdue: { icon: FiAlertTriangle, class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  Cancelled: { icon: FiX, class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  PartiallyPaid: { icon: FiCreditCard, class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
};

export default function InvoicesSection() {
  const { user } = useAuth();
  const role = user?.role;
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client: '', projectTitle: '', dueDate: '', taxRate: 18, discount: 0, notes: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0 }]
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/finance/invoices', { params });
      setInvoices(res.data.data);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { 
    fetchInvoices(); 

    // Handle real-time updates
    socket.on('invoice_created', (newInv) => {
      // Refresh current page if it's the first page
      if (page === 1) {
        setInvoices(prev => [newInv, ...prev.slice(0, 14)]);
      }
      toast.success(`New Invoice: ${newInv.invoiceNumber}`);
    });

    socket.on('invoice_updated', (updatedInv) => {
      setInvoices(prev => prev.map(inv => inv._id === updatedInv._id ? updatedInv : inv));
    });

    socket.on('invoice_deleted', (id) => {
      setInvoices(prev => prev.filter(inv => inv._id !== id));
    });

    return () => {
      socket.off('invoice_created');
      socket.off('invoice_updated');
      socket.off('invoice_deleted');
    };
  }, [fetchInvoices, page]);

  // Load clients list for invoice creation form
  useEffect(() => {
    if (role === 'admin' || role === 'manager') {
      api.get(role === 'admin' ? '/admin/users?role=client&limit=100' : '/manager/clients')
        .then(r => setClients(r.data.data || []))
        .catch(() => {});
    }
  }, [role]);

  const addLineItem = () => {
    setForm({ ...form, lineItems: [...form.lineItems, { description: '', quantity: 1, unitPrice: 0 }] });
  };

  const removeLineItem = (idx) => {
    if (form.lineItems.length <= 1) return;
    setForm({ ...form, lineItems: form.lineItems.filter((_, i) => i !== idx) });
  };

  const updateLineItem = (idx, field, value) => {
    const items = [...form.lineItems];
    items[idx] = { ...items[idx], [field]: field === 'description' ? value : Number(value) };
    setForm({ ...form, lineItems: items });
  };

  const calcSubtotal = () => form.lineItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const calcTax = () => Math.round(calcSubtotal() * (form.taxRate / 100));
  const calcTotal = () => calcSubtotal() + calcTax() - (Number(form.discount) || 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/invoices', form);
      toast.success('Invoice created!');
      setShowCreate(false);
      setForm({ client: '', projectTitle: '', dueDate: '', taxRate: 18, discount: 0, notes: '', lineItems: [{ description: '', quantity: 1, unitPrice: 0 }] });
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice.');
    }
  };

  const handlePay = async (invoiceId) => {
    try {
      await api.post(`/finance/invoices/${invoiceId}/pay`, { paymentMethod: 'Online' });
      toast.success('Payment successful!');
      fetchInvoices();
    } catch (err) {
      toast.error('Payment failed.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Invoices</h2>
          <p className="text-slate-400 text-sm mt-1">
            {role === 'client' ? 'View and pay your invoices' : 'Create and manage client invoices'}
          </p>
        </div>
        {(role === 'admin' || role === 'manager') && (
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            <FiPlus className="w-4 h-4" /> Create Invoice
          </button>
        )}
      </div>

      {/* Create Invoice Form */}
      {showCreate && (
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">New Invoice</h3>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} required
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none">
                <option value="">Select Client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
              </select>
              <input type="text" placeholder="Project Title" value={form.projectTitle} onChange={e => setForm({ ...form, projectTitle: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" required />
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none" required />
              <div className="flex gap-3">
                <input type="number" placeholder="Tax %" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: Number(e.target.value) })}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none flex-1" />
                <input type="number" placeholder="Discount ₹" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none flex-1" />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Line Items</h4>
                <button type="button" onClick={addLineItem} className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                  <FiPlus className="w-3 h-3" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {form.lineItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" placeholder="Description" value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none flex-1" required />
                    <input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', e.target.value)} min="1"
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none w-20" required />
                    <input type="number" placeholder="Price ₹" value={item.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)} min="0"
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:border-blue-500 outline-none w-28" required />
                    <span className="text-white text-sm font-bold w-24 text-right">₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</span>
                    <button type="button" onClick={() => removeLineItem(idx)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-slate-800/50 rounded-2xl p-5 space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-xs text-slate-400"><span>Subtotal</span><span className="text-white font-bold">₹{calcSubtotal().toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-xs text-slate-400"><span>Tax ({form.taxRate}%)</span><span className="text-white font-bold">₹{calcTax().toLocaleString('en-IN')}</span></div>
              {form.discount > 0 && <div className="flex justify-between text-xs text-slate-400"><span>Discount</span><span className="text-red-400 font-bold">-₹{Number(form.discount).toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-700"><span className="text-slate-300">Total</span><span className="text-emerald-400">₹{calcTotal().toLocaleString('en-IN')}</span></div>
            </div>

            <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none w-full" rows="2" />

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:text-white transition-all">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all">Create Invoice</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        {['', 'Pending', 'Paid', 'Overdue', 'Cancelled'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
              statusFilter === s ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Invoice Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>
      ) : invoices.length === 0 ? (
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-16 text-center">
          <FiFileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No invoices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {invoices.map(inv => {
            const { icon: StatusIcon, class: statusCls } = STATUS_MAP[inv.status] || STATUS_MAP.Pending;
            return (
              <div key={inv._id} className="bg-[#13161e] border border-slate-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-black text-slate-500 tracking-widest">{inv.invoiceNumber}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusCls}`}>
                    <StatusIcon className="w-3 h-3" /> {inv.status}
                  </span>
                </div>

                <h4 className="text-white font-bold text-sm mb-1 truncate group-hover:text-blue-400 transition-colors">{inv.projectTitle}</h4>
                <p className="text-slate-500 text-xs mb-5">{inv.client?.name || 'Client'} {inv.client?.company ? `— ${inv.client.company}` : ''}</p>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Subtotal</span><span className="text-slate-300">₹{(inv.subtotal || inv.amount)?.toLocaleString('en-IN')}</span></div>
                  {inv.taxAmount > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Tax ({inv.taxRate}%)</span><span className="text-slate-300">₹{inv.taxAmount?.toLocaleString('en-IN')}</span></div>}
                  {inv.discount > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Discount</span><span className="text-red-400">-₹{inv.discount?.toLocaleString('en-IN')}</span></div>}
                  <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-2"><span className="text-slate-300">Total</span><span className="text-white">₹{inv.amount?.toLocaleString('en-IN')}</span></div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-5">
                  <span>Issued: {inv.issueDate ? format(new Date(inv.issueDate), 'dd MMM yyyy') : '—'}</span>
                  <span>Due: {inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : '—'}</span>
                </div>

                <div className="flex gap-2">
                  {role === 'client' && inv.status !== 'Paid' && (
                    <button onClick={() => handlePay(inv._id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all">
                      <FiCreditCard className="w-3.5 h-3.5" /> Pay Now
                    </button>
                  )}
                  <button className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold hover:text-white hover:bg-slate-800 transition-all">
                    <FiDownload className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-all"><FiChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 transition-all"><FiChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
