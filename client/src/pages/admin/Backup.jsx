import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiHardDrive, FiPlus, FiTrash2, FiRefreshCw, FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle } from 'react-icons/fi';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

const STATUS_CONFIG = {
  success: { icon: FiCheckCircle, color: '#22c55e', badge: 'bg-green-500/20 text-green-400', label: 'Success' },
  failed:  { icon: FiXCircle,     color: '#ef4444', badge: 'bg-red-500/20 text-red-400',   label: 'Failed' },
  running: { icon: FiClock,       color: '#3b82f6', badge: 'bg-blue-500/20 text-blue-400', label: 'Running' },
};

export default function AdminBackup() {
  const [records, setRecords]   = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notes, setNotes]       = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/backup');
      setRecords(data.data || []);
      setStats(data.stats || {});
    } catch {
      toast.error('Failed to load backup records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  // Poll while any backup is running
  useEffect(() => {
    const hasRunning = records.some(r => r.status === 'running');
    if (!hasRunning) return;
    const timer = setInterval(fetchRecords, 3000);
    return () => clearInterval(timer);
  }, [records]);

  const triggerBackup = async () => {
    setTriggering(true);
    try {
      await api.post('/admin/backup/trigger', { notes, type: 'manual' });
      toast.success('Backup started! Refreshing in a moment...');
      setNotes('');
      setTimeout(fetchRecords, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start backup');
    } finally {
      setTriggering(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/backup/${deleteId}`);
      setRecords(prev => prev.filter(r => r._id !== deleteId));
      toast.success('Backup record deleted.');
      setDeleteId(null);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FiHardDrive className="w-6 h-6 text-green-400" /> Backup & Security
          </h1>
          <p className="text-slate-400 mt-1">Real-time database backup management and restore history</p>
        </div>
        <button onClick={fetchRecords} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-all">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Backups',  value: stats.total ?? 0,        color: '#3b82f6' },
          { label: 'Successful',     value: stats.successful ?? 0,   color: '#22c55e' },
          { label: 'Total Size',     value: formatBytes(stats.totalSizeBytes), color: '#a855f7' },
          { label: 'Last Backup',    value: stats.lastBackupAt ? formatDateTime(stats.lastBackupAt) : 'Never', color: '#f59e0b', small: true },
        ].map(s => (
          <div key={s.label} className="bg-[#13161e] border border-slate-800 rounded-2xl p-5">
            <div className="text-slate-400 text-sm mb-1">{s.label}</div>
            <div className={`font-black ${s.small ? 'text-base' : 'text-2xl'}`} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Trigger Backup */}
      <div className="bg-[#13161e] border border-green-500/20 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <FiPlus className="w-4 h-4 text-green-400" /> Create Manual Backup
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Creates a complete JSON snapshot of all database collections. The backup runs in the background — progress is tracked below.
        </p>
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Optional notes for this backup..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button
            onClick={triggerBackup}
            disabled={triggering}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <FiHardDrive className="w-4 h-4" />
            {triggering ? 'Starting...' : 'Start Backup'}
          </button>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-[#13161e] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="text-white font-semibold">Backup History</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiHardDrive className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-white font-semibold text-lg mb-1">No backups yet</h3>
            <p className="text-slate-500 text-sm">Click "Start Backup" to create your first database backup.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {records.map(rec => {
              const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.running;
              return (
                <div key={rec._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                  <cfg.icon className="w-5 h-5 shrink-0" style={{ color: cfg.color }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium truncate">{rec.filename}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>{cfg.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 capitalize">{rec.type}</span>
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">
                      {formatBytes(rec.sizeBytes)} · {rec.collections?.length ?? 0} collections
                      {rec.notes && ` · "${rec.notes}"`}
                      {rec.errorMessage && <span className="text-red-400"> · Error: {rec.errorMessage}</span>}
                    </div>
                    <div className="text-slate-600 text-xs mt-0.5">
                      By {rec.createdBy?.name || 'System'} · Started {formatDateTime(rec.createdAt)}
                      {rec.completedAt && ` · Completed ${formatDateTime(rec.completedAt)}`}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {rec.status === 'running' ? (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <button
                        onClick={() => setDeleteId(rec._id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete record"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13161e] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <FiAlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Delete Backup Record</h3>
                <p className="text-slate-400 text-sm">This only removes the record, not any actual backup file.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
