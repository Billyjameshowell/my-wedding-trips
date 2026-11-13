'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@ui-sdk/react/button';
import { Field, FieldError, FieldLabel } from '@ui-sdk/react/field';
import { Input } from '@ui-sdk/react/input';
import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputToggle,
} from '@ui-sdk/react/password-input';
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from '@ui-sdk/react/segmented-control';
import { describeAuthError, getAuthCallbackErrorMessage } from '@/lib/auth-errors';
import { createClient, getSupabaseConfigurationError } from '@/lib/supabase';

const primaryButton =
  'w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'create-account'>('sign-in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const configurationError = getSupabaseConfigurationError();
  const isSignUp = mode === 'create-account';

  useEffect(() => {
    const callbackError = getAuthCallbackErrorMessage(
      new URLSearchParams(window.location.search).get('auth_error')
    );
    if (callbackError) setError(callbackError);
  }, []);

  if (configurationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">🔧</div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">Auth not configured</h2>
          <p className="mb-4 text-sm text-gray-600">{configurationError}</p>
          <Button
            render={<Link href="/" />}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const supabase = createClient()!;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) {
          setError(describeAuthError(signUpError).message);
        } else {
          setMessage('Check your email for a confirmation link.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(describeAuthError(signInError).message);
        } else {
          router.push('/');
          router.refresh();
        }
      }
    } catch (authError) {
      setError(describeAuthError(authError).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">💒</div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">MyWeddingTrips</h1>
          <p className="mt-1 text-sm text-gray-500">Wedding season, handled.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <SegmentedControl
            aria-label="Account mode"
            value={mode}
            onValueChange={(value) => {
              if (value === 'sign-in' || value === 'create-account') {
                setMode(value);
                setError('');
                setMessage('');
              }
            }}
            className="mb-6"
          >
            <SegmentedControlIndicator />
            <SegmentedControlItem value="sign-in">Sign in</SegmentedControlItem>
            <SegmentedControlItem value="create-account">Create account</SegmentedControlItem>
          </SegmentedControl>

          <h2 className="mb-1 text-lg font-bold text-gray-900">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mb-6 text-sm text-gray-600">
            {isSignUp ? 'Start tracking your wedding trips.' : 'Sign in to your dashboard.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field name="email" invalid={error ? true : undefined}>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                value={email}
                onValueChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <FieldError match="valueMissing">Enter your email.</FieldError>
              <FieldError match="typeMismatch">Enter an email like you@example.com.</FieldError>
            </Field>

            <Field name="password" invalid={error ? true : undefined}>
              <FieldLabel>Password</FieldLabel>
              <PasswordInput
                value={password}
                onValueChange={setPassword}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              >
                <PasswordInputControl placeholder="At least 6 characters" minLength={6} />
                <PasswordInputToggle aria-label="Show password">
                  {(state) => (state.visible ? 'Hide' : 'Show')}
                </PasswordInputToggle>
              </PasswordInput>
              <FieldError match="valueMissing">Enter a password.</FieldError>
              <FieldError match="tooShort">Use at least 6 characters.</FieldError>
            </Field>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800" role="status">
                {message}
              </div>
            )}

            <Button type="submit" disabled={loading} className={primaryButton}>
              {loading ? 'Hold on…' : 'Continue'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          $11/month after free trial
        </p>
      </div>
    </div>
  );
}
