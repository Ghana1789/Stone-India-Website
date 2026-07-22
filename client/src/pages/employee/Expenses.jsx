import { useState, useEffect } from 'react';
import { 
  FiFileText, FiPlus, FiClock, FiCheckCircle, 
  FiXCircle, FiImage, FiTrendingUp, FiArrowRight
} from 'react-icons/fi';
import axios from '../../services/api';
import { toast } from 'react-hot-toast';

export default function EmployeeExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Travel',
    description: '',
    receiptUrl: '' // Mock URL for now
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('/employee/expenses');
      setExpenses(res.data.data);
    } catch (err) {
      toast.error('Failed to load expense history.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/employee/expenses', formData);
      toast.success('Expense claim submitted!');
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      toast.error('Submission failed.');
    }
  };

  const statusColors = {
    'Pending': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'Approved': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Rejected': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Paid': 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Expense Claims</h1>
          <p className="text-slate-400 mt-1">Submit receipts and track your reimbursement approvals.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-100 active:scale-95 transition-all text-sm tracking-widest uppercase"
        >
          <FiPlus className="w-5 h-5" /> NEW CLAIM
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Reimbursement Summary</h3>
              <div className="space-y-6">
                <div>
                  <div className="text-white font-black text-2xl">₹ {expenses.filter(e => e.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-500 font-bold uppercase mt-1 tracking-tighter">Total Paid To Date</div>
                </div>
                <div>
                  <div className="text-white font-black text-2xl">₹ {expenses.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div>
                  <div className="text-[10px] text-orange-400 font-bold uppercase mt-1 tracking-tighter">Pending Approval</div>
                </div>
              </div>
            </div>
            <FiTrendingUp className="absolute right-[-5%] bottom-[-5%] w-24 h-24 text-white/5" />
          </div>

          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 rounded-3xl p-6">
            <h3 className="text-white font-bold text-xs mb-3 italic">Claim Guidelines</h3>
            <ul className="space-y-3">
              {[
                'Keep all original receipts',
                'Submit weekly for faster processing',
                'Entertainment requires pre-approval'
              ].map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-indigo-200">
                  <FiCheckCircle className="mt-0.5 shrink-0 text-emerald-500" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Claim History */}
        <div className="lg:col-span-3">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-bold uppercase text-xs tracking-widest text-slate-400">Claims History</h3>
              <FiFileText className="text-slate-500" />
            </div>
            <div className="overflow-x-auto text-nowrap">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/30">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Expense Item</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {expenses.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-all cursor-default">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                            {exp.category[0]}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">{exp.title}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">{exp.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-white font-black text-sm">₹ {exp.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-slate-400 text-xs font-medium">{new Date(exp.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[exp.status]}`}>
                          {exp.status === 'Paid' || exp.status === 'Approved' ? <FiCheckCircle /> : exp.status === 'Rejected' ? <FiXCircle /> : <FiClock />}
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-8 py-16 text-center text-slate-500 font-medium">No claims found in your record.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* New Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#13161e] border border-slate-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-[#1e2235] to-[#13161e]">
              <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">NEW REIMBURSEMENT</h2>
              <p className="text-slate-500 text-[10px] font-black mt-1 uppercase tracking-widest">Ensure all data is accurate before submission</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">Expense Title</label>
                  <input 
                    type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Client Lunch at Taj"
                    className="w-full bg-slate-800 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">Amount (INR)</label>
                  <input 
                    type="number" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">Category</label>
                  <select 
                    value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm appearance-none"
                  >
                    {['Travel', 'Food', 'Equipment', 'Office Supplies', 'Maintenance', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2 block">Description</label>
                <textarea 
                  rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-sm resize-none"
                />
              </div>

              <div className="p-6 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center group cursor-pointer hover:border-emerald-500/50 transition-all">
                <FiImage className="text-slate-600 group-hover:text-emerald-500 w-8 h-8 mb-2 transition-all" />
                <div className="text-xs font-bold text-slate-400">Click to upload receipt image</div>
                <div className="text-[10px] text-slate-600 mt-1 uppercase font-black">JPG, PNG up to 5MB</div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-4 rounded-2xl border border-slate-700 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all">CLOSE</button>
                <button type="submit" className="flex-1 px-8 py-4 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-100 active:scale-95 transition-all">SUBMIT CLAIM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
