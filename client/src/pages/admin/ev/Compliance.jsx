import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { FiAward, FiRefreshCw, FiPlus, FiAlertTriangle, FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';

const STATUS_COLORS = { Valid:'#22c55e', Expired:'#ef4444', 'Expiring Soon':'#f59e0b', 'Under Review':'#3b82f6', Pending:'#64748b', 'Not Applicable':'#374151' };
const CATEGORY_COLORS = { Safety:'#ef4444', Quality:'#22c55e', Environmental:'#10b981', Product:'#3b82f6', Process:'#8b5cf6', Regulatory:'#f97316' };

export default function Compliance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ standard:'ISO 9001:2015', documentName:'', category:'Quality', status:'Valid', expiryDate:'', issuingBody:'', certificationNumber:'' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await api.get('/ev/compliance'); setData(r.data); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/ev/compliance', form);
      setShowCreate(false); fetchData();
    } catch(err) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const docs = data?.data || [];
  const expiring = data?.expiringDocs || [];
  const statusDist = data?.statusDistribution || [];

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Regulatory Compliance</h1>
          <p className="text-slate-400 text-sm mt-0.5">ISO certifications · Product standards · Audit management · CAPA</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"><FiRefreshCw className="w-4 h-4"/></button>
          <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase transition-all">
            <FiPlus className="w-4 h-4"/> Add Certificate
          </button>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {statusDist.map(s=>(
          <div key={s._id} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-4 text-center hover:border-slate-600 transition-all">
            <div className="text-2xl font-black italic text-white mb-1">{s.count}</div>
            <div className="text-[9px] font-black uppercase tracking-widest" style={{color:STATUS_COLORS[s._id]||'#64748b'}}>{s._id}</div>
          </div>
        ))}
      </div>

      {/* Expiring Soon */}
      {expiring.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiCalendar className="w-4 h-4 text-yellow-400"/>
            <span className="text-yellow-300 font-black text-sm uppercase">Expiring Within 90 Days</span>
          </div>
          <div className="space-y-3">
            {expiring.map(d=>(
              <div key={d._id} className="flex items-center gap-4 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <FiClock className="w-4 h-4 text-yellow-400 shrink-0"/>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm">{d.standard}</div>
                  <div className="text-slate-400 text-xs truncate">{d.documentName}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-yellow-400 font-black text-sm">{d.daysUntilExpiry} days</div>
                  <div className="text-slate-500 text-[9px]">{d.expiryDate?new Date(d.expiryDate).toLocaleDateString('en-IN'):'—'}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black shrink-0" style={{backgroundColor:`${STATUS_COLORS[d.status]||'#64748b'}20`,color:STATUS_COLORS[d.status]||'#64748b'}}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800"><h3 className="text-white font-black italic uppercase text-sm">All Compliance Documents</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>{['Standard','Document','Category','Issuing Body','Cert No.','Expiry','Days Left','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-10 text-center"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto"/></td></tr>
              : docs.length > 0 ? docs.map(d=>(
                <tr key={d._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-purple-400 font-bold text-xs">{d.standard}</td>
                  <td className="px-4 py-3 text-white text-xs max-w-[160px] truncate">{d.documentName}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{backgroundColor:`${CATEGORY_COLORS[d.category]||'#64748b'}20`,color:CATEGORY_COLORS[d.category]||'#64748b'}}>{d.category}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{d.issuingBody||'—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{d.certificationNumber||'—'}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{d.expiryDate?new Date(d.expiryDate).toLocaleDateString('en-IN'):'—'}</td>
                  <td className="px-4 py-3 font-black text-sm" style={{color:d.daysUntilExpiry<30?'#ef4444':d.daysUntilExpiry<90?'#f59e0b':'#22c55e'}}>{d.daysUntilExpiry??'—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{backgroundColor:`${STATUS_COLORS[d.status]||'#64748b'}20`,color:STATUS_COLORS[d.status]||'#64748b'}}>{d.status}</span></td>
                </tr>
              )) : <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No compliance documents. Add your certifications.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-black text-white italic uppercase mb-5">Add Compliance Document</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {label:'Standard',key:'standard',type:'select',opts:['ISO 9001:2015','ISO 14001:2015','ISO 45001:2018','IATF 16949','UN38.3','IEC 62133','IEC 62619','UL 1642','CE Marking','BIS Certification','AIS-048','AIS-156','CMVR','REACH','RoHS']},
                  {label:'Category',key:'category',type:'select',opts:['Safety','Quality','Environmental','Product','Process','Regulatory']},
                  {label:'Document Name',key:'documentName',type:'text',required:true},
                  {label:'Issuing Body',key:'issuingBody',type:'text'},
                  {label:'Certificate Number',key:'certificationNumber',type:'text'},
                  {label:'Status',key:'status',type:'select',opts:['Valid','Expired','Expiring Soon','Under Review','Pending']},
                  {label:'Expiry Date',key:'expiryDate',type:'date'},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{f.label}</label>
                    {f.type==='select'
                      ? <select value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                          {f.opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      : <input type={f.type} required={f.required} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"/>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-black disabled:opacity-50 transition-all">{saving?'Saving...':'Add Document'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
