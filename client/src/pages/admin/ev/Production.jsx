import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import api from '../../../services/api';
import socket from '../../../services/socket';
import { FiCpu, FiActivity, FiZap, FiAlertTriangle, FiCheckCircle, FiClock, FiRefreshCw, FiPackage, FiArrowUpRight, FiTrendingUp } from 'react-icons/fi';
import { Link } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const STATUS_COLORS = {
  Scheduled: '#64748b', InProduction: '#3b82f6', QCPending: '#f59e0b',
  QCPassed: '#22c55e', QCFailed: '#ef4444', Packed: '#8b5cf6', Dispatched: '#10b981'
};
const MACHINE_STATUS_COLOR = { Running: '#22c55e', Warning: '#f59e0b', Critical: '#ef4444', Idle: '#64748b', Maintenance: '#3b82f6', Breakdown: '#ef4444', Offline: '#374151' };

export default function Production() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [machines, setMachines] = useState([]);
  const [counters, setCounters] = useState({ cellsProducedToday: 0, packsAssembledToday: 0, packsShippedToday: 0, defectsToday: 0 });
  const [factoryMetrics, setFactoryMetrics] = useState({ oee: null, fpy: null, throughput: null, utilization: null, downtimePct: null, lineEfficiency: {} });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get('/ev/production');
      setData(r.data.data);
    } catch (e) { setError(e?.response?.data?.message || 'Failed to load production data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    socket.on('machine_status', (d) => setMachines(d.machines || []));
    socket.on('production_counters', (d) => setCounters(d));
    socket.on('factory_metrics', (d) => setFactoryMetrics(d));
    return () => {
      socket.off('machine_status');
      socket.off('production_counters');
      socket.off('factory_metrics');
    };
  }, [fetchData]);

  const statusDistribution = (data?.batchStatusDistribution || []);

  const trendChart = {
    labels: (data?.monthlyTrend || []).map(m => m.month),
    datasets: [
      { label: 'Batches', data: (data?.monthlyTrend || []).map(m => m.batches), backgroundColor: '#3b82f6aa', borderRadius: 6, barThickness: 20 },
      { label: 'Units', data: (data?.monthlyTrend || []).map(m => m.units), backgroundColor: '#22c55eaa', borderRadius: 6, barThickness: 20 }
    ]
  };

  const defectChart = {
    labels: (data?.monthlyTrend || []).map(m => m.month),
    datasets: [{
      label: 'Defect Rate %',
      data: (data?.monthlyTrend || []).map(m => m.defectRate),
      borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
      fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#ef4444'
    }]
  };

  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1117', padding: 10 } },
    scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b' }, grid: { color: '#1e2a3a' } } }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>;
  if (error) return <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>;

  const PROCESS_STAGES = [
    { name: 'Raw Materials', color: '#3b82f6', done: true },
    { name: 'Electrode Prep', color: '#8b5cf6', done: true },
    { name: 'Cell Winding', color: '#f97316', done: true },
    { name: 'Electrolyte Fill', color: '#f59e0b', done: false, active: true },
    { name: 'Formation', color: '#ec4899', done: false },
    { name: 'QC Testing', color: '#22c55e', done: false },
    { name: 'Pack Assembly', color: '#14b8a6', done: false },
    { name: 'Dispatch', color: '#10b981', done: false },
  ];

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Production Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manufacturing Execution System · Live monitoring</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all">
          <FiRefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Live Production Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cells Produced Today', value: counters.cellsProducedToday, icon: FiZap, color: '#3b82f6' },
          { label: 'Packs Assembled', value: counters.packsAssembledToday, icon: FiPackage, color: '#8b5cf6' },
          { label: 'Packs Shipped', value: counters.packsShippedToday, icon: FiTrendingUp, color: '#22c55e' },
          { label: 'Defects Today', value: counters.defectsToday, icon: FiAlertTriangle, color: '#ef4444' },
        ].map(c => (
          <div key={c.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <c.icon className="w-4 h-4" style={{ color: c.color }} />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{c.label}</span>
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="text-4xl font-black italic text-white">{c.value?.toLocaleString() ?? 0}</div>
          </div>
        ))}
      </div>

      {/* OEE + Line Efficiency */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* OEE Gauge */}
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">OEE Score</span>
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12"
                strokeDasharray={`${(factoryMetrics.oee || 82) * 2.513} 251.3`}
                strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
              <span className="text-2xl font-black text-white italic">{factoryMetrics.oee?.toFixed(1) ?? '—'}</span>
              <span className="text-[9px] text-slate-500 font-bold">%</span>
            </div>
          </div>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-2">Target: 85%</span>
        </div>

        {/* Line Efficiency */}
        <div className="lg:col-span-2 bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm tracking-wide mb-4">Production Line Efficiency</h3>
          <div className="space-y-3">
            {Object.entries(factoryMetrics.lineEfficiency || { A: 0, B: 0, C: 0, D: 0 }).map(([line, val]) => (
              <div key={line}>
                <div className="flex justify-between mb-1.5 text-xs font-bold">
                  <span className="text-slate-300">Line {line}</span>
                  <span className={val > 90 ? 'text-green-400' : val > 80 ? 'text-yellow-400' : 'text-red-400'}>{val?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val || 0}%`, backgroundColor: val > 90 ? '#22c55e' : val > 80 ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {[
            { label: 'Throughput', value: factoryMetrics.throughput, unit: 'units/hr', color: '#3b82f6', icon: FiActivity },
            { label: 'Utilization', value: factoryMetrics.utilization, unit: '%', color: '#8b5cf6', icon: FiCpu },
            { label: 'Downtime', value: factoryMetrics.downtimePct, unit: '%', color: '#ef4444', icon: FiClock },
            { label: 'FPY', value: factoryMetrics.fpy, unit: '%', color: '#22c55e', icon: FiCheckCircle },
          ].map(m => (
            <div key={m.label} className="bg-[#0d1117] rounded-xl border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</span>
              </div>
              <div className="text-xl font-black italic text-white">{m.value?.toFixed?.(1) ?? '—'}<span className="text-xs font-bold text-slate-500 ml-1">{m.unit}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Manufacturing Pipeline */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
        <h3 className="text-white font-black italic uppercase text-sm tracking-wide mb-5">Manufacturing Pipeline</h3>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {PROCESS_STAGES.map((stage, idx) => (
            <div key={stage.name} className="flex items-center gap-1 shrink-0">
              <div className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl min-w-[100px] border transition-all ${
                stage.done ? 'bg-green-500/10 border-green-500/30' :
                stage.active ? 'bg-yellow-500/10 border-yellow-500/30 shadow-lg shadow-yellow-500/10' :
                'bg-slate-800/30 border-slate-800'
              }`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: (stage.done || stage.active ? stage.color : '#1e293b') + '30' }}>
                  {stage.done ? <FiCheckCircle className="w-4 h-4 text-green-400" /> : <FiCpu className="w-4 h-4" style={{ color: stage.active ? stage.color : '#475569' }} />}
                </div>
                <span className={`text-[8px] font-black uppercase text-center ${stage.done ? 'text-green-400' : stage.active ? 'text-white' : 'text-slate-600'}`}>{stage.name}</span>
                {stage.active && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
              </div>
              {idx < PROCESS_STAGES.length - 1 && <div className={`w-5 h-px ${stage.done ? 'bg-green-500/40' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm tracking-wide mb-5">Monthly Output (6 Months)</h3>
          {(data?.monthlyTrend || []).length > 0
            ? <Bar data={trendChart} options={chartOpts} height={130} />
            : <div className="h-32 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No data</div>
          }
        </div>
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm tracking-wide mb-5">Defect Rate Trend</h3>
          {(data?.monthlyTrend || []).length > 0
            ? <Line data={defectChart} options={chartOpts} height={130} />
            : <div className="h-32 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No data</div>
          }
        </div>
      </div>

      {/* Machine Status Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-black italic uppercase text-sm tracking-wide">Machine Status</h3>
          <Link to="/admin/ev/maintenance" className="text-[10px] text-blue-400 font-black uppercase tracking-widest hover:text-blue-300 flex items-center gap-1">
            Maintenance <FiArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(machines.length > 0 ? machines : data?.productionStaff || []).map((m, i) => {
            const isFromSocket = machines.length > 0;
            if (!isFromSocket) return null;
            const statusColor = MACHINE_STATUS_COLOR[m.status] || '#64748b';
            return (
              <div key={m.id || i} className="bg-[#0d1117] rounded-xl border border-slate-800 p-4 hover:border-slate-600 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>{m.status}</span>
                </div>
                <div className="text-sm font-bold text-white mb-1 leading-tight">{m.name}</div>
                <div className="text-[10px] text-slate-500 mb-3">{m.line} · {m.type}</div>
                <div className="grid grid-cols-3 gap-1 text-[9px]">
                  <div className="text-center">
                    <div className="text-slate-400 font-black">{m.temp?.toFixed?.(0)}°</div>
                    <div className="text-slate-600 uppercase">Temp</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-400 font-black">{m.vibration?.toFixed?.(1)}</div>
                    <div className="text-slate-600 uppercase">Vib</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-black ${m.health>85?'text-green-400':m.health>70?'text-yellow-400':'text-red-400'}`}>{m.health}%</div>
                    <div className="text-slate-600 uppercase">Health</div>
                  </div>
                </div>
                <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.health || 0}%`, backgroundColor: m.health>85?'#22c55e':m.health>70?'#f59e0b':'#ef4444' }} />
                </div>
              </div>
            );
          })}
          {machines.length === 0 && (
            <div className="col-span-full text-slate-600 text-xs font-bold uppercase flex items-center justify-center h-20">
              Waiting for machine data...
            </div>
          )}
        </div>
      </div>

      {/* Recent Batches */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-black italic uppercase text-sm tracking-wide">Recent Batches</h3>
          <Link to="/admin/batches" className="text-[10px] text-blue-400 font-black uppercase tracking-widest hover:text-blue-300">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>
                {['Batch ID','Battery','Qty','QC Status','Defect%','Status','Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recentBatches || []).map((b) => (
                <tr key={b._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-blue-400 font-black text-xs">{b.batchId}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{b.batteryName || b.battery?.name || '—'}</td>
                  <td className="px-5 py-3 text-white font-bold">{b.quantity}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase" style={{ backgroundColor: `${STATUS_COLORS[b.qcStatus] || '#64748b'}20`, color: STATUS_COLORS[b.qcStatus] || '#64748b' }}>{b.qcStatus}</span>
                  </td>
                  <td className="px-5 py-3 text-xs font-bold" style={{ color: (b.defectRate||0) < 1 ? '#22c55e' : (b.defectRate||0) < 3 ? '#f59e0b' : '#ef4444' }}>{(b.defectRate||0).toFixed(2)}%</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase" style={{ backgroundColor: `${STATUS_COLORS[b.status]||'#64748b'}20`, color: STATUS_COLORS[b.status]||'#64748b' }}>{b.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{b.productionStartDate ? new Date(b.productionStartDate).toLocaleDateString('en-IN') : '—'}</td>
                </tr>
              ))}
              {!(data?.recentBatches || []).length && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No batches found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
