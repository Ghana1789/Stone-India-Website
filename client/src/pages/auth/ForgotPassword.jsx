import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiBatteryCharging, FiMail, FiArrowLeft, FiLock, FiCheck } from 'react-icons/fi';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm">
          <FiArrowLeft /> Back to Login
        </Link>

        <div className="card">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <FiBatteryCharging className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-xl">Reset Password</h1>
              <p className="text-slate-400 text-sm">Stone India Portal</p>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <p className="text-slate-400 text-sm">Enter your registered email to receive a 6-digit OTP.</p>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" className="input pl-11" placeholder="Email address"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-slate-400 text-sm">Enter the OTP sent to <strong className="text-white">{email}</strong> and set a new password.</p>
              <input type="text" className="input tracking-widest text-center text-lg" placeholder="6-digit OTP"
                maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required />
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="password" className="input pl-11" placeholder="New password (min 6 chars)"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-brand-400" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Password Reset!</h3>
              <p className="text-slate-400 text-sm mb-6">You can now log in with your new password.</p>
              <Link to="/login" className="btn-primary inline-block">Back to Login</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
