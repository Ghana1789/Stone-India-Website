import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { FiPackage, FiAlertTriangle, FiBox, FiTrendingDown, FiRefreshCw } from 'react-icons/fi';
import api from '../../../services/api';
import DateRangePicker from '../../../components/DateRangePicker';
import ExportButton from '../../../components/ExportButton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } }, position: 'top' }, tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 } },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true }
  }
};

export default function InventoryTurnover() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('last_90_days');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async (p = preset, s = startDate, e = endDate) => {
    setLoading(true);
    try {
      const params = { preset: p };
      if (p === 'custom' && s) params.startDate = s;
      if (p === 'custom' && e) params.endDate = e;
      const r = await api.get('/admin/analytics/inventory-turnover', { params });
      setData(r.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePreset = (p, s, e) => {
    setPreset(p); if (s) setStartDate(s); if (e) setEndDate(e);
    fetchData(p, s || startDate, e || endDate);
  };

  const batchChartData = data?.series ? {
    labels: data.series.map(s => s.label),
    datasets: [
      { label: 'Batches', data: data.series.map(s => s.batchesStarted), backgroundColor: '#3b82f699', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 6 },
      { label: 'Units Produced', data: data.series.map(s => s.unitsProd), backgroundColor: '#22c55e99', borderColor: '#22c55e', borderWidth: 1, borderRadius: 6 },
    ]
  } : null;

  return (
    <>
      <Helmet><title>Inventory Turnover — Stone India Analytics</title></Helmet>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Inventory Turnover</h1>
            <p className="text-slate-400 text-sm mt-1">Stock movement, batch production rates, and reorder indicators</p>
          </div>
          <div className="flex gap-3">
            <ExportButton type="csv" reportType="inventory_turnover" preset={preset} startDate={startDate} endDate={endDate} />
            <button onClick={() => fetchData()} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <DateRangePicker preset={preset} onChange={handlePreset} />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Total Inventory Value', value: data ? `₹${data.totalInventoryValue.toLocaleString('en-IN')}` : '—', icon: FiBox, color: '#3b82f6' },
            { label: 'Low Stock Items', value: data?.lowStock?.length?.toString() || '—', icon: FiAlertTriangle, color: data?.lowStock?.length > 0 ? '#ef4444' : '#22c55e' },
            { label: 'Slow-Moving Items', value: data?.slowMoving?.length?.toString() || '—', icon: FiTrendingDown, color: '#f59e0b' },
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

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-slate-200 font-semibold mb-4">Batch Production Activity</h2>
          {loading ? <div className="h-64 flex items-center justify-center"><FiRefreshCw size={24} className="animate-spin text-slate-500" /></div>
            : batchChartData ? <div className="h-64"><Bar data={batchChartData} options={CHART_OPTIONS} /></div>
            : <div className="h-64 flex items-center justify-center text-slate-500">No data</div>}
        </div>

        {/* Tabs for Low Stock / Slow Moving */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="flex border-b border-slate-700/50">
            {[['overview', 'All Batteries'], ['low', '⚠️ Low Stock'], ['slow', '📉 Slow Moving']].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>
                {label} {tab === 'low' && data?.lowStock?.length ? `(${data.lowStock.length})` : ''}{tab === 'slow' && data?.slowMoving?.length ? `(${data.slowMoving.length})` : ''}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Battery</th>
                  <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">SKU</th>
                  <th className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Category</th>
                  <th className="text-right px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Stock Qty</th>
                  <th className="text-right px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Unit Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500"><FiRefreshCw size={20} className="animate-spin mx-auto" /></td></tr>
                ) : (activeTab === 'low' ? data?.lowStock : activeTab === 'slow' ? data?.slowMoving : data?.batteries || []).map((b, i) => (
                  <tr key={b._id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/20'}`}>
                    <td className="px-6 py-3 text-slate-200 text-sm font-medium">{b.name}</td>
                    <td className="px-6 py-3 text-slate-400 text-sm font-mono">{b.sku || '—'}</td>
                    <td className="px-6 py-3 text-slate-400 text-sm">{b.category || '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`font-bold text-sm ${(b.stockQty || 0) < 10 ? 'text-red-400' : 'text-slate-200'}`}>
                        {b.stockQty ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-300 text-sm">
                      {b.unitPrice ? b.unitPrice.toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
                {!loading && (activeTab === 'low' ? data?.lowStock : activeTab === 'slow' ? data?.slowMoving : data?.batteries || []).length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No items in this category</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
