import { useState, useEffect, useCallback } from 'react';
import { 
  FiCalendar, FiDollarSign, FiClock, FiCheckCircle, 
  FiXCircle, FiFilter, FiUser, FiArrowRight
} from 'react-icons/fi';
import axios from '../../services/api';
import socket from '../../services/socket';
import { toast } from 'react-hot-toast';

export default function ManagerApprovals() {
  const [activeTab, setActiveTab] = useState('leaves');
  const [data, setData] = useState({ leaves: [], expenses: [], timesheets: [] });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        axios.get('/manager/leaves'),
        axios.get('/manager/expenses'),
        axios.get('/manager/timesheets')
      ]);

      const [leaves, expenses, timesheets] = results;

      setData({
        leaves: leaves.status === 'fulfilled' ? leaves.value.data.data : [],
        expenses: expenses.status === 'fulfilled' ? expenses.value.data.data : [],
        timesheets: timesheets.status === 'fulfilled' ? timesheets.value.data.data : []
      });
    } catch (err) {
      toast.error('Failed to load pending approvals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    socket.on('leave_requested', (leave) => {
      fetchAll();
      toast(`New Leave Request from ${leave.employee?.name || 'Employee'}`, { icon: '📅' });
    });

    socket.on('expense_submitted', (expense) => {
      fetchAll();
      toast.success(`New Expense Claim: ₹${expense.amount}`);
    });

    socket.on('clock_in_out', () => {
      fetchAll();
    });

    return () => {
      socket.off('leave_requested');
      socket.off('expense_submitted');
      socket.off('clock_in_out');
    };
  }, [fetchAll]);

  const handleLeaveStatus = async (id, status) => {
    try {
      await axios.put(`/manager/leaves/${id}/status`, { status, reviewNote: 'Processed by manager' });
      toast.success(`Leave ${status}`);
      fetchAll();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  const handleExpenseStatus = async (id, status) => {
    try {
      await axios.put(`/manager/expenses/${id}/status`, { status, remarks: 'Audit complete' });
      toast.success(`Expense ${status}`);
      fetchAll();
    } catch (err) {
      toast.error('Action failed.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Approvals Center</h1>
          <p className="text-slate-400 mt-1">Review and process your team's requests and claims.</p>
        </div>
        <div className="flex bg-[#13161e] p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'leaves', label: 'Leaves', icon: FiCalendar },
            { id: 'expenses', label: 'Expenses', icon: FiDollarSign },
            { id: 'timesheets', label: 'Timesheets', icon: FiClock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
              <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">{data[tab.id].filter(i => i.status === 'Pending').length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#13161e] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/30">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Date/Amount</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-nowrap">
              {activeTab === 'leaves' && data.leaves.map((leave, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold">{leave.employee?.name?.[0]}</div>
                      <div>
                        <div className="text-white font-bold text-sm tracking-tight">{leave.employee?.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{leave.employee?.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-white font-bold text-xs uppercase">{leave.type} LEAVE</div>
                    <div className="text-slate-500 text-xs italic line-clamp-1">"{leave.reason}"</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-slate-300 text-xs font-bold">{new Date(leave.startDate).toLocaleDateString()} <FiArrowRight className="inline mx-1" /> {new Date(leave.endDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      leave.status === 'Pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                      leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {leave.status === 'Pending' && (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleLeaveStatus(leave._id, 'Approved')} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><FiCheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => handleLeaveStatus(leave._id, 'Rejected')} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><FiXCircle className="w-5 h-5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {activeTab === 'expenses' && data.expenses.map((exp, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 transition-all text-nowrap">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs tracking-tighter uppercase italic">{exp.employee?.name?.[0]}</div>
                      <div>
                        <div className="text-slate-200 font-bold text-sm tracking-tight">{exp.employee?.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{exp.employee?.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-white font-bold text-xs uppercase">{exp.title}</div>
                    <div className="text-slate-500 text-xs font-bold uppercase">{exp.category}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-white font-black text-sm">₹ {exp.amount?.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-600 font-bold">{new Date(exp.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      exp.status === 'Pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {exp.status === 'Pending' && (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleExpenseStatus(exp._id, 'Approved')} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><FiCheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => handleExpenseStatus(exp._id, 'Rejected')} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><FiXCircle className="w-5 h-5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {activeTab === 'timesheets' && data.timesheets.map((ts, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 transition-all text-nowrap">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold">{ts.employee?.name?.[0]}</div>
                      <div>
                        <div className="text-white font-bold text-sm tracking-tight">{ts.employee?.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{ts.employee?.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-slate-200 font-bold text-xs uppercase italic">{new Date(ts.date).toLocaleDateString('en-GB', { weekday: 'long' })}</div>
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{ts.status}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-white font-black text-sm">{ts.totalHours} HOURS</div>
                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">{ts.clockIn ? new Date(ts.clockIn).toLocaleTimeString() : '--'} - {ts.clockOut ? new Date(ts.clockOut).toLocaleTimeString() : '--'}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Recorded</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button className="text-slate-500 hover:text-white transition-colors"><FiArrowRight /></button>
                  </td>
                </tr>
              ))}

              {data[activeTab].length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <FiFilter className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs tracking-widest">No pending {activeTab} for your department.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
