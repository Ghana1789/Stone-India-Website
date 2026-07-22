import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { FiActivity, FiCheckCircle, FiClock, FiTrendingUp, FiAward, FiRefreshCw } from 'react-icons/fi';
import api from '../../../services/api';
import DateRangePicker from '../../../components/DateRangePicker';
import ExportButton from '../../../components/ExportButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 } },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true }
  }
};

export default function EmployeeProductivity() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('last_30_days');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchData = async (p = preset, s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const params = { preset: p };
      if (p === 'custom' && s) params.startDate = s;
      if (p === 'custom' && e) params.endDate = e;
      const r = await api.get('/admin/analytics/employee-productivity', { params });
      setData(r.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePreset = (p, s, e) => {
    setPreset(p); if (s) setStartDate(s); if (e) setEndDate(e);
    fetchData(p, s || startDate, e || endDate);
  };

  const deptChartData = data?.deptProductivity ? {
    labels: data.deptProductivity.map(d => d._id?.split(' ').slice(0, 2).join(' ') || 'Unknown'),
    datasets: [{
      label: 'Tasks Completed',
      data: data.deptProductivity.map(d => d.tasksCompleted),
      backgroundColor: ['#3b82f699', '#22c55e99', '#a855f799', '#f59e0b99', '#06b6d499', '#ef444499', '#f97316', '#10b981'],
      borderRadius: 6,
    }]
  } : null;

  const trendChartData = data?.series ? {
    labels: data.series.map(s => s.label),
    datasets: [{
      label: 'Tasks Completed',
      data: data.series.map(s => s.completed),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      fill: true, tension: 0.4,
      pointBackgroundColor: '#10b981', pointRadius: 4,
    }]
  } : null;

  return (
    <>
      <Helmet><title>Employee Productivity — Stone India Analytics</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Employee Productivity</h1>
            <p className="text-slate-400 text-sm mt-1">Task completion, department performance, and top performers</p>
          </div>
          <div className="flex gap-3">
            <ExportButton type="csv" reportType="employee_productivity" preset={preset} startDate={startDate} endDate={endDate} />
            <ExportButton type="pdf" reportType="employee_productivity" preset={preset} startDate={startDate} endDate={endDate} />
            <button onClick={() => fetchData()} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <DateRangePicker preset={preset} onChange={handlePreset} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tasks Completed', value: data?.totalCompleted?.toLocaleString('en-IN') || '—', icon: FiCheckCircle, color: '#10b981' },
            { label: 'In Progress', value: data?.totalInProgress?.toLocaleString('en-IN') || '—', icon: FiActivity, color: '#3b82f6' },
            { label: 'Pending', value: data?.totalPending?.toLocaleString('en-IN') || '—', icon: FiClock, color: '#f59e0b' },
            { label: 'Productivity Index', value: data ? `${data.productivityIndex}%` : '—', icon: FiTrendingUp, color: (data?.productivityIndex || 0) >= 60 ? '#22c55e' : '#ef4444' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">{label}</p>
                  <p className="text-slate-50 text-xl font-bold">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-slate-200 font-semibold mb-4">Completion Trend</h2>
            {loading ? <div className="h-64 flex items-center justify-center"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
              : trendChartData ? <div className="h-64"><Line data={trendChartData} options={CHART_OPTIONS} /></div>
              : <div className="h-64 flex items-center justify-center text-slate-500">No trend data</div>}
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-slate-200 font-semibold mb-4">By Department</h2>
            {loading ? <div className="h-64 flex items-center justify-center"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
              : deptChartData ? <div className="h-64"><Bar data={deptChartData} options={{ ...CHART_OPTIONS, indexAxis: 'y' }} /></div>
              : <div className="h-64 flex items-center justify-center text-slate-500">No department data</div>}
          </div>
        </div>

        {/* Top Performers */}
        {data?.topPerformers?.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
              <FiAward size={16} className="text-yellow-400" />
              <h2 className="text-slate-200 font-semibold">Top Performers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Rank</th>
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Employee</th>
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">ID</th>
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Department</th>
                    <th className="text-right px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPerformers.map((e, i) => (
                    <tr key={e._id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/20'}`}>
                      <td className="px-6 py-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-700/20 text-amber-500' : 'text-slate-500'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-200 text-sm font-medium">{e.name}</td>
                      <td className="px-6 py-3 text-slate-400 text-sm font-mono">{e.employeeId || '—'}</td>
                      <td className="px-6 py-3 text-slate-400 text-sm">{e.department || '—'}</td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-emerald-400 font-bold text-sm">{e.tasksCompleted}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
