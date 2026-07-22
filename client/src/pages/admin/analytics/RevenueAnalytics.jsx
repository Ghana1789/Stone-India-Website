import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiShoppingBag, FiRefreshCw } from 'react-icons/fi';
import api from '../../../services/api';
import DateRangePicker from '../../../components/DateRangePicker';
import ExportButton from '../../../components/ExportButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 } },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => `₹${(v/1000).toFixed(0)}K` }, beginAtZero: true }
  }
};

export default function RevenueAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('this_year');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchData = async (p = preset, s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const params = { preset: p };
      if (p === 'custom' && s) params.startDate = s;
      if (p === 'custom' && e) params.endDate = e;
      const r = await api.get('/admin/analytics/revenue', { params });
      setData(r.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePreset = (p, s, e) => {
    setPreset(p); if (s) setStartDate(s); if (e) setEndDate(e);
    fetchData(p, s || startDate, e || endDate);
  };

  const revenueChartData = data?.series ? {
    labels: data.series.map(s => s.label),
    datasets: [{
      label: 'Revenue',
      data: data.series.map(s => s.revenue),
      backgroundColor: data.series.map((_, i) => `hsla(${140 + i * 15}, 60%, 45%, 0.7)`),
      borderColor: '#22c55e',
      borderWidth: 1, borderRadius: 6,
    }]
  } : null;

  const avgChartData = data?.series ? {
    labels: data.series.map(s => s.label),
    datasets: [{
      label: 'Avg Order Value (₹)',
      data: data.series.map(s => s.avgOrderValue),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true, tension: 0.4,
      pointBackgroundColor: '#3b82f6', pointRadius: 4,
    }]
  } : null;

  const growthPositive = (data?.revenueGrowthPct || 0) >= 0;

  return (
    <>
      <Helmet><title>Revenue Analytics — Stone India Analytics</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Revenue Analytics</h1>
            <p className="text-slate-400 text-sm mt-1">Revenue trends, growth metrics, and top clients by revenue</p>
          </div>
          <div className="flex gap-3">
            <ExportButton type="csv" reportType="revenue" preset={preset} startDate={startDate} endDate={endDate} />
            <ExportButton type="pdf" reportType="revenue" preset={preset} startDate={startDate} endDate={endDate} title="Revenue Analytics Report" />
            <button onClick={() => fetchData()} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <DateRangePicker preset={preset} onChange={handlePreset} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: data ? `₹${data.totalRevenue.toLocaleString('en-IN')}` : '—', icon: FiDollarSign, color: '#22c55e' },
            { label: 'vs Prior Period', value: data?.revenueGrowthPct !== null && data?.revenueGrowthPct !== undefined ? `${data.revenueGrowthPct > 0 ? '+' : ''}${data.revenueGrowthPct}%` : 'N/A', icon: growthPositive ? FiTrendingUp : FiTrendingDown, color: growthPositive ? '#22c55e' : '#ef4444' },
            { label: 'Total Orders (Paid)', value: data?.totalOrders?.toLocaleString('en-IN') || '—', icon: FiShoppingBag, color: '#3b82f6' },
            { label: 'Avg Order Value', value: data ? `₹${data.avgOrderValue.toLocaleString('en-IN')}` : '—', icon: FiTrendingUp, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">{label}</p>
                  <p className="text-slate-50 text-xl font-bold">{loading ? '…' : value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-slate-200 font-semibold mb-4">Monthly Revenue</h2>
            {loading ? <div className="h-64 flex items-center justify-center"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
              : revenueChartData ? <div className="h-64"><Bar data={revenueChartData} options={CHART_OPTIONS} /></div>
              : <div className="h-64 flex items-center justify-center text-slate-500">No data</div>}
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-slate-200 font-semibold mb-4">Avg Order Value Trend</h2>
            {loading ? <div className="h-64 flex items-center justify-center"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
              : avgChartData ? <div className="h-64"><Line data={avgChartData} options={{ ...CHART_OPTIONS, scales: { ...CHART_OPTIONS.scales, y: { ...CHART_OPTIONS.scales.y, ticks: { color: '#64748b', callback: v => `₹${v.toLocaleString('en-IN')}` } } } }} /></div>
              : <div className="h-64 flex items-center justify-center text-slate-500">No data</div>}
          </div>
        </div>

        {/* Top Clients by Revenue */}
        {data?.revenueByClient?.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-slate-200 font-semibold">Top Clients by Revenue</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Client</th>
                    <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Company</th>
                    <th className="text-right px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Orders</th>
                    <th className="text-right px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Revenue</th>
                    <th className="text-right px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueByClient.map((c, i) => {
                    const share = data.totalRevenue > 0 ? ((c.revenue / data.totalRevenue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={c._id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/20'}`}>
                        <td className="px-6 py-3 text-slate-200 text-sm font-medium">{c.name}</td>
                        <td className="px-6 py-3 text-slate-400 text-sm">{c.company}</td>
                        <td className="px-6 py-3 text-right text-slate-300 text-sm">{c.orderCount}</td>
                        <td className="px-6 py-3 text-right text-emerald-400 font-bold text-sm">₹{c.revenue.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-700 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-slate-400 text-xs w-10 text-right">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
