import { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';
import { FiZap, FiSearch, FiFilter } from 'react-icons/fi';

const categoryColors = { '2W/3W': 'badge-green', 'Fleet': 'badge-blue', 'Grid/BESS': 'badge-purple', 'R&D': 'badge-yellow', 'Industrial': 'badge-gray' };
const CATEGORIES = ['All', '2W/3W', 'Fleet', 'Grid/BESS', 'R&D', 'Industrial'];

export default function Products() {
  const [batteries, setBatteries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/batteries').then(r => {
      setBatteries(r.data.data); setFiltered(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let f = batteries;
    if (category !== 'All') f = f.filter(b => b.category === category);
    if (search) f = f.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.sku.toLowerCase().includes(search.toLowerCase()));
    setFiltered(f);
  }, [category, search, batteries]);

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden bg-black border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-slate-300 text-xs font-medium tracking-widest uppercase">EV Battery Catalogue</span>
          </div>
          <h1 className="font-display font-bold text-5xl md:text-7xl mb-4 text-white tracking-tighter">
            Stone India <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Battery Range</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
            BIS & AIS certified LFP and NMC battery packs for 2W, 3W, fleet vehicles, and grid storage.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl sticky top-16 md:top-20 z-30 shadow-sm">
        <div className="container-custom flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input className="input pl-11 py-2 text-xs" placeholder="Search batteries..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${
                  category === c ? 'bg-white text-black' : 'bg-transparent border border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                }`}>{c}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="section bg-black">
        <div className="container-custom">
          {loading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500 font-medium">No batteries found matching your filters.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(b => (
                <div key={b._id} className="card card-hover group flex flex-col bg-black border-white/10 p-0 overflow-hidden">
                  {b.image && (
                    <div className="overflow-hidden h-48 bg-zinc-950 border-b border-white/10">
                      <img src={b.image} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`badge bg-white/5 border border-white/10 text-slate-300`}>{b.category}</span>
                      {b.isFeatured && <span className="badge bg-white text-black">⭐ Featured</span>}
                    </div>
                    <h3 className="font-display font-semibold text-white text-xl mb-1">{b.name}</h3>
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 mb-4 uppercase">SKU: {b.sku}</span>

                    {/* Key Specs Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {[
                        { label: 'Voltage', val: b.specs?.voltage },
                        { label: 'Capacity', val: b.specs?.capacity },
                        { label: 'Chemistry', val: b.specs?.chemistry },
                        { label: 'Cycle Life', val: b.specs?.cycleLife },
                        { label: 'Charge Time', val: b.specs?.chargingTime },
                        { label: 'Protection', val: b.specs?.protection },
                      ].filter(s => s.val).slice(0, 6).map(s => (
                        <div key={s.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                          <div className="text-white font-semibold text-xs">{s.val}</div>
                          <div className="text-slate-500 text-[9px] uppercase tracking-wider">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-1 font-light">{b.description}</p>

                    {/* Operating Temp */}
                    {b.specs?.operatingTemp && (
                      <div className="text-xs text-slate-400 mb-3 font-light">🌡️ <span className="font-medium text-slate-300">Temp:</span> {b.specs.operatingTemp}</div>
                    )}

                    {/* Compatible vehicles */}
                    {b.specs?.compatibleVehicles?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-medium">Compatible with</div>
                        <div className="flex flex-wrap gap-1.5">
                          {b.specs.compatibleVehicles.map(v => (
                            <span key={v} className="text-[10px] bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/10">
                      <div>
                        <div className="text-white font-semibold text-lg tracking-tight">₹{b.price?.toLocaleString('en-IN')}</div>
                        <div className="text-slate-500 text-[10px] uppercase tracking-wider">+{b.gstRate}% GST • MOQ: {b.minOrderQty}</div>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/contact" className="btn-secondary btn-sm text-xs rounded-full">Quote</Link>
                        <Link to="/login" className="btn-primary btn-sm flex items-center gap-1 text-xs rounded-full px-4">
                          <FiZap className="w-3 h-3" /> Order
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
