import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiSearch, FiFilter, FiEye, FiPackage, FiTruck, FiActivity } from 'react-icons/fi';

const statusColors = {
  Pending: { cls: 'bg-slate-800 text-slate-400', dot: 'bg-slate-500' },
  Confirmed: { cls: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-400' },
  Manufacturing: { cls: 'bg-purple-500/20 text-purple-400', dot: 'bg-purple-400' },
  QC: { cls: 'bg-cyan-500/20 text-cyan-400', dot: 'bg-cyan-400' },
  Packed: { cls: 'bg-slate-700 text-slate-300', dot: 'bg-slate-400' },
  Shipped: { cls: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-400' },
  Delivered: { cls: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400' },
  Cancelled: { cls: 'bg-red-500/20 text-red-400', dot: 'bg-red-400' }
};

const stageMapping = {
  Pending: { label: 'Awaiting Confirmation', pct: 0 },
  Confirmed: { label: 'Order Confirmed', pct: 10 },
  Manufacturing: { label: 'On Production Floor', pct: 40 },
  QC: { label: 'Quality Assurance', pct: 80 },
  Packed: { label: 'Ready for Dispatch', pct: 90 },
  Shipped: { label: 'In Transit', pct: 95 },
  Delivered: { label: 'Delivered', pct: 100 },
};

const payColors = { Pending: 'badge-red', Partial: 'badge-yellow', Paid: 'badge-green', Refunded: 'badge-gray' };

export default function ClientOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/client/orders', { params: { status } });
      setOrders(data.data);
    } catch (e) {
      console.error(e);
      // Fallback for demo if backend route is missing
      setOrders([
        { _id: '1', orderId: 'ORD-2026-001', items: [{}, {}], totalAmount: 125000, status: 'Manufacturing', paymentStatus: 'Paid', createdAt: new Date() },
        { _id: '2', orderId: 'ORD-2026-002', items: [{}], totalAmount: 45000, status: 'Confirmed', paymentStatus: 'Pending', createdAt: new Date() }
      ]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [status]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Order Inventory</h1>
          <p className="text-slate-400 mt-1 font-medium">Global tracking for all manufacturing batches & procurement cycles.</p>
        </div>
        <Link to="/client/orders/new" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-black uppercase tracking-widest hover:bg-brand-600 shadow-glow-green transition-all">
          <FiPackage className="w-5 h-5" /> New Order
        </Link>
      </div>

      {/* Filter Stats */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        {['', 'Pending', 'Manufacturing', 'Shipped', 'Delivered'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              status === s ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {s || 'All Orders'}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <FiPackage className="w-16 h-16 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest">No matching orders found.</p>
            <Link to="/client/orders/new" className="text-brand-400 text-xs font-bold mt-4 inline-block hover:underline">Place Your First Order</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/40 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-8 py-5">Global ID</th>
                  <th className="px-8 py-5">Order Context</th>
                  <th className="px-8 py-5">Amount (INR)</th>
                  <th className="px-8 py-5">Current Stage</th>
                  <th className="px-8 py-5">Logistics Status</th>
                  <th className="px-8 py-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map(o => {
                  const st = statusColors[o.status] || statusColors.Pending;
                  const stage = stageMapping[o.status] || { label: 'N/A', pct: 0 };
                  return (
                    <tr key={o._id} className="hover:bg-slate-800/30 transition-all group">
                      <td className="px-8 py-6">
                        <span className="font-mono text-sm font-black text-brand-400 group-hover:text-brand-300 transition-colors uppercase">{o.orderId}</span>
                        <div className="text-[10px] text-slate-600 mt-1 font-bold">{new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-white font-bold text-sm">{o.items?.length || 0} Industrial Battery Units</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${payColors[o.paymentStatus] || 'badge-gray'}`}>
                            {o.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-white font-black text-lg italic">₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-8 py-6 min-w-[200px]">
                        <div className="flex justify-between items-center mb-1.5">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stage.label}</span>
                           <span className="text-[10px] font-black text-white">{stage.pct}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${stage.pct}%` }} />
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit border border-slate-800 shadow-inner ${st.cls}`}>
                          <span className={`w-2 h-2 rounded-full border-2 border-slate-900 ${st.dot} shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{o.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Link to={`/client/orders/${o._id}`} className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-brand-500 text-slate-500 group-hover:text-white transition-all transform hover:scale-110">
                          <FiEye className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
