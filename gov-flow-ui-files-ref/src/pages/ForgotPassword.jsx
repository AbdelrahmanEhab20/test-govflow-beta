import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/api/authApi';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      setIsSubmitting(true);
      const result = await forgotPassword(email);
      setMessage(result?.message || 'If the account exists, a reset email has been sent.');
    } catch (err) {
      setError(err?.message || 'Unable to process request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Forgot password</h1>
        <p className="text-slate-500 text-center mt-2 mb-6">We will send a reset link to your email.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full h-11 rounded-lg border border-slate-300 px-3"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg bg-slate-900 text-white font-medium disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
          <Link to="/login" className="block text-center text-sm text-blue-600 hover:text-blue-700">
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}
