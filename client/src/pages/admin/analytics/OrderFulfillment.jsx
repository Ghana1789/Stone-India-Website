import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { FiPackage, FiCheckCircle, FiClock, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';
import api from '../../../services/api';
import DateRangePicker from '../../../components/DateRangePicker';
import ExportButton from '../../../components/ExportButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } } },
    tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 }
  },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true }
  }
};

const STATUS_COLORS = {
  Pending: '#f59e0b', Confirmed: '#3b82f6', Manufacturing: '#8b5cf6',
  QC: '#ec4899', Dispatched: '#06b6d4', Delivered: '#22c55e', Cancelled: '#ef4444'
};

export default function OrderFulfillment() {
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
      const r = await api.get('/admin/analytics/order-fulfillment', { params });
      setData(r.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePreset = (p, s, e) => {
    setPreset(p);
    if (s) setStartDate(s);
    if (e) setEndDate(e);
    fetchData(p, s || startDate, e || endDate);
  };

  const totalOrders = data?.series?.reduce((s, r) => s + r.totalOrders, 0) || 0;
  const totalDelivered = data?.series?.reduce((s, r) => s + r.delivered, 0) || 0;
  const overallRate = totalOrders > 0 ? ((totalDelivered / totalOrders) * 100).toFixed(1) : 0;
  const totalRevenue = data?.series?.reduce((s, r) => s + r.revenue, 0) || 0;

  const volumeChartData = data ? {
    labels: data.series.map(s => s.label),
    datasets: [
      { label: 'Total Orders', data: data.series.map(s => s.totalOrders), backgroundColor: '#3b82f644', borderColor: '#3b82f6', borderWidth: 2, borderRadius: 6 },
      { label: 'Delivered', data: data.series.map(s => s.delivered), backgroundColor: '#22c55e44', borderColor: '#22c55e', borderWidth: 2, borderRadius: 6 },
    ]
  } : null;

  const rateChartData = data ? {
    labels: data.series.map(s => s.label),
    datasets: [{
      label: 'Fulfillment Rate (%)',
      data: data.series.map(s => s.fulfillmentRate),
      backgroundColor: data.series.map(s => s.fulfillmentRate >= 80 ? '#22c55e99' : s.fulfillmentRate >= 60 ? '#f59e0b99' : '#ef444499'),
      borderRadius: 6
    }]
  } : null;

  return (
    <>
      <Helmet><title>Order Fulfillment — Stone India Analytics</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Order Fulfillment</h1>
            <p className="text-slate-400 text-sm mt-1">Order volume, delivery rates, and revenue trends</p>
          </div>
          <div className="flex gap-3">
            <ExportButton type="csv" reportType="order_fulfillment" preset={preset} startDate={startDate} endDate={endDate} />
            <ExportButton type="pdf" reportType="order_fulfillment" preset={preset} startDate={startDate} endDate={endDate} />
            <button onClick={() => fetchData()} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <DateRangePicker preset={preset} onChange={handlePreset} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: totalOrders.toLocaleString('en-IN'), icon: FiPackage, color: '#3b82f6' },
            { label: 'Delivered', value: totalDelivered.toLocaleString('en-IN'), icon: FiCheckCircle, color: '#22c55e' },
            { label: 'Fulfillment Rate', value: `${overallRate}%`, icon: FiTrendingUp, color: overallRate >= 80 ? '#22c55e' : '#f59e0b' },
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: FiClock, color: '#a855f7' },
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
            <h2 className="text-slate-200 font-semibold mb-4">Order Volume</h2>
            {loading ? (
              <div className="h-64 flex items-center justify-center"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
            ) : volumeChartData ? (
              <div className="h-64"><Bar data={volumeChartData} options={CHART_OPTIONS} /></div>
            ) : <div className="h-64 flex items-center justify-center text-slate-500">No data</div>}
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-slate-200 font-semibold mb-4">Fulfillment Rate by Period</h2>
            {loading ? (
              <div className="h-64 flex items-center justify-center"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
            ) : rateChartData ? (
              <div className="h-64"><Bar data={rateChartData} options={{ ...CHART_OPTIONS, plugins: { ...CHART_OPTIONS.plugins, legend: { display: false } } }} /></div>
            ) : <div className="h-64 flex items-center justify-center text-slate-500">No data</div>}
          </div>
        </div>

        {/* Status Distribution */}
        {data?.statusDistribution?.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-slate-200 font-semibold mb-4">Order Status Distribution</h2>
            <div className="flex flex-wrap gap-3">
              {data.statusDistribution.map(s => (
                <div key={s._id} className="flex items-center gap-2 bg-slate-700/40 rounded-xl px-4 py-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s._id] || '#64748b' }} />
                  <span className="text-slate-300 text-sm">{s._id}</span>
                  <span className="text-slate-400 text-sm font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
