import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { FiTruck, FiRefreshCw, FiPlus, FiStar, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const RATING_COLORS = { Preferred: '#22c55e', Approved: '#3b82f6', Conditional: '#f59e0b', Probation: '#f97316', Disqualified: '#ef4444' };

export default function SupplyChain() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendorName:'', category:'Cathode Materials', qualityScore:0, deliveryScore:0, priceScore:0, leadTimeDays:0, country:'India' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try { setLoading(true); const r = await api.get('/ev/supply-chain'); setData(r.data.data); setAnalytics(r.data.analytics); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = { ...form, qualityScore: +form.qualityScore, deliveryScore: +form.deliveryScore, priceScore: +form.priceScore, leadTimeDays: +form.leadTimeDays };
      await api.post('/ev/supply-chain', body);
      setShowCreate(false); fetchData();
    } catch (err) { alert(err?.response?.data?.message || 'Failed to add supplier'); }
    finally { setSaving(false); }
  };

  const ScoreBar = ({ value, color }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-800 rounded-full h-1.5"><div className="h-full rounded-full" style={{width:`${value||0}%`,backgroundColor:color}} /></div>
      <span className="text-[9px] font-black" style={{color}}>{value||0}</span>
    </div>
  );

  return (
    <div className="space-y-7 pb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white italic uppercase">Supply Chain Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Vendor management · Supplier scorecards · Procurement analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"><FiRefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase transition-all">
            <FiPlus className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Suppliers', value: analytics?.totalSuppliers ?? '—', color:'#3b82f6', icon: FiTruck },
          { label: 'Avg Score', value: `${analytics?.avgOverallScore ?? '—'}/100`, color:'#22c55e', icon: FiStar },
          { label: 'Categories', value: (analytics?.categoryDistribution||[]).length, color:'#8b5cf6', icon: FiCheckCircle },
          { label: 'At Risk', value: (data||[]).filter(s=>s.overallScore<60).length, color:'#ef4444', icon: FiAlertTriangle },
        ].map(k=>(
          <div key={k.label} className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 mb-3"><k.icon className="w-4 h-4" style={{color:k.color}}/><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{k.label}</span></div>
            <div className="text-3xl font-black italic text-white">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Top Suppliers */}
      {(analytics?.topSuppliers||[]).length > 0 && (
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-6">
          <h3 className="text-white font-black italic uppercase text-sm mb-4">Top Preferred Suppliers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topSuppliers.map(s=>(
              <div key={s._id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-green-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-bold text-sm">{s.vendorName}</span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 font-black px-2 py-0.5 rounded-full">{s.overallScore}/100</span>
                </div>
                <div className="text-[10px] text-slate-500 mb-2">{s.category}</div>
                <div className="text-[9px] text-slate-400">OTD: {s.onTimeDeliveryRate||0}% · Defect: {s.defectRate||0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Table */}
      <div className="bg-[#0d1117] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800"><h3 className="text-white font-black italic uppercase text-sm">All Suppliers</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50 border-b border-slate-800">
              <tr>{['Vendor','Category','Quality','Delivery','Price','Lead Time','Overall','Rating'].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-10 text-center"><div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto"/></td></tr>
              : (data||[]).length > 0 ? (data||[]).map(s=>(
                <tr key={s._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3"><div className="text-white font-bold text-xs">{s.vendorName}</div><div className="text-slate-500 text-[9px]">{s.country}</div></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.category}</td>
                  <td className="px-4 py-3 w-24"><ScoreBar value={s.qualityScore} color="#22c55e"/></td>
                  <td className="px-4 py-3 w-24"><ScoreBar value={s.deliveryScore} color="#3b82f6"/></td>
                  <td className="px-4 py-3 w-24"><ScoreBar value={s.priceScore} color="#8b5cf6"/></td>
                  <td className="px-4 py-3 text-slate-300 text-xs">{s.leadTimeDays}d</td>
                  <td className="px-4 py-3 font-black text-sm" style={{color:s.overallScore>80?'#22c55e':s.overallScore>60?'#f59e0b':'#ef4444'}}>{s.overallScore}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{backgroundColor:`${RATING_COLORS[s.rating]||'#64748b'}20`,color:RATING_COLORS[s.rating]||'#64748b'}}>{s.rating}</span></td>
                </tr>
              )) : <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-600 text-xs font-bold uppercase">No suppliers yet. Add your first supplier.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1117] border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-black text-white italic uppercase mb-5">Add Supplier</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {label:'Vendor Name',key:'vendorName',type:'text',required:true},
                  {label:'Category',key:'category',type:'select',opts:['Cathode Materials','Anode Materials','Electrolytes','Separators','Battery Cases','BMS Components','Packaging','Equipment','Chemicals']},
                  {label:'Country',key:'country',type:'text'},
                  {label:'Lead Time (days)',key:'leadTimeDays',type:'number'},
                  {label:'Quality Score (0-100)',key:'qualityScore',type:'number'},
                  {label:'Delivery Score (0-100)',key:'deliveryScore',type:'number'},
                  {label:'Price Score (0-100)',key:'priceScore',type:'number'},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{f.label}</label>
                    {f.type==='select'
                      ? <select value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {f.opts.map(o=><option key={o}>{o}</option>)}
                        </select>
                      : <input type={f.type} required={f.required} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500" />}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowCreate(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black disabled:opacity-50 transition-all">{saving?'Adding...':'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
