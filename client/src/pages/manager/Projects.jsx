import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  FiFolder, FiCheckCircle, FiClock, FiSettings, 
  FiTrendingUp, FiActivity, FiUsers, FiPlus, FiX, FiCheck
} from 'react-icons/fi';

export default function ManagerProjects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // New Project Form
  const [form, setForm] = useState({
    title: '',
    client: '',
    dueDate: '',
    assignedTeam: 'Manufacturing',
    status: 'On track'
  });

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/manager/projects'),
        api.get('/manager/clients')
      ]);

      const [projRes, clientRes] = results;

      if (projRes.status === 'fulfilled' && projRes.value?.data?.success) {
        setProjects(projRes.value.data.data);
      }
      if (clientRes.status === 'fulfilled' && clientRes.value?.data?.success) {
        setClients(clientRes.value.data.data);
      }
    } catch (err) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();

    socket.on('project_updated', (updatedProject) => {
      setProjects(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
      toast.success(`Progress updated for "${updatedProject.title}"`, { icon: '⚡' });
    });

    socket.on('project_created', (newProject) => {
      setProjects(prev => [newProject, ...prev]);
      toast.success(`New Project Created: "${newProject.title}"`, { icon: '✨' });
    });

    return () => {
      socket.off('project_updated');
      socket.off('project_created');
    };
  }, [fetchInitialData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.client || !form.title || !form.dueDate) return toast.error('Please fill all required fields');
    
    setCreating(true);
    try {
      await api.post('/manager/projects', form);
      setShowCreateModal(false);
      setForm({ title: '', client: '', dueDate: '', assignedTeam: 'Manufacturing', status: 'On track' });
      // The socket.on('project_created') will add it to the list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const updateProgress = async (projectId, currentProgress, currentStatus) => {
    let newProgress = Math.min((currentProgress || 0) + 10, 100);
    let newStatus = currentStatus;
    if (newProgress === 100) newStatus = 'Completed';
    else if (newProgress > 0) newStatus = 'In progress';

    try {
      await api.put(`/manager/projects/${projectId}/progress`, {
        progressPercentage: newProgress,
        status: newStatus
      });
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
            <FiActivity className="text-orange-500" /> Project Operations
          </h1>
          <p className="text-slate-400 text-sm">Real-time oversight of client deployments and battery pipelines.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20"
        >
          <FiPlus className="w-5 h-5" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
        {projects.length === 0 ? (
          <div className="col-span-full bg-[#13161e] border border-slate-800 rounded-3xl p-16 text-center text-slate-500">
            <FiFolder className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="text-lg">No active projects found.</p>
            <p className="text-sm mt-1">Start by clicking 'New Project' above.</p>
          </div>
        ) : (
          projects.map(proj => (
            <div key={proj._id} className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden hover:border-orange-500/40 transition-all shadow-xl flex flex-col group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className={`px-2.5 py-1 text-[9px] uppercase font-black tracking-widest rounded-md ${
                    proj.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    proj.status === 'In progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {proj.status}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] bg-slate-900/80 px-2 py-1 rounded-lg">
                    <FiClock className="w-3 h-3 text-orange-400" />
                    {proj.dueDate ? format(new Date(proj.dueDate), 'MMM dd, yyyy') : 'No Date'}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-orange-400 transition-colors">{proj.title}</h3>
                <div className="flex items-center gap-2 text-slate-400 font-medium mb-6">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">
                    {proj.client?.name?.charAt(0) || 'C'}
                  </div>
                  <span className="truncate">{proj.client?.company || proj.client?.name || 'Internal'}</span>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Progress</span>
                    <span className="text-orange-400 font-black">{proj.progressPercentage || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-full transition-all duration-1000"
                      style={{ width: `${proj.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-800/40 border-t border-slate-800 mt-auto flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-500">Team: <span className="text-white">{proj.assignedTeam}</span></div>
                <button 
                  onClick={() => updateProgress(proj._id, proj.progressPercentage, proj.status)}
                  disabled={proj.status === 'Completed'}
                  className="flex items-center gap-1.5 text-orange-500 hover:text-orange-400 font-black uppercase text-[10px] tracking-widest disabled:opacity-30 transition-colors"
                >
                  <FiTrendingUp className="w-3 h-3" /> Update
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiPlus className="text-orange-500" /> Initialize New Project
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white p-2">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Project Title</label>
                <input 
                  autoFocus
                  className="input py-3" 
                  placeholder="e.g., 200MW Battery Deployment" 
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Target Client</label>
                  <select 
                    className="input py-3" 
                    value={form.client}
                    onChange={e => setForm({...form, client: e.target.value})}
                    required
                  >
                    <option value="">Select Project Client</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>{c.company || c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Delivery Deadline</label>
                  <input 
                    type="date"
                    className="input py-3" 
                    value={form.dueDate}
                    onChange={e => setForm({...form, dueDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Functional Team Assigned</label>
                <select 
                  className="input py-3" 
                  value={form.assignedTeam}
                  onChange={e => setForm({...form, assignedTeam: e.target.value})}
                >
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="QC & Systems">QC & Systems</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Site Deployment">Site Deployment</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2"
                >
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck />}
                  {creating ? 'Initializing...' : 'Launch Project'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
