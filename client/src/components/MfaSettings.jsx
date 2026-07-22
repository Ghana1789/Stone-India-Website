import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiShield, FiCheckCircle, FiCopy, FiDownload, FiLock, FiAlertTriangle } from 'react-icons/fi';

export default function MfaSettings() {
  const { user, updateUser } = useAuth();
  
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState(null);

  // Disable MFA states
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [password, setPassword] = useState('');

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/mfa/setup');
      setSetupData(data);
      toast.success('MFA Setup generated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start MFA setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMfa = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/mfa/enable', {
        code,
        mfaSetupToken: setupData.mfaSetupToken
      });
      setBackupCodes(data.backupCodes);
      updateUser({ ...user, twoFactorEnabled: true });
      toast.success('Multi-Factor Authentication enabled!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/mfa/disable', { password });
      updateUser({ ...user, twoFactorEnabled: false });
      setShowDisableForm(false);
      setPassword('');
      setBackupCodes(null);
      setSetupData(null);
      toast.success('MFA disabled successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable MFA. Verify password.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadBackupCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([backupCodes.join("\n")], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "stone_india_recovery_codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (user?.twoFactorEnabled) {
    return (
      <div className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 border border-green-500/20 shrink-0">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Multi-Factor Authentication is Active</h3>
            <p className="text-slate-400 text-sm mt-1">
              Your account is protected by an extra layer of security. You must supply a TOTP security code when signing in.
            </p>
          </div>
        </div>

        {backupCodes && (
          <div className="bg-slate-900 border border-brand-500/20 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
              <FiShield className="w-4 h-4" /> Save Your Backup Recovery Codes
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              If you lose access to your authenticator app, these codes can be used to bypass TOTP and log in. 
              Each code is single-use and can only be shown **once**!
            </p>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-4 rounded-lg font-mono text-sm text-center text-white border border-slate-800">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="tracking-wider">{code}</div>
              ))}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white rounded-lg transition-colors border border-slate-800"
              >
                <FiCopy /> Copy Codes
              </button>
              <button 
                onClick={downloadBackupCodes}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white rounded-lg transition-colors border border-slate-800"
              >
                <FiDownload /> Download Text
              </button>
            </div>
          </div>
        )}

        {!showDisableForm ? (
          <button 
            onClick={() => setShowDisableForm(true)}
            className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-semibold transition-colors"
          >
            Disable MFA
          </button>
        ) : (
          <form onSubmit={handleDisableMfa} className="space-y-4 bg-red-500/5 border border-red-500/10 p-5 rounded-xl max-w-md">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
              <FiAlertTriangle className="w-4 h-4" /> Are you sure you want to disable MFA?
            </div>
            <p className="text-slate-400 text-xs">
              Disabling MFA weakens your account security. Please verify your password to proceed.
            </p>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Account Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {loading ? 'Disabling...' : 'Confirm Disable'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowDisableForm(false);
                  setPassword('');
                }}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-800 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#13161e] border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
          <FiShield className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Multi-Factor Authentication (MFA)</h3>
          <p className="text-slate-400 text-sm mt-1">
            Increase your security by setting up a Time-based One-Time Password (TOTP) authenticator application.
          </p>
        </div>
      </div>

      {!setupData ? (
        <button
          onClick={handleStartSetup}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Set Up Authenticator'}
        </button>
      ) : (
        <div className="space-y-6 max-w-xl">
          <div className="flex items-start gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-slate-300 font-mono text-sm leading-relaxed space-y-3">
              <div>
                <strong className="text-white text-xs block mb-1 uppercase tracking-wider">Step 1: Scan QR Code</strong>
                Scan this QR code in Google Authenticator, Authy, or Microsoft Authenticator:
              </div>
              <div className="bg-white p-3 rounded-lg w-fit mx-auto border-4 border-white shadow">
                {/* Simplified QR Code display. Since we don't have a library, we display the raw URI or mock QR code image, and allow text-based setup */}
                <div className="text-center font-bold text-slate-900 text-xs py-4 px-2 border-2 border-dashed border-slate-400 bg-slate-100 rounded">
                  QR Code Placeholder<br/>
                  (Scan using Authenticator)
                </div>
              </div>
              
              <div className="pt-2">
                <strong className="text-white text-xs block mb-1 uppercase tracking-wider">Step 2: Manual Setup Key</strong>
                Or enter this secret key manually in your authenticator app:
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="bg-slate-950 px-3 py-1.5 rounded font-mono font-bold text-brand-400 tracking-wider text-xs border border-slate-850">
                    {setupData.secret}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(setupData.secret)}
                    className="text-slate-400 hover:text-slate-200"
                    title="Copy Key"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleEnableMfa} className="space-y-4">
            <div className="form-group max-w-sm">
              <strong className="text-white text-xs block mb-1.5 uppercase tracking-wider">Step 3: Enter Verification Code</strong>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  className="input pl-11 text-center tracking-widest font-mono text-base"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\s/g, ''))}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Enable MFA'}
              </button>
              <button
                type="button"
                onClick={() => setSetupData(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-all border border-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
