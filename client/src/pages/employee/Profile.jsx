import { useState, useEffect, useCallback } from 'react';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, 
  FiCalendar, FiClock, FiEdit2, FiShield, FiCheckCircle
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import axios from '../../services/api';
import { toast } from 'react-hot-toast';

export default function EmployeeProfile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || ''
    }
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put('/auth/update-profile', formData);
      if (res.data?.success) {
        updateUser(res.data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Profile Header */}
      <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-emerald-900/40">
              {user?.name?.[0]}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
              <FiEdit2 className="text-white w-6 h-6" />
            </div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
              {user?.name}
              <FiCheckCircle className="text-emerald-400 w-5 h-5" />
            </h1>
            <div className="text-slate-400 font-medium mt-1 flex flex-wrap justify-center md:justify-start gap-4">
              <span className="flex items-center gap-2"><FiBriefcase className="text-emerald-500" /> {user?.designation || 'Specialist'}</span>
              <span className="flex items-center gap-2"><FiMapPin className="text-emerald-500" /> {user?.department || 'Operations'}</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-500/20">
                ACTIVE EMPLOYEE
              </span>
              <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                ID: {user?.employeeId || 'SI-000'}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Employment Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-6">
            <h3 className="text-white font-black mb-6 flex items-center gap-2 uppercase text-xs tracking-widest text-slate-500">
              Employment Details
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50">
                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">Shift Type</div>
                <div className="text-white font-bold flex items-center gap-2">
                  <FiClock className="text-orange-400" /> {user?.shift || 'Morning Shift'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/20 border border-slate-800/50">
                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">Date of Joining</div>
                <div className="text-white font-bold flex items-center gap-2">
                  <FiCalendar className="text-blue-400" /> {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'August 12, 2024'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="text-[10px] text-emerald-500 font-black uppercase mb-1">Performance Score</div>
                <div className="text-white font-black text-2xl flex items-baseline gap-1">
                  {user?.performance?.score || 94}<span className="text-xs text-slate-500">/ 100</span>
                </div>
                <div className="text-emerald-400 text-xs font-bold mt-1 uppercase tracking-wider">{user?.performance?.rating || 'Excellent'}</div>
              </div>
            </div>
          </div>

          <button className="w-full p-4 rounded-2xl bg-slate-800/50 border border-slate-800 text-slate-400 font-bold flex items-center gap-3 hover:text-white transition-all">
            <FiShield className="w-5 h-5 text-emerald-500" />
            Security & Password
          </button>
        </div>

        {/* Update Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8">
            <h3 className="text-white font-black mb-8 flex items-center gap-2 uppercase text-xs tracking-widest text-slate-500">
              Personal Information
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase px-1">Full Name</label>
                  <div className="relative group">
                    <FiUser className="absolute left-4 top-4 text-slate-500 transition-colors group-focus-within:text-emerald-500" />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-800/30 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase px-1">Email Address</label>
                  <div className="relative opacity-60">
                    <FiMail className="absolute left-4 top-4 text-slate-500" />
                    <input 
                      type="email" 
                      value={user?.email}
                      disabled
                      className="w-full bg-slate-800/30 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-2xl cursor-not-allowed text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase px-1">Phone Number</label>
                  <div className="relative group">
                    <FiPhone className="absolute left-4 top-4 text-slate-500 transition-colors group-focus-within:text-emerald-500" />
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-800/30 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <label className="text-xs font-black text-slate-500 uppercase px-1">Residence Address</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Street Address" 
                    value={formData.address.street}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                    className="w-full bg-slate-800/30 border border-slate-800 text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                  />
                  <input 
                    placeholder="City" 
                    value={formData.address.city}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                    className="w-full bg-slate-800/30 border border-slate-800 text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                  />
                  <input 
                    placeholder="State" 
                    value={formData.address.state}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                    className="w-full bg-slate-800/30 border border-slate-800 text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                  />
                  <input 
                    placeholder="Pincode" 
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, pincode: e.target.value}})}
                    className="w-full bg-slate-800/30 border border-slate-800 text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                >
                  {loading ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
