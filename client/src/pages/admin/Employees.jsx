import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiUsers, FiActivity, FiUser } from 'react-icons/fi';

const DEPARTMENTS = [
  'Machine Operator', 'Sales Executive', 'Marketing Manager', 'Account Executive',
  'Data Analyst', 'Production Supervisor', 'R&D Engineer', 'Ass HR Manager'
];

function PerformanceBar({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden w-20">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{score}%</span>
    </div>
  );
}

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, managers: 0, employees: 0, avgPerformance: 0 });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      const { data } = await api.get('/admin/employees', { params });
      setEmployees(data.data || []);

      // Compute stats
      const list = data.data || [];
      const managers = list.filter(e => e.role === 'manager').length;
      const empCount = list.filter(e => e.role === 'employee').length;
      const avgPerf = list.length > 0
        ? Math.round(list.reduce((s, e) => s + (e.performance?.score || 0), 0) / list.length)
        : 0;
      setStats({ total: list.length, managers, employees: empCount, avgPerformance: avgPerf });
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, [roleFilter, search, deptFilter]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiUsers className="w-6 h-6 text-red-400" /> Employees
        </h1>
        <p className="text-slate-400 mt-1">Employee and manager profiles, departments, and performance tracking</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: stats.total, color: '#3b82f6' },
          { label: 'Managers', value: stats.managers, color: '#f97316' },
          { label: 'Employees', value: stats.employees, color: '#22c55e' },
          { label: 'Avg Performance', value: `${stats.avgPerformance}%`, color: stats.avgPerformance >= 75 ? '#22c55e' : stats.avgPerformance >= 50 ? '#f59e0b' : '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5">
            <div className="text-slate-400 text-sm mb-1">{s.label}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input className="input pl-11" placeholder="Search name, email, ID or designation..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="manager">Managers</option>
          <option value="employee">Employees</option>
        </select>
        <select className="input sm:w-52" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiUsers className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-white font-semibold text-lg mb-1">No employees found</h3>
            <p className="text-slate-500 text-sm">
              {search || roleFilter || deptFilter
                ? 'No results match your filters.'
                : 'Add employees from the User Management section.'}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Shift</th>
                  <th>Performance</th>
                  <th>Status</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{emp.name}</div>
                          <div className="text-slate-500 text-xs">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${emp.role === 'manager' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="text-slate-300 text-sm">{emp.department || '—'}</td>
                    <td className="text-slate-400 text-xs">{emp.designation || '—'}</td>
                    <td className="text-slate-400 text-xs">{emp.shift || '—'}</td>
                    <td>
                      <PerformanceBar score={emp.performance?.score || 0} />
                    </td>
                    <td>
                      <span className={`badge ${emp.isActive ? 'badge-green' : 'bg-red-500/20 text-red-400'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">{emp.lastLogin ? formatDate(emp.lastLogin) : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
