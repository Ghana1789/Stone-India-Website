import { useState, useEffect, useCallback } from 'react';
import { 
  FiBook, FiCheckCircle, FiClock, FiUsers, 
  FiTrendingUp, FiArrowRight, FiInfo, FiSearch
} from 'react-icons/fi';
import axios from '../../services/api';
import socket from '../../services/socket';
import { toast } from 'react-hot-toast';

export default function ManagerTraining() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTraining = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/manager/training-status');
      if (res.data?.success) {
        setTrainings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load training status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTraining();

    socket.on('training_updated', () => {
      fetchTraining();
    });

    return () => {
      socket.off('training_updated');
    };
  }, [fetchTraining]);

  const stats = (() => {
    const allCompletions = trainings.flatMap(t => t.completions || []);
    const completed = allCompletions.filter(c => c.status === 'Completed').length;
    const total = allCompletions.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const uniqueEmployees = new Set(allCompletions.map(c => c.employee?._id?.toString())).size;
    const pendingCount = allCompletions.filter(c => c.status !== 'Completed').length;

    return {
      completionRate: `${completionRate}%`,
      avgCourses: uniqueEmployees > 0 ? (allCompletions.length / uniqueEmployees).toFixed(1) : '0.0',
      activeLearners: `${uniqueEmployees - pendingCount < 0 ? 0 : uniqueEmployees}/${uniqueEmployees || 0}`,
      hasPending: pendingCount > 0
    };
  })();

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Training Oversight</h1>
          <p className="text-slate-400 mt-1 font-medium italic">Monitor course completion and skill development across your department.</p>
        </div>
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            className="w-full bg-[#13161e] border border-slate-800 text-white pl-11 pr-4 py-3 rounded-2xl text-[10px] font-black focus:outline-none focus:border-orange-500/50 transition-all uppercase tracking-widest placeholder:text-slate-700"
            placeholder="Search curricula or personnel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Stats Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">Department Metrics</h3>
            <div className="space-y-6">
              {[
                { label: 'Overall Completion', value: stats.completionRate, color: 'text-emerald-500' },
                { label: 'Avg courses/User', value: stats.avgCourses, color: 'text-indigo-400' },
                { label: 'Active Learners', value: stats.activeLearners, color: 'text-orange-400' },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div className={`text-2xl font-black ${stat.color} group-hover:scale-105 transition-transform origin-left`}>{stat.value}</div>
                  <div className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-widest italic">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 rounded-3xl p-6 shadow-xl overflow-hidden relative group">
            <div className="relative z-10">
              <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-3 italic">Compliance Monitor</h4>
              <p className="text-indigo-200 text-[10px] font-bold leading-relaxed mb-4 uppercase tracking-tighter opacity-80">
                {stats.hasPending ? "Some team members have pending mandatory certifications. Prompt them for completion." : "All department mandatory certifications are up to date."}
              </p>
              <button 
                onClick={() => toast.success('Reminders sent to all pending employees!')}
                disabled={!stats.hasPending}
                className="w-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-30">
                 Remind All Pending
              </button>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <FiInfo className="w-20 h-20 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Training Progress Table */}
        <div className="lg:col-span-3">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-bold uppercase text-xs tracking-widest text-slate-400">Course Participation Log</h3>
              <FiBook className="text-orange-500" />
            </div>
            <div className="overflow-x-auto">
              {trainings.map((course, idx) => (
                <div key={idx} className="border-b border-slate-800/50 last:border-0">
                  <div className="bg-slate-800/20 px-8 py-4 flex items-center justify-between">
                    <div>
                      <div className="text-white font-black text-sm tracking-tight uppercase italic">{course.title}</div>
                      <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{course.category}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Assigned To: {course.completions?.length || 0} Members</div>
                  </div>
                  
                  <div className="divide-y divide-slate-800/30">
                    {course.completions?.map((comp, cIdx) => (
                        <div key={cIdx} className="px-10 py-5 flex items-center justify-between hover:bg-slate-800/40 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold">
                              {comp.employee?.name?.[0]}
                            </div>
                            <div>
                               <div className="text-slate-300 font-bold text-sm group-hover:text-white transition-colors">{comp.employee?.name}</div>
                               <div className="text-[10px] text-slate-600 font-bold uppercase">{comp.employee?.email}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                               <div className={`text-[10px] font-black uppercase tracking-widest ${comp.status === 'Completed' ? 'text-emerald-500' : 'text-orange-400'}`}>
                                  {comp.status}
                               </div>
                               <div className="text-[10px] text-slate-600 font-bold uppercase">
                                  {comp.completedAt ? `Finished ${new Date(comp.completedAt).toLocaleDateString()}` : 'Enrolled'}
                               </div>
                            </div>
                            <button className="text-slate-500 hover:text-white transform group-hover:translate-x-1 transition-all"><FiArrowRight /></button>
                          </div>
                        </div>
                    ))}
                    {(!course.completions || course.completions.length === 0) && (
                        <div className="px-10 py-4 text-slate-600 text-xs font-medium italic">No active enrollments for this course in your department.</div>
                    )}
                  </div>
                </div>
              ))}
              {trainings.length === 0 && (
                <div className="p-20 text-center">
                  <FiBook className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                  <div className="text-slate-500 font-bold uppercase tracking-widest text-xs tracking-widest">No training catalogs available yet.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
