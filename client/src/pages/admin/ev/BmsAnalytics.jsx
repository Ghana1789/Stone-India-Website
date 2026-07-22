import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import socket from '../../../services/socket';
import { FiZap, FiRefreshCw, FiAlertTriangle, FiActivity, FiShield } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Gauge = ({ value, max = 100, color, label, unit = '%' }) => {
  const pct = Math.min((value || 0) / max, 1);
  const angle = pct * 180;
  const r = 38;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 60" className="w-36 h-20">
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circumference}`} strokeDashoffset={offset * (circumference / Math.PI / r)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        <text x="50" y="52" textAnchor="middle" fill="white" fontSize="14" fontWeight="900" fontStyle="italic">{value?.toFixed?.(1) ?? '—'}</text>
        <text x="50" y="42" textAnchor="middle" fill={color} fontSize="6" fontWeight="900">{unit}</text>
      </svg>
      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
    </div>
  );
};

export default function BmsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState({ avgSoc: null, avgSoh: null, cellImbalanceMv: null, activeFaults: null, thermalEvents: null, packCount: null });

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await api.get('/ev/bms'); setData(r.data); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    socket.on('bms_telemetry', d => setLiveMetrics(d));
    return () => socket.off('bms_telemetry');
  }, [fetchData]);

  const avg = data?.avgMetrics || {};
  const faults = data?.activeFaults || [];
  const latestPacks = data?.latestPerPack || [];

  const faultSeverityDist = faults.reduce((acc, f) => { acc[f.severity||'Unknown'] = (acc[f.severity||'Unknown']||0) + f.count; return acc; }, {});
  const donutData = {
    labels: Object.keys(faultSeverityDist),
    datasets: [{ data: Object.values(faultSeverityDist), backgroundColor: ['#ef4444','#f97316','#f59e0b','#3b82f6'], borderWidth: 3, borderColor: '#0d1117' }]
  };

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">BMS Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Battery Management System · Real-time SOC/SOH · Fault monitoring</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all">
          <FiRefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Live SOC/SOH Gauges */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h3 className="text-white font-black italic uppercase text-sm">Live Battery Health Gauges</h3>
        </div>
        <div className="flex flex-wrap items-center justify-around gap-8">
          <Gauge value={liveMetrics.avgSoc ?? avg.avgSoc} color="#3b82f6" label="Avg State of Charge" unit="%" />
          <Gauge value={liveMetrics.avgSoh ?? avg.avgSoh} color="#22c55e" label="Avg State of Health" unit="%" />
          <Gauge value={liveMetrics.cellImbalanceMv ?? avg.avgCellImbalance} max={50} color="#f59e0b" label="Cell Imbalance" unit="mV" />
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-black italic text-white">{liveMetrics.activeFaults ?? avg.totalFaults ?? 0}</div>
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse self-center" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Active Faults</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-black italic text-white">{liveMetrics.packCount ?? avg.packCount ?? 0}</div>
            <FiShield className="w-4 h-4 text-purple-400" />
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Monitored Packs</span>
          </div>
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Thermal Events', value: liveMetrics.thermalEvents ?? 0, color: '#ef4444', icon: FiAlertTriangle },
          { label: 'Balancing Active', value: '—', color: '#3b82f6', icon: FiActivity },
          { label: 'Avg Temp (°C)', value: avg.avgTemp ? avg.avgTemp.toFixed(1) : '—', color: '#f97316', icon: FiZap },
          { label: 'Capacity Fade', value: avg.avgSoh ? `${(100-avg.avgSoh).toFixed(1)}%` : '—', color: '#8b5cf6', icon: FiShield },
        ].map(m => (
          <div key={m.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
            </div>
            <div className="text-2xl font-black italic text-white">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Fault Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6 flex flex-col items-center">
          <h3 className="text-white font-black italic uppercase text-sm mb-4 self-start">Fault Severity</h3>
          {Object.keys(faultSeverityDist).length > 0
            ? <><div className="w-40 h-40"><Doughnut data={donutData} options={{ plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1117' } }, cutout: '70%' }} /></div>
              <div className="flex flex-col gap-2 mt-4 w-full">
                {Object.entries(faultSeverityDist).map(([sev, count]) => {
                  const color = sev==='Critical'?'#ef4444':sev==='Error'?'#f97316':sev==='Warning'?'#f59e0b':'#3b82f6';
                  return <div key={sev} className="flex justify-between text-xs font-bold"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:color}}/><span className="text-slate-400">{sev}</span></span><span className="text-white">{count}</span></div>;
                })}
              </div></>
            : <div className="text-slate-600 text-xs font-bold uppercase py-16">No faults recorded</div>
          }
        </div>

        <div className="lg:col-span-2 bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-white font-black italic uppercase text-sm">Active Fault Codes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 border-b border-slate-800">
                <tr>{['Code','Description','Severity','Count'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody>
                {faults.length > 0 ? faults.map((f, i) => {
                  const col = f.severity==='Critical'?'#ef4444':f.severity==='Error'?'#f97316':f.severity==='Warning'?'#f59e0b':'#3b82f6';
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-black text-xs" style={{color:col}}>{f._id}</td>
                      <td className="px-5 py-3 text-slate-300 text-xs">{f.description||'—'}</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{backgroundColor:`${col}20`,color:col}}>{f.severity}</span></td>
                      <td className="px-5 py-3 text-white font-bold">{f.count}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No active faults — all systems nominal</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Latest Pack Snapshots */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-black italic uppercase text-sm">Latest Pack Snapshots</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>{['Pack ID','SOC%','SOH%','Voltage (V)','Temp (°C)','Imbalance (mV)','Faults','Updated'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="px-5 py-10 text-center"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto"/></td></tr>
              : latestPacks.length > 0 ? latestPacks.map((p, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-purple-400 font-black text-xs">{p.packId}</td>
                  <td className="px-4 py-3 font-bold text-sm" style={{color: (p.soc||0)>30?'#22c55e':'#ef4444'}}>{p.soc?.toFixed(1)??'—'}%</td>
                  <td className="px-4 py-3 font-bold text-sm" style={{color: (p.soh||0)>80?'#22c55e':'#f59e0b'}}>{p.soh?.toFixed(1)??'—'}%</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{p.packVoltage?.toFixed(1)??'—'}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{color:(p.packTemperature||0)>45?'#ef4444':'#94a3b8'}}>{p.packTemperature?.toFixed(1)??'—'}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{color:(p.voltageImbalance||0)>20?'#f97316':'#22c55e'}}>{p.voltageImbalance?.toFixed(1)??'—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${p.activeFaultCount>0?'bg-red-500/20 text-red-400':'bg-green-500/20 text-green-400'}`}>{p.activeFaultCount||0}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.timestamp?new Date(p.timestamp).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—'}</td>
                </tr>
              )) : <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No BMS snapshots yet. Add packs to begin monitoring.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
