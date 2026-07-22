import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from 'react-icons/fi';

const CATEGORIES = ['2W/3W', 'Fleet', 'Grid/BESS', 'R&D', 'Industrial'];
const CHEMISTRIES = ['LFP', 'NMC', 'LTO', 'NCA'];

const emptyForm = {
  name: '', sku: '', category: '2W/3W', description: '', price: '', gstRate: 18, stock: 0,
  minOrderQty: 1, isFeatured: false, isActive: true,
  specs: { voltage: '', capacity: '', chemistry: 'LFP', cycleLife: '', chargingTime: '', weight: '', dimensions: '', operatingTemp: '', peakPower: '', protection: '' },
  features: '', certifications: ''
};

export default function AdminCatalogue() {
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/batteries').then(r => setBatteries(r.data.data)).finally(() => setLoading(false));
  }, []);

  const setSpec = (k, v) => setForm(prev => ({ ...prev, specs: { ...prev.specs, [k]: v } }));

  const openEdit = (b) => {
    setEditItem(b);
    setForm({
      ...b,
      features: b.features?.join(', ') || '',
      certifications: b.certifications?.join(', ') || '',
      specs: { ...emptyForm.specs, ...b.specs }
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        gstRate: Number(form.gstRate),
        stock: Number(form.stock),
        minOrderQty: Number(form.minOrderQty),
        features: form.features.split(',').map(s => s.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (editItem) {
        const { data } = await api.put(`/batteries/${editItem._id}`, payload);
        setBatteries(prev => prev.map(b => b._id === editItem._id ? data.data : b));
        toast.success('Battery updated!');
      } else {
        const { data } = await api.post('/batteries', payload);
        setBatteries(prev => [data.data, ...prev]);
        toast.success('Battery added to catalogue!');
      }
      setShowForm(false); setEditItem(null); setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const deleteBattery = async (id) => {
    if (!confirm('Remove this battery from catalogue?')) return;
    try {
      await api.delete(`/batteries/${id}`);
      setBatteries(prev => prev.filter(b => b._id !== id));
      toast.success('Battery removed.');
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Battery Catalogue</h1>
          <p className="text-slate-400 mt-1">Manage EV battery products shown on public website and client portal</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditItem(null); setForm(emptyForm); }}
          className="btn-primary flex items-center gap-2">
          {showForm ? <FiX /> : <FiPlus />} {showForm ? 'Cancel' : 'Add Battery'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card border-red-500/20 space-y-5">
          <h2 className="text-white font-semibold text-lg">{editItem ? 'Edit Battery' : 'Add New Battery'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="label">Battery Name *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="label">SKU *</label><input className="input uppercase" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })} required placeholder="SI-LFP-48-30-2W" /></div>
            <div><label className="label">Category *</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Price (₹, ex-GST) *</label><input type="number" className="input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
            <div><label className="label">GST Rate (%)</label><input type="number" className="input" value={form.gstRate} onChange={e => setForm({ ...form, gstRate: e.target.value })} /></div>
            <div><label className="label">Stock (units)</label><input type="number" className="input" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
            <div><label className="label">Min Order Qty</label><input type="number" className="input" value={form.minOrderQty} onChange={e => setForm({ ...form, minOrderQty: e.target.value })} /></div>
            <div><label className="label">Image URL</label><input className="input" value={form.image || ''} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-slate-300">Featured</span>
              </label>
            </div>
          </div>

          <div><label className="label">Description *</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>

          <div>
            <h3 className="text-white font-medium mb-3">Technical Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { key: 'voltage', label: 'Voltage', ph: '48V' },
                { key: 'capacity', label: 'Capacity', ph: '30Ah' },
                { key: 'cycleLife', label: 'Cycle Life', ph: '2000+' },
                { key: 'chargingTime', label: 'Charge Time', ph: '4-5 hrs' },
                { key: 'weight', label: 'Weight', ph: '11 kg' },
                { key: 'dimensions', label: 'Dimensions', ph: '320×200mm' },
                { key: 'operatingTemp', label: 'Op. Temp', ph: '-20 to +60°C' },
                { key: 'peakPower', label: 'Peak Power', ph: '3.5 kW' },
                { key: 'protection', label: 'Protection', ph: 'IP67' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label text-xs">{f.label}</label>
                  <input className="input py-2 text-sm" placeholder={f.ph} value={form.specs[f.key] || ''} onChange={e => setSpec(f.key, e.target.value)} />
                </div>
              ))}
              <div>
                <label className="label text-xs">Chemistry</label>
                <select className="input py-2 text-sm" value={form.specs.chemistry} onChange={e => setSpec('chemistry', e.target.value)}>
                  {CHEMISTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Features (comma-separated)</label><input className="input" value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="BMS, IP67, Fast Charge" /></div>
            <div><label className="label">Certifications (comma-separated)</label><input className="input" value={form.certifications} onChange={e => setForm({ ...form, certifications: e.target.value })} placeholder="BIS, AIS 038, UN38.3" /></div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <FiSave />}
              {saving ? 'Saving...' : editItem ? 'Update Battery' : 'Add to Catalogue'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Name</th><th>SKU</th><th>Category</th><th>Specs</th><th>Price</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead>
              <tbody>
                {batteries.map(b => (
                  <tr key={b._id}>
                    <td className="text-white font-medium">{b.name}</td>
                    <td className="font-mono text-xs text-slate-400">{b.sku}</td>
                    <td><span className="badge badge-blue text-xs">{b.category}</span></td>
                    <td className="text-xs text-slate-400">{b.specs?.voltage} · {b.specs?.capacity} · {b.specs?.chemistry}</td>
                    <td className="text-brand-400 font-semibold">₹{b.price?.toLocaleString('en-IN')}</td>
                    <td className={`font-semibold ${b.stock < 10 ? 'text-red-400' : 'text-slate-300'}`}>{b.stock}</td>
                    <td>{b.isFeatured ? '⭐' : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><FiEdit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteBattery(b._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"><FiTrash2 className="w-3.5 h-3.5" /></button>
                      </div>
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
