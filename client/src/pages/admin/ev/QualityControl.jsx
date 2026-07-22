import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../../../services/api';
import socket from '../../../services/socket';
import { FiCheckCircle, FiAlertTriangle, FiRefreshCw, FiActivity } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

export default function QualityControl() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [liveQuality, setLiveQuality] = useState({});

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await api.get(`/ev/quality?period=${period}`); setData(r.data.data); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); socket.on('quality_live', d => setLiveQuality(d)); return () => socket.off('quality_live'); }, [fetchData]);

  const s = data?.summary || {};

  const trendChart = {
    labels: (data?.qualityTrend||[]).map(m=>m.month),
    datasets: [
      { label: 'Passed', data: (data?.qualityTrend||[]).map(m=>m.passed), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.12)', fill: true, tension: 0.4, pointRadius: 4 },
      { label: 'Failed', data: (data?.qualityTrend||[]).map(m=>m.failed), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4, pointRadius: 4 },
    ]
  };

  const defectChart = {
    labels: (data?.topDefects||[]).map(d=>d._id||'Unknown'),
    datasets: [{ label: 'Defects', data: (data?.topDefects||[]).map(d=>d.count), backgroundColor: (data?.topDefects||[]).map((_,i)=>`hsla(${0+i*30},70%,55%,0.8)`), borderRadius: 6, barThickness: 22 }]
  };

  const chartOpts = { responsive: true, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1117' } }, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b' }, grid: { color: '#1e2a3a' } } } };

  const CHECKLIST_KEYS = [
    ['visual','Visual Inspection'],['voltage','Voltage Test'],['capacity','Capacity Test'],
    ['insulation','Insulation Test'],['temperature','Temperature Test'],['safety','Safety Test']
  ];
  const cl = data?.checklistPerformance || {};

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Quality Control</h1>
          <p className="text-slate-400 text-sm mt-0.5">FPY · Defect tracking · SPC monitoring · CAPA</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none">
            {[['7','7 Days'],['30','30 Days'],['90','90 Days'],['365','1 Year']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"><FiRefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'FPY', value: `${s.fpy??'—'}%`, color:'#22c55e', live: false },
          { label: 'Defect Rate', value: `${liveQuality.defectRatePct ?? s.defectRate ?? '—'}%`, color:'#ef4444', live: !!liveQuality.defectRatePct },
          { label: 'Scrap Rate', value: `${liveQuality.scrapRatePct ?? s.scrapRate ?? '—'}%`, color:'#f97316', live: !!liveQuality.scrapRatePct },
          { label: 'Rework Rate', value: `${liveQuality.reworkRatePct ?? s.reworkRate ?? '—'}%`, color:'#f59e0b', live: !!liveQuality.reworkRatePct },
          { label: 'Pass Rate', value: `${liveQuality.qualityPassPct ?? '—'}%`, color:'#10b981', live: true },
          { label: 'Inspections', value: liveQuality.inspectionsToday ?? s.total ?? '—', color:'#3b82f6', live: !!liveQuality.inspectionsToday },
        ].map(m=>(
          <div key={m.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
              {m.live && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            </div>
            <div className="text-2xl font-black italic text-white">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Passed', value: s.passed??0, color:'#22c55e', icon: FiCheckCircle },
          { label: 'Failed', value: s.failed??0, color:'#ef4444', icon: FiAlertTriangle },
          { label: 'Rework', value: s.rework??0, color:'#f59e0b', icon: FiActivity },
          { label: 'Pending', value: s.pending??0, color:'#64748b', icon: FiActivity },
        ].map(c=>(
          <div key={c.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.color}18` }}>
              <c.icon className="w-5 h-5" style={{ color: c.color }} />
            </div>
            <div>
              <div className="text-2xl font-black italic text-white">{c.value}</div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Pass/Fail Trend</h3>
          {(data?.qualityTrend||[]).length>0
            ? <Line data={trendChart} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: true, labels: { color: '#94a3b8', font: { size: 10 } } } } }} height={130} />
            : <div className="h-32 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No trend data</div>}
        </div>
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Top Defect Categories</h3>
          {(data?.topDefects||[]).length>0
            ? <Bar data={defectChart} options={chartOpts} height={130} />
            : <div className="h-32 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No defect data</div>}
        </div>
      </div>

      {/* QC Checklist Performance */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
        <h3 className="text-white font-black italic uppercase text-sm mb-5">QC Checklist Pass Rates</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CHECKLIST_KEYS.map(([key, label]) => {
            const passed = cl[key] || 0;
            const total = cl.totalCount || 1;
            const pct = +((passed / total) * 100).toFixed(1);
            const color = pct > 95 ? '#22c55e' : pct > 85 ? '#f59e0b' : '#ef4444';
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">{label}</span>
                  <span style={{ color }}>{pct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <div className="text-[10px] text-slate-600">{passed}/{total} passed</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Failed Batches */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <FiAlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="text-white font-black italic uppercase text-sm tracking-wide">Recent Failed Batches</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>{['Batch ID','Battery','QC Score','Defect Rate','QC Date'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(data?.recentFailed||[]).map(b=>(
                <tr key={b._id} className="border-b border-slate-800/50 hover:bg-red-500/5 transition-colors">
                  <td className="px-5 py-3 text-red-400 font-black text-xs">{b.batchId}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{b.batteryName||'—'}</td>
                  <td className="px-5 py-3 text-white font-bold">{b.qcScore??'—'}/100</td>
                  <td className="px-5 py-3 text-red-400 font-bold text-xs">{(b.defectRate||0).toFixed(2)}%</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{b.qcDate?new Date(b.qcDate).toLocaleDateString('en-IN'):'—'}</td>
                </tr>
              ))}
              {!(data?.recentFailed||[]).length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No failed batches in this period</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
