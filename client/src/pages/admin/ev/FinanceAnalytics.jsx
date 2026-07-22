import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../../../services/api';
import { FiDollarSign, FiTrendingUp, FiRefreshCw, FiPackage } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const fmtCr = v => { if (!v) return '₹0'; if (v>=10000000) return `₹${(v/10000000).toFixed(2)}Cr`; if (v>=100000) return `₹${(v/100000).toFixed(1)}L`; if (v>=1000) return `₹${(v/1000).toFixed(0)}K`; return `₹${v.toFixed(0)}`; };

export default function FinanceAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('90');

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await api.get(`/ev/finance?period=${period}`); setData(r.data.data); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data?.summary || {};
  const cb = data?.costBreakdown || {};
  const mf = data?.monthlyFinancials || [];

  const monthlyChart = {
    labels: mf.map(m=>m.month),
    datasets: [
      { label: 'Revenue', data: mf.map(m=>m.revenue), backgroundColor: '#22c55e80', borderRadius: 6, barThickness: 16 },
      { label: 'Cost', data: mf.map(m=>m.estimatedCost), backgroundColor: '#ef444480', borderRadius: 6, barThickness: 16 },
      { label: 'Profit', data: mf.map(m=>m.profit), backgroundColor: '#3b82f680', borderRadius: 6, barThickness: 16 },
    ]
  };

  const costLabels = ['Raw Material','Labor','Energy','Overhead','Profit'];
  const costValues = [cb.rawMaterial,cb.labor,cb.energy,cb.overhead,cb.profit].map(v=>+(v||0).toFixed(0));
  const costColors = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#10b981'];
  const donutData = {
    labels: costLabels,
    datasets: [{ data: costValues, backgroundColor: costColors, borderWidth: 3, borderColor: '#0d1117', hoverOffset: 10 }]
  };

  const chartOpts = { responsive: true, plugins: { legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 } } }, tooltip: { backgroundColor: '#0d1117' } }, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b', callback: v => fmtCr(v) }, grid: { color: '#1e2a3a' } } } };

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Finance Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Revenue · Cost breakdown · Profitability · Billing</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none">
            {[['30','30 Days'],['90','90 Days'],['180','6 Months'],['365','1 Year']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"><FiRefreshCw className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label:'Total Revenue (Paid)', value: fmtCr(s.paidRevenue), color:'#22c55e', icon: FiDollarSign, sub: 'Confirmed payments' },
          { label:'Pending Revenue', value: fmtCr(s.pendingRevenue), color:'#f59e0b', icon: FiTrendingUp, sub: 'Awaiting payment' },
          { label:'Profit Margin', value: `${cb.profitMarginPct ?? '—'}%`, color:'#3b82f6', icon: FiPackage, sub: 'Estimated margin' },
        ].map(k=>(
          <div key={k.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{backgroundColor:`${k.color}18`}}>
                <k.icon className="w-5 h-5" style={{color:k.color}}/>
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{k.label}</div>
                <div className="text-[9px] text-slate-600">{k.sub}</div>
              </div>
            </div>
            <div className="text-3xl font-black italic text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cost Donut */}
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6 flex flex-col items-center">
          <h3 className="text-white font-black italic uppercase text-sm mb-4 self-start">Cost Structure</h3>
          {costValues.some(v=>v>0) ? (
            <>
              <div className="w-44 h-44"><Doughnut data={donutData} options={{ plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1117', callbacks: { label: (c) => ` ${c.label}: ${fmtCr(c.raw)}` } } }, cutout: '65%' }}/></div>
              <div className="space-y-2 mt-4 w-full">
                {costLabels.map((l,i)=>(
                  <div key={l} className="flex justify-between text-xs font-bold">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:costColors[i]}}/><span className="text-slate-400">{l}</span></span>
                    <span className="text-white">{fmtCr(costValues[i])}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="py-16 text-slate-600 text-xs font-bold uppercase">No revenue data</div>}
        </div>

        {/* Monthly P&L */}
        <div className="lg:col-span-2 bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Monthly Revenue vs Cost vs Profit</h3>
          {mf.length > 0
            ? <Bar data={monthlyChart} options={chartOpts} height={130}/>
            : <div className="h-32 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No financial data</div>}
        </div>
      </div>

      {/* Order Status Breakdown */}
      {(data?.ordersByStatus||[]).length > 0 && (
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Order Value by Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(data.ordersByStatus||[]).map(o=>{
              const colors = { Pending:'#64748b',Confirmed:'#3b82f6',Manufacturing:'#f59e0b',QC:'#8b5cf6',Packaging:'#f97316',Shipped:'#22c55e',Delivered:'#10b981',Cancelled:'#ef4444' };
              const color = colors[o._id] || '#64748b';
              return (
                <div key={o._id} className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="text-2xl font-black italic text-white">{o.count}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest mt-1" style={{color}}>{o._id}</div>
                  <div className="text-xs text-slate-400 mt-1 font-bold">{fmtCr(o.value)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly table */}
      {mf.length > 0 && (
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800"><h3 className="text-white font-black italic uppercase text-sm">Monthly Financial Summary</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 border-b border-slate-800">
                <tr>{['Month','Orders','Revenue','Est. Cost','Profit','Margin'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody>
                {mf.map(m=>(
                  <tr key={m.month} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 text-white font-bold">{m.month} {m.year}</td>
                    <td className="px-5 py-3 text-slate-300">{m.orders}</td>
                    <td className="px-5 py-3 text-green-400 font-bold">{fmtCr(m.revenue)}</td>
                    <td className="px-5 py-3 text-red-400 font-bold">{fmtCr(m.estimatedCost)}</td>
                    <td className="px-5 py-3 text-blue-400 font-bold">{fmtCr(m.profit)}</td>
                    <td className="px-5 py-3"><span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">{m.revenue>0?(m.profit/m.revenue*100).toFixed(1):0}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
