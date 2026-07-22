import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import { FiBox, FiEye, FiCheck, FiX } from 'react-icons/fi';

const statusColors = {
  Scheduled: 'badge-gray', InProduction: 'badge-blue', QCPending: 'badge-yellow',
  QCPassed: 'badge-green', QCFailed: 'badge-red', Packed: 'badge-purple', Dispatched: 'badge-green'
};

export default function EmployeeBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    try {
      const r = await api.get('/employee/batches');
      setBatches(r.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();

    socket.on('batch_updated', (batch) => {
      fetchBatches();
    });

    return () => {
      socket.off('batch_updated');
    };
  }, [fetchBatches]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Battery Batch Logs</h1>
        <p className="text-slate-400 mt-1">Production batches assigned to you</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : batches.length === 0 ? (
        <div className="card text-center py-12">
          <FiBox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No batches assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {batches.map(b => (
            <div key={b._id} className="card card-hover group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="font-mono text-xs text-yellow-400 font-bold">{b.batchId}</span>
                  <h3 className="text-white font-semibold mt-0.5">{b.batteryName}</h3>
                </div>
                <span className={statusColors[b.status] || 'badge-gray'}>{b.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className="text-white font-bold">{b.quantity}</div>
                  <div className="text-slate-500 text-xs">Units</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className={`font-bold ${b.qcStatus === 'Passed' ? 'text-brand-400' : b.qcStatus === 'Failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {b.qcStatus || 'Pending'}
                  </div>
                  <div className="text-slate-500 text-xs">QC Status</div>
                </div>
              </div>

              {b.qcScore != null && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1 text-slate-400"><span>QC Score</span><span>{b.qcScore}%</span></div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className={`h-full rounded-full ${b.qcScore >= 80 ? 'bg-brand-500' : 'bg-red-500'}`} style={{ width: `${b.qcScore}%` }} />
                  </div>
                </div>
              )}

              {b.productionStartDate && (
                <p className="text-xs text-slate-500 mb-3">
                  Started: {new Date(b.productionStartDate).toLocaleDateString('en-IN')}
                </p>
              )}

              <Link to={`/employee/batches/${b._id}`}
                className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors group-hover:gap-3">
                <FiEye className="w-4 h-4" /> View & Update QC
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
