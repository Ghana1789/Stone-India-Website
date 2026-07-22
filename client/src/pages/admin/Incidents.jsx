import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle, FiTool, FiShield, FiZap, FiPackage,
  FiSearch, FiCheckCircle, FiClock, FiRefreshCw, FiPlus,
  FiX, FiUser, FiCalendar, FiMapPin
} from 'react-icons/fi';

const DEPARTMENTS = [
  'Research & Development', 'Procurement', 'Production', 'Quality Control',
  'Maintenance', 'Safety & Environment', 'Engineering', 'Logistics & Supply Chain',
  'Packaging', 'Sales & Marketing', 'Human Resources', 'Finance'
];

const TYPE_ICONS = {
  'Machine Failure': FiTool,
  'Safety Concern': FiShield,
  'Quality Issue': FiZap,
  'Environmental': FiPackage,
  'Process Delay': FiClock,
  'Other': FiAlertTriangle,
};

const PRIORITY_STYLES = {
  Critical: 'bg-red-500/20 text-red-400 border border-red-500/40',
  High:     'bg-orange-500/20 text-orange-400 border border-orange-500/40',
  Medium:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  Low:      'bg-slate-700 text-slate-400 border border-slate-600',
};

const STATUS_STYLES = {
  Open:         'bg-red-500/20 text-red-400',
  Investigating:'bg-yellow-500/20 text-yellow-400',
  Resolved:     'bg-emerald-500/20 text-emerald-400',
  Closed:       'bg-slate-700 text-slate-400',
};

const MOCK_INCIDENTS = [
  { _id: 'i1', title: 'Mixer Unit M-3 Overheating', type: 'Machine Failure', description: 'Temperature sensors reading above safe threshold on Mixer M-3. Cooling system may be blocked.', department: 'Production', reportedBy: { name: 'Priya Sharma' }, status: 'Open', priority: 'Critical', affectedMachine: 'Mixer M-3', location: 'Line 2, Bay 3', createdAt: new Date() },
  { _id: 'i2', title: 'Chemical Spill Near Bay 5', type: 'Safety Concern', description: 'Minor electrolyte spill detected near coating station. Area cordoned off, cleanup in progress.', department: 'Safety & Environment', reportedBy: { name: 'Arun Kumar' }, status: 'Investigating', priority: 'Critical', location: 'Bay 5', createdAt: new Date(Date.now() - 3600000) },
  { _id: 'i3', title: 'QC Sensor Calibration Drift', type: 'Quality Issue', description: 'Cell voltage sensor showing ±5% drift beyond acceptable tolerance. Recalibration required before next batch.', department: 'Quality Control', reportedBy: { name: 'Meena Reddy' }, status: 'Open', priority: 'High', affectedMachine: 'V-Sensor Array', location: 'QC Lab', createdAt: new Date(Date.now() - 7200000) },
  { _id: 'i4', title: 'Delayed Electrolyte Delivery', type: 'Process Delay', description: 'LiPF6 electrolyte shipment delayed by 3 days. Production may be halted if buffer stock depletes.', department: 'Procurement', reportedBy: { name: 'Suresh Patel' }, status: 'Investigating', priority: 'High', location: 'Stores', createdAt: new Date(Date.now() - 86400000) },
  { _id: 'i5', title: 'Conveyor Belt Jam (Line 1)', type: 'Machine Failure', description: 'Assembly line conveyor experienced a jam. Cleared manually, no damage to cells. Root cause under review.', department: 'Maintenance', reportedBy: { name: 'Ravi Singh' }, status: 'Resolved', priority: 'Medium', affectedMachine: 'Conveyor CL-1', location: 'Assembly Line 1', createdAt: new Date(Date.now() - 172800000), resolution: 'Belt re-tensioned and debris cleared. Belt replaced preventively.' },
  { _id: 'i6', title: 'Coating Thickness Non-Conformance', type: 'Quality Issue', description: 'Batch #058 electrode coating thickness measured outside spec (±2µm instead of ±0.5µm). Batch quarantined.', department: 'Engineering', reportedBy: { name: 'Anita Desai' }, status: 'Open', priority: 'High', affectedMachine: 'Coater C-2', location: 'Coating Station', createdAt: new Date(Date.now() - 43200000) },
];

export default function AdminIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (deptFilter) params.department = deptFilter;
      const r = await api.get('/admin/incidents', { params });
      setIncidents(r.data.data?.length ? r.data.data : MOCK_INCIDENTS);
    } catch {
      setIncidents(MOCK_INCIDENTS);
      toast('Demo incident data loaded', { icon: '📋' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [statusFilter, typeFilter, deptFilter]);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await api.patch(`/admin/incidents/${id}/status`, { status, resolution });
      setIncidents(prev => prev.map(i => i._id === id ? { ...i, status, resolution: resolution || i.resolution } : i));
      toast.success(`Incident marked as ${status}`);
      setSelected(null);
      setResolution('');
    } catch {
      // optimistic update for demo
      setIncidents(prev => prev.map(i => i._id === id ? { ...i, status, resolution } : i));
      toast.success(`Incident marked as ${status}`);
      setSelected(null);
      setResolution('');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase();
    return (!search || i.title.toLowerCase().includes(q) || i.department?.toLowerCase().includes(q) || i.reportedBy?.name?.toLowerCase().includes(q)) &&
      (!priorityFilter || i.priority === priorityFilter);
  });

  const counts = {
    open: incidents.filter(i => i.status === 'Open').length,
    critical: incidents.filter(i => i.priority === 'Critical').length,
    investigating: incidents.filter(i => i.status === 'Investigating').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length,
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Incident Management</h1>
          <p className="text-slate-400 mt-1 font-medium">All departments · Machine failures · Safety alerts · Quality issues</p>
        </div>
        <button onClick={fetchIncidents} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-bold transition-all">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Open', value: counts.open, color: 'red', dot: '#ef4444' },
          { label: 'Critical Priority', value: counts.critical, color: 'orange', dot: '#f97316' },
          { label: 'Investigating', value: counts.investigating, color: 'yellow', dot: '#f59e0b' },
          { label: 'Resolved', value: counts.resolved, color: 'emerald', dot: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
            <div>
              <div className={`text-3xl font-black italic text-${s.color}-400`}>{s.value}</div>
              <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            className="w-full bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-500/50"
            placeholder="Search title, dept, reporter..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          { label: 'All Statuses', value: statusFilter, setter: setStatusFilter, opts: ['Open', 'Investigating', 'Resolved', 'Closed'] },
          { label: 'All Priorities', value: priorityFilter, setter: setPriorityFilter, opts: ['Critical', 'High', 'Medium', 'Low'] },
          { label: 'All Departments', value: deptFilter, setter: setDeptFilter, opts: DEPARTMENTS },
        ].map(f => (
          <select key={f.label} className="bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-red-500/50"
            value={f.value} onChange={e => f.setter(e.target.value)}>
            <option value="">{f.label}</option>
            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#13161e] border border-slate-800 rounded-2xl text-slate-500">
            <FiCheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold uppercase tracking-widest text-sm">No incidents found.</p>
          </div>
        ) : filtered.map(incident => {
          const Icon = TYPE_ICONS[incident.type] || FiAlertTriangle;
          const isClosed = incident.status === 'Resolved' || incident.status === 'Closed';
          return (
            <div key={incident._id} className={`bg-[#13161e] border rounded-2xl p-6 transition-all ${isClosed ? 'border-slate-800 opacity-70' : 'border-slate-700 hover:border-red-500/30'}`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-11 h-11 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-white font-bold">{incident.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${PRIORITY_STYLES[incident.priority] || ''}`}>{incident.priority}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[incident.status] || ''}`}>{incident.status}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{incident.description}</p>
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="text-base">🏢</span>{incident.department}</span>
                      <span className="flex items-center gap-1.5"><FiUser className="w-3.5 h-3.5" />{incident.reportedBy?.name || 'Unknown'}</span>
                      <span className="flex items-center gap-1.5"><span className="text-base">🔧</span>{incident.type}</span>
                      {incident.affectedMachine && <span className="flex items-center gap-1.5"><span className="text-base">⚙️</span>{incident.affectedMachine}</span>}
                      {incident.location && <span className="flex items-center gap-1.5"><FiMapPin className="w-3.5 h-3.5" />{incident.location}</span>}
                      <span className="flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5" />{new Date(incident.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    {/* Resolution */}
                    {incident.resolution && (
                      <div className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        ✅ <strong>Resolution:</strong> {incident.resolution}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isClosed && (
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {incident.status === 'Open' && (
                      <button onClick={() => updateStatus(incident._id, 'Investigating')}
                        className="px-3 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/30 transition-all">
                        Investigate
                      </button>
                    )}
                    <button onClick={() => setSelected(incident)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-all">
                      Resolve
                    </button>
                    <button onClick={() => updateStatus(incident._id, 'Closed')}
                      className="px-3 py-2 rounded-xl bg-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-600 transition-all">
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolve Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#13161e] border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">Resolve Incident</h3>
                <p className="text-slate-400 text-sm mt-1">{selected.title}</p>
              </div>
              <button onClick={() => { setSelected(null); setResolution(''); }} className="text-slate-500 hover:text-white transition-all">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
              rows={4} placeholder="Describe the corrective action taken, root cause identified, and follow-up steps..."
              value={resolution} onChange={e => setResolution(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => updateStatus(selected._id, 'Resolved')} disabled={updating || !resolution.trim()}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm disabled:opacity-40 transition-all">
                {updating ? 'Resolving...' : '✅ Mark Resolved'}
              </button>
              <button onClick={() => { setSelected(null); setResolution(''); }}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
