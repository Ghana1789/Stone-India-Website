import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FiDollarSign, FiDownload, FiFileText, FiPlus,
  FiUser, FiChevronDown, FiPrinter, FiShield, FiCheckCircle
} from 'react-icons/fi';

export default function PayslipsSection() {
  const { user } = useAuth();
  const role = user?.role;
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [employees, setEmployees] = useState([]);
  const printRef = useRef(null);

  const [form, setForm] = useState({
    employee: '', month: '', year: new Date().getFullYear(),
    earnings: { basic: 30000, hra: 12000, allowances: 5000, bonus: 0 },
    deductions: { tax: 4000, pf: 3600, insurance: 500, other: 0 }
  });

  const fetchPayslips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/payslips');
      setPayslips(res.data.data);
    } catch (err) {
      toast.error('Failed to load payslips.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayslips(); }, [fetchPayslips]);

  // Load employees for generation form
  useEffect(() => {
    if (role === 'admin' || role === 'manager') {
      const endpoint = role === 'admin' ? '/admin/employees' : '/manager/employees';
      api.get(endpoint)
        .then(r => setEmployees(r.data.data || []))
        .catch(() => {});
    }
  }, [role]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/payslips', form);
      toast.success('Payslip generated!');
      setShowGenerate(false);
      fetchPayslips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payslip.');
    }
  };

  const handleMarkPaid = async (e, id) => {
    e.stopPropagation();
    try {
      await api.patch(`/finance/payslips/${id}/status`, { status: 'Paid' });
      toast.success('Salary payment confirmed!');
      fetchPayslips();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const grossSalary = Object.values(form.earnings).reduce((s, v) => s + Number(v), 0);
  const totalDeductions = Object.values(form.deductions).reduce((s, v) => s + Number(v), 0);
  const netSalary = grossSalary - totalDeductions;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Payslip - ${selectedPayslip?.month} ${selectedPayslip?.year}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; margin-bottom: 4px; } h2 { color: #666; font-size: 14px; margin-top: 0; }
        .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td, th { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        th { background: #f8fafc; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; color: #64748b; }
        .total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #1a1a1a; }
        .net td { font-size: 18px; color: #10b981; }
        .footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <h1>Stone India Pvt. Ltd.</h1>
        <h2>Payslip for ${selectedPayslip?.month} ${selectedPayslip?.year}</h2>
      </div>
      <div class="grid">
        <div><strong>Employee:</strong> ${selectedPayslip?.employee?.name || 'N/A'}</div>
        <div><strong>Employee ID:</strong> ${selectedPayslip?.employee?.employeeId || 'N/A'}</div>
        <div><strong>Department:</strong> ${selectedPayslip?.employee?.department || 'N/A'}</div>
        <div><strong>Designation:</strong> ${selectedPayslip?.employee?.designation || 'N/A'}</div>
      </div>
      <table>
        <tr><th colspan="2">Earnings</th><th colspan="2">Deductions</th></tr>
        <tr><td>Basic Salary</td><td>₹${selectedPayslip?.earnings?.basic?.toLocaleString()}</td><td>Tax</td><td>₹${selectedPayslip?.deductions?.tax?.toLocaleString()}</td></tr>
        <tr><td>HRA</td><td>₹${selectedPayslip?.earnings?.hra?.toLocaleString()}</td><td>Provident Fund</td><td>₹${selectedPayslip?.deductions?.pf?.toLocaleString()}</td></tr>
        <tr><td>Allowances</td><td>₹${selectedPayslip?.earnings?.allowances?.toLocaleString()}</td><td>Insurance</td><td>₹${selectedPayslip?.deductions?.insurance?.toLocaleString()}</td></tr>
        <tr><td>Bonus</td><td>₹${selectedPayslip?.earnings?.bonus?.toLocaleString()}</td><td>Other</td><td>₹${selectedPayslip?.deductions?.other?.toLocaleString()}</td></tr>
        <tr class="total-row"><td colspan="2"><strong>Gross: ₹${selectedPayslip?.grossSalary?.toLocaleString()}</strong></td><td colspan="2"><strong>Total: ₹${(selectedPayslip?.grossSalary - selectedPayslip?.netSalary)?.toLocaleString()}</strong></td></tr>
        <tr class="net"><td colspan="4" style="text-align:center"><strong>Net Salary: ₹${selectedPayslip?.netSalary?.toLocaleString()}</strong></td></tr>
      </table>
      <div class="footer">This is a system-generated payslip. No signature required. • Stone India Pvt. Ltd. © ${new Date().getFullYear()}</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Payslips & Salaries</h2>
          <p className="text-slate-400 text-sm mt-1">
            {role === 'employee' ? 'View your salary records and download payslips' : 'Generate and manage employee payslips'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(role === 'admin' || role === 'manager') && (
            <button onClick={() => setShowGenerate(!showGenerate)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">
              <FiPlus className="w-4 h-4" /> Generate Payslip
            </button>
          )}
          <div className="bg-[#13161e] border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <FiShield className="text-emerald-500 w-4 h-4" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Encrypted</span>
          </div>
        </div>
      </div>

      {/* Generate Form */}
      {showGenerate && (
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Generate New Payslip</h3>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })} required
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 outline-none">
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.employeeId || e.email})</option>)}
              </select>
              <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} required
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 outline-none">
                <option value="">Select Month</option>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input type="number" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 outline-none" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Earnings */}
              <div>
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Earnings</h4>
                <div className="space-y-3">
                  {[['basic', 'Basic Salary'], ['hra', 'HRA'], ['allowances', 'Allowances'], ['bonus', 'Bonus']].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-400 font-medium min-w-[100px]">{label}</span>
                      <input type="number" value={form.earnings[key]} onChange={e => setForm({ ...form, earnings: { ...form.earnings, [key]: Number(e.target.value) } })}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none w-32 text-right" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Deductions */}
              <div>
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Deductions</h4>
                <div className="space-y-3">
                  {[['tax', 'Tax'], ['pf', 'Provident Fund'], ['insurance', 'Insurance'], ['other', 'Other']].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-400 font-medium min-w-[100px]">{label}</span>
                      <input type="number" value={form.deductions[key]} onChange={e => setForm({ ...form, deductions: { ...form.deductions, [key]: Number(e.target.value) } })}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none w-32 text-right" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-purple-600/10 to-violet-600/10 border border-purple-500/20 rounded-2xl p-5 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Gross: <span className="text-white font-bold">₹{grossSalary.toLocaleString('en-IN')}</span></div>
                <div className="text-xs text-slate-400">Deductions: <span className="text-red-400 font-bold">-₹{totalDeductions.toLocaleString('en-IN')}</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Net Salary</div>
                <div className="text-2xl font-black text-emerald-400">₹{netSalary.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowGenerate(false)} className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:text-white transition-all">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 transition-all">Generate Payslip</button>
            </div>
          </form>
        </div>
      )}

      {/* Payslips Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" /></div>
      ) : payslips.length === 0 ? (
        <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-16 text-center">
          <FiDollarSign className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No payslips available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {payslips.map(slip => (
            <div key={slip._id}
              onClick={() => setSelectedPayslip(selectedPayslip?._id === slip._id ? null : slip)}
              className={`bg-[#13161e] border rounded-3xl p-6 cursor-pointer transition-all ${
                selectedPayslip?._id === slip._id ? 'border-purple-500/50 shadow-xl shadow-purple-900/20' : 'border-slate-800 hover:border-purple-500/30'
              }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                    {slip.employee?.name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{slip.employee?.name || 'Employee'}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{slip.employee?.department || 'Department'}</div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                  slip.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>{slip.status}</span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">{slip.month} {slip.year}</span>
                <span className="text-lg font-black text-white">₹{slip.netSalary?.toLocaleString('en-IN')}</span>
              </div>

              {/* Expanded Details */}
              {selectedPayslip?._id === slip._id && (
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-fade-in" ref={printRef}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Earnings</h5>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Basic</span><span className="text-white">₹{slip.earnings?.basic?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">HRA</span><span className="text-white">₹{slip.earnings?.hra?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Allowances</span><span className="text-white">₹{slip.earnings?.allowances?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Bonus</span><span className="text-white">₹{slip.earnings?.bonus?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs font-bold border-t border-slate-800 pt-1"><span className="text-slate-300">Gross</span><span className="text-emerald-400">₹{slip.grossSalary?.toLocaleString()}</span></div>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Deductions</h5>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Tax</span><span className="text-white">₹{slip.deductions?.tax?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">PF</span><span className="text-white">₹{slip.deductions?.pf?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Insurance</span><span className="text-white">₹{slip.deductions?.insurance?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-500">Other</span><span className="text-white">₹{slip.deductions?.other?.toLocaleString()}</span></div>
                        <div className="flex justify-between text-xs font-bold border-t border-slate-800 pt-1"><span className="text-slate-300">Total</span><span className="text-red-400">-₹{((slip.grossSalary || 0) - (slip.netSalary || 0))?.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {slip.status === 'Generated' && (role === 'admin' || role === 'manager') && (
                      <button onClick={(e) => handleMarkPaid(e, slip._id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all">
                        <FiCheckCircle className="w-4 h-4" /> Confirm Payout
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setSelectedPayslip(slip); handlePrint(); }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all">
                      <FiPrinter className="w-4 h-4" /> Download / Print Payslip
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
