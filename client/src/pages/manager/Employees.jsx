import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';
import { FiUsers, FiSearch, FiMail, FiPhone } from 'react-icons/fi';

function PerformanceBar({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col gap-1 w-24">
      <div className="flex items-center justify-between text-[10px] font-bold" style={{ color }}>
        <span>PERFORMANCE</span>
        <span>{score}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function ManagerEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/manager/employees');
      if (data?.success) {
        setEmployees(data.data || []);
      }
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();

    socket.on('employee_updated', () => {
      fetchEmployees();
    });

    socket.on('performance_updated', () => {
      fetchEmployees();
    });

    return () => {
      socket.off('employee_updated');
      socket.off('performance_updated');
    };
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(e => 
    e.name?.toLowerCase().includes(search.toLowerCase()) || 
    e.designation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiUsers className="w-6 h-6 text-blue-400" /> My Team
          </h1>
          <p className="text-slate-400 mt-1">Directory of employees in your department</p>
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            className="input pl-11" 
            placeholder="Search by name or role..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-20 bg-[#13161e] rounded-2xl border border-slate-800">
          <FiUsers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-1">No employees found</h3>
          <p className="text-slate-500 text-sm">Your department currently has no registered employees.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map(emp => (
            <div key={emp._id} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 hover:bg-slate-800/40 transition-all flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/30">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{emp.name}</h3>
                    <div className="text-blue-400 text-xs font-semibold">{emp.designation || 'Employee'}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${emp.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {emp.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="space-y-2 mt-2 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-400"><FiMail className="w-4 h-4 text-slate-500" /> {emp.email}</div>
                {emp.phone && <div className="flex items-center gap-2 text-sm text-slate-400"><FiPhone className="w-4 h-4 text-slate-500" /> {emp.phone}</div>}
              </div>
              
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Joined: {new Date(emp.createdAt).toLocaleDateString()}
                </div>
                <PerformanceBar score={emp.performance?.score || 0} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
