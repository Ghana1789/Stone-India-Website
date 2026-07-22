import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiDollarSign, FiTrendingUp, FiClock, FiCheckCircle,
  FiAlertTriangle, FiArrowUpRight, FiArrowDownRight, FiFileText,
  FiCreditCard, FiBarChart2
} from 'react-icons/fi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler);

export default function OverviewSection() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await api.get('/finance/overview');
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load finance overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
    </div>
  );

  const stats = data?.stats || {};
  const role = user?.role;

  const statCards = [
    {
      label: role === 'client' ? 'Total Spent' : 'Total Revenue',
      value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`,
      sub: 'Completed',
      icon: FiDollarSign,
      color: 'emerald',
      gradient: 'from-emerald-600 to-teal-700'
    },
    {
      label: 'Pending Payments',
      value: stats.pendingPayments || 0,
      sub: 'Awaiting',
      icon: FiClock,
      color: 'amber',
      gradient: 'from-amber-600 to-orange-700'
    },
    {
      label: 'Completed',
      value: stats.completedTransactions || 0,
      sub: 'Transactions',
      icon: FiCheckCircle,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-700'
    },
    ...(role !== 'client' ? [{
      label: 'Payslips',
      value: stats.totalPayslips || 0,
      sub: role === 'employee' ? 'Generated' : 'Total',
      icon: FiFileText,
      color: 'purple',
      gradient: 'from-purple-600 to-violet-700'
    }] : [{
      label: 'Invoices',
      value: stats.totalInvoices || 0,
      sub: `${stats.pendingInvoices || 0} Pending`,
      icon: FiCreditCard,
      color: 'purple',
      gradient: 'from-purple-600 to-violet-700'
    }])
  ];

  // Revenue chart data
  const revenueData = {
    labels: data?.monthlyRevenue?.map(m => m.month) || [],
    datasets: [{
      label: 'Revenue',
      data: data?.monthlyRevenue?.map(m => m.revenue) || [],
      backgroundColor: 'rgba(16, 185, 129, 0.3)',
      borderColor: '#10b981',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#10b981'
    }]
  };

  // Category breakdown doughnut
  const categoryData = {
    labels: data?.categoryBreakdown?.map(c => c.category) || [],
    datasets: [{
      data: data?.categoryBreakdown?.map(c => c.total) || [],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#6b7280'],
      borderWidth: 0,
      spacing: 4,
      borderRadius: 6
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        boxPadding: 4
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 } } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#475569', font: { size: 10 } } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        callbacks: {
          label: (ctx) => `₹${ctx.raw?.toLocaleString('en-IN')}`
        }
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-[#13161e] border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.sub}</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase mt-2 tracking-wide">{stat.label}</div>
            </div>
            <div className="absolute right-[-8%] bottom-[-8%] w-20 h-20 text-white/5 group-hover:scale-110 transition-transform duration-500">
              <stat.icon className="w-full h-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white font-black uppercase text-xs tracking-widest">
                {role === 'client' ? 'Spending Trend' : 'Revenue Trend'}
              </h3>
              <p className="text-slate-500 text-[10px] mt-1 uppercase tracking-widest">Last 6 months</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Data</span>
            </div>
          </div>
          <div className="h-[280px]">
            {(data?.monthlyRevenue?.length || 0) > 0 ? (
              <Line data={revenueData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600">
                <div className="text-center">
                  <FiBarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-widest">No revenue data yet</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-white font-black uppercase text-xs tracking-widest mb-6">Category Breakdown</h3>
          <div className="h-[200px] flex items-center justify-center">
            {(data?.categoryBreakdown?.length || 0) > 0 ? (
              <Doughnut data={categoryData} options={doughnutOptions} />
            ) : (
              <div className="text-center text-slate-600">
                <FiDollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest">No data</p>
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="mt-6 space-y-2">
            {data?.categoryBreakdown?.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i] }} />
                  <span className="text-slate-400 font-medium">{cat.category}</span>
                </div>
                <span className="text-white font-bold">₹{cat.total?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/10">
          <h3 className="text-white font-black uppercase text-xs tracking-widest">Recent Transactions</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{data?.recentTransactions?.length || 0} Latest</span>
        </div>
        <div className="divide-y divide-slate-800/50">
          {data?.recentTransactions?.map((txn, i) => (
            <div key={i} className="px-8 py-5 flex items-center gap-4 hover:bg-slate-800/20 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                txn.direction === 'Incoming'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {txn.direction === 'Incoming' ? <FiArrowDownRight className="w-5 h-5" /> : <FiArrowUpRight className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{txn.description}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{txn.transactionId}</span>
                  <span className="text-[10px] text-slate-600">•</span>
                  <span className="text-[10px] text-slate-500">{txn.user?.name || 'System'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-black text-sm ${txn.direction === 'Incoming' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {txn.direction === 'Incoming' ? '+' : '-'}₹{txn.amount?.toLocaleString('en-IN')}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  txn.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  txn.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
          {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
            <div className="p-16 text-center">
              <FiDollarSign className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
