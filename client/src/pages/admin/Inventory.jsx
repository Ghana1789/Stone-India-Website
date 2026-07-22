import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPackage, FiAlertTriangle, FiEdit2, FiCheck } from 'react-icons/fi';

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/inventory').then(r => {
      setInventory(r.data.data);
      setLowStock(r.data.lowStock);
    }).finally(() => setLoading(false));
  }, []);

  const updateStock = async (id) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/inventory/${id}/stock`, { stock: Number(newStock) });
      setInventory(prev => prev.map(b => b._id === id ? { ...b, stock: data.data.stock } : b));
      setLowStock(prev => prev.filter(b => data.data.stock >= 10 ? b._id !== id : true));
      toast.success('Stock updated!');
      setEditing(null); setNewStock('');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const totalStock = inventory.reduce((s, b) => s + b.stock, 0);
  const totalValue = inventory.reduce((s, b) => s + (b.stock * b.price), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Inventory Control</h1>
        <p className="text-slate-400 mt-1">Real-time battery stock overview</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Battery Types', value: inventory.length, color: 'text-brand-400' },
          { label: 'Total Units in Stock', value: totalStock.toLocaleString(), color: 'text-blue-400' },
          { label: 'Stock Value (ex-GST)', value: `₹${(totalValue / 100000).toFixed(1)}L`, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 font-semibold text-sm mb-1">Low Stock Alert</div>
            <div className="text-slate-400 text-xs">{lowStock.map(b => `${b.name} (${b.stock} left)`).join(' • ')}</div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Battery</th><th>SKU</th><th>Category</th><th>Price (ex-GST)</th><th>Stock</th><th>Min Order</th><th>Stock Value</th><th>Action</th></tr></thead>
              <tbody>
                {inventory.map(b => (
                  <tr key={b._id}>
                    <td className="text-white font-medium">{b.name}</td>
                    <td className="font-mono text-xs text-slate-400">{b.sku}</td>
                    <td><span className="badge badge-blue text-xs">{b.category}</span></td>
                    <td className="text-brand-400">₹{b.price?.toLocaleString('en-IN')}</td>
                    <td>
                      {editing === b._id ? (
                        <div className="flex items-center gap-2">
                          <input type="number" className="input py-1.5 w-24 text-sm" value={newStock} onChange={e => setNewStock(e.target.value)} autoFocus />
                          <button onClick={() => updateStock(b._id)} disabled={saving} className="p-1.5 bg-brand-500 rounded-lg text-white hover:bg-brand-400"><FiCheck className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <span className={`font-bold ${b.stock < 10 ? 'text-red-400' : b.stock < 30 ? 'text-yellow-400' : 'text-brand-400'}`}>{b.stock}</span>
                      )}
                    </td>
                    <td className="text-slate-400 text-sm">{b.minOrderQty}</td>
                    <td className="text-slate-400 text-sm">₹{(b.stock * b.price).toLocaleString('en-IN')}</td>
                    <td>
                      <button onClick={() => { setEditing(b._id); setNewStock(String(b.stock)); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
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
