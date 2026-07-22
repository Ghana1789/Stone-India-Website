import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import {
  FiFileText, FiPlay, FiSave, FiTrash2, FiRefreshCw, FiDownload, FiChevronDown
} from 'react-icons/fi';
import api from '../../../services/api';
import DateRangePicker from '../../../components/DateRangePicker';
import ExportButton from '../../../components/ExportButton';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_OPTIONS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#334155', borderWidth: 1 } },
  scales: {
    x: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } } },
    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true }
  }
};

export default function ReportBuilder() {
  const [templates, setTemplates] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [preset, setPreset] = useState('last_30_days');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadSaved();
  }, []);

  const loadTemplates = async () => {
    try {
      const r = await api.get('/admin/reports/templates');
      setTemplates(r.data.data);
    } catch { }
  };

  const loadSaved = async () => {
    try {
      const r = await api.get('/admin/reports/saved');
      setSavedReports(r.data.data);
    } catch { }
  };

  const runReport = async () => {
    if (!selectedTemplate) return toast.error('Please select a report template.');
    setRunning(true);
    try {
      const payload = { templateId: selectedTemplate, preset };
      if (preset === 'custom' && startDate) payload.startDate = startDate;
      if (preset === 'custom' && endDate) payload.endDate = endDate;
      const r = await api.post('/admin/reports/run', payload);
      setResult({ templateId: selectedTemplate, data: r.data.data, preset });
      toast.success('Report generated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to run report.');
    } finally {
      setRunning(false);
    }
  };

  const saveReport = async () => {
    if (!saveName.trim()) return toast.error('Please enter a report name.');
    try {
      await api.post('/admin/reports/saved', {
        name: saveName.trim(),
        filters: { dateRangePreset: preset, startDate, endDate }
      });
      toast.success('Report configuration saved!');
      setShowSaveForm(false);
      setSaveName('');
      loadSaved();
    } catch { toast.error('Failed to save report.'); }
  };

  const deleteSaved = async (id) => {
    try {
      await api.delete(`/admin/reports/saved/${id}`);
      setSavedReports(prev => prev.filter(r => r._id !== id));
      toast.success('Saved report deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const loadSavedReport = (saved) => {
    if (saved.filters?.dateRangePreset) setPreset(saved.filters.dateRangePreset);
    toast('Loaded saved configuration. Click Run Report to execute.', { icon: '📂' });
  };

  // Render result based on template type
  const renderResult = () => {
    if (!result) return null;
    const { templateId, data } = result;

    const series = data.series || [];
    const labels = series.map(s => s.label);

    let chartData = null, rows = [], columns = [];

    if (templateId === 'client_acquisition' && series.length) {
      chartData = { labels, datasets: [{ label: 'New Clients', data: series.map(s => s.newClients), backgroundColor: '#a855f799', borderRadius: 6 }] };
      columns = ['Period', 'New Clients'];
      rows = series.map(s => [s.label, s.newClients]);
    } else if (templateId === 'order_fulfillment' && series.length) {
      chartData = { labels, datasets: [{ label: 'Orders', data: series.map(s => s.totalOrders), backgroundColor: '#3b82f699', borderRadius: 6 }, { label: 'Delivered', data: series.map(s => s.delivered), backgroundColor: '#22c55e99', borderRadius: 6 }] };
      columns = ['Period', 'Total Orders', 'Delivered', 'Fulfillment Rate'];
      rows = series.map(s => [s.label, s.totalOrders, s.delivered, `${s.fulfillmentRate}%`]);
    } else if (templateId === 'employee_productivity') {
      const performers = data.topPerformers || [];
      chartData = performers.length ? { labels: performers.map(e => e.name.split(' ')[0]), datasets: [{ label: 'Tasks', data: performers.map(e => e.tasksCompleted), backgroundColor: '#10b98199', borderRadius: 6 }] } : null;
      columns = ['Employee', 'Dept', 'Tasks Completed'];
      rows = performers.map(e => [e.name, e.department || '—', e.tasksCompleted]);
    } else if (templateId === 'revenue_summary' && series.length) {
      chartData = { labels, datasets: [{ label: 'Revenue', data: series.map(s => s.revenue), backgroundColor: '#22c55e99', borderRadius: 6 }] };
      columns = ['Period', 'Revenue (₹)', 'Orders', 'Avg Order Value (₹)'];
      rows = series.map(s => [s.label, s.revenue.toLocaleString('en-IN'), s.orders, s.avgOrderValue.toLocaleString('en-IN')]);
    } else if (templateId === 'inventory_turnover' && series.length) {
      chartData = { labels, datasets: [{ label: 'Batches', data: series.map(s => s.batchesStarted), backgroundColor: '#f59e0b99', borderRadius: 6 }] };
      columns = ['Period', 'Batches', 'Units', 'QC Passed'];
      rows = series.map(s => [s.label, s.batchesStarted, s.unitsProd, s.qcPassed]);
    } else if (templateId === 'full_business_summary') {
      columns = ['Metric', 'Value'];
      rows = [
        ['Total Revenue', `₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`],
        ['Orders', data.orderCount], ['Fulfillment Rate', `${data.fulfillmentRate}%`],
        ['New Clients', data.newClients], ['Active Clients', data.activeClients],
        ['Tasks Completed', data.tasksCompleted], ['Tasks Pending', data.tasksPending],
        ['Pending Orders', data.pendingOrders], ['Warranty Claims', data.warrantyClaims],
      ];
    }

    const currentTemplate = templates.find(t => t.id === templateId);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-slate-200 font-semibold">{currentTemplate?.name} — Results</h2>
          <div className="flex gap-2">
            <ExportButton type="csv" reportType={templateId === 'full_business_summary' ? 'overview' : templateId === 'revenue_summary' ? 'revenue' : templateId} preset={preset} startDate={startDate} endDate={endDate} />
            <ExportButton type="pdf" reportType={templateId === 'full_business_summary' ? 'overview' : templateId === 'revenue_summary' ? 'revenue' : templateId} preset={preset} startDate={startDate} endDate={endDate} />
          </div>
        </div>

        {chartData && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="h-64"><Bar data={chartData} options={CHART_OPTIONS} /></div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {columns.map(col => (
                      <th key={col} className="text-left px-6 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-b border-slate-700/30 hover:bg-slate-700/20 ${i % 2 === 0 ? '' : 'bg-slate-800/20'}`}>
                      {row.map((cell, j) => (
                        <td key={j} className={`px-6 py-3 text-sm ${j === 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet><title>Report Builder — Stone India Analytics</title></Helmet>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Report Builder</h1>
          <p className="text-slate-400 text-sm mt-1">Build and run ad-hoc reports from pre-built templates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Saved Reports */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              <h3 className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2"><FiSave size={14} /> Saved Reports</h3>
              {savedReports.length === 0 ? (
                <p className="text-slate-500 text-xs">No saved reports yet. Run a report and save the configuration.</p>
              ) : (
                <div className="space-y-2">
                  {savedReports.map(s => (
                    <div key={s._id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 group">
                      <button onClick={() => loadSavedReport(s)} className="flex-1 text-left text-slate-300 text-xs truncate hover:text-slate-100">
                        <FiFileText size={11} className="inline mr-1.5 opacity-60" />
                        {s.name}
                      </button>
                      <button onClick={() => deleteSaved(s._id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all">
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Builder */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-5">
              <h3 className="text-slate-200 font-semibold">Configure Report</h3>

              {/* Template Selector */}
              <div>
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Report Template</label>
                <div className="relative">
                  <select
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-200 text-sm appearance-none focus:outline-none focus:border-blue-500 pr-10">
                    <option value="">— Select a template —</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <FiChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {selectedTemplate && (
                  <p className="text-slate-500 text-xs mt-1.5">{templates.find(t => t.id === selectedTemplate)?.description}</p>
                )}
              </div>

              {/* Date Range */}
              <div>
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">Date Range</label>
                <DateRangePicker preset={preset} onChange={(p, s, e) => { setPreset(p); if (s) setStartDate(s); if (e) setEndDate(e); }} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={runReport}
                  disabled={running || !selectedTemplate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
                  {running ? <FiRefreshCw size={14} className="animate-spin" /> : <FiPlay size={14} />}
                  Run Report
                </button>
                {result && (
                  <button onClick={() => setShowSaveForm(!showSaveForm)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium border border-slate-600/50 transition-colors">
                    <FiSave size={14} />
                    Save Config
                  </button>
                )}
              </div>

              {showSaveForm && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="text" placeholder="Report name…" value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button onClick={saveReport} className="px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium hover:bg-emerald-600/30 transition-colors">
                    Save
                  </button>
                </div>
              )}
            </div>

            {running && (
              <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
                <FiRefreshCw size={20} className="animate-spin" />
                <span>Generating report…</span>
              </div>
            )}

            {!running && renderResult()}
          </div>
        </div>
      </div>
    </>
  );
}
