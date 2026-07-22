import { useState, useEffect, useCallback } from 'react';
import {
  FiCheckSquare, FiClock, FiCalendar, FiDollarSign, FiRefreshCw,
  FiActivity, FiArrowRight, FiTrendingUp, FiZap, FiUser,
  FiAlertTriangle, FiCheckCircle, FiShield, FiMessageSquare, FiSend,
  FiFileText, FiAward, FiMessageCircle, FiTrendingDown, FiCommand, FiGrid,
  FiCamera, FiVideo, FiMic
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from '../../services/api';
import socket from '../../services/socket';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockedIn, setClockedIn] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [quickMsg, setQuickMsg] = useState('');
  
  // Real-Time IoT Machine & Production counters
  const [liveMetrics, setLiveMetrics] = useState({
    oee: 84.6,
    throughput: 132,
    defectRatePct: 0.72,
    producedToday: 1840,
    machineHealth: 92
  });

  // Industry 4.0 Interactive Demos
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [showVoiceAssis, setShowVoiceAssis] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // SOP / Digital Work Instructions Modal
  const [activeSOP, setActiveSOP] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        axios.get('/employee/dashboard'),
        axios.get('/employee/issues'),
        axios.get('/employee/timesheets'),
      ]);
      
      const [dashRes, issueRes, tsRes] = results;
      
      if (dashRes.status === 'fulfilled' && dashRes.value?.data?.success) {
        setStats(dashRes.value.data.data);
      }
      
      if (issueRes.status === 'fulfilled' && issueRes.value?.data?.success) {
        setIssues(issueRes.value.data.data?.slice(0, 3) || []);
      }
      
      if (tsRes.status === 'fulfilled' && tsRes.value?.data?.success) {
        const timesheets = tsRes.value.data.data;
        if (Array.isArray(timesheets) && timesheets.length > 0) {
          const today = new Date().setHours(0,0,0,0);
          const lastTs = timesheets[0];
          if (lastTs && new Date(lastTs.date).setHours(0,0,0,0) === today && !lastTs.clockOut) {
            setClockedIn(true);
          }
        }
      }

      // Fetch recent team chat messages
      try {
        const chatRes = await axios.get('/chat/stone-global');
        if (chatRes.data.success) {
          setChatMessages(chatRes.data.data.slice(-4));
        }
      } catch (err) {
        console.error('Chat Load Error:', err);
      }
    } catch (err) {
      console.error('Dashboard Load Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Listen to live machine / factory streams
    socket.on('factory_metrics', (d) => {
      setLiveMetrics(prev => ({
        ...prev,
        oee: d.oee || prev.oee,
        throughput: d.throughput || prev.throughput
      }));
    });

    socket.on('production_counters', (d) => {
      setLiveMetrics(prev => ({
        ...prev,
        producedToday: d.cellsProducedToday || prev.producedToday
      }));
    });

    socket.on('quality_live', (d) => {
      setLiveMetrics(prev => ({
        ...prev,
        defectRatePct: d.defectRatePct || prev.defectRatePct
      }));
    });

    socket.on('machine_status', (d) => {
      if (d.machines && d.machines.length > 0) {
        const avgH = d.machines.reduce((acc, m) => acc + m.health, 0) / d.machines.length;
        setLiveMetrics(prev => ({
          ...prev,
          machineHealth: Math.round(avgH)
        }));
      }
    });

    socket.emit('join_room', 'stone-global');
    socket.on('receive_message', (data) => {
      if (data.roomId === 'stone-global') {
        setChatMessages(prev => [...prev.slice(-3), data]);
      }
    });

    return () => {
      socket.off('factory_metrics');
      socket.off('production_counters');
      socket.off('quality_live');
      socket.off('machine_status');
      socket.off('receive_message');
    };
  }, [fetchStats]);

  const handleAttendance = async () => {
    try {
      if (!clockedIn) {
        await axios.post('/employee/timesheets/clock-in');
        setClockedIn(true);
        toast.success('Successfully Clocked In via Geofence Portal.', { icon: '🟢' });
      } else {
        await axios.put('/employee/timesheets/clock-out');
        setClockedIn(false);
        toast.success('Clocked out. Shift targets registered.', { icon: '🛑' });
      }
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Attendance status failed.');
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!quickMsg.trim()) return;

    socket.emit('send_message', {
      roomId: 'stone-global',
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role,
      text: quickMsg,
      time: new Date()
    });
    setQuickMsg('');
  };

  // Mock scan handler
  const triggerScan = (code) => {
    setScanResult(code);
    toast.success(`Scanned asset metadata successfully retrieved for: ${code}`, { icon: '🔍' });
  };

  // Mock Voice Command recognition
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    
    setIsListening(true);
    setVoiceInput('Listening for instructions...');
    
    setTimeout(() => {
      setVoiceInput('Report machine welding station vibration alarm');
      setIsListening(false);
      toast.success('Voice log created: Escalation dispatched to floor lead.', { icon: '🗣️' });
    }, 3000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      
      {/* Welcome Header inspired by BYD / CATL Factory Dashboard */}
      <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nexus-MES Floor Console</span>
            </div>
            <h1 className="text-3xl font-black text-white italic tracking-wide">
              {user?.name || 'Operator'}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              ID: <span className="font-mono text-white font-bold">{user?.employeeId || 'EMP-2026'}</span> · Dept: <span className="text-white font-bold">{user?.department || 'Cell Manufacturing'}</span> · Current Shift: <span className="text-white font-bold">{user?.shift || 'Morning (06:00 - 14:00)'}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleAttendance} className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
              clockedIn ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/25' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
            }`}>
              {clockedIn ? '⏹ Clock Out' : '▶ Clock In'}
            </button>
            <button onClick={() => setShowQRScanner(true)} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-slate-700">
              📸 Scan QR / Barcode
            </button>
          </div>
        </div>
        
        {/* Glow */}
        <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
      </div>

      {/* Production KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'OEE Score', value: `${liveMetrics.oee}%`, icon: FiActivity, color: '#3b82f6', subtitle: 'Target: 85%' },
          { label: 'Cell Throughput', value: `${liveMetrics.producedToday} cells`, icon: FiZap, color: '#f59e0b', subtitle: 'Live Shift Counter' },
          { label: 'Defect Rate', value: `${liveMetrics.defectRatePct}%`, icon: FiAlertTriangle, color: '#ef4444', subtitle: 'Limit: 1.5%' },
          { label: 'Equipment Health', value: `${liveMetrics.machineHealth}%`, icon: FiGrid, color: '#10b981', subtitle: '8 Automated Assets' },
          { label: 'Timesheet Hours', value: clockedIn ? 'Active' : 'Offline', icon: FiClock, color: '#8b5cf6', subtitle: '14-Day Shift Sync' }
        ].map((card, idx) => (
          <div key={idx} className="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="flex items-center gap-2 text-slate-500">
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-[10px] font-black uppercase tracking-wider">{card.label}</span>
            </div>
            <div className="text-2xl font-black text-white mt-2 tracking-wide italic">{card.value}</div>
            <div className="text-[10px] text-slate-500 mt-1 font-semibold">{card.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Hand: Assigned Tasks & Quality Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Shift Tasks */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white tracking-wide">Assigned Shift Tasks</h2>
              <Link to="/employee/tasks" className="text-xs font-bold text-emerald-400 hover:text-emerald-300">View Board →</Link>
            </div>

            <div className="space-y-3">
              {stats?.recentTasks?.slice(0, 3).map((task, idx) => (
                <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      task.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {task.priority ? task.priority[0] : 'P'}
                    </div>
                    <div>
                      <h4 className="text-white text-xs font-bold">{task.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Today'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveSOP(task)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold transition-all"
                    >
                      Instructions
                    </button>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400">{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality & Machine Inspections */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
            <h2 className="text-lg font-bold text-white tracking-wide mb-4">Inspection Checklists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white">Anode Coating Integrity</span>
                  <span className="text-[10px] font-black text-yellow-400 uppercase">Daily</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">Inspect coater knives and rollers for contamination and dry spots.</p>
                <button onClick={() => toast.success('Inspection Form opened in MES mode.', { icon: '📝' })} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">Start Inspection</button>
              </div>

              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white">BMS Diagnostic Calibration</span>
                  <span className="text-[10px] font-black text-red-400 uppercase">Critical</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-4">Check multi-meter verification records on high-voltage test racks.</p>
                <button onClick={() => toast.success('Calibration Form loaded.', { icon: '🛠️' })} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all">Start Calibration</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Safety Alerts, Communication & Live Tools */}
        <div className="space-y-6">
          
          {/* Action Center */}
          <div className="bg-gradient-to-br from-red-900/20 to-slate-900/40 border border-red-500/20 p-6 rounded-3xl">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <FiAlertTriangle className="text-red-400" /> Active Safety Center
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Wear Class-3 ESD PPE. Elevated vibration alerts detected on Winding Machine #1.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowVoiceAssis(true)} className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                <FiMic className="w-3.5 h-3.5" /> Voice Escalation
              </button>
            </div>
          </div>

          {/* Real-time Team Messenger Feed */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <FiMessageSquare className="text-emerald-400" /> Plant Messaging Feed
              </h3>
              <Link to="/employee/chat" className="text-[10px] font-bold text-slate-500 hover:text-emerald-400">Open</Link>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto mb-4 custom-scrollbar pr-1">
              {chatMessages.length > 0 ? chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.senderId === user._id ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[90%] p-3 rounded-2xl text-[11px] ${
                    msg.senderId === user._id 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-tr-none' 
                      : 'bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700/50'
                  }`}>
                    {msg.senderId !== user._id && <div className="text-[9px] font-black text-slate-500 mb-1">{msg.senderName}</div>}
                    {msg.text || msg.content}
                  </div>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">No active chat feeds</div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="relative">
              <input 
                value={quickMsg}
                onChange={e => setQuickMsg(e.target.value)}
                placeholder="Broadcast to floor..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-emerald-500/40"
              />
              <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300">
                <FiSend className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Dashboard Page Navigation Links */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiGrid className="text-emerald-400" /> Modular Portals
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Schedule', to: '/employee/schedule', icon: FiCalendar },
                { label: 'Expenses', to: '/employee/expenses', icon: FiDollarSign },
                { label: 'Timesheet', to: '/employee/timesheet', icon: FiClock },
                { label: 'Training', to: '/employee/training', icon: FiCheckCircle },
                { label: 'Safety Log', to: '/employee/issues', icon: FiShield },
                { label: 'Profile', to: '/employee/profile', icon: FiUser }
              ].map((link, idx) => (
                <Link key={idx} to={link.to} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 hover:bg-slate-800/40 transition-all">
                  <link.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] text-slate-300 font-bold mt-1 text-center truncate w-full">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* QR Code Scanner Overlay Simulator */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0f1a] border border-slate-700 rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm tracking-wide">MES Asset Scanner</h3>
              <button onClick={() => setShowQRScanner(false)} className="text-slate-400 hover:text-white text-sm">Close</button>
            </div>
            
            <div className="aspect-video bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <FiCamera className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-500">Scanning for floor plates, tags, or batteries...</p>
              
              {/* Scan simulation overlay */}
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-500 animate-bounce" />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => triggerScan('Machine Winding Station (M-003)')} className="p-2.5 bg-slate-800 text-[10px] font-black uppercase text-white rounded-lg hover:bg-slate-700">Simulate M-003 Scan</button>
              <button onClick={() => triggerScan('Battery Pack Batch (BP-2026-X1)')} className="p-2.5 bg-slate-800 text-[10px] font-black uppercase text-white rounded-lg hover:bg-slate-700">Simulate Pack Scan</button>
            </div>

            {scanResult && (
              <div className="mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 block uppercase font-black">Scan Result</span>
                <span className="text-xs font-bold text-emerald-400">{scanResult}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Assistant Escalate Simulator */}
      {showVoiceAssis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0f1a] border border-slate-700 rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-sm tracking-wide">Hands-Free voice Reporting</h3>
              <button onClick={() => { setShowVoiceAssis(false); setIsListening(false); }} className="text-slate-400 hover:text-white text-sm">Close</button>
            </div>

            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
              <div onClick={toggleListening} className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
              }`}>
                <FiMic className="w-5 h-5" />
              </div>
              
              <p className="text-xs text-slate-400 font-bold">{isListening ? 'System listening...' : 'Click mic to report machine errors or safety anomalies'}</p>
            </div>

            {voiceInput && (
              <div className="mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase font-black">Transcribed Voice Text</span>
                <p className="text-xs font-bold text-white italic mt-1">"{voiceInput}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOP Work instructions Modal */}
      {activeSOP && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0f1a] border border-slate-700 rounded-3xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-white font-bold text-sm tracking-wide">{activeSOP.title}</h3>
                <span className="text-[10px] font-black uppercase text-slate-500">Digital SOP / Instructions</span>
              </div>
              <button onClick={() => setActiveSOP(null)} className="text-slate-400 hover:text-white text-sm">Close</button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 max-h-[300px] overflow-y-auto pr-1">
              <div className="p-3 bg-red-500/10 border border-red-500/15 text-red-400 rounded-xl font-bold flex items-center gap-2">
                <FiShield className="shrink-0 w-4 h-4" /> ESD Protection & High-Voltage safety gloves are mandatory.
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs">Step 1: Calibration Check</h4>
                <p className="text-[11px] text-slate-400">Scan coater head QR code to confirm last calibration timestamp is within 8 hours.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs">Step 2: Clean Contamination</h4>
                <p className="text-[11px] text-slate-400">Wipe roller contact plates with isopropyl alcohol (IPA) and inspect coater nozzle pressure.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs">Step 3: Document Upload</h4>
                <p className="text-[11px] text-slate-400">Capture coater alignment photo and submit as evidence inside the task dashboard.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <button onClick={() => { setActiveSOP(null); toast.success('Completed SOP checklist logged.', { icon: '✅' }); }} className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all">Mark Instruction Read</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
