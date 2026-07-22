import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import { format } from 'date-fns';
import { FiCreditCard, FiDownload, FiCheckCircle, FiClock, FiX, FiPrinter } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get('/client/invoices');
      setInvoices(r.data.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();

    // Socket listeners for real-time updates
    socket.on('invoice_created', (newInv) => {
      // Re-fetch to ensure data integrity and filters
      fetchInvoices();
      toast.success(`New Invoice: ${newInv.invoiceNumber}`, { icon: '📄' });
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

  const handleDownload = (inv) => {
    setSelected(inv);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handlePay = async (invoiceId, amount) => {
    // Simulated Razorpay flow based on the approved plan mock integration
    toast.loading('Initializing secure payment...', { duration: 2000 });
    
    setTimeout(async () => {
      try {
        await api.post(`/client/invoices/${invoiceId}/pay`, { paymentId: 'pay_live_' + Math.random().toString(36).substr(2, 9) });
        toast.success('Payment confirmed! Your invoice is now marked as Paid.');
      } catch (err) {
        toast.error('Payment failed. Please try again or contact support.');
      }
    }, 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10 font-sans">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; padding: 40px !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="flex flex-wrap gap-4 items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Invoices & Billing</h1>
          <p className="text-slate-400 text-sm">View, download, and pay your pending invoices.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        {invoices.length === 0 ? (
           <div className="text-center py-12 text-slate-500">
             <FiCreditCard className="w-12 h-12 opacity-20 mx-auto mb-4" />
             <p>No invoices found.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Invoice No.</th>
                  <th className="p-4 font-semibold">Project</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Issue Date</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-sm font-bold text-white tracking-tight">{inv.invoiceNumber}</td>
                    <td className="p-4 text-xs text-slate-300">{inv.projectTitle}</td>
                    <td className="p-4 text-sm font-bold text-white">₹{inv.amount?.toLocaleString()}</td>
                    <td className="p-4 text-xs text-slate-400">{format(new Date(inv.issueDate), 'dd MMM yyyy')}</td>
                    <td className="p-4 text-xs text-slate-400">{format(new Date(inv.dueDate), 'dd MMM yyyy')}</td>
                    <td className="p-4">
                      {inv.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                          <FiCheckCircle className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          <FiClock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                       <button 
                         onClick={() => handleDownload(inv)}
                         className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded hover:bg-slate-700 transition-colors" title="Download PDF"
                       >
                         <FiDownload className="w-4 h-4" />
                       </button>
                       {inv.status !== 'Paid' && (
                         <button 
                           onClick={() => handlePay(inv._id, inv.amount)}
                           className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded shadow-lg shadow-brand-500/20 transition-all"
                         >
                           Pay Now
                         </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail & Print Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 overflow-y-auto py-8 no-print">
          <div className="bg-[#13161e] border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-slate-800/20">
              <div>
                <h3 className="text-white font-black text-xl italic uppercase tracking-tighter flex items-center gap-2">
                  <FiFileText className="text-brand-500" /> {selected.invoiceNumber}
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
                  <p className="text-sm font-bold text-slate-900">{selected.client?.name || 'Customer'}</p>
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
                        <td className="px-4 py-3 text-slate-700 font-medium">{selected.projectTitle}</td>
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
                    <span>Tax (GST {selected.taxRate || 18}%)</span>
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
              <button onClick={() => window.print()} className="flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all">
                <FiPrinter className="w-4 h-4" /> Print / Save as PDF
              </button>
              <button onClick={() => setSelected(null)} className="px-6 py-4 rounded-2xl border border-slate-800 text-slate-500 font-bold hover:text-white transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
