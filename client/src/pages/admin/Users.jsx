import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiUsers, FiPlus, FiEdit2, FiToggleLeft, FiToggleRight,
  FiSearch, FiX, FiTrash2, FiKey, FiAlertTriangle
} from 'react-icons/fi';

const DEPARTMENTS = [
  'Research & Development',
  'Procurement',
  'Production',
  'Quality Control',
  'Maintenance',
  'Safety & Environment',
  'Engineering',
  'Logistics & Supply Chain',
  'Packaging',
  'Sales & Marketing',
  'Human Resources',
  'Finance'
];

const ROLE_COLORS = {
  admin: 'bg-red-500/20 text-red-400',
  manager: 'bg-orange-500/20 text-orange-400',
  employee: 'bg-yellow-500/20 text-yellow-400',
  client: 'bg-green-500/20 text-green-400'
};

const INITIAL_FORM = {
  name: '', email: '', password: '', role: 'client',
  phone: '', company: '', department: '', designation: '', shift: 'Morning', employeeId: ''
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  // Confirm delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, search, deptFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Sanitize payload: clean fields based on role to avoid DB crashes / index failures
    const payload = { ...form };
    if (payload.role === 'client') {
      delete payload.department;
      delete payload.designation;
      delete payload.shift;
      delete payload.employeeId;
    } else {
      delete payload.company;
      if (!payload.department) delete payload.department;
      if (!payload.employeeId || !payload.employeeId.trim()) {
        delete payload.employeeId;
      }
    }

    try {
      if (editUser) {
        const { data } = await api.put(`/admin/users/${editUser._id}`, payload);
        setUsers(prev => prev.map(u => u._id === editUser._id ? data.data : u));
        toast.success('User updated!');
      } else {
        const { data } = await api.post('/admin/users', payload);
        setUsers(prev => [data.data, ...prev]);
        toast.success('User created!');
      }
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle-status`);
      setUsers(prev => prev.map(u => u._id === id ? data.data : u));
      toast.success(data.message);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
      toast.success(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const { data } = await api.patch(`/admin/users/${resetTarget._id}/reset-password`);
      setTempPassword(data.tempPassword);
      toast.success('Password reset!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      name: u.name, email: u.email, password: '', role: u.role,
      phone: u.phone || '', company: u.company || '',
      department: u.department || '', designation: u.designation || '',
      shift: u.shift || 'Morning', employeeId: u.employeeId || ''
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditUser(null);
    setForm(INITIAL_FORM);
  };

  const needsDepartment = form.role === 'employee' || form.role === 'manager';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiUsers className="w-6 h-6 text-purple-400" /> Manage Users
          </h1>
          <p className="text-slate-400 mt-1">Clients, employees, managers and administrators</p>
        </div>
        <button onClick={() => { if (showForm && !editUser) { closeForm(); } else { closeForm(); setShowForm(true); } }}
          className="btn-primary flex items-center gap-2">
          {showForm && !editUser ? <FiX /> : <FiPlus />} {showForm && !editUser ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSave} className="card border-red-500/20 space-y-4">
          <h2 className="text-white font-semibold">{editUser ? 'Edit User' : 'Create New User'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editUser} minLength={6} />
            </div>

            {/* Role */}
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value, department: '' })}>
                <option value="client">Client</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            {/* Client-specific */}
            {form.role === 'client' && (
              <div>
                <label className="label">Company</label>
                <input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </div>
            )}

            {/* Employee / Manager specific */}
            {needsDepartment && (
              <>
                <div>
                  <label className="label">Employee ID *</label>
                  <input className="input" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required placeholder="e.g. EMP123" />
                </div>
                <div>
                  <label className="label">Department *</label>
                  <select className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Designation</label>
                  <input className="input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
                </div>
                <div>
                  <label className="label">Shift</label>
                  <select className="input" value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value })}>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editUser ? 'Update User' : 'Create User'}</button>
            <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input className="input pl-11" placeholder="Search name, email or company..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="client">Clients</option>
          <option value="employee">Employees</option>
          <option value="manager">Managers</option>
          <option value="admin">Admins</option>
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
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No users found</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Company / Dept</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="text-white font-medium">{u.name}</td>
                    <td className="text-slate-400 text-xs">{u.email}</td>
                    <td>
                      <span className={`badge ${ROLE_COLORS[u.role] || 'bg-slate-700 text-slate-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{u.company || u.department || '—'}</td>
                    <td className="text-xs text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      <span className={u.isActive ? 'badge-green' : 'bg-red-500/20 text-red-400 badge'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button onClick={() => openEdit(u)} title="Edit" className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Toggle Status */}
                        <button onClick={() => toggleStatus(u._id)} title={u.isActive ? 'Deactivate' : 'Activate'} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                          {u.isActive ? <FiToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <FiToggleLeft className="w-3.5 h-3.5 text-slate-500" />}
                        </button>
                        {/* Reset Password */}
                        <button onClick={() => { setResetTarget(u); setTempPassword(''); }} title="Reset Password" className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors">
                          <FiKey className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete */}
                        <button onClick={() => setDeleteTarget(u)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13161e] border border-red-500/30 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Delete User</h3>
                <p className="text-slate-400 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              Are you sure you want to delete <strong className="text-white">{deleteTarget.name}</strong> ({deleteTarget.email})?
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors">
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13161e] border border-amber-500/30 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <FiKey className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Reset Password</h3>
                <p className="text-slate-400 text-sm">{resetTarget.name} ({resetTarget.email})</p>
              </div>
            </div>

            {tempPassword ? (
              <div className="mb-6">
                <p className="text-slate-300 text-sm mb-3">Password reset successfully! Share this temporary password with the user:</p>
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 font-mono text-amber-400 text-lg font-bold text-center tracking-widest">
                  {tempPassword}
                </div>
                <p className="text-slate-500 text-xs mt-2 text-center">Ask the user to change this password after login.</p>
              </div>
            ) : (
              <p className="text-slate-300 text-sm mb-6">
                This will generate a random temporary password for <strong className="text-white">{resetTarget.name}</strong>. The user must change it after logging in.
              </p>
            )}

            <div className="flex gap-3">
              {!tempPassword && (
                <button onClick={handleResetPassword} disabled={resetting}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors">
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
              )}
              <button onClick={() => { setResetTarget(null); setTempPassword(''); }}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors">
                {tempPassword ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
