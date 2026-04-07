import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C17.1 3.4 14.8 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 11.7S6.9 20.9 12 20.9c6.2 0 9.1-4.3 9.1-6.6 0-.4 0-.7-.1-1H12z" />
      <path fill="#34A853" d="M3.8 7.9l3.2 2.4c.9-2.6 2.9-4.3 5-4.3 1.9 0 3.2.8 4 1.5l2.7-2.6C17.1 3.4 14.8 2.5 12 2.5 8.4 2.5 5.3 4.6 3.8 7.9z" opacity=".001" />
      <path fill="#4285F4" d="M21.1 13.3c0-.4 0-.7-.1-1H12v3.9h5.5c-.4 1.1-1.3 1.9-2.4 2.5l3.7 2.9c2.2-2.1 3.4-5.1 3.4-8.3z" opacity=".001" />
      <path fill="#FBBC05" d="M3.8 15.5c1.5 3.3 4.6 5.4 8.2 5.4 2.8 0 5.1-.9 6.8-2.5l-3.7-2.9c-1 .7-2.1 1.1-3.1 1.1-2.1 0-4.1-1.7-5-4.3l-3.2 2.5z" opacity=".001" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <div className="w-5 h-5 grid grid-cols-2 gap-0.5" aria-hidden="true">
      <span className="bg-[#F25022] rounded-sm" />
      <span className="bg-[#7FBA00] rounded-sm" />
      <span className="bg-[#00A4EF] rounded-sm" />
      <span className="bg-[#FFB900] rounded-sm" />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { signIn, isLoadingAuth, appPublicSettings } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await signIn(identifier, password);
      navigate('/MyDashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Unable to sign in');
    }
  };

  const appName = appPublicSettings?.public_settings?.appName || 'GovFlow';
  const companyName = appPublicSettings?.public_settings?.companyName || 'GovFlow';
  const logoUrl = appPublicSettings?.public_settings?.logoUrl || '';
  const showGovflowCredit = appPublicSettings?.public_settings?.showGovflowCredit !== false;
  const govflowCreditText = appPublicSettings?.public_settings?.govflowCreditText || 'Powered by GovFlow';

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex justify-center mb-5">
          {logoUrl ? (
            <img src={logoUrl} alt={`${companyName} logo`} className="w-20 h-20 object-contain rounded-xl" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              GF
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-slate-900 text-center">Welcome to {appName}</h1>
        <p className="text-slate-500 text-center mt-2 mb-6">Sign in to continue</p>

        <div className="space-y-3 mb-5">
          <button type="button" disabled className="w-full h-12 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-slate-500 bg-slate-50 cursor-not-allowed">
            <GoogleIcon />
            Google sign-in (coming soon)
          </button>
          <button type="button" disabled className="w-full h-12 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-slate-500 bg-slate-50 cursor-not-allowed">
            <MicrosoftIcon />
            Microsoft sign-in (coming soon)
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">OR</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-600 mb-1">Email</label>
          <div className="h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center px-3 gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <input
              className="w-full bg-transparent outline-none text-slate-900"
              placeholder="name@company.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </div>

          <label className="block text-sm text-slate-600 mb-1 mt-1">Password</label>
          <div className="h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center px-3 gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <input
              className="w-full bg-transparent outline-none text-slate-900"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoadingAuth}
            className="w-full h-12 mt-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {isLoadingAuth ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="text-xs text-slate-500 text-center">{companyName} beta</p>
          {showGovflowCredit ? <p className="text-[11px] text-slate-400 text-center">{govflowCreditText}</p> : null}
        </form>
      </div>
    </div>
  );
}

