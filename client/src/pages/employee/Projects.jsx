import { useState, useEffect } from 'react';
import { 
  FiBriefcase, FiLayers, FiFlag, FiUsers, 
  FiArrowRight, FiExternalLink, FiClock
} from 'react-icons/fi';
import axios from '../../services/api';
import { toast } from 'react-hot-toast';

export default function EmployeeProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/employee/projects');
      setProjects(res.data.data);
    } catch (err) {
      toast.error('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-white">Project Participation</h1>
        <p className="text-slate-400 mt-1">View projects you are currently contributing to and track their milestones.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.length > 0 ? projects.map((project, idx) => (
          <div key={idx} className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden group hover:border-emerald-500/30 transition-all flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <FiBriefcase className="w-6 h-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{project.name}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2 mb-6">{project.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold uppercase tracking-widest">Progress</span>
                  <span className="text-white font-black">{project.progress || 0}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-1000"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-800/20 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400 font-bold">
                <FiUsers className="w-4 h-4 text-emerald-500" />
                {project.team?.length || 0} Members
              </div>
              <button className="text-white font-black flex items-center gap-1 hover:gap-2 transition-all">
                Details <FiArrowRight className="text-emerald-500" />
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full bg-[#13161e] border border-slate-800 rounded-3xl p-16 text-center">
            <FiLayers className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">No active projects</h2>
            <p className="text-slate-500 max-w-sm mx-auto">You aren't currently assigned to any specific projects. Contact your manager for assignments.</p>
          </div>
        )}
      </div>

      {/* Corporate Overview Section */}
      <div className="bg-gradient-to-br from-[#1e2235] to-[#13161e] border border-slate-800 rounded-3xl p-8 mt-4">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="lg:w-2/3">
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight italic">Why Your Contribution Matters</h2>
            <p className="text-slate-400 leading-relaxed font-medium">Stone India's success is built on the collective performance of our project teams. By tracking your progress here, you help us stay agile and committed to our clients' battery manufacturing deadlines.</p>
          </div>
          <div className="lg:w-1/3 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="text-white font-black text-2xl">12+</div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Live Projects</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="text-white font-black text-2xl">98%</div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">On-Time Delivery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
