import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiDownload, FiBarChart2, FiTrendingUp, FiPieChart,
  FiUsers, FiCalendar, FiDollarSign, FiCreditCard
} from 'react-icons/fi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#06b6d4'];

export default function ReportsSection() {
  const { user } = useAuth();
  const role = user?.role;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6months');
  const [exporting, setExporting] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/reports', { params: { period } });
      setData(res.data.data);
    } catch (err) {
      // If user doesn't have access
      if (err.response?.status === 403) {
        toast.error('Access denied. Reports are available for managers and admins only.');
      } else {
        toast.error('Failed to load reports.');
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      if (format === 'csv') {
        const res = await api.get('/finance/reports/export', { params: { format: 'csv' }, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `finance_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('CSV exported!');
      } else {
        const res = await api.get('/finance/reports/export', { params: { format: 'json' } });
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `finance_report_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('JSON exported!');
      }
    } catch (err) {
      toast.error('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  // Restrict access for employee/client
  if (role === 'employee' || role === 'client') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FiBarChart2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Reports Access Restricted</h3>
          <p className="text-slate-500 text-sm">Financial reports are available for managers and administrators.</p>
        </div>
      </div>
    );
  }

  const tooltipConfig = {
    backgroundColor: '#1e293b',
    titleColor: '#f1f5f9',
    bodyColor: '#94a3b8',
    borderColor: '#334155',
    borderWidth: 1,
    cornerRadius: 12,
    padding: 12,
    boxPadding: 4
  };

  const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipConfig, callbacks: { label: (ctx) => `₹${ctx.raw?.toLocaleString('en-IN')}` } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 } } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 }, callback: (v) => `₹${(v / 1000).toFixed(0)}k` } }
    }
  };

  // Revenue vs Expenses chart
  const revenueExpenseData = {
    labels: data?.revenueOverTime?.map(r => `${r.month}`) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.revenueOverTime?.map(r => r.total) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        label: 'Expenses',
        data: data?.expensesOverTime?.map(e => e.total) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.4)',
        borderColor: '#ef4444',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  // Payment methods doughnut
  const methodsData = {
    labels: data?.paymentMethods?.map(p => p.method) || [],
    datasets: [{
      data: data?.paymentMethods?.map(p => p.total) || [],
      backgroundColor: CHART_COLORS.slice(0, data?.paymentMethods?.length || 0),
      borderWidth: 0,
      spacing: 4,
      borderRadius: 6
    }]
  };

  // Invoice status bar
  const invoiceData = {
    labels: data?.invoiceStatuses?.map(s => s.status) || [],
    datasets: [{
      data: data?.invoiceStatuses?.map(s => s.total) || [],
      backgroundColor: data?.invoiceStatuses?.map(s => {
        if (s.status === 'Paid') return 'rgba(16, 185, 129, 0.6)';
        if (s.status === 'Pending') return 'rgba(245, 158, 11, 0.6)';
        if (s.status === 'Overdue') return 'rgba(239, 68, 68, 0.6)';
        return 'rgba(100, 116, 139, 0.6)';
      }) || [],
      borderRadius: 8,
      borderWidth: 0
    }]
  };

  // Salary trend line
  const salaryData = {
    labels: data?.salaryBreakdown?.map(s => `${s.month}`) || [],
    datasets: [{
      label: 'Salary Expenses',
      data: data?.salaryBreakdown?.map(s => s.total) || [],
      borderColor: '#a855f7',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#a855f7',
      borderWidth: 2
    }]
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Reports & Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Financial performance insights and exportable reports</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs font-bold uppercase tracking-widest focus:border-emerald-500 outline-none">
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
          {/* Export buttons */}
          <button onClick={() => handleExport('csv')} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
            <FiDownload className="w-4 h-4" /> CSV
          </button>
          <button onClick={() => handleExport('json')} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
            <FiDownload className="w-4 h-4" /> JSON
          </button>
        </div>
      </div>

      {/* Row 1: Revenue vs Expenses + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-black uppercase text-xs tracking-widest">Revenue vs Expenses</h3>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Comparative analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-[10px] text-slate-400 font-bold">Revenue</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="text-[10px] text-slate-400 font-bold">Expenses</span></div>
            </div>
          </div>
          <div className="h-[300px]">
            {(data?.revenueOverTime?.length || 0) > 0 ? (
              <Bar data={revenueExpenseData} options={{ ...chartConfig, plugins: { ...chartConfig.plugins, legend: { display: false } } }} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600">
                <div className="text-center"><FiBarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-xs font-bold uppercase tracking-widest">No data for this period</p></div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-white font-black uppercase text-xs tracking-widest mb-6">Payment Methods</h3>
          <div className="h-[200px] flex items-center justify-center">
            {(data?.paymentMethods?.length || 0) > 0 ? (
              <Doughnut data={methodsData} options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: tooltipConfig } }} />
            ) : (
              <div className="text-center text-slate-600"><FiPieChart className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-xs font-bold uppercase tracking-widest">No data</p></div>
            )}
          </div>
          <div className="mt-5 space-y-2">
            {data?.paymentMethods?.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                  <span className="text-slate-400">{m.method}</span>
                </div>
                <span className="text-white font-bold">₹{m.total?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Invoice Status + Salary Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-black uppercase text-xs tracking-widest">Invoice Status</h3>
            <FiCreditCard className="text-blue-500 w-5 h-5" />
          </div>
          <div className="h-[250px]">
            {(data?.invoiceStatuses?.length || 0) > 0 ? (
              <Bar data={invoiceData} options={{ ...chartConfig, indexAxis: 'y' }} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600">
                <p className="text-xs font-bold uppercase tracking-widest">No invoice data</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-black uppercase text-xs tracking-widest">Salary Expenses Trend</h3>
            <FiDollarSign className="text-purple-500 w-5 h-5" />
          </div>
          <div className="h-[250px]">
            {(data?.salaryBreakdown?.length || 0) > 0 ? (
              <Line data={salaryData} options={chartConfig} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600">
                <p className="text-xs font-bold uppercase tracking-widest">No salary data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top Clients */}
      {data?.topClients?.length > 0 && (
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-black uppercase text-xs tracking-widest">Top Clients by Revenue</h3>
            <FiUsers className="text-emerald-500 w-5 h-5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.topClients.map((client, i) => (
              <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5 text-center hover:border-emerald-500/30 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-3">
                  {client.name?.charAt(0) || '?'}
                </div>
                <div className="text-white font-bold text-sm truncate">{client.name}</div>
                <div className="text-[10px] text-slate-500 mb-2 truncate">{client.company || 'Individual'}</div>
                <div className="text-emerald-400 font-black text-sm">₹{client.total?.toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-slate-500">{client.count} payments</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
