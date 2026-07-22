import { useState, useEffect, useRef } from 'react';
import { 
  FiSend, FiSmile, FiMoreHorizontal, FiPlus, 
  FiSearch, FiMessageSquare, FiUser, FiInfo
} from 'react-icons/fi';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import axios from '../../services/api';
import { toast } from 'react-hot-toast';

export default function EmployeeChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    // Join room (e.g., department room or global)
    socket.emit('join_room', 'stone-global');

    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on('receive_message', handleMessage);

    fetchMessages();

    return () => {
      socket.off('receive_message', handleMessage);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get('/chat/stone-global');
      setMessages(res.data.data);
    } catch (err) {
      toast.error('Failed to load chat history.');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      roomId: 'stone-global',
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role,
      text: newMessage,
      createdAt: new Date()
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
    
    // Server handles saving to DB in send_message handler
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row bg-[#13161e] border border-slate-800 rounded-[2.5rem] overflow-hidden animate-fade-in shadow-2xl">
      {/* Sidebar - Contacts */}
      <div className="w-full md:w-80 border-r border-slate-800 bg-slate-800/10 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-black text-white italic tracking-tight mb-4 flex items-center gap-2">
            <FiMessageSquare className="text-emerald-400" /> TEAM CHAT
          </h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-slate-500 text-sm" />
            <input 
              placeholder="Search conversations..."
              className="w-full bg-slate-800/50 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black italic">
                SI
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm">Stone India (Global)</div>
                <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  General Channel
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest px-4 pt-6 pb-2">Direct Messages</div>
          {[
            { name: 'Adbhut (Admin)', role: 'admin', active: true },
            { name: 'Sankalp (Manager)', role: 'manager', active: false },
          ].map((contact, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-800/50 cursor-pointer transition-all group">
              <div className="relative">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold group-hover:text-emerald-400 transition-colors">
                  {contact.name[0]}
                </div>
                {contact.active && <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-emerald-500 border-2 border-[#13161e] rounded-full"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-300 font-bold text-sm group-hover:text-white transition-colors">{contact.name}</div>
                <div className="text-[10px] text-slate-600 font-bold uppercase">{contact.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="px-8 py-4 border-b border-slate-800 flex items-center justify-between bg-white/5 backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-900/40">SI</div>
            <div>
              <div className="text-white font-black text-lg">Stone India Global Chat</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active now • 12 Team Members</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-white transition-colors"><FiSearch /></button>
            <button className="text-slate-500 hover:text-white transition-colors"><FiInfo /></button>
            <button className="text-slate-500 hover:text-white transition-colors"><FiMoreHorizontal /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {messages.map((msg, i) => {
            const isMe = msg.sender?._id === user._id;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-scale-in`}>
                <div className={`flex items-end gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 shadow-lg ${
                    msg.sender?.role === 'admin' ? 'bg-red-500 text-white' : 
                    msg.sender?.role === 'manager' ? 'bg-blue-500 text-white' : 
                    'bg-emerald-500 text-white'
                  }`}>
                    {msg.sender?.name?.[0]}
                  </div>
                  <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                      {msg.sender?.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-xl ${
                      isMe 
                        ? 'bg-emerald-500 text-white rounded-br-none' 
                        : 'bg-slate-800 text-white rounded-bl-none border border-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-slate-800 bg-[#13161e]">
          <form onSubmit={handleSend} className="relative group">
            <input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full bg-slate-800/40 border border-slate-800 text-white pl-6 pr-32 py-4 rounded-[1.5rem] focus:outline-none focus:border-emerald-500/50 transition-all font-medium text-sm shadow-inner"
            />
            <div className="absolute right-3 top-2.5 flex items-center gap-2">
              <button type="button" className="text-slate-500 hover:text-emerald-400 p-2 transform active:scale-90 transition-all">
                <FiSmile className="w-5 h-5" />
              </button>
              <button type="button" className="text-slate-500 hover:text-emerald-400 p-2 transform active:scale-90 transition-all">
                <FiPlus className="w-5 h-5" />
              </button>
              <button 
                type="submit"
                className="bg-emerald-500 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all ml-1"
              >
                <FiSend className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
          <div className="mt-3 text-center">
             <div className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Press Enter to send message</div>
          </div>
        </div>
      </div>
    </div>
  );
}
