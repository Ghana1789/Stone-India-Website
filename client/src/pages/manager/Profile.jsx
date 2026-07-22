import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiUser, FiSave, FiLock, FiMail, FiPhone, FiCalendar, FiBriefcase, 
  FiClock, FiActivity, FiBell, FiSliders, FiCheckCircle, FiAlertTriangle 
} from 'react-icons/fi';

export default function ManagerProfile() {
  const { user, updateUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', shift: 'Morning', designation: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Custom Preferences State (Saved in LocalStorage for persistence)
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('mgr_preferences');
    return saved ? JSON.parse(saved) : {
      notifications: true,
      compactView: false,
      dailyDigest: true,
      refreshInterval: '15'
    };
  });

  const [prefSaving, setPrefSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/me');
      if (data?.user) {
        setProfile(data.user);
        setForm({
          name: data.user.name || '',
          phone: data.user.phone || '',
          shift: data.user.shift || 'Morning',
          designation: data.user.designation || 'Production Lead'
        });
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/update-profile', form);
      setProfile(data.user);
      updateUser(data.user);
      toast.success('Profile details updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', {
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

  const handleSavePreferences = (e) => {
    e.preventDefault();
    setPrefSaving(true);
    setTimeout(() => {
      localStorage.setItem('mgr_preferences', JSON.stringify(preferences));
      toast.success('Operational preferences updated!');
      setPrefSaving(false);
    }, 600);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = (profile?.name || 'M').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Dynamic list of recent operational activity logged by this manager
  const activityLogs = [
    {
      id: 1,
      type: 'task',
      title: 'Assigned Cell Assembly Duty',
      desc: 'Assigned Production Line #1 Cell Assembly task to Priya Sharma.',
      time: 'Today, 11:30 AM',
      icon: FiBriefcase,
      color: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    {
      id: 2,
      type: 'approval',
      title: 'Approved Sick Leave',
      desc: 'Approved Priya Sharma\'s sick leave application with recuperation note.',
      time: 'Yesterday, 04:15 PM',
      icon: FiCheckCircle,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 3,
      type: 'incident',
      title: 'Monitored Overheating Log',
      desc: 'Logged Critical incident for Mixer Unit M-3 overheating in Bay 3.',
      time: '16 May 2026, 02:10 PM',
      icon: FiAlertTriangle,
      color: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    {
      id: 4,
      type: 'review',
      title: 'Submitted Performance Review',
      desc: 'Submitted Q3 2026 performance rating (90% - Excellent) for Priya Sharma.',
      time: '15 May 2026, 09:45 AM',
      icon: FiActivity,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FiUser className="w-6 h-6 text-green-400" /> My Profile
          </h1>
          <p className="text-slate-400 mt-1">Manage your manager account details, operational preferences, and recent activities</p>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-[#13161e] border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl" />
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-lg shadow-green-900/40 border-2 border-green-500/20">
          {initials}
        </div>
        
        <div className="flex-1">
          <div className="text-white text-2xl font-bold flex items-center gap-2">
            {profile?.name}
            <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              Active Duty
            </span>
          </div>
          <div className="text-slate-400 text-sm mt-1.5 flex items-center gap-2">
            <FiMail className="w-4 h-4 text-slate-500" /> {profile?.email}
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5 capitalize">
              <FiBriefcase className="w-3.5 h-3.5 text-green-400" /> {profile?.designation || 'Production Lead'}
            </span>
            <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
              <FiClock className="w-3.5 h-3.5 text-orange-400" /> {profile?.shift || 'Morning'} Shift
            </span>
            <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5">
              ID: {profile?.employeeId || 'SI-MGR-002'}
            </span>
          </div>
        </div>

        <div className="md:text-right text-slate-500 text-xs shrink-0 flex flex-col md:items-end gap-2 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <FiCalendar className="w-4 h-4 text-green-400" /> Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Never'}
          </div>
          <div className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 w-fit text-[10px] font-semibold">
            SECURE PORTAL VERIFIED
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/60 p-1.5 border border-slate-800/80 rounded-xl w-fit overflow-x-auto max-w-full">
        {[
          { key: 'profile', label: 'Profile Details', icon: FiUser },
          { key: 'preferences', label: 'Operational Preferences', icon: FiSliders },
          { key: 'activity', label: 'Recent Activities', icon: FiActivity },
          { key: 'password', label: 'Security & Password', icon: FiLock },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key ? 'bg-[#181d28] text-white shadow border border-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
          <div>
            <h3 className="text-white font-bold text-lg">Edit Personal Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">Keep your active manufacturing team coordinates up to date.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                title="Contact Admin to change email" 
              />
            </div>

            <div>
              <label className="label">Designation / Role Title *</label>
              <input 
                className="input" 
                value={form.designation} 
                onChange={e => setForm({ ...form, designation: e.target.value })} 
                placeholder="Production Lead"
                required 
              />
            </div>

            <div>
              <label className="label">Shift Schedule Preference</label>
              <select 
                className="input select" 
                value={form.shift} 
                onChange={e => setForm({ ...form, shift: e.target.value })}
              >
                <option value="Morning">Morning Shift (06:00 AM - 02:00 PM)</option>
                <option value="Evening">Evening Shift (02:00 PM - 10:00 PM)</option>
                <option value="Night">Night Shift (10:00 PM - 06:00 AM)</option>
              </select>
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
              <label className="label">Supervised Department</label>
              <input 
                className="input opacity-60 cursor-not-allowed uppercase font-semibold" 
                value={profile?.department || 'Production'} 
                disabled 
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={saving} 
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-500 shadow-glow-green min-w-[140px]"
            >
              <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Operational Preferences */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
          <div>
            <h3 className="text-white font-bold text-lg">Operational Preferences & Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize your supervisor workspace dashboards and data feeds.</p>
          </div>

          <div className="space-y-4 max-w-xl">
            {/* Toggle 1: Desktop Alerts */}
            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <div>
                <div className="text-white text-sm font-semibold flex items-center gap-2">
                  <FiBell className="w-4 h-4 text-green-400" /> Enable Real-Time Desktop Alerts
                </div>
                <div className="text-slate-400 text-xs mt-1">Get immediate push updates for safety incidents and leave applications.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications} 
                  onChange={e => setPreferences({ ...preferences, notifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white" />
              </label>
            </div>

            {/* Toggle 2: Compact View */}
            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <div>
                <div className="text-white text-sm font-semibold flex items-center gap-2">
                  <FiSliders className="w-4 h-4 text-orange-400" /> Compact Layout Mode
                </div>
                <div className="text-slate-400 text-xs mt-1">Remove heavy card backgrounds to fit more grids on smaller dashboard screens.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={preferences.compactView} 
                  onChange={e => setPreferences({ ...preferences, compactView: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white" />
              </label>
            </div>

            {/* Toggle 3: Daily digest */}
            <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <div>
                <div className="text-white text-sm font-semibold flex items-center gap-2">
                  <FiMail className="w-4 h-4 text-blue-400" /> Shift Performance Digest
                </div>
                <div className="text-slate-400 text-xs mt-1">Receive an automated Q3 score and task completion report via email at the end of each shift.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={preferences.dailyDigest} 
                  onChange={e => setPreferences({ ...preferences, dailyDigest: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white" />
              </label>
            </div>

            {/* Dropdown: Auto refresh interval */}
            <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <label className="text-white text-sm font-semibold flex items-center gap-2 mb-2">
                <FiClock className="w-4 h-4 text-purple-400" /> Real-time Dashboard Sync Interval
              </label>
              <select 
                className="input select w-full sm:w-64"
                value={preferences.refreshInterval}
                onChange={e => setPreferences({ ...preferences, refreshInterval: e.target.value })}
              >
                <option value="5">Every 5 Seconds (Fast Sync)</option>
                <option value="15">Every 15 Seconds (Standard Sync)</option>
                <option value="30">Every 30 Seconds (Optimized)</option>
                <option value="manual">Manual Refresh Only</option>
              </select>
              <div className="text-slate-500 text-[11px] mt-1.5">Auto-updates and re-checks for telemetry drift and supervisor checklists.</div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={prefSaving} 
              className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-500 shadow-glow-green"
            >
              <FiSave className="w-4 h-4" /> {prefSaving ? 'Saving Preferences...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Recent Activity Log */}
      {activeTab === 'activity' && (
        <div className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
          <div>
            <h3 className="text-white font-bold text-lg">My Recent Operations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chronological audit ledger of your administrative actions in the Production department.</p>
          </div>

          <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
            {activityLogs.map((log) => (
              <div key={log.id} className="relative group animate-slide-in">
                {/* Connector Node Icon */}
                <span className={`absolute -left-[37px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-850 shadow-md ${log.color}`}>
                  <log.icon className="h-3 w-3" />
                </span>
                
                <div className="bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800/40 hover:border-slate-800/80 rounded-xl p-4 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <span className="text-white text-sm font-semibold tracking-wide">{log.title}</span>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <FiClock className="w-3 h-3" /> {log.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{log.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Security & Password */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-lg">
          <div>
            <h3 className="text-white font-bold text-lg">Security & Password Settings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Keep your supervisor credentials secure.</p>
          </div>
          
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="label">Current Password *</label>
              <input 
                type="password" 
                className="input" 
                value={pwForm.currentPassword} 
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} 
                required 
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
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={pwSaving} 
              className="btn-primary flex items-center gap-2 bg-red-600 hover:bg-red-500 border-none shadow-glow-red"
            >
              <FiLock className="w-4 h-4" /> {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
