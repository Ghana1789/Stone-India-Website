import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiEdit2, FiEye } from 'react-icons/fi';

const statusColors = {
  Pending: 'badge-yellow', Confirmed: 'badge-blue', Manufacturing: 'badge-purple',
  QC: 'badge-blue', Packed: 'badge-gray', Shipped: 'badge-purple', Delivered: 'badge-green', Cancelled: 'badge-red'
};
const payColors = { Pending: 'badge-red', Partial: 'badge-yellow', Paid: 'badge-green', Refunded: 'badge-gray' };

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Manufacturing', 'QC', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders', { params: { status: statusFilter, search } });
      setOrders(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, search]);

  const updateStatus = async (id, status, message) => {
    setUpdating(id);
    try {
      const { data } = await api.put(`/admin/orders/${id}/status`, { status, message });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: data.data.status } : o));
      toast.success('Order status updated!');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">All Orders</h1>
        <p className="text-slate-400 mt-1">Manage and track all client orders</p>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-2">
        {['', ...ORDER_STATUSES].map(s => {
          const count = s ? orders.filter(o => o.status === s).length : orders.length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === s ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}>
              {s || 'All'} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input className="input pl-11" placeholder="Search order ID..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Order ID</th><th>Client</th><th>Items</th><th>Amount</th><th>Status</th><th>Payment</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td><span className="font-mono text-xs text-red-400">{o.orderId}</span></td>
                    <td>
                      <div className="text-white text-sm">{o.client?.name}</div>
                      <div className="text-slate-500 text-xs">{o.client?.company}</div>
                    </td>
                    <td className="text-xs text-slate-400">{o.items?.length} item(s)</td>
                    <td className="text-white font-medium">₹{o.totalAmount?.toLocaleString('en-IN')}</td>
                    <td><span className={statusColors[o.status] || 'badge-gray'}>{o.status}</span></td>
                    <td><span className={payColors[o.paymentStatus] || 'badge-gray'}>{o.paymentStatus}</span></td>
                    <td className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <select
                        className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
                        value={o.status}
                        disabled={updating === o._id}
                        onChange={e => updateStatus(o._id, e.target.value, `Status changed to ${e.target.value}`)}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
