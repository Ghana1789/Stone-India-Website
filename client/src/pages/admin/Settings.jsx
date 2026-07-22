import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSettings, FiSave, FiRefreshCw, FiMail, FiShield, FiBell, FiSliders } from 'react-icons/fi';

const TABS = [
  { key: 'general',       label: 'General',       icon: FiSliders },
  { key: 'notifications', label: 'Notifications', icon: FiBell },
  { key: 'security',      label: 'Security',       icon: FiShield },
  { key: 'email',         label: 'Email Config',   icon: FiMail },
];

export default function AdminSettings() {
  const [settings, setSettings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [localValues, setLocalValues] = useState({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settings');
      setSettings(data.data || []);
      // build local state map
      const map = {};
      (data.data || []).forEach(s => { map[s.key] = s.value; });
      setLocalValues(map);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleChange = (key, value) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only save settings for the current tab
      const tabSettings = settings
        .filter(s => s.category === activeTab)
        .map(s => ({ key: s.key, value: localValues[s.key] }));

      await api.put('/admin/settings', { settings: tabSettings });
      toast.success('Settings saved successfully!');
      await fetchSettings();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabSettings = settings.filter(s => s.category === activeTab);

  const renderInput = (setting) => {
    const val = localValues[setting.key];

    if (setting.type === 'boolean') {
      return (
        <button
          onClick={() => handleChange(setting.key, !val)}
          className={`relative w-12 h-6 rounded-full transition-colors ${val ? 'bg-emerald-500' : 'bg-slate-600'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${val ? 'left-6' : 'left-0.5'}`} />
        </button>
      );
    }

    if (setting.type === 'password') {
      return (
        <input
          type="password"
          className="input"
          placeholder="••••••••"
          value={val || ''}
          onChange={e => handleChange(setting.key, e.target.value)}
        />
      );
    }

    if (setting.type === 'number') {
      return (
        <input
          type="number"
          className="input w-32"
          value={val ?? ''}
          onChange={e => handleChange(setting.key, Number(e.target.value))}
        />
      );
    }

    return (
      <input
        type={setting.type || 'text'}
        className="input"
        value={val ?? ''}
        onChange={e => handleChange(setting.key, e.target.value)}
      />
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FiSettings className="w-6 h-6 text-teal-400" /> System Settings
          </h1>
          <p className="text-slate-400 mt-1">Configure application-wide settings — all changes are saved to database.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSettings} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-all">
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
            <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
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

      {/* Settings Panel */}
      <div className="bg-[#13161e] border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tabSettings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No settings for this category.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {tabSettings.map(setting => (
              <div key={setting.key} className="flex items-center gap-6 px-6 py-5">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm">{setting.label}</div>
                  {setting.description && (
                    <div className="text-slate-500 text-xs mt-0.5">{setting.description}</div>
                  )}
                  <div className="text-slate-700 text-xs mt-0.5 font-mono">{setting.key}</div>
                </div>
                <div className="shrink-0">
                  {renderInput(setting)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button at bottom for convenience */}
      {!loading && tabSettings.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-all disabled:opacity-50">
            <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : `Save ${TABS.find(t=>t.key===activeTab)?.label} Settings`}
          </button>
        </div>
      )}
    </div>
  );
}
