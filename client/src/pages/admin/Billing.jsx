import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';
import {
  FiDollarSign, FiFileText, FiSearch, FiRefreshCw, FiDownload,
  FiCheckCircle, FiClock, FiAlertTriangle, FiFilter, FiEye, FiX,
  FiPlus, FiTrash2, FiEdit2, FiPrinter
} from 'react-icons/fi';

const STATUS_STYLES = {
  Paid:     { cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', dot: '#22c55e' },
  Pending:  { cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', dot: '#f59e0b' },
  Overdue:  { cls: 'bg-red-500/20 text-red-400 border border-red-500/30', dot: '#ef4444' },
  Draft:    { cls: 'bg-slate-700 text-slate-400 border border-slate-600', dot: '#6b7280' },
  Cancelled:{ cls: 'bg-slate-800 text-slate-500 border border-slate-700', dot: '#374151' },
};

export default function AdminBilling() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [showPrintView, setShowPrintView] = useState(false);
  const printRef = useRef();

  const [newInvoice, setNewInvoice] = useState({
    client: '',
    projectTitle: '',
    description: '',
    dueDate: '',
    taxRate: 18,
    discount: 0,
    notes: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0 }]
  });
  const [creating, setCreating] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/billing');
      setInvoices(r.data.data || []);
    } catch (e) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = async () => {
    try {
      const r = await api.get('/admin/users', { params: { role: 'client', isActive: 'true' } });
      setClients(r.data.data || []);
    } catch (e) {
      console.error('Failed to fetch clients', e);
    }
  };

  useEffect(() => { 
    fetchInvoices(); 
    fetchClients();

    // Socket.io Real-time Listeners
    socket.on('invoice_created', (newInv) => {
      setInvoices(prev => [newInv, ...prev]);
      toast.success(`New Invoice Created: ${newInv.invoiceNumber}`, { id: newInv._id });
    });

    socket.on('invoice_updated', (updatedInv) => {
      setInvoices(prev => prev.map(inv => inv._id === updatedInv._id ? updatedInv : inv));
      if (selected?._id === updatedInv._id) setSelected(updatedInv);
    });

    socket.on('invoice_deleted', (id) => {
      setInvoices(prev => prev.filter(inv => inv._id !== id));
      if (selected?._id === id) setSelected(null);
    });

    return () => {
      socket.off('invoice_created');
      socket.off('invoice_updated');
      socket.off('invoice_deleted');
    };
  }, [fetchInvoices, selected?._id]);

  const addLineItem = () => {
    setNewInvoice({ ...newInvoice, lineItems: [...newInvoice.lineItems, { description: '', quantity: 1, unitPrice: 0 }] });
  };

  const removeLineItem = (idx) => {
    if (newInvoice.lineItems.length <= 1) return;
    setNewInvoice({ ...newInvoice, lineItems: newInvoice.lineItems.filter((_, i) => i !== idx) });
  };

  const updateLineItem = (idx, field, value) => {
    const items = [...newInvoice.lineItems];
    items[idx] = { ...items[idx], [field]: field === 'description' ? value : Number(value) };
    setNewInvoice({ ...newInvoice, lineItems: items });
  };

  const calcSubtotal = () => newInvoice.lineItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const calcTax = () => Math.round(calcSubtotal() * (newInvoice.taxRate / 100));
  const calcTotal = () => calcSubtotal() + calcTax() - (Number(newInvoice.discount) || 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...newInvoice,
        amount: calcTotal() // Ensure subtotal/tax matches
      };
      await api.post('/admin/billing', payload);
      toast.success('Invoice created successfully');
      setShowAddModal(false);
      setNewInvoice({ client: '', projectTitle: '', description: '', dueDate: '', taxRate: 18, discount: 0, notes: '', lineItems: [{ description: '', quantity: 1, unitPrice: 0 }] });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/billing/${id}`, { status });
      toast.success(`Invoice marked as ${status}`);
    } catch (e) {
      toast.error('Failed to update invoice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/admin/billing/${id}`);
      toast.success('Invoice deleted');
    } catch (e) {
      toast.error('Failed to delete invoice');
    }
  };

  const filtered = invoices.filter(inv =>
    (!search || inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || inv.client?.name?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || inv.status === statusFilter)
  );

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((a, i) => a + (i.amount || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((a, i) => a + (i.amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((a, i) => a + (i.amount || 0), 0);

  const fmt = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${(n / 1000).toFixed(1)}K`;
  const fmtFull = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const exportCSV = () => {
    const rows = [['Invoice #', 'Client', 'Amount', 'Status', 'Due Date']];
    filtered.forEach(inv => {
      rows.push([inv.invoiceNumber, inv.client?.name, inv.amount, inv.status, new Date(inv.dueDate).toLocaleDateString('en-IN')]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'invoices.csv'; a.click();
    toast.success('CSV downloaded!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; padding: 40px !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Billing & Invoices</h1>
          <p className="text-slate-400 mt-1 font-medium">Client invoicing · payment tracking · revenue overview</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all shadow-lg shadow-red-900/20">
            <FiPlus className="w-4 h-4" /> Create Invoice
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all">
            <FiDownload className="w-4 h-4" /> Export
          </button>
          <button onClick={fetchInvoices} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-bold transition-all">
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Total Collected', value: fmt(totalRevenue), icon: FiCheckCircle, color: 'emerald', sub: `${invoices.filter(i => i.status === 'Paid').length} invoices paid` },
          { label: 'Pending Amount', value: fmt(totalPending), icon: FiClock, color: 'yellow', sub: `${invoices.filter(i => i.status === 'Pending').length} awaiting payment` },
          { label: 'Overdue', value: fmt(totalOverdue), icon: FiAlertTriangle, color: 'red', sub: `${invoices.filter(i => i.status === 'Overdue').length} overdue invoices` },
          { label: 'Total Invoices', value: invoices.length, icon: FiFileText, color: 'blue', sub: `${invoices.filter(i => i.status === 'Draft').length} drafts` },
        ].map(card => (
          <div key={card.label} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className={`p-2.5 rounded-xl bg-${card.color}-500/10 w-fit mb-3`}>
              <card.icon className={`w-5 h-5 text-${card.color}-500`} />
            </div>
            <div className={`text-2xl font-black italic text-${card.color}-400`}>{card.value}</div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{card.label}</div>
            <div className="text-slate-600 text-[10px] mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Paid', 'Pending', 'Overdue', 'Draft', 'Cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input className="w-full bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-500/50"
          placeholder="Search invoice number or client name..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Invoice Table */}
      <div className="bg-[#13161e] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30">
                {['Invoice #', 'Client', 'Amount', 'Status', 'Due Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No invoices found</td></tr>
              ) : filtered.map(inv => {
                const st = STATUS_STYLES[inv.status] || STATUS_STYLES.Draft;
                const isOverdue = inv.status === 'Overdue';
                return (
                  <tr key={inv._id} className={`hover:bg-slate-800/20 transition-all ${isOverdue ? 'bg-red-500/5' : ''}`}>
                    <td className="px-5 py-4 text-white font-bold text-sm font-mono">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4">
                      <div className="text-white text-sm font-semibold">{inv.client?.name}</div>
                      <div className="text-slate-500 text-xs">{inv.client?.email || inv.client?.company}</div>
                    </td>
                    <td className="px-5 py-4 text-white font-black text-sm">{fmtFull(inv.amount)}</td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${st.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: st.dot }} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'}>
                        {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(inv)} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all" title="View Details">
                          <FiEye className="w-4 h-4" />
                        </button>
                        <select 
                          className="bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded-lg px-2 py-1 outline-none border border-transparent focus:border-red-500/50"
                          value={inv.status}
                          onChange={(e) => handleUpdateStatus(inv._id, e.target.value)}
                        >
                          {['Paid', 'Pending', 'Overdue', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => handleDelete(inv._id)} className="p-2 rounded-lg bg-slate-800 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail & Print Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 overflow-y-auto py-8 no-print">
          <div className="bg-[#13161e] border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-slate-800/20">
              <div>
                <h3 className="text-white font-black text-xl italic uppercase tracking-tighter flex items-center gap-2">
                  <FiFileText className="text-red-500" /> {selected.invoiceNumber}
                </h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Generated on {new Date(selected.createdAt).toDateString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white transition-all"><FiX className="w-6 h-6" /></button>
            </div>

            <div className="print-content bg-white p-8 md:p-12 space-y-8">
              <div className="flex justify-between items-start border-b border-slate-100 pb-8">
                <div className="space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 uppercase italic">STONE INDIA PVT LTD</h1>
                  <p className="text-xs text-slate-500 font-medium">LFP Battery Manufacturing & Systems</p>
                  <p className="text-[10px] text-slate-400">GSTIN: 09AAACS9876Z1Z0</p>
                </div>
                <div className="text-right space-y-1">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Client Bill To</h4>
                  <p className="text-sm font-bold text-slate-900">{selected.client?.name}</p>
                  <p className="text-xs text-slate-500">{selected.client?.company || 'Authorized Representative'}</p>
                  <p className="text-[10px] text-slate-400">{selected.client?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-xs">
                <div>
                  <h4 className="font-black text-slate-400 uppercase tracking-widest mb-2">Subject</h4>
                  <p className="text-slate-700 font-bold text-sm uppercase italic">{selected.projectTitle || 'Project Implementation'}</p>
                  <p className="text-slate-500 mt-1">{selected.description}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</h4>
                  <p className={`text-sm font-black ${selected.status === 'Overdue' ? 'text-red-600' : 'text-slate-900'}`}>{new Date(selected.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] font-black uppercase text-emerald-600 mt-1">{selected.status}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-slate-400">Description</th>
                      <th className="px-4 py-3 text-center font-black uppercase tracking-widest text-slate-400">Qty</th>
                      <th className="px-4 py-3 text-right font-black uppercase tracking-widest text-slate-400">Rate</th>
                      <th className="px-4 py-3 text-right font-black uppercase tracking-widest text-slate-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selected.lineItems?.length > 0 ? selected.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-slate-700 font-medium">{item.description}</td>
                        <td className="px-4 py-3 text-center text-slate-500 font-mono">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-500 font-mono">₹{item.unitPrice?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-slate-900 font-black">₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-4 py-3 text-slate-700 font-medium">{selected.description}</td>
                        <td className="px-4 py-3 text-center text-slate-500 font-mono">1</td>
                        <td className="px-4 py-3 text-right text-slate-500 font-mono">₹{selected.amount?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-slate-900 font-black">₹{selected.amount?.toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4">
                <div className="w-full max-w-[240px] space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{(selected.subtotal || selected.amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Tax (GST {selected.taxRate}%)</span>
                    <span>₹{selected.taxAmount?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  {selected.discount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-red-500">
                      <span>Discount</span>
                      <span>-₹{selected.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-100 pt-3">
                    <span className="italic uppercase tracking-tighter">Total</span>
                    <span className="text-red-600">₹{selected.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8 mt-12">
                <p className="text-[10px] font-medium text-slate-400 italic">This is a system-generated invoice. No signature is required.</p>
              </div>
            </div>

            <div className="px-8 pb-8 flex gap-3 no-print">
              <button onClick={handlePrint} className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all">
                <FiPrinter className="w-4 h-4" /> Print / Save as PDF
              </button>
              <button onClick={() => setSelected(null)} className="px-6 py-4 rounded-2xl border border-slate-800 text-slate-500 font-bold hover:text-white transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 overflow-y-auto py-8">
          <div className="bg-[#13161e] border border-slate-700 rounded-[2.5rem] w-full max-w-2xl my-8 shadow-2xl animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-slate-800/10">
              <h3 className="text-white font-black text-xl uppercase italic tracking-tighter">Create Professional Invoice</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-all"><FiX className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Client Selection</label>
                  <select 
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-medium focus:outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer"
                    value={newInvoice.client}
                    onChange={e => setNewInvoice({...newInvoice, client: e.target.value})}
                  >
                    <option value="">Choose a client...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
                  <input 
                    required type="date"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-mono focus:outline-none focus:border-red-500/50"
                    value={newInvoice.dueDate}
                    onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project / Contract Title</label>
                <input 
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-medium focus:outline-none focus:border-red-500/50"
                  placeholder="e.g. Phase 2 - LFP Battery Integration"
                  value={newInvoice.projectTitle}
                  onChange={e => setNewInvoice({...newInvoice, projectTitle: e.target.value})}
                />
              </div>

              {/* Line Items UI */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing & Items</label>
                  <button type="button" onClick={addLineItem} className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <FiPlus /> Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {newInvoice.lineItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center group">
                      <input 
                        required placeholder="Item Description"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500/50"
                        value={item.description}
                        onChange={e => updateLineItem(idx, 'description', e.target.value)}
                      />
                      <input 
                        required type="number" placeholder="Qty"
                        className="w-20 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono text-center focus:border-red-500/50"
                        value={item.quantity}
                        onChange={e => updateLineItem(idx, 'quantity', e.target.value)}
                      />
                      <input 
                        required type="number" placeholder="Rate"
                        className="w-32 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-red-500/50"
                        value={item.unitPrice}
                        onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)}
                      />
                      <button type="button" onClick={() => removeLineItem(idx)} className="p-2 text-slate-600 hover:text-red-500 group-hover:block transition-all">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GST Rate (%)</label>
                  <input type="number" value={newInvoice.taxRate} onChange={e => setNewInvoice({...newInvoice, taxRate: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Flat Discount (₹)</label>
                  <input type="number" value={newInvoice.discount} onChange={e => setNewInvoice({...newInvoice, discount: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white text-sm font-mono" />
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{calcSubtotal().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Tax Amount</span>
                  <span>₹{calcTax().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white border-t border-slate-800 pt-3">
                  <span className="italic uppercase tracking-tight">Net Amount Payable</span>
                  <span className="text-red-500">₹{calcTotal().toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-sm uppercase italic tracking-[0.2em] disabled:opacity-50 transition-all shadow-xl shadow-red-900/20"
              >
                {creating ? 'Processing Transaction...' : 'Generate Live Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
