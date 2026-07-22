import { useState, useEffect } from 'react';
import { 
  FiDollarSign, FiDownload, FiFileText, FiTrendingUp, 
  FiShield, FiArrowRight, FiInfo
} from 'react-icons/fi';
import axios from '../../services/api';
import { toast } from 'react-hot-toast';

export default function EmployeePayslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      const res = await axios.get('/employee/payslips');
      setPayslips(res.data.data);
    } catch (err) {
      toast.error('Failed to load payslips.');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-black text-white italic tracking-tight">PAYSLIPS & SALARY</h1>
          <p className="text-slate-400 mt-1">Access your monthly compensation records and tax documents.</p>
        </div>
        <div className="bg-[#13161e] border border-slate-800 rounded-2xl px-6 py-3 flex items-center gap-4">
          <FiShield className="text-emerald-500 w-5 h-5" />
          <div className="text-left">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Secure Access</div>
            <div className="text-white text-xs font-bold">Encrypted Documents</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latest Payslip Highlight */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-900/40 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">Latest Compensation</h3>
              <div className="text-4xl font-black mb-1">₹ {payslips[0]?.netSalary?.toLocaleString() || '---'}</div>
              <div className="text-sm font-medium text-indigo-100 mb-8 opacity-80">{payslips[0]?.month || 'Last Paid Period'}</div>
              
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2">
                  <span className="opacity-60">Gross Earnings</span>
                  <span>₹ {payslips[0]?.grossSalary?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2">
                  <span className="opacity-60">Total Deductions</span>
                  <span className="text-red-300">- ₹ {((payslips[0]?.grossSalary || 0) - (payslips[0]?.netSalary || 0)).toLocaleString()}</span>
                </div>
              </div>

              <button className="w-full bg-white text-indigo-600 font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 uppercase text-xs tracking-widest">
                <FiDownload className="w-4 h-4" /> Download Latest Slips
              </button>
            </div>
            <FiDollarSign className="absolute right-[-10%] bottom-[-10%] w-48 h-48 text-white/10 -rotate-12" />
          </div>

          <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 uppercase text-[10px] tracking-widest text-slate-500">
              <FiInfo className="text-emerald-500" /> Salary Components
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Basic Salary', percent: 50 },
                { label: 'HRA', percent: 20 },
                { label: 'Special Allowance', percent: 20 },
                { label: 'Tax & PF', percent: 10, variant: 'red' },
              ].map((comp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400 capitalize">{comp.label}</span>
                    <span className="text-slate-200">{comp.percent}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${comp.variant === 'red' ? 'bg-red-500/50' : 'bg-emerald-500/50'} rounded-full`} style={{ width: `${comp.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Previous Payslips List */}
        <div className="lg:col-span-2">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/10">
              <h3 className="text-white font-bold uppercase text-xs tracking-widest text-slate-400">Salary History</h3>
              <FiTrendingUp className="text-emerald-500" />
            </div>
            <div className="divide-y divide-slate-800/50">
              {payslips.map((slip, idx) => (
                <div key={idx} className="px-8 py-6 flex items-center justify-between hover:bg-slate-800/20 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                      <FiFileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-white font-bold group-hover:text-emerald-400 transition-colors">{slip.month}</div>
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Payment Date: {slip.paymentDate ? new Date(slip.paymentDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-8">
                    <div className="hidden sm:block text-right">
                      <div className="text-white font-black">₹ {slip.netSalary?.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{slip.status}</div>
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500 transition-all">
                      <FiDownload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {payslips.length === 0 && (
                <div className="p-16 text-center">
                  <FiDollarSign className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">No payslips available yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
