import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { FiMessageSquare, FiPlus, FiAlertCircle, FiSend } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function ClientTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState(null);
  
  // New ticket state
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  
  // Reply state
  const [replyMsg, setReplyMsg] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = () => {
    api.get('/client/tickets')
      .then(r => setTickets(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/client/tickets', { subject: newSubject, description: newDesc, priority: newPriority });
      setTickets([res.data.data, ...tickets]);
      setIsCreating(false);
      setNewSubject(''); setNewDesc('');
    } catch (err) {
      alert('Failed to create ticket');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMsg.trim() || !activeTicket) return;
    try {
      const res = await api.post(`/client/tickets/${activeTicket._id}/reply`, { message: replyMsg });
      setActiveTicket(res.data.data);
      setTickets(tickets.map(t => t._id === activeTicket._id ? res.data.data : t));
      setReplyMsg('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)] animate-fade-in font-sans">
      
      {/* Left List */}
      <div className="w-full lg:w-1/3 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-white font-bold">Support Tickets</h2>
          <button 
            onClick={() => { setIsCreating(true); setActiveTicket(null); }}
            className="p-2 bg-brand-500/20 text-brand-400 rounded-lg hover:bg-brand-500 hover:text-white transition-colors"
          >
            <FiPlus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {tickets.length === 0 ? (
            <div className="text-slate-500 text-sm text-center py-10">No tickets found.</div>
          ) : (
            tickets.map(t => (
              <button 
                key={t._id} 
                onClick={() => { setActiveTicket(t); setIsCreating(false); }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeTicket?._id === t._id 
                    ? 'bg-slate-800 border-brand-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                    : 'bg-slate-900 border-transparent hover:bg-slate-800/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-white text-sm font-bold truncate pr-2">{t.subject}</span>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${t.status === 'Open' ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-slate-600 text-slate-400 bg-slate-800/50'}`}>{t.status}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-xs">
                  <span>{t.ticketNumber}</span>
                  <span>{format(new Date(t.createdAt), 'MMM d')}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right View */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col overflow-hidden relative">
        {isCreating ? (
          <div className="p-8 max-w-2xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Raise New Ticket</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2">Subject</label>
                <input required value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none" placeholder="Brief issue summary" />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2">Description</label>
                <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} rows="5" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none" placeholder="Describe your issue in detail..." />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2">Priority</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-brand-500 focus:outline-none">
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold transition-colors">Submit Ticket</button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        ) : activeTicket ? (
          <>
            <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur shrink-0">
              <h2 className="text-xl font-bold text-white mb-1">{activeTicket.subject}</h2>
              <div className="text-slate-400 text-sm flex gap-3">
                <span>{activeTicket.ticketNumber}</span>
                <span>•</span>
                <span className={activeTicket.priority === 'High' ? 'text-red-400' : 'text-yellow-400'}>{activeTicket.priority} Priority</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTicket.messages.map((m, i) => {
                const isMine = m.senderRole === 'client';
                return (
                  <div key={i} className={`flex gap-4 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isMine ? 'bg-brand-500 text-slate-900' : 'bg-slate-700 text-white'}`}>
                      {m.senderName.charAt(0)}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${isMine ? 'bg-brand-500/10 border border-brand-500/20 text-white rounded-tr-none' : 'bg-slate-800 border-transparent text-slate-200 rounded-tl-none'}`}>
                      <div className="text-xs text-slate-500 font-medium mb-1.5 flex justify-between">
                        <span>{m.senderName}</span>
                        <span className="ml-4">{format(new Date(m.createdAt), 'h:mm a, d MMM')}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
              <form onSubmit={handleReply} className="flex gap-3">
                <input 
                  value={replyMsg}
                  onChange={e => setReplyMsg(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button type="submit" disabled={!replyMsg.trim()} className="px-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-bold">
                  Send <FiSend className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
            <FiMessageSquare className="w-16 h-16 opacity-20 mb-4" />
            <p>Select a ticket or raise a new one.</p>
          </div>
        )}
      </div>

    </div>
  );
}
