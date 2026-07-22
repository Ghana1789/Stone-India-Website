import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiBox, FiDroplet, FiLayers, FiZap, FiCheckCircle, FiPackage, FiTruck, FiArrowRight } from 'react-icons/fi';
import { format } from 'date-fns';

const STAGES = [
  { id: 1, name: 'Raw Materials', icon: FiBox, color: '#3b82f6' },
  { id: 2, name: 'Mixing', icon: FiDroplet, color: '#8b5cf6' },
  { id: 3, name: 'Coating', icon: FiLayers, color: '#f97316' },
  { id: 4, name: 'Drying', icon: FiZap, color: '#f59e0b' },
  { id: 5, name: 'Assembly', icon: FiLayers, color: '#ec4899' },
  { id: 6, name: 'Testing', icon: FiCheckCircle, color: '#22c55e' },
  { id: 7, name: 'Packaging', icon: FiPackage, color: '#14b8a6' },
  { id: 8, name: 'Delivery', icon: FiTruck, color: '#10b981' },
];

const STATUS_TO_STAGE = {
  'Pending': 1, 'Confirmed': 1,
  'Manufacturing': 3,
  'QC': 6,
  'Packaging': 7,
  'Dispatch': 8,
  'Delivered': 8,
};

export default function ClientProcessTracker() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    api.get('/client/orders')
      .then(r => {
        const data = r.data.data || [];
        setOrders(data);
        if (data.length > 0) setSelectedOrder(data[0]);
      })
      .catch(() => {
        // Mock data for demo
        const mock = [{
          _id: 'ord-demo-1', orderId: 'ORD-2026-001',
          status: 'QC', createdAt: new Date(),
          items: [{ battery: { name: 'StonePack 48V 30Ah' } }],
          totalAmount: 57000
        }];
        setOrders(mock);
        setSelectedOrder(mock[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStageNum = (status) => STATUS_TO_STAGE[status] || 1;

  const formatCurrency = (v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Manufacturing Tracker</h1>
        <p className="text-slate-400 mt-1">Real-time production stage tracking for your orders</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
          <FiPackage className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-bold">No active orders found.</p>
          <Link to="/client/orders/new" className="inline-block mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all">
            Place an Order
          </Link>
        </div>
      ) : (
        <>
          {/* Order Selector */}
          {orders.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {orders.map(o => (
                <button key={o._id} onClick={() => setSelectedOrder(o)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedOrder?._id === o._id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                  {o.orderId}
                </button>
              ))}
            </div>
          )}

          {selectedOrder && (() => {
            const stageNum = getStageNum(selectedOrder.status);
            const pct = Math.round(((stageNum - 1) / (STAGES.length - 1)) * 100);

            return (
              <div className="space-y-6">
                {/* Order Summary Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="text-slate-500 text-xs font-bold uppercase">Order ID</div>
                      <div className="text-white font-black text-xl mt-0.5">{selectedOrder.orderId}</div>
                      <div className="text-slate-400 text-sm mt-1">
                        Placed {format(new Date(selectedOrder.createdAt), 'd MMM yyyy')}
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <div className="text-slate-500 text-xs font-bold uppercase">Amount</div>
                        <div className="text-white font-black text-lg">{formatCurrency(selectedOrder.totalAmount || 0)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs font-bold uppercase">Status</div>
                        <div className="text-blue-400 font-black text-lg">{selectedOrder.status}</div>
                      </div>
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-500 uppercase">Manufacturing Progress</span>
                      <span className="text-white">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Stage Pipeline */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-6">Production Pipeline</h3>
                  <div className="space-y-3">
                    {STAGES.map((stage, idx) => {
                      const isComplete = stage.id < stageNum;
                      const isCurrent = stage.id === stageNum;
                      const isPending = stage.id > stageNum;
                      return (
                        <div key={stage.id} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isCurrent ? 'bg-blue-500/10 border border-blue-500/30' : isComplete ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-slate-800/30 border border-transparent'}`}>
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-500/20' : isCurrent ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                            {isComplete
                              ? <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                              : <stage.icon className={`w-5 h-5 ${isCurrent ? 'text-blue-400' : 'text-slate-600'}`} />}
                          </div>

                          {/* Info */}
                          <div className="flex-1">
                            <div className={`font-bold text-sm ${isComplete ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-slate-500'}`}>
                              {stage.name}
                            </div>
                            {isCurrent && (
                              <div className="text-blue-400 text-xs mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                                Currently in progress
                              </div>
                            )}
                          </div>

                          {/* Status dot */}
                          <div>
                            {isComplete && <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">Done</div>}
                            {isCurrent && <div className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase animate-pulse">Active</div>}
                            {isPending && <div className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 text-[10px] font-black uppercase">Pending</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/client/orders" className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-sm font-bold transition-all group">
                    <FiPackage className="w-5 h-5 text-blue-400" />
                    View All Orders
                    <FiArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link to="/client/support" className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-sm font-bold transition-all group">
                    <FiCheckCircle className="w-5 h-5 text-emerald-400" />
                    Contact Support
                    <FiArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
