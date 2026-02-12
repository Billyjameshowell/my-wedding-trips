'use client';

import { useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🔧</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Auth Not Configured</h2>
          <p className="text-sm text-gray-500 mb-4">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable login.</p>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  const supabase = createClient()!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage('Check your email for a confirmation link!');
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push('/');
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💒</div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">MyWeddingTrips</h1>
          <p className="text-sm text-gray-400 mt-1">Wedding season, handled.</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isSignUp ? 'Start tracking your wedding trips.' : 'Sign in to your dashboard.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                  transition-all placeholder:text-gray-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                  transition-all placeholder:text-gray-300"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5 font-medium">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-emerald-50 text-emerald-600 text-sm rounded-xl px-4 py-2.5 font-medium">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white
                hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Hold on...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          $11/month after free trial
        </p>
      </div>
    </div>
  );
}
