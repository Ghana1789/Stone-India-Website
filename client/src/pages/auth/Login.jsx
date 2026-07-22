import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiBatteryCharging, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiKey } from 'react-icons/fi';
import api from '../../services/api';

export default function Login() {
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // CAPTCHA States
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // MFA States
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const fetchCaptcha = async () => {
    try {
      const { data } = await api.get('/auth/captcha');
      setCaptchaChallenge(data.data.challenge);
      setCaptchaToken(data.data.captchaToken);
      setCaptchaAnswer('');
    } catch (err) {
      toast.error('Failed to load CAPTCHA.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.email, form.password, captchaAnswer, captchaToken);
      
      if (res && res.mfaRequired) {
        setMfaToken(res.mfaToken);
        setMfaPending(true);
        toast.success('Multi-Factor Authentication required.');
        setLoading(false);
        return;
      }

      // Check if user object was returned directly
      if (res && res.role) {
        const redirectMap = {
          admin: '/admin/dashboard',
          manager: '/manager/dashboard',
          client: '/client/dashboard',
          employee: '/employee/dashboard'
        };
        navigate(redirectMap[res.role] || '/');
        toast.success('Logged in successfully!');
      }
    } catch (err) {
      if (err.response?.data?.captchaRequired) {
        setCaptchaRequired(true);
        fetchCaptcha();
      }
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await verifyMfa(mfaToken, mfaCode);
      const redirectMap = {
        admin: '/admin/dashboard',
        manager: '/manager/dashboard',
        client: '/client/dashboard',
        employee: '/employee/dashboard'
      };
      navigate(redirectMap[user.role] || '/');
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired MFA code.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogins = [
    { role: 'Admin', email: 'admin@stoneindia.com', password: 'Admin@123', color: 'text-red-400 border-red-500/30 bg-red-500/5' },
    { role: 'Manager', email: 'amit@stoneindia.com', password: 'Manager@123', color: 'text-orange-400 border-orange-500/30 bg-orange-500/5' },
    { role: 'Client', email: 'client@stoneindia.com', password: 'Client@123', color: 'text-brand-400 border-brand-500/30 bg-brand-500/5' },
    { role: 'Employee', email: 'employee@stoneindia.com', password: 'Employee@123', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-gradient-radial from-brand-500/15 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-brand-500 rounded-xl flex items-center justify-center shadow-glow-green">
              <FiBatteryCharging className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-xl">Stone India</div>
              <div className="text-[11px] text-brand-400 tracking-widest font-medium">PVT. LTD.</div>
            </div>
          </Link>

          {/* Content */}
          <div>
            <h2 className="font-display font-black text-5xl text-white leading-tight mb-6">
              Multi-Role<br />
              <span className="gradient-text">Secure Portal</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-10">
              Robust security checks implemented by default including lockout protection, MFA verification, and secure cookie storage.
            </p>

            <div className="space-y-4">
              {[
                { role: 'Client Portal', desc: 'Securely manage battery fleet and payments', icon: '🟩' },
                { role: 'Employee Portal', desc: 'Secure production logging and QC checklists', icon: '🟨' },
                { role: 'Manager Portal', desc: 'Manage workflows and workforce securely', icon: '🟧' },
                { role: 'Admin Portal', desc: 'Enterprise-grade security controls & logs', icon: '🟥' },
              ].map(p => (
                <div key={p.role} className="flex items-start gap-4 glass rounded-xl p-4">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{p.role}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-sm">© 2026 Stone India Pvt. Ltd.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2.5 mb-10 justify-center">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <FiBatteryCharging className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg">Stone India Pvt. Ltd.</span>
          </Link>

          {!mfaPending ? (
            <>
              <div className="mb-8">
                <h1 className="font-display font-bold text-3xl text-white mb-2">Sign In</h1>
                <p className="text-slate-400">Enter your credentials to access your portal.</p>
              </div>

              {/* Demo Quick Login */}
              <div className="mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-brand-400 mb-3 uppercase tracking-wider font-semibold">Quick Demo Login</p>
                <div className="grid grid-cols-2 gap-2">
                  {demoLogins.map(d => (
                    <button
                      key={d.role}
                      type="button"
                      onClick={() => {
                        setForm({ email: d.email, password: d.password });
                        setCaptchaRequired(false);
                      }}
                      className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all duration-200 ${d.color} hover:opacity-85`}
                    >
                      {d.role}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="form-group">
                  <label className="label text-slate-300">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="email"
                      type="email"
                      className="input pl-11"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0 text-slate-300">Password</label>
                    <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      className="input pl-11 pr-12"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {captchaRequired && (
                  <div className="form-group bg-slate-900 p-4 rounded-xl border border-red-500/20">
                    <div className="flex justify-between items-center mb-2">
                      <label className="label text-red-400 font-semibold mb-0">Solve CAPTCHA</label>
                      <button 
                        type="button" 
                        onClick={fetchCaptcha} 
                        className="text-xs text-brand-400 hover:underline"
                      >
                        Refresh Challenge
                      </button>
                    </div>
                    <div className="text-sm text-slate-300 mb-2 font-mono bg-slate-950 p-2 rounded text-center border border-slate-800">
                      {captchaChallenge}
                    </div>
                    <input
                      type="number"
                      placeholder="Your answer"
                      className="input text-center"
                      value={captchaAnswer}
                      onChange={e => setCaptchaAnswer(e.target.value)}
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  id="login-btn"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                  ) : (
                    <>Sign In <FiArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            // MFA Verification Screen
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 bg-brand-500/10 rounded-full flex items-center justify-center text-brand-400 mb-4 border border-brand-500/20">
                  <FiShield className="w-7 h-7" />
                </div>
                <h1 className="font-display font-bold text-2xl text-white text-center">Security Verification</h1>
                <p className="text-slate-400 text-sm text-center mt-2">
                  Enter the 6-digit TOTP code from your authenticator app, or a backup recovery code.
                </p>
              </div>

              <form onSubmit={handleMfaSubmit} className="space-y-5">
                <div className="form-group">
                  <label className="label text-slate-300">Authentication Code</label>
                  <div className="relative">
                    <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      className="input pl-11 text-center tracking-widest font-mono text-lg"
                      placeholder="000000"
                      maxLength={16}
                      value={mfaCode}
                      onChange={e => setMfaCode(e.target.value.replace(/\s/g, ''))}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                  ) : (
                    <>Verify Code</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaPending(false);
                    setMfaCode('');
                    setMfaToken('');
                  }}
                  className="text-sm text-slate-500 hover:text-slate-300 w-full text-center mt-2 block transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-slate-500 text-sm mt-8">
            Need access?{' '}
            <Link to="/contact" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Contact Stone India
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
