import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiFolder, FiCreditCard, FiMessageSquare, FiFileText, FiArrowRight, FiActivity, FiPackage, FiLayers, FiBox, FiTruck, FiCheckCircle, FiZap, FiShield, FiGrid, FiPieChart, FiCalendar, FiCamera, FiHeadphones } from 'react-icons/fi';
import { format } from 'date-fns';

const ADVANCED_FEATURES = [
  { icon: FiShield, label: 'Warranty & Claims', desc: 'Track battery health & RMAs', to: '/client/warranty', iconBg: '#f97316' },
  { icon: FiGrid, label: 'Product Catalogue', desc: 'Explore and order new packs', to: '/client/catalogue', iconBg: '#3b82f6' },
  { icon: FiPieChart, label: 'Advanced Analytics', desc: 'Performance & dispatch reports', to: '/client/reports', iconBg: '#8b5cf6' },
  { icon: FiCalendar, label: 'Delivery Scheduler', desc: 'Manage dispatch locations', to: '/client/scheduler', iconBg: '#10b981' },
  { icon: FiCamera, label: 'Live Factory Feed', desc: 'Real-time assembly visibility', to: '/client/process-tracker', iconBg: '#ef4444' },
  { icon: FiHeadphones, label: 'Priority Support', desc: 'Direct escalation to engineers', to: '/client/tickets', iconBg: '#f59e0b' },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const formatLakhs = (amount) => {
    if (!amount) return '0';
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  const projectStatusStyles = {
    'In progress': 'bg-blue-500/20 text-blue-400',
    'On track': 'bg-green-500/20 text-green-400',
    'Review': 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10 font-sans">
      
      {/* Header Info */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-slate-400 text-sm">{user?.company || 'Stone India Pvt. Ltd. - Client account'}</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold mb-3">Active projects</div>
          <div className="text-white text-3xl font-black tracking-tight mb-2">{data?.activeProjects || 0}</div>
          <div className="text-green-400 text-xs font-medium">2 on schedule</div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold mb-3">Pending invoices</div>
          <div className="text-white text-3xl font-black tracking-tight mb-2">{formatLakhs(data?.pendingInvoicesAmount)}</div>
          <div className="text-yellow-500 text-xs font-medium">Due in 7 days</div>
        </div>

        {/* Open Tickets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold mb-3">Open tickets</div>
          <div className="text-white text-3xl font-black tracking-tight mb-2">{data?.openTickets || 0}</div>
          <div className="text-slate-400 text-xs font-medium">1 awaiting reply</div>
        </div>

        {/* Documents */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-semibold mb-3">Documents</div>
          <div className="text-white text-3xl font-black tracking-tight mb-2">{data?.documentsCount || 0}</div>
          <div className="text-slate-400 text-xs font-medium">3 new this week</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (My Projects) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-white font-bold mb-6">My projects</h2>
            
            <div className="space-y-6">
              {data?.recentProjects?.length > 0 ? data.recentProjects.map((proj, idx) => (
                <div key={proj._id} className="group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-bold text-sm mb-1">{proj.title}</div>
                      <div className="text-slate-500 text-xs">{proj.assignedTeam} - Due {format(new Date(proj.dueDate), 'dd MMM')}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${projectStatusStyles[proj.status] || 'bg-slate-800 text-slate-400'}`}>
                      {proj.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400 text-xs w-8">{proj.progressPercentage}%</div>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                           proj.status === 'Review' ? 'bg-orange-500' : 
                           proj.status === 'On track' ? 'bg-green-500' : 'bg-blue-500'
                        }`} 
                        style={{ width: `${proj.progressPercentage}%` }} 
                      />
                    </div>
                  </div>
                  {idx < data.recentProjects.length - 1 && <div className="h-px bg-slate-800/50 mt-6" />}
                </div>
              )) : (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <FiFolder className="w-8 h-8 opacity-20 mx-auto mb-2" />
                  No active projects found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Invoices & Tickets) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Recent Invoices */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-white font-bold mb-6">Recent invoices</h2>
            
            <div className="space-y-4 mb-6">
              {data?.recentInvoices?.length > 0 ? data.recentInvoices.map((inv) => (
                <div key={inv._id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-700/50">
                  <div>
                    <div className="text-white font-bold text-sm mb-1">{inv.invoiceNumber} - {inv.projectTitle}</div>
                    <div className="text-slate-500 text-xs">Issued {format(new Date(inv.issueDate), 'd MMM')}</div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-white font-bold text-sm">₹{inv.amount.toLocaleString()}</div>
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inv.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-slate-500 text-sm">No recent invoices.</div>
              )}
            </div>
            
            <Link to="/client/invoices" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition-colors">
              View all invoices <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Support Tickets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-white font-bold mb-6">Support tickets</h2>
            
            <div className="space-y-4 mb-6">
              {data?.recentTickets?.length > 0 ? data.recentTickets.map(ticket => (
                <div key={ticket._id} className="flex gap-4">
                  <div className="shrink-0 pt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${ticket.status === 'Open' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-slate-600 text-slate-400 bg-slate-800'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold mb-1">{ticket.subject}</div>
                    <div className="text-slate-500 text-[11px]">Ticket {ticket.ticketNumber} - {format(new Date(ticket.createdAt), 'h a, d MMM')}</div>
                  </div>
                </div>
              )) : (
                <div className="text-slate-500 text-sm">No open support tickets.</div>
              )}
            </div>

            <div className="flex gap-3">
              <Link to="/client/tickets" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition-colors">
                Raise new ticket <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link to="/client/tickets" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent text-slate-400 hover:text-white text-xs font-semibold transition-colors">
                View all tickets <FiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Manufacturing Stage Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg mt-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold">Production Status</h2>
          <Link to="/client/process-tracker" className="text-blue-400 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all">
            Full tracker <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {/* Pipeline Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {[
            { name: 'Raw\nMaterials', icon: FiBox, done: true },
            { name: 'Mixing', icon: FiActivity, done: true },
            { name: 'Coating', icon: FiLayers, done: true },
            { name: 'Drying', icon: FiZap, done: true },
            { name: 'Assembly', icon: FiLayers, done: true },
            { name: 'Testing', icon: FiCheckCircle, current: true, done: false },
            { name: 'Packaging', icon: FiPackage, done: false },
            { name: 'Delivery', icon: FiTruck, done: false },
          ].map((stage, idx, arr) => (
            <div key={stage.name} className="flex items-center flex-shrink-0">
              <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[64px] transition-all ${
                stage.done ? 'bg-emerald-500/10 border border-emerald-500/30' :
                stage.current ? 'bg-yellow-500/10 border border-yellow-500/30' :
                'bg-slate-800/30 border border-slate-800'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  stage.done ? 'bg-emerald-500/20' : stage.current ? 'bg-yellow-500/20' : 'bg-slate-800'
                }`}>
                  {stage.done
                    ? <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    : <stage.icon className={`w-3.5 h-3.5 ${stage.current ? 'text-yellow-400' : 'text-slate-600'}`} />
                  }
                </div>
                <span className={`text-[8px] font-bold uppercase text-center leading-tight whitespace-pre-line ${
                  stage.done ? 'text-emerald-400' : stage.current ? 'text-yellow-400' : 'text-slate-600'
                }`}>{stage.name}</span>
                {stage.current && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
              </div>
              {idx < arr.length - 1 && (
                <div className={`w-3 h-px mx-0.5 ${stage.done ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-500 uppercase tracking-widest">Overall Progress</span>
            <span className="text-white">63%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-yellow-400 rounded-full" style={{ width: '63%' }} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-2">
            <p className="text-slate-500 text-xs italic">🟡 Currently in <strong className="text-yellow-400 uppercase">Testing</strong> stage · Avg. cycle time 3 days remaining</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Live Updates Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Schedule Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-12 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
            <div>
              <h2 className="text-white font-bold">Upcoming Delivery Schedule</h2>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Real-time logistics & dispatch monitoring</p>
            </div>
            <FiTruck className="text-brand-400 w-5 h-5" />
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/40 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">Order / Batch</th>
                    <th className="px-6 py-4">Product Specification</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Current Warehouse</th>
                    <th className="px-6 py-4">Est. Delivery</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {[
                    { id: '#ORD-9281', prod: 'StonePack 48V 30Ah (GEN-2)', qty: '40 Units', loc: 'Pune Central Hub', date: 'Jul 18, 2026', status: 'In Transit', stColor: 'text-blue-400' },
                    { id: '#ORD-9304', prod: 'Lithium-Ion Custom Module', qty: '12 Units', loc: 'Manufacturing Floor', date: 'Jul 24, 2026', status: 'Processing', stColor: 'text-yellow-400' },
                    { id: '#BCH-0722', prod: 'V-BMS Control Units', qty: '100 Units', loc: 'Ready for Dispatch', date: 'Jul 15, 2026', status: 'Awaiting Pickup', stColor: 'text-emerald-400' },
                  ].map((item, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 text-white font-bold text-sm">{item.id}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm font-medium">{item.prod}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{item.qty}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs italic">{item.loc}</td>
                      <td className="px-6 py-4 text-white font-bold text-sm italic">{item.date}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.stColor}`}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Capabilities */}
      <div className="mt-8">
        <div className="mb-5">
          <h2 className="text-xl font-black italic uppercase text-white tracking-tight">Advanced Capabilities</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Premium tools for enterprise clients</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {ADVANCED_FEATURES.map(f => (
            <Link
              key={f.to}
              to={f.to}
              className="group flex flex-col gap-5 p-6 rounded-3xl border border-slate-800 bg-[#13161e] hover:border-brand-500/30 hover:-translate-y-2 transition-all shadow-xl"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform" style={{ backgroundColor: f.iconBg + '15', border: `1px solid ${f.iconBg}30` }}>
                <f.icon className="w-5 h-5" style={{ color: f.iconBg }} />
              </div>
              <div>
                <div className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-brand-400 transition-colors">{f.label}</div>
                <div className="text-slate-500 text-[9px] font-bold mt-1.5 uppercase leading-tight tracking-widest">{f.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Features Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg mt-6">
        <h2 className="text-white font-bold mb-6">All client features</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Production tracker', desc: 'Real-time manufacturing stage tracking', icon: FiLayers, color: 'text-yellow-400', bg: 'bg-yellow-500/20', to: '/client/process-tracker' },
            { title: 'Project tracking', desc: 'Live progress, milestones, deadlines', icon: FiActivity, color: 'text-blue-400', bg: 'bg-blue-500/20', to: '/client/projects' },
            { title: 'Invoices & payments', desc: 'View, download, pay via Razorpay', icon: FiCreditCard, color: 'text-green-400', bg: 'bg-green-500/20', to: '/client/invoices' },
            { title: 'Support tickets', desc: 'Raise, track, resolve issues', icon: FiMessageSquare, color: 'text-rose-400', bg: 'bg-rose-500/20', to: '/client/tickets' },
            { title: 'Documents', desc: 'Upload, download, share files', icon: FiFolder, color: 'text-purple-400', bg: 'bg-purple-500/20', to: '/client/documents' },
            { title: 'Live chat', desc: 'Real-time chat with project team', icon: FiMessageSquare, color: 'text-orange-400', bg: 'bg-orange-500/20', to: '/client/support' },
            { title: 'Order tracking', desc: 'View test batches for your orders', icon: FiActivity, color: 'text-cyan-400', bg: 'bg-cyan-500/20', to: '/client/orders' },
            { title: 'Delivery status', desc: 'Real-time dispatch & tracking', icon: FiTruck, color: 'text-emerald-400', bg: 'bg-emerald-500/20', to: '/client/orders' },
          ].map(feat => (
            <Link key={feat.title} to={feat.to} className="flex flex-col p-5 rounded-2xl bg-slate-950/50 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
              <div className={`w-8 h-8 rounded mb-4 flex items-center justify-center ${feat.bg}`}>
                <feat.icon className={`w-4 h-4 ${feat.color}`} />
              </div>
              <div className="text-white text-sm font-bold mb-1">{feat.title}</div>
              <div className="text-slate-500 text-xs leading-relaxed">{feat.desc}</div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
