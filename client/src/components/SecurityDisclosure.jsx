import { useState, useEffect } from 'react';
import { FiInfo, FiCheck } from 'react-icons/fi';

export default function SecurityDisclosure() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('si_security_disclosure');
    if (!consent) {
      // Delay display slightly for smoother entrance transition
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('si_security_disclosure', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('si_security_disclosure', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-50 animate-slide-up">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl shadow-slate-950/50 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-brand-500/10 text-brand-400 rounded-full flex items-center justify-center shrink-0 border border-brand-500/20">
            <FiInfo className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Security & Privacy Disclosure</h4>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              We use secure, HttpOnly, and SameSite session tokens strictly for account authentication, 
              MFA protection, and anti-CSRF validation. No tracking or third-party ad monitoring is used.
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 pt-2">
          <button 
            onClick={handleDecline}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold border border-slate-800 transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-bold transition-all shadow-glow-green"
          >
            <FiCheck /> Accept Security Tokens
          </button>
        </div>
      </div>
    </div>
  );
}
