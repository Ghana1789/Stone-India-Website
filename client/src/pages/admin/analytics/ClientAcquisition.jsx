import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { FiUsers, FiUserPlus, FiUserCheck, FiUserX, FiRefreshCw } from 'react-icons/fi';
import api from '../../../services/api';
import DateRangePicker from '../../../components/DateRangePicker';
import ExportButton from '../../../components/ExportButton';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 }
  },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true }
  }
};

export default function ClientAcquisition() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('last_90_days');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchData = async (p = preset, s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const params = { preset: p };
      if (p === 'custom' && s) params.startDate = s;
      if (p === 'custom' && e) params.endDate = e;
      const r = await api.get('/admin/analytics/client-acquisition', { params });
      setData(r.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePreset = (p, s, e) => {
    setPreset(p);
    if (s) setStartDate(s);
    if (e) setEndDate(e);
    fetchData(p, s || startDate, e || endDate);
  };

  const chartData = data ? {
    labels: data.series.map(s => s.label),
    datasets: [{
      label: 'New Clients',
      data: data.series.map(s => s.newClients),
      borderColor: '#a855f7',
      backgroundColor: 'rgba(168,85,247,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#a855f7',
      pointRadius: 4,
    }]
  } : null;

  return (
    <>
      <Helmet><title>Client Acquisition — Stone India Analytics</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Client Acquisition</h1>
            <p className="text-slate-400 text-sm mt-1">New client signups and active base over time</p>
          </div>
          <div className="flex gap-3">
            <ExportButton type="csv" reportType="client_acquisition" preset={preset} startDate={startDate} endDate={endDate} />
            <ExportButton type="pdf" reportType="client_acquisition" preset={preset} startDate={startDate} endDate={endDate} />
            <button onClick={() => fetchData()} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <DateRangePicker preset={preset} onChange={handlePreset} />

        {/* Stat Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total New', value: data.totalNew, icon: FiUserPlus, color: '#a855f7' },
              { label: 'Active Clients', value: data.activeCount, icon: FiUserCheck, color: '#22c55e' },
              { label: 'Inactive', value: data.inactiveCount, icon: FiUserX, color: '#ef4444' },
              { label: 'Total Base', value: data.activeCount + data.inactiveCount, icon: FiUsers, color: '#3b82f6' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{label}</p>
                    <p className="text-slate-50 text-xl font-bold">{value?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-slate-200 font-semibold mb-4">New Clients Over Time</h2>
          {loading ? (
            <div className="h-72 flex items-center justify-center text-slate-500">
              <FiRefreshCw size={24} className="animate-spin" />
            </div>
          ) : chartData ? (
            <div className="h-72">
              <Line data={chartData} options={CHART_OPTIONS} />
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-500">No data for selected range</div>
          )}
        </div>

        {/* Recent Clients Table */}
        {data?.recentClients?.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-slate-200 font-semibold">Recent Client Signups</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Company</th>
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Joined</th>
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentClients.map((c, i) => (
                    <tr key={c._id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/20'}`}>
                      <td className="px-6 py-3 text-slate-200 text-sm font-medium">{c.name}</td>
                      <td className="px-6 py-3 text-slate-400 text-sm">{c.email}</td>
                      <td className="px-6 py-3 text-slate-400 text-sm">{c.company || '—'}</td>
                      <td className="px-6 py-3 text-slate-400 text-sm">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
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
