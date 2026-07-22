import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../../../services/api';
import socket from '../../../services/socket';
import {
  FiZap, FiActivity, FiTrendingUp, FiPackage, FiDollarSign, FiShield,
  FiAlertTriangle, FiCheckCircle, FiWind, FiDroplet, FiCpu, FiArrowUpRight,
  FiRefreshCw, FiAward, FiTruck, FiBarChart2, FiX, FiBell, FiGlobe
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const fmt = (v) => v?.toLocaleString?.('en-IN') ?? '—';
const fmtCr = (v) => {
  if (!v) return '₹0';
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v/1000).toFixed(0)}K`;
  return `₹${v}`;
};

const CHART_DEFAULTS = {
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#0d1117', padding: 12, cornerRadius: 10, borderColor: '#1e293b', borderWidth: 1 }
  }
};

export default function EvDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState({
    oee: null, fpy: null, utilization: null, downtimePct: null,
    plantKw: null, carbonGPerMin: null, avgSoc: null, avgSoh: null,
    cellsProducedToday: null, packsAssembledToday: null, packsShippedToday: null,
    defectRatePct: null, qualityPassPct: null
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get('/ev/overview');
      setData(r.data.data);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load EV dashboard data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();

    const handleFactoryMetrics = (d) => setLiveMetrics(prev => ({ ...prev, oee: d.oee, fpy: d.fpy, utilization: d.utilization, downtimePct: d.downtimePct }));
    const handleEnergyPulse = (d) => setLiveMetrics(prev => ({ ...prev, plantKw: d.plantKw, carbonGPerMin: d.carbonGPerMin }));
    const handleBmsTelemetry = (d) => setLiveMetrics(prev => ({ ...prev, avgSoc: d.avgSoc, avgSoh: d.avgSoh, activeFaults: d.activeFaults }));
    const handleProductionCounters = (d) => setLiveMetrics(prev => ({ ...prev, cellsProducedToday: d.cellsProducedToday, packsAssembledToday: d.packsAssembledToday, packsShippedToday: d.packsShippedToday }));
    const handleQualityLive = (d) => setLiveMetrics(prev => ({ ...prev, defectRatePct: d.defectRatePct, qualityPassPct: d.qualityPassPct }));
    const handleAlerts = (d) => setAlerts(d.alerts || []);

    socket.on('factory_metrics', handleFactoryMetrics);
    socket.on('energy_pulse', handleEnergyPulse);
    socket.on('bms_telemetry', handleBmsTelemetry);
    socket.on('production_counters', handleProductionCounters);
    socket.on('quality_live', handleQualityLive);
    socket.on('alert_stream', handleAlerts);

    return () => {
      socket.off('factory_metrics', handleFactoryMetrics);
      socket.off('energy_pulse', handleEnergyPulse);
      socket.off('bms_telemetry', handleBmsTelemetry);
      socket.off('production_counters', handleProductionCounters);
      socket.off('quality_live', handleQualityLive);
      socket.off('alert_stream', handleAlerts);
    };
  }, [fetchData]);

  const kpis = data?.kpis || {};

  // KPI Cards definition (mix of live socket + DB)
  const KPI_CARDS = [
    { label: 'Production Today', value: liveMetrics.cellsProducedToday ?? kpis.totalProductionToday ?? '—', unit: 'cells', icon: FiCpu, color: '#3b82f6', live: !!liveMetrics.cellsProducedToday },
    { label: 'Monthly Output', value: fmt(kpis.monthlyProductionOutput), unit: 'batches', icon: FiBarChart2, color: '#8b5cf6', live: false },
    { label: 'OEE', value: liveMetrics.oee ?? kpis.oee ?? '—', unit: '%', icon: FiActivity, color: '#22c55e', live: true },
    { label: 'Factory Utilization', value: liveMetrics.utilization ?? kpis.factoryUtilization ?? '—', unit: '%', icon: FiGlobe, color: '#f97316', live: true },
    { label: 'Total Revenue', value: fmtCr(kpis.totalRevenue), unit: '', icon: FiDollarSign, color: '#10b981', live: false },
    { label: 'Profit Margin', value: kpis.profitMarginPct ?? '—', unit: '%', icon: FiTrendingUp, color: '#a855f7', live: false },
    { label: 'Inventory Value', value: fmtCr(kpis.totalInventory * 50000), unit: '', icon: FiPackage, color: '#f59e0b', live: false },
    { label: 'Order Fulfillment', value: kpis.orderFulfillmentRate ?? '—', unit: '%', icon: FiTruck, color: '#06b6d4', live: false },
    { label: 'Warranty Claims', value: kpis.warrantyOpen ?? '—', unit: 'open', icon: FiShield, color: '#ef4444', live: false },
    { label: 'Quality Pass Rate', value: liveMetrics.qualityPassPct ?? kpis.qualityPassRate ?? '—', unit: '%', icon: FiCheckCircle, color: '#22c55e', live: true },
    { label: 'Plant Power', value: liveMetrics.plantKw ?? kpis.energyKwhToday ?? '—', unit: 'kW', icon: FiZap, color: '#eab308', live: true },
    { label: 'Carbon Footprint', value: liveMetrics.carbonGPerMin ?? '—', unit: 'g/min', icon: FiWind, color: '#64748b', live: true },
  ];

  const lineData = {
    labels: (data?.productionTrend || []).map(m => m.month),
    datasets: [
      {
        label: 'Batches',
        data: (data?.productionTrend || []).map(m => m.batches),
        borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)',
        fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#3b82f6'
      },
      {
        label: 'Units',
        data: (data?.productionTrend || []).map(m => m.units),
        borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#22c55e',
        yAxisID: 'y1'
      }
    ]
  };

  const revenueData = {
    labels: (data?.monthlyTrend || []).map(m => m.month),
    datasets: [{
      label: 'Revenue (₹)',
      data: (data?.monthlyTrend || []).map(m => m.revenue),
      backgroundColor: (data?.monthlyTrend || []).map((_, i) => `hsla(${160 + i * 20},70%,50%,0.85)`),
      borderRadius: 8, barThickness: 28,
    }]
  };

  const lineOptions = {
    ...CHART_DEFAULTS,
    responsive: true,
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: '#1e2a3a' } },
      y: { ticks: { color: '#64748b' }, grid: { color: '#1e2a3a' }, position: 'left' },
      y1: { ticks: { color: '#22c55e' }, grid: { display: false }, position: 'right' }
    }
  };
  const barOptions = { ...CHART_DEFAULTS, responsive: true, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b' }, grid: { color: '#1e2a3a' } } } };

  // Heatmap data: quality by hour (simulated from live defect rate)
  const heatmapHours = ['6AM','8AM','10AM','12PM','2PM','4PM','6PM','8PM'];
  const heatmapDays = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const heatmapBase = liveMetrics.qualityPassPct || kpis.qualityPassRate || 95;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-14 h-14 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      <p className="text-slate-400 text-sm animate-pulse">Loading EV Dashboard...</p>
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-3 p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
      <FiAlertTriangle className="w-5 h-5 shrink-0" /> {error}
      <button onClick={fetchData} className="ml-auto text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-all"><FiRefreshCw className="w-3.5 h-3.5 inline mr-1" />Retry</button>
    </div>
  );

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Live Factory Intelligence</span>
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tight">EV Battery Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Executive Overview · Real-time manufacturing intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && <span className="text-[10px] text-slate-500">Updated {lastUpdate.toLocaleTimeString()}</span>}
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-green-500/40 transition-all text-xs font-bold">
            <FiRefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Live Alerts Strip */}
      {alerts.length > 0 && (
        <div className="bg-[#0d1117] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-800">
            <FiBell className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Live Alert Stream</span>
            <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">{alerts.filter(a=>a.type==='error'||a.type==='warning').length} Active</span>
          </div>
          <div className="flex gap-4 px-5 py-3 overflow-x-auto no-scrollbar">
            {alerts.slice(0, 6).map((alert, i) => (
              <div key={alert.id || i} className={`flex items-center gap-2.5 shrink-0 px-4 py-2 rounded-xl border text-xs font-semibold ${
                alert.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                alert.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' :
                'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${alert.type==='error'?'bg-red-400':alert.type==='warning'?'bg-yellow-400':alert.type==='success'?'bg-green-400':'bg-blue-400'} animate-pulse`}/>
                <span className="text-slate-400 font-bold">{alert.source}:</span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {KPI_CARDS.map((card) => (
          <div key={card.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5 hover:border-slate-600 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at top right, ${card.color}08 0%, transparent 70%)` }} />
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}18` }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
              {card.live && (
                <span className="flex items-center gap-1 text-[8px] font-black text-green-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Live
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-white italic tracking-tight">
              {card.value}{card.unit && <span className="text-sm font-bold text-slate-500 ml-1">{card.unit}</span>}
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Trend Line */}
        <div className="lg:col-span-2 bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-black italic uppercase text-sm tracking-wide">Production Trend</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase mt-0.5">6-Month Batch & Unit Output</p>
            </div>
            <Link to="/admin/ev/production" className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all">
              <FiArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {(data?.productionTrend || []).length > 0 ? (
            <Line data={lineData} options={lineOptions} height={100} />
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">
              No production data yet — batches will appear here
            </div>
          )}
        </div>

        {/* Revenue Bar */}
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-black italic uppercase text-sm tracking-wide">Revenue</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase mt-0.5">Monthly Collection</p>
            </div>
            <Link to="/admin/ev/finance" className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all">
              <FiArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          {(data?.monthlyTrend || []).length > 0 ? (
            <Bar data={revenueData} options={barOptions} height={140} />
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No revenue data</div>
          )}
        </div>
      </div>

      {/* Live Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'OEE Score', value: liveMetrics.oee, max: 100, unit: '%', color: '#22c55e', icon: FiActivity, link: '/admin/ev/production', target: 85 },
          { label: 'First Pass Yield', value: liveMetrics.fpy, max: 100, unit: '%', color: '#3b82f6', icon: FiAward, link: '/admin/ev/quality', target: 95 },
          { label: 'Avg Battery SOC', value: liveMetrics.avgSoc, max: 100, unit: '%', color: '#8b5cf6', icon: FiZap, link: '/admin/ev/bms', target: 80 },
          { label: 'Avg Battery SOH', value: liveMetrics.avgSoh, max: 100, unit: '%', color: '#f97316', icon: FiShield, link: '/admin/ev/bms', target: 90 },
        ].map((m) => (
          <Link key={m.label} to={m.link} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5 hover:border-slate-600 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="text-3xl font-black italic text-white mb-3">
              {m.value?.toFixed?.(1) ?? '—'}<span className="text-base font-bold text-slate-500 ml-1">{m.unit}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(m.value || 0, 100)}%`, backgroundColor: m.color }} />
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 font-bold mt-1.5 uppercase">
              <span>0%</span>
              <span className="text-slate-500">Target: {m.target}%</span>
              <span>100%</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quality Heatmap */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-black italic uppercase text-sm tracking-wide">Quality Heatmap</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-0.5">Pass Rate % by Shift × Day (Live-derived)</p>
          </div>
          <Link to="/admin/ev/quality" className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all">
            <FiArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 mb-2 ml-12">
            {heatmapHours.map(h => <div key={h} className="w-10 text-center text-[9px] text-slate-500 font-bold shrink-0">{h}</div>)}
          </div>
          {heatmapDays.map((day) => (
            <div key={day} className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-slate-500 font-bold w-10 text-right uppercase">{day}</span>
              <div className="flex gap-2">
                {heatmapHours.map((h, hi) => {
                  const variance = (Math.sin(day.charCodeAt(0) + hi) * 8);
                  const val = Math.min(100, Math.max(70, heatmapBase + variance));
                  const bg = val > 97 ? '#22c55e' : val > 93 ? '#84cc16' : val > 88 ? '#f59e0b' : val > 82 ? '#f97316' : '#ef4444';
                  const opacity = (val - 70) / 30;
                  return (
                    <div key={h} className="w-10 h-8 rounded-lg flex items-center justify-center text-[8px] font-black text-white/90 shrink-0 cursor-default hover:scale-110 transition-transform"
                      style={{ backgroundColor: bg, opacity: 0.4 + opacity * 0.6 }}
                      title={`${day} ${h}: ${val.toFixed(0)}%`}>
                      {val.toFixed(0)}%
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 mt-4 ml-12">
            {[['#ef4444','<83%'],['#f97316','83-88%'],['#f59e0b','88-93%'],['#84cc16','93-97%'],['#22c55e','>97%']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: c }} />
                <span className="text-[9px] text-slate-400 font-bold">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation to All Modules */}
      <div>
        <h3 className="text-white font-black italic uppercase text-sm tracking-widest mb-4">Manufacturing Modules</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { to: '/admin/ev/production', label: 'Production', icon: FiCpu, color: '#3b82f6' },
            { to: '/admin/ev/cell-manufacturing', label: 'Cell Mfg', icon: FiZap, color: '#8b5cf6' },
            { to: '/admin/ev/quality', label: 'Quality', icon: FiCheckCircle, color: '#22c55e' },
            { to: '/admin/ev/testing', label: 'Testing Lab', icon: FiActivity, color: '#f97316' },
            { to: '/admin/ev/bms', label: 'BMS', icon: FiShield, color: '#a855f7' },
            { to: '/admin/ev/inventory', label: 'Inventory', icon: FiPackage, color: '#f59e0b' },
            { to: '/admin/ev/supply-chain', label: 'Supply Chain', icon: FiTruck, color: '#06b6d4' },
            { to: '/admin/ev/maintenance', label: 'Maintenance', icon: FiAlertTriangle, color: '#ef4444' },
            { to: '/admin/ev/sustainability', label: 'ESG', icon: FiWind, color: '#10b981' },
            { to: '/admin/ev/finance', label: 'Finance', icon: FiDollarSign, color: '#84cc16' },
            { to: '/admin/ev/compliance', label: 'Compliance', icon: FiAward, color: '#64748b' },
            { to: '/admin/ev/traceability', label: 'Traceability', icon: FiBarChart2, color: '#14b8a6' },
            { to: '/admin/ev/ai-insights', label: 'AI Insights', icon: FiTrendingUp, color: '#818cf8' },
            { to: '/admin/ev/roles', label: 'Roles & Access', icon: FiGlobe, color: '#94a3b8' },
          ].map(m => (
            <Link key={m.to} to={m.to} className="flex items-center gap-3 p-4 rounded-xl bg-[#0d1117] border border-slate-800 hover:border-slate-600 hover:-translate-y-1 transition-all group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${m.color}18` }}>
                <m.icon className="w-4 h-4" style={{ color: m.color }} />
              </div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
