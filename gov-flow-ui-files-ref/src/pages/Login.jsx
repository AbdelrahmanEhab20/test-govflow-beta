import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import govflowLoginLogo from '../assets/new-govflow-logo.png';

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
  const showGovflowCredit = appPublicSettings?.public_settings?.showGovflowCredit !== false;
  const govflowCreditText = appPublicSettings?.public_settings?.govflowCreditText || 'Powered by GovFlow';

  const inputWrapperClass =
    'h-12 rounded-xl bg-white/80 border border-slate-200/80 flex items-center px-3 gap-2 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-sm';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-xl sm:p-8 dark:bg-slate-900/90 dark:border-slate-700/60">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-white shadow-lg ring-1 ring-slate-200/80 dark:from-slate-800 dark:to-slate-900 dark:ring-slate-700">
              <img
                src={govflowLoginLogo}
                alt="GovFlow logo"
                className="h-10 w-10 rounded-lg object-cover"
                draggable={false}
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome to {appName}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in with your email and password to continue
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <div className={inputWrapperClass}>
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  id="login-email"
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="name@company.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className={inputWrapperClass}>
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  id="login-password"
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoadingAuth}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition-all hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {isLoadingAuth ? 'Signing in...' : 'Sign in'}
              {!isLoadingAuth && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>

            <div className="space-y-1 pt-2 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">{companyName} beta</p>
              {showGovflowCredit ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{govflowCreditText}</p>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
