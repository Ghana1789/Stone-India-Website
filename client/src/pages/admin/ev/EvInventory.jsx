import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import socket from '../../../services/socket';
import { FiPackage, FiAlertTriangle, FiRefreshCw, FiTrendingDown } from 'react-icons/fi';

export default function EvInventory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveAlerts, setLiveAlerts] = useState([]);

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await api.get('/ev/inventory'); setData(r.data); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    socket.on('alert_stream', d => {
      const invAlerts = (d.alerts||[]).filter(a => a.source === 'Inventory');
      if (invAlerts.length) setLiveAlerts(invAlerts);
    });
    return () => socket.off('alert_stream');
  }, [fetchData]);

  const batteries = data?.data || [];
  const summary = data?.summary || {};
  const lowStock = data?.lowStock || [];
  const categoryDist = data?.stockByCategory || [];

  const CATEGORY_COLORS = { 'NMC': '#3b82f6','LFP': '#22c55e','Lead Acid': '#f59e0b','Lithium': '#8b5cf6','NiMH': '#f97316','Default': '#64748b' };

  const fmtCr = v => { if (!v) return '₹0'; if (v>=10000000) return `₹${(v/10000000).toFixed(1)}Cr`; if (v>=100000) return `₹${(v/100000).toFixed(0)}L`; return `₹${(v/1000).toFixed(0)}K`; };

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Inventory & Warehouse</h1>
          <p className="text-slate-400 text-sm mt-0.5">Raw materials · Components · Finished goods · Multi-warehouse</p>
        </div>
        <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"><FiRefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FiAlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-black text-sm uppercase">{lowStock.length} Items Below Reorder Level</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(b => (
              <span key={b._id} className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-bold">
                {b.name} — <span className="font-black">{b.stock} units</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total SKUs', value: batteries.length, icon: FiPackage, color: '#3b82f6' },
          { label: 'Total Units', value: summary.totalItems?.toLocaleString() ?? '—', icon: FiPackage, color: '#22c55e' },
          { label: 'Inventory Value', value: fmtCr(summary.totalValue), icon: FiPackage, color: '#8b5cf6' },
          { label: 'Low Stock Items', value: summary.lowStockCount ?? 0, icon: FiTrendingDown, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3"><k.icon className="w-4 h-4" style={{color:k.color}}/><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{k.label}</span></div>
            <div className="text-3xl font-black italic text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* By Category */}
      {categoryDist.length > 0 && (
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-5">Stock by Category</h3>
          <div className="space-y-4">
            {categoryDist.map(cat => {
              const color = CATEGORY_COLORS[cat._id] || CATEGORY_COLORS.Default;
              const maxStock = Math.max(...categoryDist.map(c=>c.totalStock||0));
              return (
                <div key={cat._id} className="flex items-center gap-4">
                  <span className="text-slate-300 text-xs font-bold w-24 shrink-0">{cat._id||'Unknown'}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${((cat.totalStock||0)/Math.max(maxStock,1))*100}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-white font-black text-sm w-20 text-right">{(cat.totalStock||0).toLocaleString()} units</span>
                  <span className="text-slate-500 text-xs w-20 text-right">{cat.count} SKUs</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Inventory Table */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-black italic uppercase text-sm">All Inventory Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>{['Name','SKU','Category','Stock','Price','Value','Status'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="py-10 text-center"><div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin mx-auto"/></td></tr>
              : batteries.length > 0 ? batteries.map(b => {
                const stockStatus = b.stock < 5 ? { label:'Critical', color:'#ef4444' } : b.stock < 10 ? { label:'Low', color:'#f97316' } : b.stock < 20 ? { label:'Medium', color:'#f59e0b' } : { label:'Good', color:'#22c55e' };
                return (
                  <tr key={b._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-white font-bold text-xs">{b.name}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono">{b.sku}</td>
                    <td className="px-5 py-3 text-slate-300 text-xs">{b.category||'—'}</td>
                    <td className="px-5 py-3 font-black text-sm" style={{color:stockStatus.color}}>{b.stock}</td>
                    <td className="px-5 py-3 text-slate-300 text-xs">₹{(b.price||0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-green-400 font-bold text-xs">₹{((b.stock||0)*(b.price||0)).toLocaleString()}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{backgroundColor:`${stockStatus.color}20`,color:stockStatus.color}}>{stockStatus.label}</span></td>
                  </tr>
                );
              }) : <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No inventory items found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
