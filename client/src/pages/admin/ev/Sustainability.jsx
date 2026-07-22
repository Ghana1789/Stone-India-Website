import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../../../services/api';
import socket from '../../../services/socket';
import { FiWind, FiDroplet, FiZap, FiRefreshCw, FiPlus, FiActivity } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, BarElement, Title, Tooltip, Legend, Filler);

const fmtNum = v => v === undefined || v === null ? '—' : typeof v === 'number' ? v.toFixed(1) : v;

export default function Sustainability() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [showLog, setShowLog] = useState(false);
  const [liveEnergy, setLiveEnergy] = useState({});
  const [form, setForm] = useState({ source:'Total Plant', kwhConsumed:'', carbonKg:'', waterLiters:'', wasteKg:'', recycledKg:'', period:'daily', periodStart: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await api.get(`/ev/sustainability?period=${period}`); setData(r.data.data); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }, [period]);

  useEffect(() => {
    fetchData();
    socket.on('energy_pulse', d => setLiveEnergy(d));
    return () => socket.off('energy_pulse');
  }, [fetchData]);

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = { ...form, kwhConsumed:+form.kwhConsumed, carbonKg:+form.carbonKg, waterLiters:+form.waterLiters, wasteKg:+form.wasteKg, recycledKg:+form.recycledKg };
      await api.post('/ev/sustainability', body);
      setShowLog(false); fetchData();
    } catch(err) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const totals = data?.totals || {};
  const trend = data?.monthlyTrend || [];
  const bySource = data?.bySource || [];

  const lineChart = {
    labels: trend.map(m => m.month),
    datasets: [
      { label: 'kWh', data: trend.map(m => m.kwh), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4, pointRadius: 4 },
      { label: 'CO₂ kg', data: trend.map(m => m.carbon), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4, pointRadius: 4 },
    ]
  };
  const barChart = {
    labels: trend.map(m => m.month),
    datasets: [
      { label: 'Waste kg', data: trend.map(m => m.waste), backgroundColor: '#94a3b880', borderRadius: 6, barThickness: 16 },
      { label: 'Water kL', data: trend.map(m => (m.water/1000).toFixed(1)), backgroundColor: '#3b82f680', borderRadius: 6, barThickness: 16 },
    ]
  };
  const chartOpts = { responsive: true, plugins: { legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 } } }, tooltip: { backgroundColor: '#0d1117' } }, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b' }, grid: { color: '#1e2a3a' } } } };

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Sustainability & ESG</h1>
          <p className="text-slate-400 text-sm mt-0.5">Carbon emissions · Energy · Water · Waste · Recycling</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none">
            {[['7','7 Days'],['30','30 Days'],['90','90 Days'],['365','1 Year']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"><FiRefreshCw className="w-4 h-4"/></button>
          <button onClick={() => setShowLog(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-xs font-black uppercase transition-all">
            <FiPlus className="w-4 h-4" /> Log Reading
          </button>
        </div>
      </div>

      {/* Live Pulse */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-2xl p-5 flex flex-wrap items-center gap-6">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <div className="text-xs font-bold text-slate-400">Live Plant:</div>
        {[
          { label: 'Power', value: `${liveEnergy.plantKw ?? '—'} kW`, icon: FiZap, color: '#f59e0b' },
          { label: 'Carbon', value: `${liveEnergy.carbonGPerMin ?? '—'} g/min`, icon: FiWind, color: '#ef4444' },
          { label: 'Water', value: `${liveEnergy.waterLPerHr ?? '—'} L/hr`, icon: FiDroplet, color: '#3b82f6' },
          { label: 'Renewable', value: `${liveEnergy.renewablePct ?? '—'}%`, icon: FiActivity, color: '#22c55e' },
        ].map(m=>(
          <div key={m.label} className="flex items-center gap-2">
            <m.icon className="w-4 h-4" style={{color:m.color}}/>
            <span className="text-white font-black text-sm">{m.value}</span>
            <span className="text-[9px] text-slate-500 uppercase">{m.label}</span>
          </div>
        ))}
      </div>
 
      {/* ESG KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total kWh', value: fmtNum(totals.totalKwh), unit: 'kWh', color: '#f59e0b', icon: FiZap },
          { label: 'Carbon', value: fmtNum(totals.totalCarbon), unit: 'kg CO₂', color: '#ef4444', icon: FiWind },
          { label: 'Water', value: totals.totalWater ? (totals.totalWater/1000).toFixed(1)+'kL' : '—', unit: '', color: '#3b82f6', icon: FiDroplet },
          { label: 'Waste', value: fmtNum(totals.totalWaste), unit: 'kg', color: '#64748b', icon: FiWind },
          { label: 'Recycled', value: fmtNum(totals.totalRecycled), unit: 'kg', color: '#22c55e', icon: FiActivity },
          { label: 'Recycling Rate', value: `${fmtNum(totals.recyclingRate)}%`, unit: '', color: '#10b981', icon: FiActivity },
        ].map(k=>(
          <div key={k.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3"><k.icon className="w-4 h-4" style={{color:k.color}}/><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{k.label}</span></div>
            <div className="text-2xl font-black italic text-white">{k.value}{k.unit&&<span className="text-xs font-bold text-slate-500 ml-1">{k.unit}</span>}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Energy & Carbon Trend</h3>
          {trend.length > 0 ? <Line data={lineChart} options={chartOpts} height={130}/> : <div className="h-32 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No data — log energy readings to see trends</div>}
        </div>
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Waste & Water Trend</h3>
          {trend.length > 0 ? <Bar data={barChart} options={chartOpts} height={130}/> : <div className="h-32 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No data</div>}
        </div>
      </div>

      {/* Energy by Source */}
      {bySource.length > 0 && (
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Energy Breakdown by Source</h3>
          <div className="space-y-3">
            {bySource.map((s,i)=>{
              const maxKwh = Math.max(...bySource.map(x=>x.kwh||0));
              const pct = maxKwh > 0 ? (s.kwh||0)/maxKwh*100 : 0;
              const colors = ['#f59e0b','#3b82f6','#22c55e','#8b5cf6','#f97316','#06b6d4','#ec4899','#84cc16'];
              const c = colors[i % colors.length];
              return (
                <div key={s._id} className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs font-bold w-36 shrink-0 truncate">{s._id}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-2.5"><div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,backgroundColor:c}}/></div>
                  <span className="text-white font-black text-xs w-20 text-right">{(s.kwh||0).toFixed(0)} kWh</span>
                  <span className="text-red-400 text-xs w-16 text-right">{(s.carbon||0).toFixed(1)} kg</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Log Modal */}
      {showLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-black text-white italic uppercase mb-5">Log Energy Reading</h2>
            <form onSubmit={handleLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {label:'Source',key:'source',type:'select',opts:['Total Plant','Production Line A','Production Line B','Production Line C','Production Line D','HVAC System','Lighting','QC Lab','Warehouse']},
                  {label:'Period',key:'period',type:'select',opts:['hourly','daily','weekly','monthly']},
                  {label:'Date',key:'periodStart',type:'date'},
                  {label:'Energy (kWh)',key:'kwhConsumed',type:'number'},
                  {label:'Carbon (kg CO₂)',key:'carbonKg',type:'number'},
                  {label:'Water (L)',key:'waterLiters',type:'number'},
                  {label:'Waste (kg)',key:'wasteKg',type:'number'},
                  {label:'Recycled (kg)',key:'recycledKg',type:'number'},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{f.label}</label>
                    {f.type==='select'
                      ? <select value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                          {f.opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      : <input type={f.type} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500" placeholder="0"/>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowLog(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-black disabled:opacity-50 transition-all">{saving?'Logging...':'Log Reading'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
