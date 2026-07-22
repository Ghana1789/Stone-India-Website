import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import io from 'socket.io-client';

export default function Support() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const roomId = `client_${user?._id}`;

  useEffect(() => {
    api.get('/client/messages').then(r => setMessages(r.data.data));

    socketRef.current = io('/', { transports: ['websocket'] });
    socketRef.current.emit('join_room', roomId);
    socketRef.current.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => socketRef.current?.disconnect();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      await api.post('/client/messages', { content: input, type: 'text' });
      setInput('');
    } catch {
      toast.error('Failed to send message');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Support Chat</h1>
        <p className="text-slate-400 mt-1">Chat with Stone India support team in real-time</p>
      </div>

      <div className="card flex-1 flex flex-col" style={{ height: '60vh' }}>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50 mb-4">
          <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
            <FiMessageSquare className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="text-white font-semibold">Stone India Support</div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
              <span className="text-slate-400 text-xs">Online</span>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {messages.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">
              👋 Welcome! How can we help you today?
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.senderRole === 'client' || msg.sender === user?._id;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : 'bg-slate-700 text-slate-200 rounded-bl-sm'
                }`}>
                  {!isMe && <div className="font-semibold text-xs text-brand-400 mb-1">{msg.senderName}</div>}
                  <p>{msg.content}</p>
                  <div className={`text-[10px] mt-1 ${isMe ? 'text-brand-200' : 'text-slate-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex items-center gap-3 pt-4 border-t border-slate-700/50 mt-4">
          <input
            className="input flex-1 py-2.5"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" disabled={sending || !input.trim()}
            className="w-10 h-10 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 rounded-xl flex items-center justify-center text-white transition-colors shrink-0">
            <FiSend className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
