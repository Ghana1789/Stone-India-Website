import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { FiArrowLeft, FiPackage, FiCheck, FiClock, FiTruck, FiBox } from 'react-icons/fi';

const steps = ['Pending', 'Confirmed', 'Manufacturing', 'QC', 'Packed', 'Shipped', 'Delivered'];
const statusColors = { Pending: 'badge-yellow', Confirmed: 'badge-blue', Manufacturing: 'badge-purple', QC: 'badge-blue', Packed: 'badge-gray', Shipped: 'badge-purple', Delivered: 'badge-green', Cancelled: 'badge-red' };

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/client/orders/${id}`).then(r => setOrder(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="text-center py-20 text-slate-500">Order not found.</div>;

  const currentStep = steps.indexOf(order.status);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/client/orders" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"><FiArrowLeft /></Link>
        <div>
          <h1 className="text-xl font-bold text-white font-mono">{order.orderId}</h1>
          <p className="text-slate-400 text-sm">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <span className={`ml-auto ${statusColors[order.status] || 'badge-gray'}`}>{order.status}</span>
      </div>

      {/* Tracking Progress */}
      {order.status !== 'Cancelled' && (
        <div className="card">
          <h2 className="text-white font-semibold mb-6">Order Tracking</h2>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    i < currentStep ? 'bg-brand-500 border-brand-500' :
                    i === currentStep ? 'bg-brand-500/20 border-brand-500' : 'bg-slate-800 border-slate-600'
                  }`}>
                    {i < currentStep ? <FiCheck className="w-4 h-4 text-white" /> :
                     i === currentStep ? <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" /> :
                     <div className="w-2 h-2 bg-slate-600 rounded-full" />}
                  </div>
                  <span className={`text-[10px] font-medium text-center ${i <= currentStep ? 'text-brand-400' : 'text-slate-600'}`}>{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 transition-all ${i < currentStep ? 'bg-brand-500' : 'bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card">
        <h2 className="text-white font-semibold mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500/10 rounded-lg flex items-center justify-center">
                  <FiPackage className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{item.batteryName}</div>
                  <div className="text-slate-500 text-xs font-mono">{item.batterySku} × {item.quantity}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">₹{item.totalPrice?.toLocaleString('en-IN')}</div>
                <div className="text-slate-500 text-xs">₹{item.unitPrice?.toLocaleString('en-IN')} each</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-slate-400"><span>GST</span><span>₹{order.gstAmount?.toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-white font-bold text-base"><span>Total</span><span className="text-brand-400">₹{order.totalAmount?.toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      {/* Delivery & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><FiTruck className="text-brand-400" />Delivery Address</h3>
          <div className="text-slate-400 text-sm space-y-1">
            <div className="text-white font-medium">{order.deliveryAddress?.name}</div>
            <div>{order.deliveryAddress?.phone}</div>
            <div>{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</div>
            <div>{order.deliveryAddress?.state} – {order.deliveryAddress?.pincode}</div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><FiBox className="text-brand-400" />Payment Info</h3>
          <div className="text-slate-400 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Status</span>
              <span className={`font-medium ${order.paymentStatus === 'Paid' ? 'text-brand-400' : 'text-yellow-400'}`}>{order.paymentStatus}</span>
            </div>
            {order.paidAt && <div className="flex justify-between"><span>Paid on</span><span>{new Date(order.paidAt).toLocaleDateString('en-IN')}</span></div>}
          </div>
          {order.paymentStatus !== 'Paid' && (
            <button className="btn-primary btn-sm w-full mt-4">Pay Now via Razorpay</button>
          )}
        </div>
      </div>

      {/* Tracking History */}
      {order.trackingHistory?.length > 0 && (
        <div className="card">
          <h2 className="text-white font-semibold mb-4">History</h2>
          <div className="space-y-2">
            {[...order.trackingHistory].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-brand-400 rounded-full mt-1.5 shrink-0" />
                <div>
                  <span className="text-white">{h.status}</span>
                  <span className="text-slate-500"> — {h.message}</span>
                  <div className="text-slate-600 text-xs">{new Date(h.timestamp).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
