import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiSearch, FiZap, FiInfo } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const categoryColors = {
  '2W/3W': 'badge-green', 'Fleet': 'badge-blue', 'Grid/BESS': 'badge-purple',
  'R&D': 'badge-yellow', 'Industrial': 'badge-gray'
};

export default function Catalogue() {
  const [batteries, setBatteries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/batteries').then(r => {
      setBatteries(r.data.data);
      setFiltered(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let f = batteries;
    if (category) f = f.filter(b => b.category === category);
    if (search) f = f.filter(b =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.sku.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(f);
  }, [category, search, batteries]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Battery Catalogue</h1>
        <p className="text-slate-400 mt-1">Browse all available Stone India EV battery products</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input className="input pl-11" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {['2W/3W', 'Fleet', 'Grid/BESS', 'R&D', 'Industrial'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(b => (
            <div key={b._id} className="card card-hover group flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={categoryColors[b.category] || 'badge-gray'}>{b.category}</span>
                {b.isFeatured && <span className="badge bg-yellow-500/20 text-yellow-400">⭐ Featured</span>}
              </div>

              <h3 className="text-white font-bold mb-1">{b.name}</h3>
              <span className="text-xs font-mono text-slate-500 mb-3">{b.sku}</span>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: 'Voltage', val: b.specs?.voltage },
                  { label: 'Capacity', val: b.specs?.capacity },
                  { label: 'Chemistry', val: b.specs?.chemistry },
                ].map(s => s.val && (
                  <div key={s.label} className="bg-slate-800 rounded-lg p-2 text-center">
                    <div className="text-white font-semibold text-sm">{s.val}</div>
                    <div className="text-slate-500 text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">{b.description}</p>

              {/* Certifications */}
              {b.certifications?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {b.certifications.map(c => (
                    <span key={c} className="text-[10px] bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700/50">
                <div>
                  <div className="text-brand-400 font-bold text-lg">₹{b.price?.toLocaleString('en-IN')}</div>
                  <div className="text-slate-500 text-xs">+ {b.gstRate}% GST • Min: {b.minOrderQty}</div>
                </div>
                <Link to="/client/orders/new" className="btn-primary btn-sm flex items-center gap-1.5">
                  <FiZap className="w-3 h-3" /> Order
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
