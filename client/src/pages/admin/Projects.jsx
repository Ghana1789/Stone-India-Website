import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiBriefcase, FiSearch, FiRefreshCw, FiCheckCircle, FiClock,
  FiAlertTriangle, FiTrendingUp, FiUsers, FiCalendar, FiArrowRight
} from 'react-icons/fi';

const STATUS_STYLES = {
  'Planning':    { cls: 'bg-slate-700 text-slate-300',           dot: '#6b7280', pct: 5 },
  'In Progress': { cls: 'bg-blue-500/20 text-blue-400',          dot: '#3b82f6', pct: null },
  'On Hold':     { cls: 'bg-yellow-500/20 text-yellow-400',      dot: '#f59e0b', pct: null },
  'Completed':   { cls: 'bg-emerald-500/20 text-emerald-400',    dot: '#22c55e', pct: 100 },
  'Delayed':     { cls: 'bg-red-500/20 text-red-400',            dot: '#ef4444', pct: null },
};

const MOCK_PROJECTS = [
  { _id: 'p1', name: 'EV Fleet Battery Deployment — Phase 1', client: 'EV Fleet Solutions Pvt Ltd', department: 'Production', status: 'In Progress', progress: 72, startDate: new Date('2026-01-15'), endDate: new Date('2026-05-10'), manager: 'Rajan Mehta', teamSize: 8, description: 'Supplying and commissioning 120 StonePack 48V 30Ah battery units for electric fleet vehicles.', milestones: [{name:'Design Approval', done:true},{name:'Batch Production', done:true},{name:'QC Testing', done:false},{name:'Delivery', done:false}] },
  { _id: 'p2', name: 'Custom High-Voltage BMS Integration', client: 'GreenDrive Motors', department: 'Engineering', status: 'Completed', progress: 100, startDate: new Date('2025-11-01'), endDate: new Date('2026-04-10'), manager: 'Ananya Singh', teamSize: 5, description: 'Custom battery management system integration with CAN bus for electric bus fleet.', milestones: [{name:'Spec Finalization', done:true},{name:'Prototype Build', done:true},{name:'Field Testing', done:true},{name:'Sign-off', done:true}] },
  { _id: 'p3', name: 'Lithium Storage System — Solar Backup', client: 'SolarX India', department: 'Research & Development', status: 'Planning', progress: 15, startDate: new Date('2026-04-01'), endDate: new Date('2026-09-30'), manager: 'Vikram Patel', teamSize: 4, description: 'Designing a 100kWh lithium iron phosphate storage system for solar farm backup power.', milestones: [{name:'Feasibility Study', done:true},{name:'Prototype Design', done:false},{name:'Testing', done:false},{name:'Production', done:false}] },
  { _id: 'p4', name: 'UPS Module Supply — Q2 Batch', client: 'BlueSpark Energy', department: 'Production', status: 'In Progress', progress: 45, startDate: new Date('2026-03-01'), endDate: new Date('2026-05-20'), manager: 'Suresh Kumar', teamSize: 6, description: 'Manufacturing 30 units of StonePack 60V 40Ah for industrial UPS backup systems.', milestones: [{name:'Material Procurement', done:true},{name:'Cell Manufacturing', done:true},{name:'Assembly', done:false},{name:'Dispatch', done:false}] },
  { _id: 'p5', name: 'Three-Wheeler Retrofit Program', client: 'Volterra Logistics', department: 'Engineering', status: 'Delayed', progress: 30, startDate: new Date('2026-02-01'), endDate: new Date('2026-04-15'), manager: 'Priya Sharma', teamSize: 7, description: 'Retrofitting 50 three-wheelers with StonePack 60V 40Ah. Delayed due to procurement issues.', milestones: [{name:'Vehicle Survey', done:true},{name:'Kit Design', done:true},{name:'Installation', done:false},{name:'Testing', done:false}] },
];

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/projects');
      setProjects(r.data.data?.length ? r.data.data : MOCK_PROJECTS);
    } catch {
      setProjects(MOCK_PROJECTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const filtered = projects.filter(p =>
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.client?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || p.status === statusFilter)
  );

  const counts = {
    total: projects.length,
    active: projects.filter(p => p.status === 'In Progress').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    delayed: projects.filter(p => p.status === 'Delayed').length,
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Manufacturing Projects</h1>
          <p className="text-slate-400 mt-1 font-medium">All active, planned & completed client projects</p>
        </div>
        <button onClick={fetchProjects} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-bold transition-all">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Total Projects', value: counts.total, icon: FiBriefcase, color: 'blue' },
          { label: 'Active', value: counts.active, icon: FiTrendingUp, color: 'emerald' },
          { label: 'Completed', value: counts.completed, icon: FiCheckCircle, color: 'purple' },
          { label: 'Delayed', value: counts.delayed, icon: FiAlertTriangle, color: 'red' },
        ].map(s => (
          <div key={s.label} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5">
            <div className={`p-2.5 rounded-xl bg-${s.color}-500/10 w-fit mb-3`}>
              <s.icon className={`w-5 h-5 text-${s.color}-500`} />
            </div>
            <div className={`text-3xl font-black italic text-${s.color}-400`}>{s.value}</div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input className="w-full bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-500/50"
            placeholder="Search project or client..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-red-500/50 sm:w-44"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.map(project => {
          const st = STATUS_STYLES[project.status] || STATUS_STYLES['Planning'];
          const isExpanded = expanded === project._id;
          const pct = project.progress ?? st.pct ?? 0;
          return (
            <div key={project._id} className="bg-[#13161e] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all">
              {/* Main row */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-white font-bold text-base">{project.name}</h3>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${st.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                        {project.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span>🏢</span>{project.client}</span>
                      <span className="flex items-center gap-1.5"><FiUsers className="w-3.5 h-3.5" />{project.manager} ({project.teamSize} members)</span>
                      <span className="flex items-center gap-1.5"><FiBriefcase className="w-3.5 h-3.5" />{project.department}</span>
                      <span className="flex items-center gap-1.5"><FiCalendar className="w-3.5 h-3.5" />{new Date(project.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} → {new Date(project.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Progress ring area */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-2xl font-black text-white italic">{pct}%</div>
                      <div className="text-slate-500 text-[10px] font-bold uppercase">complete</div>
                    </div>
                    <button onClick={() => setExpanded(isExpanded ? null : project._id)}
                      className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                      <FiArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                    <span>Progress</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : pct > 50 ? '#3b82f6' : pct > 25 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              </div>

              {/* Milestones (expanded) */}
              {isExpanded && project.milestones && (
                <div className="border-t border-slate-800 px-6 py-4 bg-slate-800/20">
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Milestones</div>
                  <div className="flex flex-wrap gap-3">
                    {project.milestones.map((m, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${m.done ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {m.done ? <FiCheckCircle className="w-3.5 h-3.5" /> : <FiClock className="w-3.5 h-3.5" />}
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
