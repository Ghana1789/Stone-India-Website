import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../../../services/api';
import { FiPlus, FiRefreshCw, FiAlertTriangle, FiCheckCircle, FiZap, FiFilter } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const CHEM_COLORS = { NMC: '#3b82f6', LFP: '#22c55e', NCA: '#8b5cf6', NiMH: '#f59e0b', LTO: '#f97316' };
const QC_COLORS = { Passed: '#22c55e', Failed: '#ef4444', Pending: '#64748b', InProgress: '#3b82f6', Rework: '#f59e0b' };

export default function CellManufacturing() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ chemistry: '', status: '', line: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ cellChemistry: 'NMC', quantity: '', assignedLine: 'Line A', nominalCapacity: '', nominalVoltage: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filter).filter(([,v])=>v))).toString();
      const r = await api.get(`/ev/cell-batches?${params}`);
      setData(r.data.data);
      setAnalytics(r.data.analytics);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/ev/cell-batches', { ...form, quantity: Number(form.quantity), nominalCapacity: Number(form.nominalCapacity), nominalVoltage: Number(form.nominalVoltage) });
      setShowCreate(false);
      fetchData();
    } catch (err) { alert(err?.response?.data?.message || 'Failed to create batch'); }
    finally { setSaving(false); }
  };

  const chemDist = analytics?.chemistryDistribution || [];
  const donutData = {
    labels: chemDist.map(c => c._id),
    datasets: [{ data: chemDist.map(c => c.count), backgroundColor: chemDist.map(c => CHEM_COLORS[c._id] || '#64748b'), borderWidth: 3, borderColor: '#0d1117', hoverOffset: 12 }]
  };

  const defectData = {
    labels: (analytics?.topDefects || []).map(d => d._id),
    datasets: [{ label: 'Count', data: (analytics?.topDefects || []).map(d => d.count), backgroundColor: '#ef444488', borderRadius: 6, barThickness: 18 }]
  };

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Battery Cell Manufacturing</h1>
          <p className="text-slate-400 text-sm mt-0.5">Formation process tracking · Yield & defect analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"><FiRefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase transition-all">
            <FiPlus className="w-4 h-4" /> New Cell Batch
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Yield', value: `${analytics?.avgYield ?? '—'}%`, color: '#22c55e', icon: FiCheckCircle },
          { label: 'Avg Scrap', value: `${analytics?.avgScrap ?? '—'}%`, color: '#ef4444', icon: FiAlertTriangle },
          { label: 'Total Batches', value: data?.length ?? '—', color: '#3b82f6', icon: FiZap },
          { label: 'Active Lines', value: '4', color: '#8b5cf6', icon: FiZap },
        ].map(k => (
          <div key={k.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{k.label}</span>
            </div>
            <div className="text-3xl font-black italic text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6 flex flex-col items-center">
          <h3 className="text-white font-black italic uppercase text-sm mb-4 self-start">Chemistry Distribution</h3>
          {chemDist.length > 0 ? (
            <>
              <div className="w-44 h-44"><Doughnut data={donutData} options={{ plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1117' } }, cutout: '70%' }} /></div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {chemDist.map(c => (
                  <div key={c._id} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHEM_COLORS[c._id] || '#64748b' }} />
                    {c._id} ({c.count})
                  </div>
                ))}
              </div>
            </>
          ) : <div className="text-slate-600 text-xs font-bold uppercase py-16">No data yet</div>}
        </div>

        <div className="lg:col-span-2 bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Top Defect Types</h3>
          {(analytics?.topDefects || []).length > 0 ? (
            <Bar data={defectData} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1117' } }, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b' }, grid: { color: '#1e2a3a' } } } }} height={120} />
          ) : <div className="text-slate-600 text-xs font-bold uppercase flex items-center justify-center h-32">No defect data</div>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <FiFilter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Filter:</span>
        </div>
        {[['chemistry', ['','NMC','LFP','NCA','NiMH','LTO']],['status',['','Planned','InProgress','Completed','OnHold']],['line',['','Line A','Line B','Line C','Line D']]].map(([key, opts]) => (
          <select key={key} value={filter[key]} onChange={e => setFilter(p => ({...p, [key]: e.target.value}))}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500">
            {opts.map(o => <option key={o} value={o}>{o || `All ${key}`}</option>)}
          </select>
        ))}
      </div>

      {/* Cell Batch Table */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-black italic uppercase text-sm tracking-wide">Cell Batch Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>
                {['Batch #','Chemistry','Stage','Quantity','Yield%','Voltage','IR (mΩ)','QC','Line','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center"><div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" /></td></tr>
              ) : (data || []).length > 0 ? (data || []).map((b) => (
                <tr key={b._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-blue-400 font-black text-xs">{b.batchNumber}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{ backgroundColor: `${CHEM_COLORS[b.cellChemistry]||'#64748b'}20`, color: CHEM_COLORS[b.cellChemistry]||'#64748b' }}>{b.cellChemistry}</span></td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{b.formationStage}</td>
                  <td className="px-4 py-3 text-white font-bold">{b.quantity}</td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: (b.yieldPercent||0) > 90 ? '#22c55e' : (b.yieldPercent||0) > 80 ? '#f59e0b' : '#ef4444' }}>{b.yieldPercent ?? '—'}%</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{b.actualVoltage ?? b.nominalVoltage ?? '—'} V</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{b.internalResistance ?? '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{ backgroundColor: `${QC_COLORS[b.qcStatus]||'#64748b'}20`, color: QC_COLORS[b.qcStatus]||'#64748b' }}>{b.qcStatus}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{b.assignedLine}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-800 text-slate-300">{b.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No cell batches found. Create your first batch above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-black text-white italic uppercase mb-5">New Cell Batch</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Chemistry', key: 'cellChemistry', type: 'select', opts: ['NMC','LFP','NCA','NiMH','LTO'] },
                  { label: 'Line', key: 'assignedLine', type: 'select', opts: ['Line A','Line B','Line C','Line D'] },
                  { label: 'Quantity (cells)', key: 'quantity', type: 'number', required: true },
                  { label: 'Nominal Capacity (Ah)', key: 'nominalCapacity', type: 'number' },
                  { label: 'Nominal Voltage (V)', key: 'nominalVoltage', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{f.label}</label>
                    {f.type === 'select'
                      ? <select value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {f.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      : <input type={f.type} required={f.required} value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" placeholder="0" />
                    }
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={2} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black disabled:opacity-50 transition-all">
                  {saving ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
