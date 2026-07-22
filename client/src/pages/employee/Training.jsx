import { useState, useEffect, useCallback } from 'react';
import socket from '../../services/socket';
import { 
  FiBarChart2, FiPlay, FiCheckCircle, FiBookOpen, 
  FiClock, FiTrendingUp, FiArrowRight, FiStar
} from 'react-icons/fi';
import axios from '../../services/api';
import { toast } from 'react-hot-toast';

export default function EmployeeTraining() {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTraining = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/employee/training');
      setTrainings(res.data.data);
    } catch (err) {
      toast.error('Failed to load training programs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTraining();

    socket.on('training_updated', (data) => {
      // Refresh if it's about this employee or a general update
      if (!data.employeeId || data.employeeId === user?._id) {
        fetchTraining();
      }
    });

    socket.on('training_assigned', () => {
      fetchTraining();
    });

    return () => {
      socket.off('training_updated');
      socket.off('training_assigned');
    };
  }, [fetchTraining]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/employee/training/${id}/status`, { status });
      toast.success(`Training marked as ${status}`);
      fetchTraining();
    } catch (err) {
      toast.error('Failed to update status.');
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
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Training & Learning</h1>
          <p className="text-slate-400 mt-1">Enhance your skills with our curated professional development courses.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-6 py-4 flex items-center gap-4">
          <FiStar className="text-emerald-500 w-6 h-6 animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Growth Path</div>
            <div className="text-white text-xs font-bold italic">Top Performer Track</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Catalog */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-white font-black text-sm uppercase tracking-widest">Assigned Curriculums</h2>
            <div className="text-slate-500 text-[10px] font-black">{trainings.length} COURSES FOUND</div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {trainings.map((course, idx) => {
              // Note: our logic in backend finds completion for the logged-in employee
              const empCompletion = course.completions?.find(c => c.employee) || { status: 'NotStarted' };
              
              return (
                <div key={idx} className="bg-[#13161e] border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
                  <div className="relative z-10 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 h-32 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-emerald-500/50 transition-all">
                      <FiPlay className="text-slate-600 group-hover:text-emerald-500 w-12 h-12 transition-all group-hover:scale-125" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{course.category}</span>
                        {empCompletion.status === 'Completed' && <FiCheckCircle className="text-emerald-500 w-5 h-5" />}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 leading-tight uppercase group-hover:text-emerald-400 transition-colors tracking-tight">{course.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{course.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <FiClock className="text-slate-600" /> 4.5 Hours
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <FiBookOpen className="text-slate-600" /> 12 Modules
                        </div>
                        <div className="flex-1"></div>
                        
                        {empCompletion.status === 'NotStarted' && (
                          <button onClick={() => updateStatus(course._id, 'InProgress')} className="px-6 py-2.5 rounded-xl bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">START LEARNING</button>
                        )}
                        {empCompletion.status === 'InProgress' && (
                          <button onClick={() => updateStatus(course._id, 'Completed')} className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">COMPLETE COURSE</button>
                        )}
                        {empCompletion.status === 'Completed' && (
                          <button className="px-6 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-black text-xs uppercase tracking-widest transition-all">VIEW CERTIFICATE</button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-[-5%] right-[-5%] w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                </div>
              );
            })}
            {trainings.length === 0 && (
              <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-16 text-center">
                <FiBookOpen className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h2 className="text-xl font-bold text-white mb-2 italic uppercase">Expand Your Horizon</h2>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">No training programs assigned currently. Check with your supervisor for new learning opportunities.</p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Progress Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 relative overflow-hidden group shadow-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 italic relative z-10">Learning Milestones</h3>
            <div className="space-y-8 relative z-10">
              {[
                { 
                  label: 'Completed Courses', 
                  value: trainings.filter(t => t.completions?.some(c => c.status === 'Completed')).length, 
                  total: trainings.length || 1, 
                  color: 'emerald' 
                },
                { 
                  label: 'Skill Points Earned', 
                  value: (trainings.filter(t => t.completions?.some(c => c.status === 'Completed')).length) * 500, 
                  total: (trainings.length || 1) * 500, 
                  color: 'indigo' 
                },
                { 
                  label: 'Technical Hours', 
                  value: (trainings.filter(t => t.completions?.some(c => c.status === 'Completed')).length) * 4, 
                  total: (trainings.length || 1) * 4, 
                  color: 'orange' 
                },
              ].map((stat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="text-white font-bold text-[10px] uppercase tracking-wider">{stat.label}</div>
                    <div className="text-slate-400 font-black text-[10px] italic">{stat.value} / {stat.total}</div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color === 'emerald' ? 'bg-emerald-500' : stat.color === 'indigo' ? 'bg-indigo-500' : 'bg-orange-500'} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.5)]`} 
                      style={{ width: `${(stat.value/(stat.total||1))*100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-indigo-500/5 rotate-45 rounded-3xl"></div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-900/40 group overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="text-lg font-black italic uppercase leading-tight mb-4 tracking-tighter">Become a Lead <br/>Supervisor</h4>
              <p className="text-indigo-100 text-xs font-medium mb-6 leading-relaxed opacity-80">Complete 3 more technical certifications to unlock the leadership track and performance bonuses.</p>
              <button className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest group/btn transition-all">
                LEARN MORE <FiArrowRight className="group-hover/btn:translate-x-2 transition-transform" />
              </button>
            </div>
            <FiTrendingUp className="absolute right-[-10%] bottom-[-10%] w-40 h-40 text-white/10 group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
