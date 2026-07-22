import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../../services/api';
import {
  FiTrendingUp, FiUsers, FiPackage, FiDollarSign, FiActivity,
  FiCheckCircle, FiAlertTriangle, FiClock, FiArrowUpRight, FiArrowDownRight,
  FiRefreshCw
} from 'react-icons/fi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import DateRangePicker from '../../../components/DateRangePicker';
import ExportButton from '../../../components/ExportButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 } },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } }
  }
};

function KpiCard({ label, value, sub, icon: Icon, color, trend, trendUp }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-600/60 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`} style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-slate-50 text-2xl font-bold mt-1 truncate">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {trendUp ? <FiArrowUpRight size={13} /> : <FiArrowDownRight size={13} />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsHub() {
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
      const r = await api.get('/admin/analytics/overview', { params });
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

  const fmt = (n) => typeof n === 'number' ? n.toLocaleString('en-IN') : n;
  const fmtRs = (n) => `₹${fmt(n)}`;

  return (
    <>
      <Helmet><title>Analytics Hub — Stone India EV Admin</title></Helmet>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Analytics Hub</h1>
            <p className="text-slate-400 text-sm mt-1">Business intelligence overview across all operations</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ExportButton type="csv" reportType="overview" preset={preset} startDate={startDate} endDate={endDate}>Export CSV</ExportButton>
            <ExportButton type="pdf" reportType="overview" preset={preset} startDate={startDate} endDate={endDate}>Export PDF</ExportButton>
            <button onClick={() => fetchData()} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Date Range */}
        <DateRangePicker preset={preset} onChange={handlePreset} />

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Revenue" value={fmtRs(data.totalRevenue)} icon={FiDollarSign} color="#22c55e" sub={`${data.orderCount} paid orders`} />
            <KpiCard label="Fulfillment Rate" value={`${data.fulfillmentRate}%`} icon={FiCheckCircle} color="#3b82f6" sub={`${data.fulfilledOrders} of ${data.orderCount} delivered`} trendUp={data.fulfillmentRate >= 80} trend={data.fulfillmentRate >= 80 ? 'On target' : 'Below target'} />
            <KpiCard label="New Clients" value={fmt(data.newClients)} icon={FiUsers} color="#a855f7" sub={`${data.activeClients} total active`} />
            <KpiCard label="Avg Processing" value={`${data.avgProcessingDays} days`} icon={FiClock} color="#f59e0b" sub="Order to delivery" trendUp={Number(data.avgProcessingDays) <= 7} trend={Number(data.avgProcessingDays) <= 7 ? 'Within SLA' : 'Above SLA'} />
            <KpiCard label="Tasks Completed" value={fmt(data.tasksCompleted)} icon={FiActivity} color="#10b981" sub={`${data.tasksPending} pending`} />
            <KpiCard label="Pending Orders" value={fmt(data.pendingOrders)} icon={FiPackage} color="#f97316" sub="In pipeline" trendUp={data.pendingOrders < 10} trend={data.pendingOrders < 10 ? 'Healthy' : 'High volume'} />
            <KpiCard label="Warranty Claims" value={fmt(data.warrantyClaims)} icon={FiAlertTriangle} color="#ef4444" sub="This period" trendUp={data.warrantyClaims === 0} trend={data.warrantyClaims === 0 ? 'None this period' : 'Needs attention'} />
            <KpiCard label="Active Clients" value={fmt(data.activeClients)} icon={FiTrendingUp} color="#06b6d4" sub="Total base" />
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12">No analytics data available for selected range.</div>
        )}

        {/* Navigation Grid to sub-pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { to: '/admin/analytics/clients', icon: FiUsers, title: 'Client Acquisition', desc: 'New signups, churn trends, active base growth', color: '#a855f7' },
            { to: '/admin/analytics/fulfillment', icon: FiPackage, title: 'Order Fulfillment', desc: 'Delivery rates, processing time, status distribution', color: '#3b82f6' },
            { to: '/admin/analytics/productivity', icon: FiActivity, title: 'Employee Productivity', desc: 'Task completion, department rankings, top performers', color: '#10b981' },
            { to: '/admin/analytics/revenue', icon: FiDollarSign, title: 'Revenue Analytics', desc: 'Revenue trends, MoM growth, client segment revenue', color: '#22c55e' },
            { to: '/admin/analytics/inventory', icon: FiPackage, title: 'Inventory Turnover', desc: 'Stock movement, slow-movers, reorder indicators', color: '#f59e0b' },
            { to: '/admin/analytics/reports', icon: FiTrendingUp, title: 'Report Builder', desc: 'Ad-hoc reports, templates, saved configs', color: '#06b6d4' },
            { to: '/admin/analytics/schedules', icon: FiClock, title: 'Scheduled Reports', desc: 'Auto-delivery schedules via email', color: '#f97316' },
            { to: '/admin/analytics/alerts', icon: FiAlertTriangle, title: 'Alerts Center', desc: 'Configurable threshold alerts & history', color: '#ef4444' },
          ].map(item => (
            <Link key={item.to} to={item.to}
              className="group bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/60 hover:bg-slate-800/60 transition-all duration-300 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: `${item.color}22`, border: `1px solid ${item.color}44` }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-slate-100 font-semibold text-sm">{item.title}</p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{item.desc}</p>
              </div>
              <FiArrowUpRight size={16} className="ml-auto text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
