import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  FiUsers, FiCheckSquare, FiCalendar,
  FiCheckCircle, FiAlertTriangle, FiArrowRight,
  FiDollarSign, FiBook, FiTrendingUp, FiZap, FiShield, FiActivity,
  FiBatteryCharging, FiCpu, FiMonitor
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState({
    productionRate: '98.2%',
    qualityScore: '99.5%',
    machineUptime: '99.9%',
    trends: { productionRate: '+1.4%', qualityScore: '+0.5%', machineUptime: 'Stable' }
  });

  const fetchDashboard = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/manager/dashboard'),
        api.get('/manager/incidents', { params: { status: 'Open' } }),
      ]);
      
      const [dashRes, incRes] = results;
      
      if (dashRes.status === 'fulfilled' && dashRes.value?.data?.success) {
        setData(dashRes.value.data.data);
      }
      
      if (incRes.status === 'fulfilled' && incRes.value?.data?.success) {
        setIncidents(incRes.value.data.data?.slice(0, 3) || []);
      }
    } catch (err) {
      console.error('Dashboard Load Error:', err);
      toast.error('Failed to sync dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    socket.on('task_updated', (updatedTask) => {
      fetchDashboard();
      toast.success(`Task Progress: ${updatedTask.title}`, { icon: '📊' });
    });

    socket.on('leave_requested', (leave) => {
      fetchDashboard();
      toast(`New Leave Request: ${leave.reason}`, { icon: '📅', style: { border: '1px solid #3b82f6', background: '#09090b', color: '#fff' } });
    });

    socket.on('incident_reported', (incident) => {
      fetchDashboard();
      toast.error(`CRITICAL: ${incident.title}`, { duration: 5000 });
    });

    socket.on('batch_updated', () => {
      fetchDashboard();
    });

    socket.on('production_update', (update) => {
      setLiveMetrics({
        productionRate: update.metrics.productionRate || '98.2%',
        qualityScore: update.metrics.qualityScore || '99.5%',
        machineUptime: update.metrics.machineUptime || '99.9%',
        trends: update.trends || { productionRate: '+1.4%', qualityScore: '+0.5%', machineUptime: 'Stable' }
      });
    });

    return () => {
      socket.off('task_updated');
      socket.off('leave_requested');
      socket.off('incident_reported');
      socket.off('batch_updated');
      socket.off('production_update');
    };
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
      </div>
    );
  }

  const { teamCount, pendingTasks, pendingLeaves, pendingExpenses, recentTasks } = data || {};

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(9, 9, 11, 0.9)', titleColor: '#22d3ee', bodyColor: '#fff', borderColor: '#27272a', borderWidth: 1, padding: 12 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#52525b', font: { family: 'monospace' } } },
      y: { grid: { color: '#27272a', drawBorder: false }, ticks: { color: '#52525b', font: { family: 'monospace' } } }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  const lineChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Cell Output (k Units)',
        data: [12, 19, 15, 25, 22, 30, 28],
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#22d3ee',
        pointHoverBorderColor: '#fff',
      }
    ]
  };

  const doughnutData = {
    labels: ['Grade A', 'Grade B', 'Rejected'],
    datasets: [
      {
        data: [85, 12, 3],
        backgroundColor: ['#22d3ee', '#fcd34d', '#f87171'],
        borderColor: '#09090b',
        borderWidth: 4,
        hoverOffset: 4
      }
    ]
  };

  const doughnutOptions = {
    cutout: '75%',
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans text-slate-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FiMonitor className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Giga-Factory Command Center</h1>
          </div>
          <p className="text-zinc-500 text-sm font-mono tracking-wider uppercase">
            {user?.department || 'Operations'} // Live Telemetry Feed
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-zinc-900/50 backdrop-blur-md border border-cyan-500/30 rounded-xl px-5 py-2.5 flex items-center gap-4 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <div className="text-right">
                <div className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-widest leading-none mb-1">Grid Status</div>
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest">Optimized</div>
              </div>
           </div>
        </div>
      </div>

      {/* Large KPI Cards (Tesla Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Cell Production Yield', value: liveMetrics.productionRate, trend: liveMetrics.trends.productionRate, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', icon: FiBatteryCharging },
          { label: 'Module Assembly Quality', value: liveMetrics.qualityScore, trend: liveMetrics.trends.qualityScore, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', icon: FiShield },
          { label: 'Robotic Line Uptime', value: liveMetrics.machineUptime, trend: liveMetrics.trends.machineUptime, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5', icon: FiCpu },
        ].map(kpi => (
          <div key={kpi.label} className={`relative bg-zinc-900/40 backdrop-blur-xl border ${kpi.border} rounded-2xl p-6 overflow-hidden group hover:bg-zinc-900/80 transition-all duration-300`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-lg ${kpi.bg} backdrop-blur-sm`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <span className={`text-[11px] font-mono font-bold uppercase px-2 py-1 rounded bg-zinc-950/50 ${kpi.trend?.toString()?.startsWith('+') || kpi.trend === 'Stable' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {kpi.trend}
              </span>
            </div>
            <div className="relative z-10">
              <div className={`text-4xl md:text-5xl font-light tracking-tight ${kpi.color} drop-shadow-lg mb-2`}>{kpi.value}</div>
              <div className="text-zinc-500 text-xs font-mono uppercase tracking-widest">{kpi.label}</div>
            </div>
            {/* Ambient Glow */}
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 ${kpi.bg} blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
          </div>
        ))}
      </div>

      {/* Charts & Interactive Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-bold tracking-widest uppercase text-sm">Volume Trajectory</h3>
              <p className="text-zinc-500 text-xs font-mono mt-1">2170 Cell Production (Last 24h)</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-xs font-mono">1D</button>
              <button className="px-3 py-1 bg-zinc-950 text-zinc-500 border border-zinc-800 rounded text-xs font-mono hover:text-zinc-300">1W</button>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-1">Quality Control</h3>
            <p className="text-zinc-500 text-xs font-mono mb-6">Real-time Batch Grading</p>
          </div>
          <div className="relative h-[180px] w-full flex items-center justify-center">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-light text-cyan-400">85<span className="text-lg">%</span></span>
               <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Grade A</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="text-center p-2 bg-zinc-950 rounded border border-zinc-800/50">
              <div className="text-cyan-400 font-bold text-sm">85%</div>
              <div className="text-zinc-500 text-[9px] uppercase font-mono mt-1">Grade A</div>
            </div>
            <div className="text-center p-2 bg-zinc-950 rounded border border-zinc-800/50">
              <div className="text-amber-400 font-bold text-sm">12%</div>
              <div className="text-zinc-500 text-[9px] uppercase font-mono mt-1">Grade B</div>
            </div>
            <div className="text-center p-2 bg-zinc-950 rounded border border-zinc-800/50">
              <div className="text-rose-400 font-bold text-sm">3%</div>
              <div className="text-zinc-500 text-[9px] uppercase font-mono mt-1">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Personnel & Operations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Engineers', value: teamCount || 0, sub: 'On Shift', icon: FiUsers, color: 'text-blue-400', border: 'border-blue-500/20' },
          { label: 'System Alerts', value: pendingTasks || 0, sub: 'Requires Review', icon: FiActivity, color: 'text-rose-400', border: 'border-rose-500/20' },
          { label: 'Procurement', value: pendingExpenses || 0, sub: 'Pending POs', icon: FiDollarSign, color: 'text-amber-400', border: 'border-amber-500/20' },
          { label: 'Time Off Req', value: pendingLeaves || 0, sub: 'Awaiting Action', icon: FiCalendar, color: 'text-purple-400', border: 'border-purple-500/20' },
        ].map((stat, i) => (
          <div key={i} className={`bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:${stat.border} transition-colors group cursor-pointer`}>
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{stat.sub}</span>
            </div>
            <div className="text-3xl font-light text-white mb-1">{stat.value}</div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Engineering Tasks */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
            <h3 className="text-white font-bold tracking-widest uppercase text-sm">Engineering Queue</h3>
            <Link to="/manager/tasks" className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest hover:text-cyan-400 flex items-center gap-1">
              View All <FiArrowRight />
            </Link>
          </div>

          <div className="divide-y divide-zinc-800/50">
            {recentTasks?.map(task => (
              <div key={task._id} className="p-6 hover:bg-zinc-800/20 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <h4 className="text-md font-bold text-zinc-200 tracking-wide group-hover:text-cyan-400 transition-colors">{task.title}</h4>
                       <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-widest ${
                         task.priority === 'High' || task.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                       }`}>
                         {task.priority}
                       </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                       <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                          <FiUsers className="text-zinc-600" /> {task.assignedTo?.map(u => u.name).join(', ')}
                       </div>
                       {task.dueDate && <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                          <FiCalendar className="text-zinc-600" /> {new Date(task.dueDate).toLocaleDateString('en-IN')}
                       </div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-right">
                       <div className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest mb-1.5">{task.status}</div>
                       <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${task.progress || 0}%` }}></div>
                       </div>
                    </div>
                    <Link to={`/manager/tasks`} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all">
                       <FiArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {(!recentTasks || recentTasks?.length === 0) && (
              <div className="p-16 text-center">
                 <FiCheckCircle className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                 <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">No active tasks in queue.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Incidents */}
        <div className="space-y-6">
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
             <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
               <div className="flex items-center gap-2">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                 </span>
                 <span className="text-white font-bold text-sm uppercase tracking-widest">Active Anomalies</span>
               </div>
               <Link to="/manager/incidents" className="text-[10px] text-rose-400 font-mono uppercase tracking-widest hover:text-rose-300">
                 View All
               </Link>
             </div>
             <div className="divide-y divide-zinc-800/50">
               {incidents.length > 0 ? incidents.map(inc => (
                 <div key={inc._id} className="p-5 hover:bg-zinc-800/20 transition-colors">
                   <div className="flex items-start gap-3">
                     <FiAlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                     <div className="min-w-0">
                       <div className="text-zinc-200 text-sm font-medium truncate mb-1">{inc.title}</div>
                       <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-zinc-500">
                          <span className="bg-zinc-800 px-1.5 py-0.5 rounded">{inc.type}</span>
                          <span>·</span>
                          <span className={inc.priority === 'Critical' ? 'text-rose-400' : ''}>{inc.priority}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               )) : (
                 <div className="p-8 text-center">
                   <FiShield className="w-8 h-8 text-emerald-500/50 mx-auto mb-3" />
                   <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">Systems Nominal</p>
                 </div>
               )}
             </div>
           </div>

           <div className="bg-gradient-to-br from-cyan-950 to-zinc-900 border border-cyan-900/50 rounded-2xl p-6 relative overflow-hidden group">
              <div className="relative z-10">
                 <h4 className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2">Attention Required</h4>
                 <div className="text-xl font-light text-white mb-1">Leave Approvals</div>
                 <p className="text-zinc-400 text-xs mb-6">There are <strong className="text-cyan-400">{pendingLeaves || 0}</strong> pending requests awaiting clearance.</p>
                 <Link to="/manager/approvals" className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest">
                    Process Approvals <FiArrowRight className="w-3 h-3" />
                 </Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
