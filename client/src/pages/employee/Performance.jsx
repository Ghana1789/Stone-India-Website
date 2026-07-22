import { useState, useEffect, useCallback } from 'react';
import socket from '../../services/socket';
import { 
  FiBarChart2, FiStar, FiClock, FiTarget, 
  FiTrendingUp, FiCheckCircle, FiEdit3, FiAward
} from 'react-icons/fi';
import axios from '../../services/api';
import { toast } from 'react-hot-toast';

export default function EmployeePerformance() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/employee/performance');
      setReviews(res.data.data);
    } catch (err) {
      toast.error('Failed to load performance reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();

    socket.on('performance_updated', (data) => {
      // If the update was for this employee, refresh
      if (data.employee?._id === undefined || data.employee?._id === user?._id) {
         fetchReviews();
         toast.success('Your performance review has been updated!');
      }
    });

    return () => {
      socket.off('performance_updated');
    };
  }, [fetchReviews]);

  const getRatingLabel = (score) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Role Model';
    if (score >= 70) return 'Star Performer';
    return 'Consistent';
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  const latestReview = reviews[0];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Performance Review</h1>
          <p className="text-slate-400 mt-1">Track your professional growth, feedback history, and periodic goals.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4">
            <FiAward className="text-orange-400 w-6 h-6" />
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Global Rank</div>
              <div className="text-white text-xs font-bold uppercase tracking-tight italic">Top 5% of Unit</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Performance Snapshot */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-[#1e2235] to-[#13161e] border border-slate-800 rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="relative">
                <div className="w-48 h-48 rounded-full border-[10px] border-emerald-500/10 flex items-center justify-center relative shadow-2xl shadow-emerald-900/40">
                  <div className="text-6xl font-black text-white italic tracking-tighter">{latestReview?.overallScore || 92}</div>
                  <div className="absolute bottom-[-10px] bg-emerald-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg border-2 border-[#13161e] uppercase tracking-widest">SCORE</div>
                </div>
                <div className="absolute inset-0 border-[10px] border-emerald-500 rounded-full border-t-transparent animate-spin-slow opacity-60"></div>
              </div>
              
              <div className="text-center md:text-left space-y-4">
                <h3 className="text-3xl font-black text-white italic tracking-tight uppercase leading-none">
                  {getRatingLabel(latestReview?.overallScore || 92)} <br/>
                  <span className="text-emerald-400 tracking-normal">Status Confirmed</span>
                </h3>
                <p className="text-slate-500 font-medium max-w-sm">"Your contribution to the recent Project Zeus was outstanding. Keep up the high level of technical ethics and teamwork."</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <div className="bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-slate-700">Reviewer: {latestReview?.reviewer?.name || 'Mr. Adbhut'}</div>
                  <div className="bg-slate-800/50 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-slate-700">Period: {latestReview?.reviewPeriod || 'Q3 2026'}</div>
                </div>
              </div>
            </div>
            <FiTrendingUp className="absolute right-[-5%] top-[-5%] w-64 h-64 text-white/5 -rotate-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8">
              <h4 className="text-white font-black text-[10px] uppercase tracking-widest mb-8 italic flex items-center gap-2 text-slate-500">
                <FiTarget className="text-emerald-500" /> Key Competencies
              </h4>
              <div className="space-y-6">
                {[
                  { label: 'Technical Quality', score: latestReview?.overallScore || 85 },
                  { label: 'Production Speed', score: latestReview?.overallScore ? latestReview.overallScore - 5 : 80 },
                  { label: 'Team Collaboration', score: 92 },
                  { label: 'Safety Compliance', score: 100 },
                ].map((s, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-500 capitalize">{s.label}</span>
                      <span className="text-white italic">{s.score}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000" 
                        style={{ width: `${s.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#13161e] border border-slate-800 rounded-3xl p-8">
              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-8 italic flex items-center gap-2">
                <FiEdit3 className="text-blue-500" /> Career Goals (2026)
              </h4>
              <div className="space-y-4">
                {[
                  'Master Advanced Li-ion Logistics',
                  'Mentor 2 Junior Supervisors',
                  'Reduce QC Reject Rate by 15%',
                ].map((goal, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-800 group hover:border-emerald-500/30 transition-all">
                    <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-300 leading-relaxed">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Review History Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#13161e] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
            <div className="px-8 py-6 border-b border-slate-800 bg-slate-800/10">
              <h3 className="text-white font-bold uppercase text-xs tracking-widest text-slate-400">Review Timeline</h3>
            </div>
            <div className="flex-1 divide-y divide-slate-800/50">
              {reviews.map((rev, idx) => (
                <div key={idx} className="p-8 hover:bg-slate-800/20 transition-all relative group cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-emerald-500 font-black text-sm tracking-tighter italic">{rev.reviewPeriod}</div>
                    <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{rev.overallScore}%</div>
                  </div>
                  <h5 className="text-white font-bold text-sm mb-1 leading-tight group-hover:text-emerald-400 transition-colors">Periodic Assessment</h5>
                  <p className="text-slate-500 text-xs font-medium line-clamp-2 italic">Submitted by {rev.reviewer?.name || 'Unit Manager'}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="p-16 text-center">
                  <FiBarChart2 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">No review history found</div>
                </div>
              )}
            </div>
            <div className="p-8 border-t border-slate-800">
              <button className="w-full bg-slate-800 text-slate-400 font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all shadow-xl">
                DOWNLOAD FULL HISTORY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
