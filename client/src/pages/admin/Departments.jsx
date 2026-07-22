import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiUsers, FiAlertTriangle, FiCheckCircle, FiActivity,
  FiSearch, FiRefreshCw
} from 'react-icons/fi';

const DEPARTMENTS = [
  'Research & Development', 'Procurement', 'Production', 'Quality Control',
  'Maintenance', 'Safety & Environment', 'Engineering', 'Logistics & Supply Chain',
  'Packaging', 'Sales & Marketing', 'Human Resources', 'Finance'
];

const DEPT_ICONS = {
  'Research & Development': '🔬',
  'Procurement': '🛒',
  'Production': '🏭',
  'Quality Control': '✅',
  'Maintenance': '🔧',
  'Safety & Environment': '🛡️',
  'Engineering': '⚙️',
  'Logistics & Supply Chain': '🚛',
  'Packaging': '📦',
  'Sales & Marketing': '📈',
  'Human Resources': '👥',
  'Finance': '💰',
};

const STATUS_COLORS = {
  Active: { dot: '#22c55e', cls: 'bg-emerald-500/20 text-emerald-400' },
  Alert: { dot: '#ef4444', cls: 'bg-red-500/20 text-red-400' },
  Inactive: { dot: '#6b7280', cls: 'bg-slate-700 text-slate-400' },
};

const MOCK_DEPTS = DEPARTMENTS.map((name, i) => ({
  name,
  employeeCount: Math.floor(Math.random() * 15) + 3,
  managerCount: Math.floor(Math.random() * 2) + 1,
  headName: ['Rajiv Mehta', 'Priya Sharma', 'Arjun Reddy', 'Suresh Kumar', 'Ananya Singh', 'Vikram Patel'][i % 6],
  headDesignation: 'Department Manager',
  openTasks: Math.floor(Math.random() * 8),
  openIncidents: Math.floor(Math.random() * 3),
  status: i === 2 ? 'Alert' : 'Active',
}));

export default function AdminDepartments() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/departments');
      setDepts(r.data.data || []);
    } catch {
      setDepts(MOCK_DEPTS);
      toast.error('Using demo data – connect MongoDB for live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepts(); }, []);

  const filtered = depts.filter(d =>
    (!search || d.name.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || d.status === statusFilter)
  );

  const totalEmployees = depts.reduce((a, d) => a + d.employeeCount, 0);
  const activeCount = depts.filter(d => d.status === 'Active').length;
  const alertCount = depts.filter(d => d.status === 'Alert').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Department Management</h1>
          <p className="text-slate-400 mt-1 font-medium">All 12 operational departments · Battery Manufacturing</p>
        </div>
        <button onClick={fetchDepts} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-bold transition-all">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[
          { label: 'Total Departments', value: 12, icon: '🏢', color: 'blue' },
          { label: 'Total Employees', value: totalEmployees, icon: '👥', color: 'emerald' },
          { label: 'Active Depts', value: activeCount, icon: '✅', color: 'green' },
          { label: 'Alert Depts', value: alertCount, icon: '⚠️', color: 'red' },
        ].map(s => (
          <div key={s.label} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-3xl font-black italic text-${s.color}-400`}>{s.value}</div>
            <div className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input className="w-full bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 pl-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-500/50"
            placeholder="Search department..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="bg-[#13161e] border border-slate-800 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-red-500/50 sm:w-44"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Alert">Alert</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Department Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(dept => {
            const st = STATUS_COLORS[dept.status] || STATUS_COLORS.Active;
            const icon = DEPT_ICONS[dept.name] || '🏢';
            return (
              <div key={dept.name} className="bg-[#13161e] border border-slate-800 rounded-[1.5rem] p-6 hover:border-red-500/30 transition-all group relative overflow-hidden">
                {/* Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl">
                        {icon}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-sm leading-tight">{dept.name}</h3>
                        <div className="text-slate-500 text-xs mt-0.5">{dept.headName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.dot }} />
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${st.cls}`}>
                        {dept.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Employees', value: dept.employeeCount, icon: FiUsers },
                      { label: 'Managers', value: dept.managerCount, icon: FiActivity },
                      { label: 'Open Tasks', value: dept.openTasks, icon: FiCheckCircle },
                      { label: 'Open Issues', value: dept.openIncidents, icon: FiAlertTriangle },
                    ].map(m => (
                      <div key={m.label} className="bg-slate-800/60 rounded-xl p-3">
                        <div className="text-white font-black text-lg italic">{m.value}</div>
                        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {dept.openIncidents > 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                      <FiAlertTriangle className="w-3.5 h-3.5" />
                      {dept.openIncidents} open incident{dept.openIncidents > 1 ? 's' : ''} require attention
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
