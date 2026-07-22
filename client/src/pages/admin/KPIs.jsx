import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { FiActivity, FiZap, FiAlertTriangle, FiCheckCircle, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const MOCK_KPI = {
  overview: { totalBatches: 284, qcPassedBatches: 261, qcFailedBatches: 23, defectRate: 8.1, efficiency: 78.4, activeTasks: 41, completedTasks: 147, activeOrders: 12 },
  monthlyProduction: [
    { month: 'Nov', batches: 38, units: 4560 },
    { month: 'Dec', batches: 42, units: 5040 },
    { month: 'Jan', batches: 45, units: 5400 },
    { month: 'Feb', batches: 47, units: 5640 },
    { month: 'Mar', batches: 55, units: 6600 },
    { month: 'Apr', batches: 57, units: 6840 },
  ],
  deptPerformance: [
    { dept: 'Production', rate: 85 },
    { dept: 'Quality Control', rate: 91 },
    { dept: 'Packaging', rate: 72 },
    { dept: 'Maintenance', rate: 68 },
    { dept: 'Logistics & Supply Chain', rate: 77 },
    { dept: 'Engineering', rate: 80 },
  ]
};

export default function AdminKPIs() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/kpis');
      setData(r.data.data);
    } catch {
      setData(MOCK_KPI);
      toast('Using demo KPI data', { icon: '📊' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKPIs(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { overview, monthlyProduction, deptPerformance } = data || MOCK_KPI;

  const barData = {
    labels: monthlyProduction.map(m => m.month),
    datasets: [
      {
        label: 'Batches Produced',
        data: monthlyProduction.map(m => m.batches),
        backgroundColor: '#3b82f6',
        borderRadius: 8, barThickness: 24,
      },
      {
        label: 'Units (00s)',
        data: monthlyProduction.map(m => Math.round(m.units / 100)),
        backgroundColor: '#22c55e',
        borderRadius: 8, barThickness: 24,
      }
    ]
  };

  const lineData = {
    labels: deptPerformance.map(d => d.dept || d._id || ''),
    datasets: [{
      label: 'Completion Rate %',
      data: deptPerformance.map(d => Math.round(d.rate || 0)),
      borderColor: '#f97316',
      backgroundColor: '#f9731620',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#f97316',
      pointRadius: 5,
    }]
  };

  const donutData = {
    labels: ['QC Passed', 'QC Failed'],
    datasets: [{
      data: [overview.qcPassedBatches, overview.qcFailedBatches],
      backgroundColor: ['#22c55e', '#ef4444'],
      borderWidth: 3,
      borderColor: '#13161e',
    }]
  };

  const chartOpts = (labelColor = '#64748b') => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#13161e', padding: 12, cornerRadius: 12 } },
    scales: {
      x: { ticks: { color: labelColor, font: { size: 10, weight: 'bold' } }, grid: { display: false } },
      y: { ticks: { color: labelColor, font: { size: 10 } }, grid: { color: '#1e293b' } }
    }
  });

  const kpiCards = [
    { label: 'Total Batches', value: overview.totalBatches, icon: FiActivity, color: 'blue', sub: 'All time' },
    { label: 'Efficiency Rate', value: `${overview.efficiency}%`, icon: FiTrendingUp, color: 'emerald', sub: 'Task completion' },
    { label: 'Defect Rate', value: `${overview.defectRate}%`, icon: FiAlertTriangle, color: overview.defectRate > 10 ? 'red' : 'yellow', sub: 'QC failures' },
    { label: 'QC Passed', value: overview.qcPassedBatches, icon: FiCheckCircle, color: 'green', sub: `${overview.qcFailedBatches} failed` },
    { label: 'Active Tasks', value: overview.activeTasks, icon: FiZap, color: 'purple', sub: 'In progress' },
    { label: 'Active Orders', value: overview.activeOrders, icon: FiActivity, color: 'orange', sub: 'In production' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Production KPIs</h1>
          <p className="text-slate-400 mt-1 font-medium">Manufacturing performance analytics & quality metrics</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const csvData = [
                ['Metric', 'Value'],
                ['Total Batches', overview.totalBatches],
                ['Efficiency', overview.efficiency + '%'],
                ['Defect Rate', overview.defectRate + '%'],
                ['QC Passed', overview.qcPassedBatches],
                ['QC Failed', overview.qcFailedBatches]
              ].map(e => e.join(',')).join('\n');
              const blob = new Blob([csvData], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('hidden', '');
              a.setAttribute('href', url);
              a.setAttribute('download', 'production_kpis_2026.csv');
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              toast.success('CSV Exported successfully!');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-bold border border-slate-700 hover:border-slate-500 transition-all"
          >
            <FiActivity className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={fetchKPIs} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-bold transition-all shadow-lg shadow-red-900/20">
            <FiRefreshCw className="w-4 h-4" /> LIVE REFRESH
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5 hover:border-red-500/30 transition-all">
            <div className={`p-2.5 rounded-xl bg-${card.color}-500/10 w-fit mb-3`}>
              <card.icon className={`w-5 h-5 text-${card.color}-500`} />
            </div>
            <div className="text-2xl font-black text-white italic">{card.value}</div>
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">{card.label}</div>
            <div className="text-slate-600 text-[10px] mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Production Bar */}
        <div className="lg:col-span-2 bg-[#13161e] border border-slate-800 rounded-[2rem] p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-black italic uppercase text-base">Monthly Production Output</h3>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mt-1">Batches & Units · Last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Batches</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Units (00s)</span>
            </div>
          </div>
          <Bar data={barData} options={chartOpts()} height={120} />
        </div>

        {/* QC Donut */}
        <div className="bg-[#13161e] border border-slate-800 rounded-[2rem] p-8 flex flex-col">
          <h3 className="text-white font-black italic uppercase text-base mb-6">QC Pass/Fail Ratio</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44">
              <Doughnut data={donutData} options={{ responsive: true, cutout: '72%', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#13161e', padding: 12 } } }} />
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <div className="text-2xl font-black text-white italic">
                  {((overview.qcPassedBatches / Math.max(overview.totalBatches, 1)) * 100).toFixed(0)}%
                </div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Pass Rate</div>
              </div>
            </div>
            <div className="flex gap-6 mt-6">
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1" />
                <div className="text-white font-black text-sm">{overview.qcPassedBatches}</div>
                <div className="text-slate-500 text-[9px] uppercase">Passed</div>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
                <div className="text-white font-black text-sm">{overview.qcFailedBatches}</div>
                <div className="text-slate-500 text-[9px] uppercase">Failed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-[#13161e] border border-slate-800 rounded-[2rem] p-8">
        <h3 className="text-white font-black italic uppercase text-base mb-6">Department Task Completion Rate</h3>
        {deptPerformance.length > 0 ? (
          <div className="space-y-4">
            {deptPerformance.map((d, i) => {
              const name = d.dept || d._id || 'Unknown';
              const rate = Math.round(d.rate || 0);
              const color = rate >= 80 ? '#22c55e' : rate >= 60 ? '#f59e0b' : '#ef4444';
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-44 text-slate-400 text-xs font-bold truncate">{name}</div>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${rate}%`, backgroundColor: color }} />
                  </div>
                  <div className="w-12 text-right text-white font-black text-sm italic">{rate}%</div>
                  <div className="flex items-center">
                    {rate >= 80
                      ? <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                      : rate >= 60
                        ? <FiActivity className="w-4 h-4 text-yellow-400" />
                        : <FiAlertTriangle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 text-center py-8">No department data available</p>
        )}
      </div>
    </div>
  );
}
