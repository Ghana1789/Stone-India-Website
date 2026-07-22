import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiPieChart, FiBarChart2, FiTrendingUp, FiDownload, 
  FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiPlus
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export default function ClientReports() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Production');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/client/reports');
        if (res.data.success) {
          setReportData(res.data.data);
        }
      } catch (error) {
        toast.error('Failed to fetch reports data');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading || !reportData) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const productionData = {
    labels: reportData.production.labels,
    datasets: [
      {
        label: 'Batteries Produced',
        data: reportData.production.data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const qcStats = {
    labels: ['Pass', 'Fail', 'Review'],
    datasets: [
      {
        data: [reportData.qc.pass, reportData.qc.fail, reportData.qc.review],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0,
      }
    ]
  };

  const totalQC = reportData.qc.pass + reportData.qc.fail + reportData.qc.review;
  const passRate = totalQC > 0 ? ((reportData.qc.pass / totalQC) * 100).toFixed(1) : 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } }
    }
  };

  const handleDownload = (reportName) => {
    // Simulated CSV download using real or dummy data based on context
    const csvContent = "data:text/csv;charset=utf-8,Report Name,Date,Type,Size\n" + 
      "Monthly Production Summary - June 2026,Jul 4 2026,Production,2.4 MB\n" +
      "QC Audit Report: Batch Stone-EV-092,Jul 1 2026,Quality,1.1 MB";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${reportName} successfully!`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Intelligence & Reports</h1>
          <p className="text-slate-400 mt-1 font-medium">Production efficiency, quality metrics and historical data logs.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleDownload('Monthly_Summary_Export')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-sm font-bold border border-slate-700 hover:border-slate-500 transition-all"
          >
            <FiDownload className="w-4 h-4" /> Export All (CSV)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        {['Production', 'Quality Control', 'Billing History'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <FiTrendingUp className="w-32 h-32 text-emerald-500" />
          </div>
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-wider">Growth Analytics</h3>
                <p className="text-slate-400 text-sm mt-1">Total battery production throughput (units)</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                <FiPlus className="w-3 h-3" /> Real-time
              </div>
            </div>

            <div className="flex-1 min-h-[300px]">
              <Line data={productionData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Small Stat Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8"/>
            </div>
            <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest">Quality Pass Rate</h4>
            <div className="text-4xl font-black text-white italic mt-2">{passRate}%</div>
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${passRate}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-3 italic">Verified by Stone QC Engineering Dept.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-white font-bold text-sm uppercase">QC Distribution</h4>
               <FiPieChart className="text-slate-500" />
             </div>
             <div className="h-[120px]">
                {totalQC > 0 ? (
                  <Doughnut data={qcStats} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">No QC data available</div>
                )}
             </div>
             <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pass ({reportData.qc.pass})</div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Fail ({reportData.qc.fail})</div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Review ({reportData.qc.review})</div>
             </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-white font-black italic uppercase tracking-wider">Available Document Logs</h3>
          <FiFileText className="text-slate-500" />
        </div>
        <div className="divide-y divide-slate-800">
          {reportData.documents && reportData.documents.length > 0 ? (
            reportData.documents.map((report, idx) => (
              <div key={idx} className="px-8 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <FiFileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{report.title}</div>
                    <div className="text-slate-500 text-xs mt-1 font-medium">{new Date(report.createdAt).toLocaleDateString()} · {report.fileType || 'Document'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-slate-600 text-xs font-bold">{report.sizeBytes ? (report.sizeBytes / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</div>
                  <button 
                    onClick={() => {
                      if(report.fileUrl) window.open(report.fileUrl, '_blank');
                      else toast.error('No file URL associated');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-emerald-600 transition-all"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 italic">No document logs available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
