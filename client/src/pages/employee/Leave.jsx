import { useState, useEffect, useCallback } from 'react';
import { 
  FiCalendar, FiPlus, FiClock, FiCheckCircle, 
  FiAlertCircle, FiXCircle, FiTrendingUp, FiArrowRight
} from 'react-icons/fi';
import axios from '../../services/api';
import socket from '../../services/socket';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeLeave() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Sick',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await axios.get('/employee/leave-requests');
      setLeaves(res.data.data);
    } catch (err) {
      toast.error('Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();

    socket.on('leave_reviewed', (leave) => {
      // Refresh if it's this user's leave
      if (leave.employee?._id === user?._id || leave.employee === user?._id) {
        fetchLeaves();
        toast(`Leave Request ${leave.status}: ${leave.type}`, { icon: leave.status === 'Approved' ? '✅' : '❌' });
      }
    });

    socket.on('leave_requested', (leave) => {
      if (leave.employee?._id === user?._id || leave.employee === user?._id) {
        fetchLeaves();
      }
    });

    return () => {
      socket.off('leave_reviewed');
      socket.off('leave_requested');
    };
  }, [fetchLeaves, user?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/employee/leave-requests', formData);
      toast.success('Leave request submitted!');
      setShowModal(false);
      fetchLeaves();
    } catch (err) {
      toast.error('Submission failed.');
    }
  };

  const statusColors = {
    'Pending': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'Approved': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Rejected': 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white">Leave & Attendance</h1>
          <p className="text-slate-400 mt-1">Manage your time-off requests and track your attendance status.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest uppercase"
        >
          <FiPlus className="w-5 h-5" /> NEW LEAVE REQUEST
        </button>
      </div>

      {/* Leave Balance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Sick Leave', value: 8, total: 12, color: 'text-orange-400', bg: 'bg-orange-400/10' },
          { label: 'Annual Leave', value: 14, total: 20, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Maternity/Paternity', value: 0, total: 30, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-[#13161e] border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${item.bg} p-3 rounded-xl`}>
                <FiCalendar className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Available</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{item.value}<span className="text-sm text-slate-600 font-bold ml-1">/ {item.total} DAYS</span></div>
            <div className="text-xs font-bold text-slate-400 uppercase">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Leave History */}
      <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-800 bg-slate-800/10">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FiClock className="text-emerald-400" /> Recent Requests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/30">
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {leaves.map((leave, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 transition-all">
                  <td className="px-8 py-5">
                    <div className="text-white font-bold text-sm tracking-tight">{leave.type}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-slate-300 text-xs font-medium flex items-center gap-2">
                      {new Date(leave.startDate).toLocaleDateString()} <FiArrowRight className="text-slate-600" /> {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-slate-500 text-xs font-medium max-w-xs truncate italic">"{leave.reason}"</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[leave.status]}`}>
                      {leave.status === 'Approved' ? <FiCheckCircle /> : leave.status === 'Rejected' ? <FiXCircle /> : <FiClock />}
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-16 text-center">
                    <FiCalendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No leave history found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#13161e] border border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-[#1e2235] to-[#13161e]">
              <h2 className="text-2xl font-black text-white italic tracking-tight">REQUEST LEAVE</h2>
              <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest transition-all">Submit for manager approval</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">Leave Category</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm appearance-none"
                  >
                    <option value="Sick">🏥 Sick Leave</option>
                    <option value="Annual">🏠 Annual Leave</option>
                    <option value="Maternity">🍼 Maternity/Paternity</option>
                    <option value="Unpaid">🌑 Unpaid Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">From</label>
                    <input 
                      type="date" 
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">To</label>
                    <input 
                      type="date" 
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">Detailed Reason</label>
                  <textarea 
                    rows="3"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Briefly explain your leave requirement..."
                    className="w-full bg-slate-800 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-4 rounded-2xl border border-slate-700 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all">CANCEL</button>
                <button type="submit" className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all">SUBMIT REQUEST</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
