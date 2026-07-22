import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import socket from '../../../services/socket';
import { FiAlertTriangle, FiRefreshCw, FiTool, FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi';

const ALERT_COLORS = { Info:'#3b82f6', Warning:'#f59e0b', Critical:'#ef4444', Emergency:'#dc2626' };
const STATUS_COLORS = { Scheduled:'#64748b', InProgress:'#3b82f6', Completed:'#22c55e', Overdue:'#ef4444', Cancelled:'#374151', Postponed:'#f59e0b' };

export default function PredictiveMaintenance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ machineId:'', machineName:'', maintenanceType:'Preventive', scheduledDate:'', alertLevel:'Info', alertMessage:'' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await api.get('/ev/maintenance'); setData(r.data); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    socket.on('machine_status', d => setMachines(d.machines || []));
    return () => socket.off('machine_status');
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/ev/maintenance', { ...form, scheduledDate: new Date(form.scheduledDate) });
      setShowCreate(false); fetchData();
    } catch(err) { alert(err?.response?.data?.message || 'Failed to create maintenance record'); }
    finally { setSaving(false); }
  };

  const upcomingAlerts = data?.upcomingAlerts || [];
  const schedules = data?.data || [];
  const criticalMachines = data?.criticalMachines || machines.filter(m => m.status === 'Warning' || m.status === 'Critical');

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Predictive Maintenance</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-driven machine health · Failure prediction · Maintenance scheduling</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"><FiRefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase transition-all">
            <FiPlus className="w-4 h-4" /> Schedule Maintenance
          </button>
        </div>
      </div>

      {/* Status Distribution */}
      {data?.statusDistribution && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {(data.statusDistribution||[]).map(s=>(
            <div key={s._id} className="bg-[#0d1117] rounded-xl border border-slate-800 p-4 text-center">
              <div className="text-2xl font-black italic text-white mb-1">{s.count}</div>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{color:STATUS_COLORS[s._id]||'#64748b'}}>{s._id}</div>
            </div>
          ))}
        </div>
      )}

      {/* Critical Machine Alerts */}
      {criticalMachines.length > 0 && (
        <div className="bg-[#0d1117] rounded-2xl border border-red-500/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-red-300 font-black uppercase text-sm">Critical Machine Alerts — Immediate Attention Required</h3>
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse ml-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalMachines.map((m, i) => {
              const statusColor = m.status === 'Critical' ? '#ef4444' : '#f59e0b';
              return (
                <div key={m.id || i} className="p-4 rounded-xl border" style={{borderColor:`${statusColor}30`,backgroundColor:`${statusColor}08`}}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-sm">{m.name}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full" style={{backgroundColor:`${statusColor}20`,color:statusColor}}>{m.status}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] mb-3">{m.line}</div>
                  <div className="grid grid-cols-3 gap-2 text-[9px] text-center">
                    <div><div className="font-black text-slate-300">{m.health || m.healthScore || 0}%</div><div className="text-slate-600">Health</div></div>
                    <div><div className="font-black text-slate-300">{m.vibration?.toFixed?.(1) || '—'}</div><div className="text-slate-600">Vib mm/s</div></div>
                    <div><div className="font-black" style={{color:(m.temp||m.temperature||0)>80?'#ef4444':'#94a3b8'}}>{m.temp?.toFixed?.(0) || m.temperature || '—'}°</div><div className="text-slate-600">Temp</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Scheduled Maintenance */}
      {upcomingAlerts.length > 0 && (
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiClock className="w-4 h-4 text-yellow-400" />
            <h3 className="text-white font-black italic uppercase text-sm">Upcoming in 7 Days</h3>
          </div>
          <div className="space-y-3">
            {upcomingAlerts.map(a=>(
              <div key={a._id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:ALERT_COLORS[a.alertLevel]||'#64748b'}} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm">{a.machineName}</div>
                  <div className="text-slate-400 text-xs">{a.maintenanceType} · {a.alertMessage||'Scheduled maintenance'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-white font-black text-sm">{new Date(a.scheduledDate).toLocaleDateString('en-IN')}</div>
                  <div className="text-[9px] font-black uppercase" style={{color:ALERT_COLORS[a.alertLevel]||'#64748b'}}>{a.alertLevel}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black shrink-0" style={{backgroundColor:`${STATUS_COLORS[a.status]||'#64748b'}20`,color:STATUS_COLORS[a.status]||'#64748b'}}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Machine Status (from Socket.io) */}
      {machines.length > 0 && (
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="text-white font-black italic uppercase text-sm">Live Machine Health</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr>{['Machine','Line','Status','Health','Temp °C','Vibration','OEE%'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody>
                {machines.map((m,i)=>{
                  const sColor = m.status==='Running'?'#22c55e':m.status==='Warning'?'#f59e0b':m.status==='Critical'?'#ef4444':'#64748b';
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-white font-bold text-xs">{m.name}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{m.line}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{backgroundColor:`${sColor}20`,color:sColor}}>{m.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5"><div className="h-full rounded-full" style={{width:`${m.health||0}%`,backgroundColor:m.health>85?'#22c55e':m.health>70?'#f59e0b':'#ef4444'}}/></div>
                          <span className="text-xs font-bold text-white">{m.health}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold" style={{color:m.temp>80?'#ef4444':m.temp>60?'#f59e0b':'#94a3b8'}}>{m.temp?.toFixed(1)}</td>
                      <td className="px-4 py-3 text-xs font-bold" style={{color:m.vibration>4?'#ef4444':m.vibration>2?'#f59e0b':'#22c55e'}}>{m.vibration?.toFixed(1)} mm/s</td>
                      <td className="px-4 py-3 text-xs font-bold text-white">{m.oee?.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800"><h3 className="text-white font-black italic uppercase text-sm">Maintenance Schedule</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>{['Machine','Type','Scheduled','Alert','Status','Technician'].map(h=><th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="py-10 text-center"><div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto"/></td></tr>
              : schedules.length > 0 ? schedules.map(s=>(
                <tr key={s._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-white font-bold text-xs">{s.machineName}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{s.maintenanceType}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{s.scheduledDate?new Date(s.scheduledDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{backgroundColor:`${ALERT_COLORS[s.alertLevel]||'#64748b'}20`,color:ALERT_COLORS[s.alertLevel]||'#64748b'}}>{s.alertLevel}</span></td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{backgroundColor:`${STATUS_COLORS[s.status]||'#64748b'}20`,color:STATUS_COLORS[s.status]||'#64748b'}}>{s.status}</span></td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{s.assignedTechnician?.name||'Unassigned'}</td>
                </tr>
              )) : <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No scheduled maintenance. Add your first record.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-black text-white italic uppercase mb-5">Schedule Maintenance</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {label:'Machine ID',key:'machineId',type:'text',required:true,placeholder:'e.g. M-007'},
                  {label:'Machine Name',key:'machineName',type:'text',required:true,placeholder:'Welding Station #1'},
                  {label:'Type',key:'maintenanceType',type:'select',opts:['Preventive','Predictive','Corrective','Emergency','Calibration','Inspection']},
                  {label:'Alert Level',key:'alertLevel',type:'select',opts:['Info','Warning','Critical','Emergency']},
                  {label:'Scheduled Date',key:'scheduledDate',type:'date',required:true},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{f.label}</label>
                    {f.type==='select'
                      ? <select value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                          {f.opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      : <input type={f.type} required={f.required} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-slate-500"/>}
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Alert Message</label>
                <input value={form.alertMessage} onChange={e=>setForm(p=>({...p,alertMessage:e.target.value}))} placeholder="Vibration threshold exceeded..." className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-slate-500"/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-black disabled:opacity-50 transition-all">{saving?'Scheduling...':'Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
