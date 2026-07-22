import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiPlus, FiX, FiCalendar } from 'react-icons/fi';

const INITIAL_TASK = { title: '', description: '', assignedTo: [], dueDate: '', taskType: 'Production', priority: 'Medium' };

export default function ManagerTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_TASK);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/manager/tasks'),
        api.get('/manager/employees')
      ]);

      const [tasksRes, empRes] = results;

      if (tasksRes.status === 'fulfilled' && tasksRes.value?.data?.success) {
        setTasks(tasksRes.value.data.data || []);
      }
      if (empRes.status === 'fulfilled' && empRes.value?.data?.success) {
        setEmployees(empRes.value.data.data || []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    socket.on('task_updated', (updatedTask) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    });

    socket.on('task_assigned', (newTask) => {
      setTasks(prev => {
        if (prev.find(t => t._id === newTask._id)) return prev;
        return [newTask, ...prev];
      });
    });

    return () => {
      socket.off('task_updated');
      socket.off('task_assigned');
    };
  }, [fetchData]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.assignedTo.length) return toast.error('Assign to at least one employee');
    setSaving(true);
    try {
      const { data } = await api.post('/manager/tasks', form);
      setTasks([data.data, ...tasks]);
      toast.success('Task created successfully');
      setShowForm(false);
      setForm(INITIAL_TASK);
    } catch {
      toast.error('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/manager/tasks/${id}/status`, { status });
      setTasks(tasks.map(t => t._id === id ? data.data : t));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiCheckSquare className="w-6 h-6 text-purple-400" /> Task Management
          </h1>
          <p className="text-slate-400 mt-1">Assign and track tasks for your team</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-500"
        >
          {showForm ? <FiX /> : <FiPlus />} {showForm ? 'Cancel' : 'New Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card border-purple-500/20 fade-in">
          <h2 className="text-white font-semibold mb-4">Create New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Task Title *</label>
              <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="label">Assign To *</label>
              <select 
                className="input" 
                multiple
                value={form.assignedTo} 
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions);
                  setForm({...form, assignedTo: options.map(o => o.value)});
                }}
                required
              >
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input type="date" className="input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input min-h-[100px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary bg-purple-600 hover:bg-purple-500">
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="card">
        {loading ? (
           <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No tasks created yet.</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task._id}>
                    <td>
                      <div className="font-semibold text-white">{task.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{task.description}</div>
                    </td>
                    <td className="text-sm text-slate-300">
                      {task.assignedTo?.map(u => u.name).join(', ')}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'High' || task.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="text-sm text-slate-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{task.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        task.status === 'Completed' ? 'badge-green' : 
                        task.status === 'InProgress' ? 'badge-blue' : 
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-500"
                        value={task.status}
                        onChange={(e) => updateStatus(task._id, e.target.value)}
                      >
                        <option value="Assigned">Assigned</option>
                        <option value="InProgress">In Progress</option>
                        <option value="OnHold">On Hold</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
