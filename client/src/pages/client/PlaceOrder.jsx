import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiMinus, FiTrash2, FiShoppingCart, FiMapPin } from 'react-icons/fi';

export default function PlaceOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [batteries, setBatteries] = useState([]);
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState({
    name: user?.name || '', phone: user?.phone || '',
    street: user?.address?.street || '', city: user?.address?.city || '',
    state: user?.address?.state || '', pincode: user?.address?.pincode || ''
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/batteries').then(r => setBatteries(r.data.data)); }, []);

  const addToCart = (b) => {
    setCart(prev => {
      const existing = prev.find(c => c.battery === b._id);
      if (existing) return prev.map(c => c.battery === b._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { battery: b._id, batteryName: b.name, price: b.price, gstRate: b.gstRate, quantity: 1 }];
    });
    toast.success(`${b.name} added to cart`);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => c.battery === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.battery !== id));

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const gst = cart.reduce((s, c) => s + (c.price * c.quantity * c.gstRate) / 100, 0);
  const total = subtotal + gst;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error('Add at least one battery to your order.');
    setLoading(true);
    try {
      const { data } = await api.post('/client/orders', {
        items: cart.map(({ battery, quantity }) => ({ battery, quantity })),
        deliveryAddress: address,
        notes
      });
      toast.success('Order placed successfully!');
      navigate(`/client/orders/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Place New Order</h1>
        <p className="text-slate-400 mt-1">Select batteries and configure your delivery</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battery Selection */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-white font-semibold">Select Batteries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batteries.map(b => (
              <div key={b._id} className="card card-hover">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{b.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">{b.sku}</span>
                  </div>
                  <span className="badge badge-blue text-xs shrink-0">{b.category}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {b.specs?.voltage && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{b.specs.voltage}</span>}
                  {b.specs?.capacity && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{b.specs.capacity}</span>}
                  {b.specs?.chemistry && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{b.specs.chemistry}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-brand-400 font-bold">₹{b.price?.toLocaleString('en-IN')}</div>
                    <div className="text-slate-500 text-xs">+{b.gstRate}% GST • Stock: {b.stock}</div>
                  </div>
                  <button onClick={() => addToCart(b)} disabled={b.stock === 0}
                    className="btn-primary btn-sm flex items-center gap-1.5">
                    <FiPlus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary + Address */}
        <div className="space-y-4">
          {/* Cart */}
          <div className="card">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiShoppingCart className="text-brand-400" /> Order Cart
            </h2>
            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">No items added yet</p>
            ) : (
              <div className="space-y-3">
                {cart.map(c => (
                  <div key={c.battery} className="flex items-center justify-between gap-2 p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{c.batteryName}</div>
                      <div className="text-brand-400 text-xs">₹{(c.price * c.quantity).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(c.battery, -1)} className="w-6 h-6 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors">
                        <FiMinus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-white text-sm">{c.quantity}</span>
                      <button onClick={() => updateQty(c.battery, 1)} className="w-6 h-6 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center transition-colors">
                        <FiPlus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(c.battery)} className="w-6 h-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center ml-1 transition-colors">
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-slate-400"><span>GST</span><span>₹{Math.round(gst).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-white font-bold text-base"><span>Total</span><span className="text-brand-400">₹{Math.round(total).toLocaleString('en-IN')}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Address */}
          <form onSubmit={handleSubmit} className="card space-y-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FiMapPin className="text-brand-400" /> Delivery Address
            </h2>
            {[
              { key: 'name', placeholder: 'Contact name', label: 'Name' },
              { key: 'phone', placeholder: '10-digit phone', label: 'Phone' },
              { key: 'street', placeholder: 'Street / Area', label: 'Street' },
              { key: 'city', placeholder: 'City', label: 'City' },
              { key: 'state', placeholder: 'State', label: 'State' },
              { key: 'pincode', placeholder: '6-digit PIN', label: 'PIN Code' },
            ].map(f => (
              <input key={f.key} className="input py-2.5 text-sm" placeholder={f.placeholder}
                value={address[f.key]} onChange={e => setAddress({ ...address, [f.key]: e.target.value })} required />
            ))}
            <textarea className="input py-2.5 text-sm resize-none" rows={2} placeholder="Order notes (optional)"
              value={notes} onChange={e => setNotes(e.target.value)} />
            <button type="submit" disabled={loading || cart.length === 0} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Placing...' : `Place Order • ₹${Math.round(total).toLocaleString('en-IN')}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
