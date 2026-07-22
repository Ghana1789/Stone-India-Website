import { useState, useEffect } from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';

export default function ClientScheduler() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading the Calendly widget
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10 font-sans">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Meeting Scheduler</h1>
        <p className="text-slate-400 text-sm">Book a call with your dedicated project manager.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg min-h-[600px] flex flex-col items-center justify-center text-center">
        {loading ? (
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="space-y-4">
             <FiCalendar className="w-16 h-16 text-brand-500 mx-auto opacity-50" />
             <h2 className="text-xl font-bold text-white">Calendly Integration Ready</h2>
             <p className="text-slate-400 max-w-sm mx-auto text-sm">
                In a production environment, this area will load the interactive Calendly embed script allowing clients to securely book available slots.
             </p>
             <div className="pt-4 flex justify-center gap-4">
               <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
                 <FiClock className="w-4 h-4 text-brand-400" /> Auto-syncs with Google Calendar
               </span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
