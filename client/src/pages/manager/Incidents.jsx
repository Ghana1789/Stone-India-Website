import { useState, useEffect, useCallback } from 'react';
import socket from '../../services/socket';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle, FiTool, FiShield, FiZap, FiPackage,
  FiSearch, FiFilter, FiChevronDown, FiCheckCircle, FiClock, FiRefreshCw
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
  Critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  Low: 'bg-slate-700 text-slate-400 border-slate-600',
};

const STATUS_STYLES = {
  Open: 'bg-red-500/20 text-red-400',
  Investigating: 'bg-yellow-500/20 text-yellow-400',
  Resolved: 'bg-emerald-500/20 text-emerald-400',
  Closed: 'bg-slate-700 text-slate-400',
};

export default function ManagerIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const r = await api.get('/manager/incidents', { params });
      setIncidents(r.data.data || []);
    } catch {
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { 
    fetch(); 

    socket.on('incident_reported', (incident) => {
      fetch();
      toast.error(`New Incident Reported: ${incident.title}`, { duration: 6000 });
    });

    socket.on('incident_resolved', () => {
       fetch();
    });

    return () => {
      socket.off('incident_reported');
      socket.off('incident_resolved');
    };
  }, [fetch]);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const r = await api.patch(`/manager/incidents/${id}/status`, { status, resolution });
      setIncidents(prev => prev.map(i => i._id === id ? r.data.data : i));
      toast.success(`Incident marked as ${status}`);
      setSelected(null);
      setResolution('');
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = incidents.filter(i =>
    !search || i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.reportedBy?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = incidents.filter(i => i.status === 'Open').length;
  const criticalCount = incidents.filter(i => i.priority === 'Critical').length;
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Incident Tracker</h1>
          <p className="text-slate-400 mt-1 font-medium">Department issue & safety alert management</p>
        </div>
        <button onClick={fetch} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-bold transition-all">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Open', value: openCount, color: 'text-red-400' },
          { label: 'Critical', value: criticalCount, color: 'text-orange-400' },
          { label: 'Resolved', value: resolvedCount, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#13161e] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className={`text-4xl font-black italic ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-[10px] font-black uppercase mt-2 tracking-widest italic">{s.label} Incidents</div>
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-current opacity-[0.03] rounded-full group-hover:scale-110 transition-transform duration-700`} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input className="w-full bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-orange-500/50"
            placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-orange-500/50 sm:w-44"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['Open', 'Investigating', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-orange-500/50 sm:w-48"
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {['Machine Failure', 'Safety Concern', 'Quality Issue', 'Environmental', 'Process Delay', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <FiCheckCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold uppercase tracking-widest text-sm">No incidents found.</p>
          </div>
        ) : filtered.map(incident => {
          const Icon = TYPE_ICONS[incident.type] || FiAlertTriangle;
          return (
            <div key={incident._id} className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-white font-bold">{incident.title}</h3>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${PRIORITY_STYLES[incident.priority] || ''}`}>
                        {incident.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[incident.status] || ''}`}>
                        {incident.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{incident.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>🏢 {incident.department}</span>
                      <span>👤 {incident.reportedBy?.name || 'Unknown'}</span>
                      <span>🔧 {incident.type}</span>
                      {incident.affectedMachine && <span>⚙️ {incident.affectedMachine}</span>}
                      <span>🕐 {new Date(incident.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    {incident.resolution && (
                      <div className="mt-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
                        ✅ Resolution: {incident.resolution}
                      </div>
                    )}
                  </div>
                </div>

                {incident.status !== 'Resolved' && incident.status !== 'Closed' && (
                  <div className="flex gap-2 shrink-0">
                    {incident.status === 'Open' && (
                      <button onClick={() => updateStatus(incident._id, 'Investigating')} disabled={updating}
                        className="px-3 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/30 transition-all">
                        Investigate
                      </button>
                    )}
                    <button onClick={() => setSelected(incident)}
                      className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-all">
                      Resolve
                    </button>
                    <button onClick={() => updateStatus(incident._id, 'Closed')} disabled={updating}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#13161e] border border-emerald-500/30 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold mb-1">Resolve Incident</h3>
            <p className="text-slate-400 text-sm mb-4">{selected.title}</p>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
              rows={3} placeholder="Describe the resolution taken..." value={resolution}
              onChange={e => setResolution(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => updateStatus(selected._id, 'Resolved')} disabled={updating || !resolution.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm disabled:opacity-50 transition-all">
                {updating ? 'Resolving...' : 'Mark Resolved'}
              </button>
              <button onClick={() => { setSelected(null); setResolution(''); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
