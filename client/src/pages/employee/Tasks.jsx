import { useState, useEffect, useCallback } from 'react';
import { 
  FiSearch, FiFilter, FiCheckCircle, FiClock, 
  FiAlertCircle, FiArrowRight, FiPlus, FiMoreVertical,
  FiCalendar, FiCheckSquare
} from 'react-icons/fi';
import axios from '../../services/api';
import socket from '../../services/socket';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`/employee/tasks${filter ? `?status=${filter}` : ''}`);
      setTasks(res.data.data);
    } catch (err) {
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();

    socket.on('task_assigned', (task) => {
      // Check if task is assigned to this user
      if (task.assignedTo?.some(u => u._id === user?._id || u === user?._id)) {
        fetchTasks();
      }
    });

    socket.on('task_updated', (task) => {
      // If task belongs to user, refresh
      if (task.assignedTo?.some(u => u._id === user?._id || u === user?._id)) {
        fetchTasks();
      }
    });

    return () => {
      socket.off('task_assigned');
      socket.off('task_updated');
    };
  }, [fetchTasks, user?._id]);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`/employee/tasks/${id}`, { status: newStatus });
      toast.success(`Task marked as ${newStatus}`);
      fetchTasks();
    } catch (err) {
      toast.error('Update failed.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">My Tasks</h1>
          <p className="text-slate-400 mt-1">Manage and track your assigned production and operational tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <FiSearch className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search tasks..."
              className="bg-slate-800/40 border border-slate-800 text-white pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm w-full md:w-64"
            />
          </div>
          <button className="bg-emerald-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all">
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'Assigned', 'InProgress', 'Completed', 'OnHold'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
              filter === status 
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            {status || 'All Tasks'}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks.length > 0 ? tasks.map((task) => (
          <div key={task._id} className="bg-[#13161e] border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                task.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                task.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                {task.priority || 'Normal'} Priority
              </div>
              <button className="text-slate-500 hover:text-white transition-colors p-1">
                <FiMoreVertical className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors">{task.title}</h3>
            <p className="text-slate-400 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{task.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Due Date</div>
                <div className="text-white text-xs font-bold flex items-center gap-2">
                  <FiCalendar className="text-blue-400" /> {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Assigned By</div>
                <div className="text-white text-xs font-bold flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[8px]">{task.assignedBy?.name?.[0]}</div>
                  {task.assignedBy?.name || 'Manager'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  task.status === 'Completed' ? 'bg-emerald-500' : 
                  task.status === 'InProgress' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse' : 
                  'bg-slate-600'
                }`}></div>
                <span className="text-xs font-black text-white uppercase tracking-tighter">{task.status}</span>
              </div>
              
              <div className="flex gap-2">
                {task.status !== 'InProgress' && task.status !== 'Completed' && (
                  <button 
                    onClick={() => updateStatus(task._id, 'InProgress')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-black hover:bg-blue-500 hover:text-white transition-all transform active:scale-95"
                  >
                    START WORK
                  </button>
                )}
                {task.status === 'InProgress' && (
                  <button 
                    onClick={() => updateStatus(task._id, 'Completed')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-black hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95"
                  >
                    MARK DONE
                  </button>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="lg:col-span-2 bg-[#13161e] border border-slate-800 rounded-3xl p-16 text-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckSquare className="w-10 h-10 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Clean Slate!</h2>
            <p className="text-slate-500 max-w-sm mx-auto">You don't have any tasks in this category. Take a break or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
