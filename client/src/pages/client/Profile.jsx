import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiSettings, FiBell, FiShield, FiSave, FiCamera, FiTrash2, FiKey, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ClientProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || 'Stone India Pvt. Ltd.',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || 'Stone India Pvt. Ltd.',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // If there is an actual API endpoint, we would call it here
      await new Promise(r => setTimeout(r, 800)); // Simulated API Call
      toast.success('Profile settings updated successfully.', { icon: '✅' });
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Identity Matrix', icon: FiUser },
    { id: 'security', label: 'Access Security', icon: FiShield },
    { id: 'notifications', label: 'Alert Config', icon: FiBell },
    { id: 'company', label: 'Corporate Data', icon: FiSettings },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12 font-sans text-slate-300">
      <div className="mb-8 border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-2">Account Identity</h1>
        <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Configure your personal and corporate credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-3">
          {tabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-mono uppercase tracking-widest transition-all ${
              activeTab === tab.id 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
              : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent'
            }`}>
              <tab.icon className={`w-4 h-4 shrink-0 ${activeTab === tab.id ? 'text-cyan-400' : 'text-zinc-600'}`} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Configuration Form */}
        <div className="lg:col-span-9 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group min-h-[400px]">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none"></div>

          {activeTab === 'general' && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mb-10 pb-10 border-b border-zinc-800/50 relative z-10">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-zinc-950 flex items-center justify-center text-cyan-400 font-light text-4xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] relative z-10">
                    {formData.name.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute inset-0 rounded-full border border-cyan-500/20 scale-110 animate-pulse"></div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-3">Biometric / Visual Avatar</h2>
                  <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 px-5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono tracking-widest uppercase rounded-lg transition-all">
                      <FiCamera className="w-4 h-4" /> Initialize Scan
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono tracking-widest uppercase rounded-lg transition-all">
                      <FiTrash2 className="w-4 h-4" /> Purge
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Operator Designation</label>
                    <input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all placeholder:text-zinc-700" 
                      placeholder="Enter full designation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Comms Link (Email)</label>
                    <input 
                      value={formData.email} 
                      disabled 
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-zinc-600 cursor-not-allowed font-mono text-sm" 
                      placeholder="operator@network.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Corporate Entity</label>
                    <input 
                      value={formData.company} 
                      onChange={e => setFormData({...formData, company: e.target.value})} 
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-all placeholder:text-zinc-700" 
                      placeholder="Registered corporate name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Direct Frequency (Phone)</label>
                    <input 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all placeholder:text-zinc-700" 
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
                
                <div className="pt-8 mt-8 border-t border-zinc-800/50 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex items-center justify-center gap-3 px-8 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-70 disabled:cursor-wait text-xs font-mono uppercase tracking-widest"
                  >
                    {isSaving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <FiSave className="w-4 h-4" />
                    )}
                    Commit Overwrite
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in relative z-10">
              <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-8">Access Security Protocol</h2>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2 max-w-md">
                  <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Current Passcode</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-zinc-700" />
                </div>
                <div className="space-y-2 max-w-md">
                  <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">New Passcode</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-zinc-700" />
                </div>
                <div className="space-y-2 max-w-md">
                  <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Verify Passcode</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all placeholder:text-zinc-700" />
                </div>
                <div className="pt-6">
                  <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono tracking-widest uppercase rounded-lg transition-all">
                    <FiLock className="w-4 h-4" /> Update Protocol
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-fade-in relative z-10">
              <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-8">Alert Configurations</h2>
              <div className="space-y-6">
                {[
                  { label: 'System Anomalies', desc: 'Critical alerts for production line faults or supply chain delays.' },
                  { label: 'Billing Cycles', desc: 'Invoices, payment confirmations, and ledger updates.' },
                  { label: 'Engineering Reports', desc: 'Weekly digests of battery metrics and QC pass rates.' }
                ].map((alert, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-zinc-950/30 border border-zinc-800/50 rounded-xl">
                    <div>
                      <div className="text-white font-bold text-sm tracking-widest uppercase">{alert.label}</div>
                      <div className="text-zinc-500 text-xs mt-1">{alert.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="animate-fade-in relative z-10">
              <h2 className="text-xl font-bold text-white tracking-widest uppercase mb-8">Corporate Data Registration</h2>
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Tax ID / GSTIN</label>
                    <input placeholder="27ABCDE1234F1Z5" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Registration Number</label>
                    <input placeholder="U12345MH2026PTC123456" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-zinc-500 text-[10px] font-mono tracking-widest uppercase">Corporate Headquarters</label>
                    <textarea rows="3" placeholder="Enter full address..." className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all"></textarea>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all text-xs font-mono uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <FiSave className="w-4 h-4" /> Save Corporate Data
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
