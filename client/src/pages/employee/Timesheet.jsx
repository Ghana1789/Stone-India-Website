import { useState, useEffect } from 'react';
import { 
  FiClock, FiPlay, FiSquare, FiList, 
  FiCalendar, FiActivity, FiArrowRight, FiCheckCircle
} from 'react-icons/fi';
import axios from '../../services/api';
import { toast } from 'react-hot-toast';

export default function EmployeeTimesheet() {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/employee/timesheets');
      setTimesheets(res.data.data);
      // Check if there's an active shift (no clock-out)
      const active = res.data.data.find(ts => !ts.clockOut && new Date(ts.date).toDateString() === new Date().toDateString());
      setActiveShift(active);
    } catch (err) {
      toast.error('Failed to load timesheet history.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await axios.post('/employee/timesheets/clock-in');
      toast.success('Shift started! Good luck.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Clock-in failed.');
    }
  };

  const handleClockOut = async () => {
    try {
      await axios.put('/employee/timesheets/clock-out');
      toast.success('Shift ended. Have a great rest!');
      fetchData();
    } catch (err) {
      toast.error('Clock-out failed.');
    }
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
          <h1 className="text-3xl font-black text-white">Timesheet</h1>
          <p className="text-slate-400 mt-1">Track your daily work hours and shift activities.</p>
        </div>
        
        {/* Real-time Clock Widget */}
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl px-6 py-4 flex items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Live Status</div>
            <div className={`text-lg font-black flex items-center gap-2 ${activeShift ? 'text-emerald-400' : 'text-slate-500'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
              {activeShift ? 'Currently Working' : 'Not Clocked In'}
            </div>
          </div>
          <div className="h-10 w-px bg-slate-800 hidden md:block"></div>
          <div className="relative z-10 min-w-[120px]">
            {activeShift ? (
              <button 
                onClick={handleClockOut}
                className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-red-500/20 active:scale-95 transition-all w-full justify-center"
              >
                <FiSquare className="w-4 h-4" /> CLOCK OUT
              </button>
            ) : (
              <button 
                onClick={handleClockIn}
                className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all w-full justify-center"
              >
                <FiPlay className="w-4 h-4 fill-current" /> CLOCK IN
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Summary Dashboard */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-[#1e2235] to-[#13161e] border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">This Month Summary</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500"><FiClock className="w-5 h-5" /></div>
                  <div className="text-sm font-bold text-slate-300">Total Hours</div>
                </div>
                <div className="text-xl font-black text-white">142.5</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500"><FiCalendar className="w-5 h-5" /></div>
                  <div className="text-sm font-bold text-slate-300">Days Present</div>
                </div>
                <div className="text-xl font-black text-white">18</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500"><FiActivity className="w-5 h-5" /></div>
                  <div className="text-sm font-bold text-slate-300">Efficiency</div>
                </div>
                <div className="text-xl font-black text-emerald-400">92%</div>
              </div>
            </div>
            <button className="w-full mt-8 bg-slate-800/50 hover:bg-slate-800 px-4 py-3 rounded-2xl text-xs font-black text-slate-300 uppercase tracking-widest border border-slate-700 transition-all">
              Download Report
            </button>
          </div>
        </div>

        {/* Timesheet Logs */}
        <div className="lg:col-span-3">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-bold">Shift History</h3>
              <FiList className="text-slate-500" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/30">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Clock In</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Clock Out</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Hours</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {timesheets.map((ts, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-all group">
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="text-white font-bold text-sm">{new Date(ts.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="text-slate-300 text-sm font-medium">{new Date(ts.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="text-slate-300 text-sm font-medium">{ts.clockOut ? new Date(ts.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}</div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="text-emerald-400 font-black text-sm">{ts.totalHours ? `${ts.totalHours} hrs` : '---'}</div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                          ts.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {ts.status === 'Present' && <FiCheckCircle className="w-3 h-3" />}
                          {ts.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {timesheets.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-8 py-16 text-center text-slate-500 font-medium">No records found for the current period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
