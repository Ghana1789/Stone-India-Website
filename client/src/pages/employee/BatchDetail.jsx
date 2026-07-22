import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiX, FiUpload } from 'react-icons/fi';

const qcItems = [
  { key: 'visualInspection', label: 'Visual Inspection', hint: 'Check for physical damage, corrosion, loose connections' },
  { key: 'voltageTest', label: 'Voltage Test', hint: 'Measure open circuit voltage', hasValue: true },
  { key: 'capacityTest', label: 'Capacity Test', hint: 'Actual Ah delivered vs rated', hasValue: true },
  { key: 'insulationTest', label: 'Insulation Test', hint: 'Check insulation resistance > 1MΩ' },
  { key: 'temperatureTest', label: 'Temperature Test', hint: 'Monitor temperature during charge/discharge', hasValue: true },
  { key: 'cycleTest', label: 'Cycle Test', hint: 'Charge/discharge cycle performance check' },
  { key: 'safetyTest', label: 'Safety Test', hint: 'Overcharge, over-discharge, short circuit protection' },
  { key: 'packagingCheck', label: 'Packaging Check', hint: 'Packaging integrity, labels, documentation' },
];

export default function BatchDetail() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/employee/batches/${id}`).then(r => {
      setBatch(r.data.data);
      setChecklist(r.data.data.qcChecklist || {});
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const updateCheck = (key, field, val) => {
    setChecklist(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  };

  const handleSubmitQC = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/employee/batches/${id}/qc`, { qcChecklist: checklist });
      setBatch(data.data);
      toast.success(`QC submitted! Score: ${data.data.qcScore}%`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit QC');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!batch) return <div className="text-center py-20 text-slate-500">Batch not found.</div>;

  const totalPassed = qcItems.filter(i => checklist[i.key]?.passed).length;
  const score = Math.round((totalPassed / qcItems.length) * 100);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/employee/batches" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"><FiArrowLeft /></Link>
        <div>
          <h1 className="text-xl font-bold text-white font-mono">{batch.batchId}</h1>
          <p className="text-slate-400 text-sm">{batch.batteryName} • {batch.quantity} units</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-bold text-yellow-400">{score}%</div>
          <div className="text-slate-500 text-xs">QC Score</div>
        </div>
      </div>

      {/* Score bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">QC Progress</h2>
          <span className="text-slate-400 text-sm">{totalPassed}/{qcItems.length} checks passed</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full">
          <div className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-brand-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }} />
        </div>
        {batch.qcStatus && batch.qcStatus !== 'Pending' && (
          <div className={`mt-3 text-sm font-semibold ${batch.qcStatus === 'Passed' ? 'text-brand-400' : 'text-red-400'}`}>
            Final Status: {batch.qcStatus} {batch.qcScore != null ? `(${batch.qcScore}%)` : ''}
          </div>
        )}
      </div>

      {/* QC Checklist */}
      <div className="card space-y-4">
        <h2 className="text-white font-semibold text-lg">QC Checklist</h2>
        {qcItems.map(item => (
          <div key={item.key} className={`p-4 rounded-xl border transition-all ${
            checklist[item.key]?.passed === true ? 'bg-brand-500/5 border-brand-500/30' :
            checklist[item.key]?.passed === false ? 'bg-red-500/5 border-red-500/30' :
            'bg-slate-800/50 border-slate-700/50'
          }`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-medium">{item.label}</span>
                  {checklist[item.key]?.passed === true && <FiCheck className="w-4 h-4 text-brand-400" />}
                  {checklist[item.key]?.passed === false && <FiX className="w-4 h-4 text-red-400" />}
                </div>
                <p className="text-slate-500 text-xs">{item.hint}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateCheck(item.key, 'passed', true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    checklist[item.key]?.passed === true ? 'bg-brand-500 border-brand-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-brand-500'
                  }`}>PASS</button>
                <button onClick={() => updateCheck(item.key, 'passed', false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    checklist[item.key]?.passed === false ? 'bg-red-500 border-red-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-red-500'
                  }`}>FAIL</button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {item.hasValue && (
                <input className="input py-2 text-xs" placeholder="Measured value (e.g. 48.2V)"
                  value={checklist[item.key]?.value || ''}
                  onChange={e => updateCheck(item.key, 'value', e.target.value)} />
              )}
              <input className={`input py-2 text-xs ${!item.hasValue ? 'md:col-span-2' : ''}`}
                placeholder="Remarks (optional)"
                value={checklist[item.key]?.remarks || ''}
                onChange={e => updateCheck(item.key, 'remarks', e.target.value)} />
            </div>
          </div>
        ))}

        <button onClick={handleSubmitQC} disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
          {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <FiCheck />}
          {saving ? 'Submitting...' : 'Submit QC Checklist'}
        </button>
      </div>
    </div>
  );
}
