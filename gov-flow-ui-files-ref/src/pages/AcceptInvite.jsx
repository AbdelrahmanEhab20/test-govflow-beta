import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { acceptInvite } from '@/api/authApi';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('Missing invite token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setIsSubmitting(true);
      await acceptInvite(token, password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'Unable to accept invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Set your password</h1>
        <p className="text-slate-500 text-center mt-2 mb-6">Complete your GovFlow account setup.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full h-11 rounded-lg border border-slate-300 px-3"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <input
            className="w-full h-11 rounded-lg border border-slate-300 px-3"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg bg-slate-900 text-white font-medium disabled:opacity-60"
          >
            {isSubmitting ? 'Saving...' : 'Activate account'}
          </button>
        </form>
      </div>
    </div>
  );
}
