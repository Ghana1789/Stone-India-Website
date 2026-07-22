import { useState } from 'react';
import api from '../../../services/api';
import { FiSearch, FiGitBranch, FiPackage, FiCheckCircle, FiTruck, FiBox, FiChevronRight, FiAlertTriangle } from 'react-icons/fi';

const NODE_ICONS = {
  'Cell Manufacturing': FiBox,
  'Pack Assembly': FiPackage,
  'QC Inspection': FiCheckCircle,
  'Shipment': FiTruck,
};

export default function Traceability() {
  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    try {
      setLoading(true); setError(null); setResult(null);
      const r = await api.get(`/ev/traceability/${encodeURIComponent(searchId.trim())}`);
      setResult(r.data.data);
      if (!r.data.data?.found) setError('No records found for this ID. Try a Batch ID, Cell Batch Number, or Order ID.');
    } catch (e) { setError(e?.response?.data?.message || 'Search failed.'); }
    finally { setLoading(false); }
  };

  const NodeCard = ({ title, data: nodeData, color }) => {
    if (!nodeData) return null;
    const Icon = NODE_ICONS[title] || FiBox;
    const pairs = Object.entries(nodeData).filter(([k]) => !['stage'].includes(k));
    return (
      <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-5 min-w-[280px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="font-black text-white text-sm uppercase tracking-wide">{title}</span>
        </div>
        <div className="space-y-2">
          {pairs.slice(0, 8).map(([k, v]) => {
            if (v === null || v === undefined || (typeof v === 'object' && !Array.isArray(v) && !v._id)) return null;
            const displayVal = Array.isArray(v) ? v.length + ' items' : typeof v === 'object' && v?.name ? v.name : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v).length > 30 ? String(v).slice(0,30)+'…' : String(v);
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s=>s.toUpperCase());
            return (
              <div key={k} className="flex justify-between gap-3 text-xs">
                <span className="text-slate-500 font-bold capitalize">{label}</span>
                <span className="text-slate-300 font-semibold text-right">{displayVal}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const stages = [
    { key: 'rawMaterials', label: 'Raw Materials', color: '#3b82f6' },
    { key: 'cellManufacturing', label: 'Cell Manufacturing', color: '#8b5cf6' },
    { key: 'packAssembly', label: 'Pack Assembly', color: '#f97316' },
    { key: 'shipment', label: 'Shipment', color: '#10b981' },
  ];

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-white italic uppercase">Battery Pack Traceability</h1>
        <p className="text-slate-400 text-sm mt-0.5">Complete genealogy: Raw Material → Cell → Module → Pack → Shipment</p>
      </div>

      {/* Search */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
        <h3 className="text-white font-black italic uppercase text-sm mb-4">Search by ID</h3>
        <p className="text-slate-500 text-xs mb-4">Enter a Batch ID (e.g., SI-BATCH-2026-0001), Cell Batch Number (e.g., CB-2026-00001), or Order ID</p>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input type="text" value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="Enter Batch ID, Cell Batch #, or Order ID..."
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-500" />
          </div>
          <button type="submit" disabled={loading || !searchId.trim()} className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-black uppercase disabled:opacity-50 transition-all flex items-center gap-2">
            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <FiSearch className="w-4 h-4" />}
            Trace
          </button>
        </form>

        {/* Quick examples */}
        <div className="flex flex-wrap gap-2 mt-3">
          {['SI-BATCH-2026-0001','CB-2026-00001','ORD-001'].map(ex => (
            <button key={ex} onClick={() => setSearchId(ex)} className="text-[9px] font-black text-slate-500 hover:text-purple-400 border border-slate-800 hover:border-purple-500/30 rounded-lg px-2.5 py-1 transition-all uppercase tracking-widest">{ex}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
          <FiAlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Traceability Tree */}
      {result?.found && (
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
            <h3 className="text-white font-black italic uppercase text-sm mb-6">Pack History Timeline</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" />
              <div className="space-y-6">
                {(result.timeline || []).map((step, i) => (
                  <div key={i} className="flex items-start gap-4 pl-10 relative">
                    <div className="absolute left-2 w-5 h-5 rounded-full border-2 border-slate-600 bg-[#0d1117] flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${step.status?.toLowerCase().includes('pass') || step.status === 'QCPassed' ? 'bg-green-400' : step.status?.toLowerCase().includes('fail') ? 'bg-red-400' : 'bg-blue-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-white text-sm">{step.stage}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-800 text-slate-400 uppercase">{step.status}</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">{step.date ? new Date(step.date).toLocaleString('en-IN') : '—'}</div>
                    </div>
                  </div>
                ))}
                {!(result.timeline || []).length && <div className="pl-10 text-slate-600 text-xs font-bold uppercase">No timeline events recorded</div>}
              </div>
            </div>
          </div>

          {/* Genealogy Flow */}
          <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6 overflow-hidden">
            <h3 className="text-white font-black italic uppercase text-sm mb-6">Genealogy Tree — Raw Material → Pack → Shipment</h3>
            <div className="flex items-start gap-3 overflow-x-auto pb-4">
              {stages.map((stage, idx) => {
                const nodeData = result.nodes?.[stage.key === 'rawMaterials' ? 'packAssembly' : stage.key];
                const hasData = !!nodeData;
                return (
                  <div key={stage.key} className="flex items-start gap-3 shrink-0">
                    <div className={`flex flex-col gap-2 ${!hasData ? 'opacity-30' : ''}`}>
                      <div className={`text-[9px] font-black uppercase tracking-widest text-center px-3 py-1 rounded-full`} style={{ backgroundColor: `${stage.color}20`, color: stage.color }}>
                        {stage.label}
                      </div>
                      {hasData
                        ? <NodeCard title={stage.label} data={nodeData} color={stage.color} />
                        : <div className="bg-[#0d1117] border border-dashed border-slate-700 rounded-2xl p-5 min-w-[200px] flex items-center justify-center h-24">
                            <span className="text-slate-700 text-xs font-bold uppercase">Not found</span>
                          </div>
                      }
                    </div>
                    {idx < stages.length - 1 && (
                      <div className="flex items-center self-center mt-8">
                        <FiChevronRight className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!result && !error && !loading && (
        <div className="bg-[#0d1117] rounded-2xl border border-dashed border-slate-700 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
            <FiGitBranch className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-white font-black italic uppercase text-lg mb-2">Full Genealogy Tracing</h3>
          <p className="text-slate-500 text-sm max-w-md">Enter any ID above to trace the complete manufacturing history — from raw materials through cell formation, pack assembly, QC testing, and final delivery.</p>
          <div className="grid grid-cols-3 gap-4 mt-8 text-left">
            {[
              { title: 'QR Code Scan', desc: 'Scan pack QR to auto-fill search', icon: FiCheckCircle, color: '#22c55e' },
              { title: 'Batch Tracking', desc: 'Track by SI-BATCH-XXXX number', icon: FiPackage, color: '#3b82f6' },
              { title: 'Order Tracing', desc: 'Trace from order ID to delivery', icon: FiTruck, color: '#10b981' },
            ].map(f => (
              <div key={f.title} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <f.icon className="w-5 h-5 mb-2" style={{ color: f.color }} />
                <div className="text-white font-bold text-xs">{f.title}</div>
                <div className="text-slate-500 text-[10px] mt-1">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
