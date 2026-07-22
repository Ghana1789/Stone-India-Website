import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  FiUsers, FiBriefcase, FiPackage, FiActivity, FiArrowUpRight, 
  FiAlertTriangle, FiX, FiTrendingUp, FiZap, FiGrid, FiGitBranch,
  FiDroplet, FiCheckCircle, FiSettings, FiWind, FiShield, FiTrendingDown
} from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const DEPT_SPOTS = [
  { name: 'Production Floor', status: 'Active', employees: 18, dot: '#22c55e' },
  { name: 'Quality Lab', status: 'Active', employees: 9, dot: '#22c55e' },
  { name: 'Predictive Maint', status: 'Alert', employees: 6, dot: '#ef4444' },
  { name: 'Compliance & Safety', status: 'Active', employees: 7, dot: '#22c55e' },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real-Time Socket Streams (Tesla/CATL style)
  const [livePulse, setLivePulse] = useState({
    oee: 82.4,
    fpy: 94.8,
    throughput: 127,
    plantKw: 342.5,
    carbonGPerMin: 58.4,
    waterLPerHr: 120.3,
    activeFaults: 2
  });

  const [alerts, setAlerts] = useState([
     { id: 1, type: 'warning', source: 'M-007', message: 'Welding Station #1 vibration above threshold (4.2 mm/s)' },
     { id: 2, type: 'success', source: 'QC-Lab', message: 'Batch CB-2026-00142 passed formation QC (96.2/100)' }
  ]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const r = await api.get('/admin/dashboard');
        setData(r.data.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();

    // Ingest real-time OPC UA / SCADA simulated telemetry from server
    socket.on('factory_metrics', (metrics) => {
      setLivePulse(prev => ({
        ...prev,
        oee: metrics.oee ?? prev.oee,
        fpy: metrics.fpy ?? prev.fpy,
        throughput: metrics.throughput ?? prev.throughput
      }));
    });

    socket.on('energy_pulse', (energy) => {
      setLivePulse(prev => ({
        ...prev,
        plantKw: energy.plantKw ?? prev.plantKw,
        carbonGPerMin: energy.carbonGPerMin ?? prev.carbonGPerMin,
        waterLPerHr: energy.waterLPerHr ?? prev.waterLPerHr
      }));
    });

    socket.on('bms_telemetry', (bms) => {
      setLivePulse(prev => ({
        ...prev,
        activeFaults: bms.activeFaults ?? prev.activeFaults
      }));
    });

    socket.on('alert_stream', (d) => {
      if (d.alerts && d.alerts.length > 0) {
        setAlerts(d.alerts.slice(0, 3));
      }
    });

    return () => {
      socket.off('factory_metrics');
      socket.off('energy_pulse');
      socket.off('bms_telemetry');
      socket.off('alert_stream');
    };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-400">
      <FiAlertTriangle className="w-5 h-5 mr-2" /> {error}
    </div>
  );

  const { stats, monthlyActivity } = data || {};

  // Historical production line efficiency chart
  const speedChartData = {
    labels: (monthlyActivity || []).map(m => m.month),
    datasets: [
      {
        label: 'Production Volume (Cells)',
        data: (monthlyActivity || []).map(m => m.orders * 80),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3
      },
      {
        label: 'Revenue (₹k)',
        data: (monthlyActivity || []).map(m => Math.round(m.revenue / 1000)),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        fill: true,
        tension: 0.4,
        pointRadius: 3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 10 } } },
      tooltip: { backgroundColor: '#0d1117' }
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { display: false } },
      y: { ticks: { color: '#64748b' }, grid: { color: '#1e293b' } }
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Industry 4.0 Operations Control</span>
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Plant Command Console</h1>
        </div>

        <div className="flex bg-[#13161e] p-1.5 rounded-xl border border-slate-800 self-start sm:self-center">
          <div className="flex items-center gap-2 px-3 py-1 border-r border-slate-800">
            <FiShield className="text-red-500 w-3.5 h-3.5" />
            <span className="text-[9px] text-white font-black uppercase tracking-widest">Admin Mode</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1">
            <FiActivity className="text-emerald-500 w-3.5 h-3.5" />
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">OPC UA Link Active</span>
          </div>
        </div>
      </div>

      {/* Real-time SCADA / Live Metrics Bar */}
      <div className="bg-gradient-to-r from-emerald-900/10 to-blue-900/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="text-xs font-black text-white uppercase tracking-wider">Live telemetry:</span>
        </div>
        
        <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <FiActivity className="text-emerald-400 w-4 h-4" />
            <span>OEE Rate: <strong className="text-white">{livePulse.oee}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiCheckCircle className="text-blue-400 w-4 h-4" />
            <span>FPY Quality: <strong className="text-white">{livePulse.fpy}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiZap className="text-amber-400 w-4 h-4" />
            <span>Power Draw: <strong className="text-white">{livePulse.plantKw} kW</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiWind className="text-red-400 w-4 h-4" />
            <span>Carbon rate: <strong className="text-white">{livePulse.carbonGPerMin} g/min</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiDroplet className="text-sky-400 w-4 h-4" />
            <span>Water Usage: <strong className="text-white">{livePulse.waterLPerHr} L/hr</strong></span>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Factory Operators', value: stats?.totalEmployees ?? 0, desc: `${stats?.totalManagers ?? 0} Floor Supervisors`, icon: FiUsers, color: '#3b82f6' },
          { label: 'Active Batches (Daily)', value: stats?.totalBatteries ?? 0, desc: `${stats?.pendingWarranty ?? 0} Quality Claims`, icon: FiPackage, color: '#f59e0b' },
          { label: 'Plant Gross Yield', value: formatCurrency(stats?.totalRevenue), desc: `${stats?.pendingOrders ?? 0} Pending dispatch`, icon: FiBriefcase, color: '#10b981' },
          { label: 'Active Alarm Watch', value: `${livePulse.activeFaults} Alerts`, desc: 'Critical limit triggers', icon: FiAlertTriangle, color: '#ef4444' }
        ].map((card, idx) => (
          <div key={idx} className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.desc}</span>
            </div>
            <div className="text-3xl font-black text-white tracking-wide italic">{card.value}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-2">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Plant Production Trend */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Historical Output vs Revenue Velocity</h3>
            <p className="text-slate-400 text-xs mt-0.5">Cell yield statistics aggregated against revenue profiles</p>
          </div>
          <div className="h-64 mt-6">
            <Line data={speedChartData} options={chartOptions} />
          </div>
        </div>

        {/* Live Alarm & Dispatch Center */}
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col justify-between">
          <div>
             <h3 className="text-lg font-bold text-white tracking-wide mb-1">Active SCADA Alarms</h3>
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time floor notifications</span>
          </div>

          <div className="space-y-4 my-6 flex-1 overflow-y-auto max-h-[220px] pr-1">
             {alerts.map((alert, idx) => (
               <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 ${
                 alert.type === 'warning' || alert.type === 'error' 
                   ? 'bg-red-500/5 border-red-500/10 text-red-400' 
                   : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
               }`}>
                 <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                 <div>
                    <div className="text-xs font-bold text-white">{alert.message}</div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 block">Source: {alert.source || 'PLC Engine'}</span>
                 </div>
               </div>
             ))}
          </div>

          <Link to="/admin/incidents" className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-center text-xs font-bold transition-all border border-slate-700 block">Open Incident Logs</Link>
        </div>
      </div>

      {/* Production Flow Stage Monitor */}
      <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
         <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Manufacturing Layout Board</h3>
              <p className="text-slate-400 text-xs mt-0.5">OPC UA validation checkpoints</p>
            </div>
            <Link to="/admin/process-flow" className="text-xs font-bold text-emerald-400 hover:text-emerald-300">Detailed Flow Layout →</Link>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
           {DEPT_SPOTS.map((dept, i) => (
             <div key={dept.name} className={`p-3 ${i > 0 ? 'md:pl-6' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                   <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.dot }} />
                   <span className={`text-[9px] font-black uppercase tracking-wider ${dept.status === 'Alert' ? 'text-red-400' : 'text-emerald-400'}`}>{dept.status}</span>
                </div>
                <h4 className="text-white text-xs font-bold leading-tight">{dept.name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">{dept.employees} Operators assigned</p>
             </div>
           ))}
         </div>
      </div>

      {/* Core EV Modules Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
         {[
           { label: 'Overview', to: '/admin/ev-dashboard', icon: FiGrid, color: '#3b82f6' },
           { label: 'Production Line', to: '/admin/ev-dashboard/production', icon: FiZap, color: '#8b5cf6' },
           { label: 'Traceability', to: '/admin/ev-dashboard/traceability', icon: FiGitBranch, color: '#f59e0b' },
           { label: 'Quality Control', to: '/admin/ev-dashboard/quality', icon: FiShield, color: '#ef4444' },
           { label: 'Maintenance', to: '/admin/ev-dashboard/maintenance', icon: FiSettings, color: '#10b981' },
           { label: 'ESG / Sustainability', to: '/admin/ev-dashboard/sustainability', icon: FiWind, color: '#ec4899' }
         ].map((module, idx) => (
           <Link key={idx} to={module.to} className="p-5 bg-slate-900/40 hover:bg-slate-800/40 rounded-2xl border border-white/5 hover:border-emerald-500/20 flex flex-col items-center justify-center gap-3 transition-all text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: module.color + '15' }}>
                 <module.icon className="w-5 h-5" style={{ color: module.color }} />
              </div>
              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-wider leading-tight">{module.label}</span>
           </Link>
         ))}
      </div>

    </div>
  );
}
