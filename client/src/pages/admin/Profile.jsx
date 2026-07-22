import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiSave, FiLock, FiMail, FiPhone, FiCalendar, FiShield, FiSliders, FiDownload, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import MfaSettings from '../../components/MfaSettings';

export default function AdminProfile() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // GDPR & Session Revocation States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleRevokeSessions = async () => {
    try {
      const { data } = await api.post('/auth/revoke-sessions');
      toast.success(data.message || 'Sessions revoked. Logging out...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke sessions.');
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/auth/gdpr/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `personal_data_${profile?.name?.replace(/\s+/g, '_') || 'profile'}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Data exported successfully!');
    } catch (err) {
      toast.error('Failed to export personal data.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Password is required.');
      return;
    }
    try {
      const { data } = await api.post('/auth/gdpr/delete', { password: deletePassword });
      toast.success(data.message || 'Account deleted successfully.');
      setShowDeleteModal(false);
      setDeletePassword('');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed.');
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/profile');
      setProfile(data.data);
      setForm({ name: data.data.name || '', phone: data.data.phone || '', avatar: data.data.avatar || '' });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/admin/profile', form);
      setProfile(data.data);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/admin/profile/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPwSaving(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = (profile?.name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FiUser className="w-6 h-6 text-blue-400" /> My Profile
        </h1>
        <p className="text-slate-400 mt-1">Manage your admin account details and security</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 flex items-center gap-5">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg shadow-red-900/40">
          {initials}
        </div>
        <div>
          <div className="text-white text-xl font-bold">{profile?.name}</div>
          <div className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
            <FiMail className="w-3.5 h-3.5" /> {profile?.email}
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="bg-red-500/20 text-red-400 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize flex items-center gap-1">
              <FiShield className="w-3 h-3" /> {profile?.role}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${profile?.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {profile?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <div className="text-slate-500 text-xs flex items-center justify-end gap-1">
            <FiCalendar className="w-3.5 h-3.5" />
            Joined {formatDate(profile?.createdAt)}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Last login: {formatDate(profile?.lastLogin)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
        {[
          { key: 'profile', label: 'Profile Details', icon: FiUser },
          { key: 'password', label: 'Change Password', icon: FiLock },
          { key: 'security', label: 'Security & MFA', icon: FiShield },
          { key: 'privacy', label: 'Privacy & Sessions', icon: FiSliders },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[#13161e] text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold">Edit Profile Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                className="input opacity-60 cursor-not-allowed"
                value={profile?.email || ''}
                disabled
                title="Email cannot be changed here"
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  className="input pl-11"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input opacity-60 cursor-not-allowed capitalize" value={profile?.role || ''} disabled />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-50">
              <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-white font-semibold">Change Password</h3>
          <p className="text-slate-400 text-sm">Enter your current password to verify your identity, then set a new password.</p>

          <div className="space-y-4 max-w-sm">
            <div>
              <label className="label">Current Password *</label>
              <input
                type="password"
                className="input"
                value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="label">New Password *</label>
              <input
                type="password"
                className="input"
                value={pwForm.newPassword}
                onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="label">Confirm New Password *</label>
              <input
                type="password"
                className="input"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
              />
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={pwSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all disabled:opacity-50">
            <FiLock className="w-4 h-4" /> {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <MfaSettings />
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Active Sessions */}
          <div className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
                <FiSliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Active Device Sessions</h3>
                <p className="text-slate-400 text-sm mt-1">
                  You are currently logged in. If you suspect unauthorized access, you can revoke all other active sessions immediately.
                </p>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    Current Device (This Browser Session)
                  </div>
                  <div className="text-slate-400 text-xs mt-1 font-mono">
                    IP Address: Connected | User Agent: Active
                  </div>
                </div>
                <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Active Now
                </span>
              </div>
            </div>

            <button
              onClick={handleRevokeSessions}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Revoke All Other Sessions
            </button>
          </div>

          {/* GDPR Controls */}
          <div className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-white font-bold text-lg">Data Privacy & GDPR Controls</h3>
            <p className="text-slate-400 text-sm">
              Under data protection regulations, you have the right to export your personal data profile or request account deactivation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                  <FiDownload className="text-blue-400" /> Export Personal Profile
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Download a complete data transcript of your registered profile parameters, contact details, and historical audit logs.
                </p>
                <button
                  onClick={handleExportData}
                  className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg border border-slate-850 transition-colors"
                >
                  Download Data (JSON)
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                  <FiTrash2 className="text-red-400" /> Request Account Erasure
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Deactivate your account profile and flag all associated records for permanent deletion in compliance with GDPR guidelines.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition-colors"
                >
                  Request Deletion
                </button>
              </div>
            </div>
          </div>

          {/* Erasure Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
                <h4 className="text-white font-bold text-lg flex items-center gap-2 text-red-400">
                  <FiAlertTriangle /> Confirm Profile Deletion
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Warning: This action is permanent. Enter your password below to confirm deactivation and initiate the GDPR data erasure protocol.
                </p>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Your Password</label>
                  <input
                    type="password"
                    className="input text-sm"
                    placeholder="Enter account password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword('');
                    }}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-850/80 text-slate-400 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
