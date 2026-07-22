import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { FiTrendingUp, FiCpu, FiAlertTriangle, FiRefreshCw, FiZap, FiPackage, FiActivity } from 'react-icons/fi';

const PRIORITY_COLORS = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
};

const ICONS = {
  'trending-up': FiTrendingUp,
  'shield': FiCpu,
  'package': FiPackage,
  'tool': FiCpu,
  'truck': FiAlertTriangle,
  'zap': FiZap,
  'bar-chart': FiTrendingUp
};

export default function AiInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState({});
  const [warrantyPatterns, setWarrantyPatterns] = useState([]);
  const [incidentWatch, setIncidentWatch] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/ev/ai-insights');
      if (res.data.success) {
        setInsights(res.data.data.insights || []);
        setSummary(res.data.data.summary || {});
        setWarrantyPatterns(res.data.data.warrantyPatterns || []);
        setIncidentWatch(res.data.data.incidentWatch || []);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">AI Predictive Insights</h1>
          <p className="text-slate-400 text-sm">Real-time heuristics and anomaly detection on plant operations</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 border border-slate-700 self-start sm:self-center">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Insights
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <div className="bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center">
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total Insights</div>
          <div className="text-2xl font-black text-white mt-1">{summary.totalInsights || 0}</div>
        </div>
        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/10 text-center">
          <div className="text-red-400 text-[10px] font-black uppercase tracking-wider">Critical Priority</div>
          <div className="text-2xl font-black text-red-400 mt-1">{summary.critical || 0}</div>
        </div>
        <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/10 text-center">
          <div className="text-orange-400 text-[10px] font-black uppercase tracking-wider">High Priority</div>
          <div className="text-2xl font-black text-orange-400 mt-1">{summary.high || 0}</div>
        </div>
        <div className="bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/10 text-center">
          <div className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">Medium Priority</div>
          <div className="text-2xl font-black text-yellow-400 mt-1">{summary.medium || 0}</div>
        </div>
        <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/10 text-center col-span-2 md:col-span-1">
          <div className="text-blue-400 text-[10px] font-black uppercase tracking-wider">Low Priority</div>
          <div className="text-2xl font-black text-blue-400 mt-1">{summary.low || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Insights Stream */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
            <h2 className="text-lg font-bold text-white tracking-wide mb-6 flex items-center gap-2">
              <FiZap className="w-5 h-5 text-yellow-400 fill-yellow-400/20" /> Active Recommendations
            </h2>

            {loading ? (
              <div className="text-slate-500 text-center py-12 font-semibold">Generating recommendations...</div>
            ) : insights.length === 0 ? (
              <div className="text-slate-500 text-center py-12 font-semibold">
                No active anomalies or optimization recommendations. Plant is operating within normal parameters.
              </div>
            ) : (
              <div className="space-y-6">
                {insights.map((insight, idx) => {
                  const Icon = ICONS[insight.icon] || FiZap;
                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-300">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-sm tracking-wide">{insight.title}</h3>
                            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">{insight.category}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${PRIORITY_COLORS[insight.priority] || 'bg-slate-800 text-slate-300'}`}>
                          {insight.priority}
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed mb-4">{insight.recommendation}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5 text-[11px] font-semibold">
                        <div>
                          <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Est. Impact</span>
                          <span className="text-emerald-400 font-bold">{insight.estimatedImpact}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase tracking-wider text-[9px]">AI Confidence</span>
                          <span className="text-blue-400 font-bold">{insight.confidence}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase tracking-wider text-[9px]">Data Source</span>
                          <span className="text-slate-300 truncate block">{insight.dataSource}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          {/* Incidents Warning Watch */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
            <h2 className="text-md font-bold text-white tracking-wide mb-4">Critical Incident Watch</h2>
            {incidentWatch.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 font-semibold text-center">Zero open incidents</p>
            ) : (
              <div className="space-y-3">
                {incidentWatch.map((item, idx) => (
                  <div key={idx} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-slate-200 text-xs font-bold">{item.title}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{item.department}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-black">{item.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warranty Root Cause Analysis */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
            <h2 className="text-md font-bold text-white tracking-wide mb-4">Warranty Failure Patterns</h2>
            {warrantyPatterns.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 font-semibold text-center">No warranty claims data resolved yet</p>
            ) : (
              <div className="space-y-4">
                {warrantyPatterns.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300 truncate pr-2">{item._id}</span>
                      <span className="text-white">{item.count} claims</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-red-500 h-1.5 rounded-full" 
                        style={{ width: `${Math.min(100, (item.count / warrantyPatterns[0].count) * 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
