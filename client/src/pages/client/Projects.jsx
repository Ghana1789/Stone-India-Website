import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { FiFolder, FiClock, FiCheck, FiMoreHorizontal } from 'react-icons/fi';

export default function ClientProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client/projects')
      .then(r => setProjects(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Projects</h1>
          <p className="text-slate-400 text-sm">Track milestones, pipelines, and change requests.</p>
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors border border-slate-700">
          Request Change
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <FiFolder className="w-12 h-12 opacity-20 mx-auto mb-4" />
          <p>No active projects found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((proj) => (
            <div key={proj._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{proj.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">Assigned Team: <span className="text-white">{proj.assignedTeam}</span></p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white mb-1">{proj.progressPercentage}% Complete</div>
                  <div className="text-xs text-slate-500">Due: {format(new Date(proj.dueDate), 'do MMM yyyy')}</div>
                </div>
              </div>

              {/* Pipeline Process */}
              <div className="relative mt-8 mb-4">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-brand-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                  style={{ width: `${proj.progressPercentage}%` }}
                />
                
                <div className="relative flex justify-between">
                  {proj.milestones.map((ms, idx) => (
                    <div key={ms._id || idx} className="flex flex-col items-center gap-2 group cursor-pointer w-24">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-colors
                        ${ms.status === 'Completed' ? 'bg-brand-500 border-brand-500 text-slate-950' : 
                          ms.status === 'In Progress' ? 'bg-slate-900 border-brand-500 text-brand-500' : 'bg-slate-900 border-slate-700 text-slate-600'}`
                      }>
                        {ms.status === 'Completed' ? <FiCheck className="w-3 h-3 font-bold" /> : 
                         ms.status === 'In Progress' ? <FiMoreHorizontal className="w-3 h-3" /> : null}
                      </div>
                      <div className="text-center">
                        <div className={`text-[11px] font-bold ${ms.status === 'Completed' || ms.status === 'In Progress' ? 'text-white' : 'text-slate-500'}`}>
                          {ms.title}
                        </div>
                        {ms.dueDate && (
                          <div className="text-[10px] text-slate-600">{format(new Date(ms.dueDate), 'dd MMM')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
