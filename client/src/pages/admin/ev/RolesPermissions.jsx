import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { FiShield, FiRefreshCw, FiUser, FiActivity } from 'react-icons/fi';
import ErrorBoundary from '../../../components/ErrorBoundary';

export default function RolesPermissions() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [usersByRole, setUsersByRole] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activity, setActivity] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/ev/roles-permissions');
      if (res.data.success) {
        setRoles(res.data.data.roleDefinitions || []);
        setUsersByRole(res.data.data.usersByRole || []);
        setTotalUsers(res.data.data.totalUsers || 0);
        setActivity(res.data.data.recentActivity || []);
        if (res.data.data.roleDefinitions?.length > 0) {
          setSelectedRole(res.data.data.roleDefinitions[0]);
        }
      } else {
        setErrorMsg('API returned success: false');
      }
    } catch (err) {
      console.error('Error fetching roles & permissions data:', err);
      setErrorMsg(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">Roles & Permissions Matrix</h1>
          <p className="text-slate-400 text-sm">Configure Role-Based Access Control (RBAC) and audit role assignments</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-700 self-start sm:self-center">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Matrix
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl font-bold">
          Error: {errorMsg}
        </div>
      )}

      {/* Summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Staff Registered</div>
          <div className="text-3xl font-black text-white mt-2">{totalUsers}</div>
          <div className="text-blue-400 text-xs font-semibold mt-2 flex items-center gap-1">
            <FiUser className="w-3.5 h-3.5" /> All active operator & manager accounts
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest">Defined Roles</div>
          <div className="text-3xl font-black text-white mt-2">{roles.length}</div>
          <div className="text-emerald-400 text-xs font-semibold mt-2 flex items-center gap-1">
            <FiShield className="w-3.5 h-3.5" /> Granular module-level access definitions
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
          <div className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Shifts</div>
          <div className="text-3xl font-black text-white mt-2">3 Shifts</div>
          <div className="text-purple-400 text-xs font-semibold mt-2 flex items-center gap-1">
            <FiActivity className="w-3.5 h-3.5 animate-pulse" /> 24/7 Continuous plant coverage
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Roles List */}
        <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 space-y-4">
          <h2 className="text-lg font-bold text-white tracking-wide mb-4">Plant & System Roles</h2>
          {loading ? (
            <div className="text-slate-500 text-center py-8">Loading roles...</div>
          ) : (
            <div className="space-y-2">
              {roles.map((roleDef, idx) => {
                const countObj = (usersByRole || []).find(u => u?._id === roleDef.role);
                const active = selectedRole?.role === roleDef.role;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedRole(roleDef)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      active ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: roleDef.color }} />
                        <span className="text-white font-bold text-sm">{roleDef.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{roleDef.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-bold">
                      {countObj?.count || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Center/Right Permissions Matrix */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
          {selectedRole ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                    <FiShield className="w-5 h-5" style={{ color: selectedRole.color }} />
                    Permissions Matrix: {selectedRole.label}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">{selectedRole.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(selectedRole.permissions || {}).map(([moduleName, perms]) => (
                  <div key={moduleName} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <span className="text-slate-300 text-sm font-bold capitalize">{moduleName.replace('_', ' ')}</span>
                    <div className="flex gap-1.5">
                      {(perms || []).map((p, pIdx) => (
                        <span key={pIdx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-24 font-semibold">Select a role to view its permission matrix.</div>
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
        <h2 className="text-lg font-bold text-white tracking-wide mb-6">Security & RBAC Audit Logs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 text-xs font-black uppercase tracking-wider">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {(activity || []).length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-500 font-semibold text-sm">No recent security audit logs found.</td>
                </tr>
              ) : (
                (activity || []).map((log) => (
                  <tr key={log._id} className="border-b border-white/5 text-sm hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{log.action}</td>
                    <td className="py-3 px-4 text-slate-300">{log.description}</td>
                    <td className="py-3 px-4 text-slate-400">{log.performedBy?.name || log.performedBy?.email || 'System'}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.status === 'Success' || log.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {log.status || 'Success'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
