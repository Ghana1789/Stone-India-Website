import { useState, useEffect, useRef } from 'react';
import { FiMessageSquare, FiX, FiSend, FiZap, FiUser } from 'react-icons/fi';
import socket from '../services/socket';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const roomId = 'stone-global'; // Global Company Chat Room

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch History
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setLoading(true);
      api.get(`/chat/${roomId}`)
        .then((res) => {
          if (res.data.success) {
            setMessages(res.data.data.map(m => ({
              id: m._id,
              text: m.content,
              senderId: m.sender,
              senderName: m.senderName,
              senderRole: m.senderRole,
              time: m.createdAt
            })));
          }
        })
        .catch(err => console.error("Failed to load chat history", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Socket Connection
  useEffect(() => {
    socket.emit('join_room', roomId);

    const handleReceive = (data) => {
      // Avoid duplicating our own messages if they were optimistic
      setMessages((prev) => {
        // If we already added it via optimistic UI without an ID
        // Note: For simplicity we add messages dynamically
        return [...prev, {
          id: data._id || Date.now(),
          text: data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          time: data.time || new Date()
        }];
      });
    };

    socket.on('receive_message', handleReceive);

    return () => {
      socket.off('receive_message', handleReceive);
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const newMessage = {
      roomId,
      senderId: user._id,
      senderName: user.name,
      senderRole: user.role,
      text: message
    };

    // We rely on the socket emitting it back to us, or we can optimistically update.
    // Let's rely on emitting it back to ensure DB save sync.
    socket.emit('send_message', {
      ...newMessage,
      text: message // Ensure 'text' field is used for content
    });
    setMessage('');
  };

  if (!user) return null; // Don't show if not logged in (to prevent unauthorized access to team chat)

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      {/* Chat Window */}
      {isOpen ? (
        <div className="bg-slate-900 border border-slate-700 w-80 md:w-96 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-400 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <FiZap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="font-bold text-sm">Global Team Chat</div>
                <div className="flex items-center gap-1.5 text-[10px] opacity-80 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live Sync
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 h-80 overflow-y-auto p-4 space-y-4 bg-slate-950/50 backdrop-blur-sm custom-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center h-full text-slate-500 text-xs">Loading history...</div>
            ) : (
              messages.map((m, i) => {
                const isMe = m.senderId === user._id;
                const showHeader = i === 0 || messages[i-1].senderId !== m.senderId;

                return (
                  <div key={m.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && showHeader && (
                      <div className="flex items-center gap-2 mb-1 pl-1">
                        <span className="text-[10px] font-bold text-slate-400">{m.senderName}</span>
                        <span className="text-[8px] bg-slate-800 text-brand-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{m.senderRole}</span>
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm flex flex-col ${
                      isMe 
                        ? 'bg-brand-500 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                    }`}>
                      <span>{m.text}</span>
                      <div className={`text-[9px] mt-1.5 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                        {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="relative">
              <input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message Team..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors shadow-inner"
                autoFocus
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-500 hover:bg-brand-400 text-white p-2 rounded-xl transition-all shadow-lg shadow-brand-500/20 active:scale-95 disabled:opacity-50"
                disabled={!message.trim()}
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Floating Bubble */
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 bg-brand-500 hover:bg-brand-400 rounded-2xl shadow-xl shadow-brand-500/30 flex items-center justify-center transition-all hover:-translate-y-1 active:scale-90"
        >
          <div className="absolute -top-12 right-0 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700 shadow-xl after:content-[''] after:absolute after:top-full after:right-4 after:border-8 after:border-transparent after:border-t-slate-800">
            Global Team Chat
          </div>
          <FiMessageSquare className="w-7 h-7 text-white" />
          {messages.length > 0 && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </button>
      )}
    </div>
  );
}
