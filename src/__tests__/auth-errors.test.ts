import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { describeAuthError, getAuthCallbackErrorMessage } from '@/lib/auth-errors';

describe('describeAuthError', () => {
  it('maps invalid credentials without leaking the provider response', () => {
    const error = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials');

    expect(describeAuthError(error)).toEqual({
      kind: 'credentials',
      message: 'Email or password is incorrect.',
    });
  });

  it('maps Supabase retryable fetch errors to an unreachable service message', () => {
    const error = new AuthRetryableFetchError('Failed to fetch', 0);

    expect(describeAuthError(error)).toEqual({
      kind: 'unreachable',
      message: "We can't reach the login service. Check your connection and try again. If this continues, the Supabase project may be unavailable.",
    });
  });

  it('maps browser network failures to an unreachable service message', () => {
    expect(describeAuthError(new TypeError('Failed to fetch')).kind).toBe('unreachable');
  });

  it('maps invalid project credentials to a configuration message', () => {
    expect(describeAuthError(new Error('Invalid API key'))).toEqual({
      kind: 'configuration',
      message: 'Login is unavailable because the authentication service is misconfigured. Please contact support.',
    });
  });

  it('preserves a useful provider message for other auth failures', () => {
    expect(describeAuthError(new Error('Email not confirmed'))).toEqual({
      kind: 'unknown',
      message: 'Email not confirmed',
    });
  });
});

describe('getAuthCallbackErrorMessage', () => {
  it('maps known callback failure reasons to safe messages', () => {
    expect(getAuthCallbackErrorMessage('unreachable')).toContain("can't reach the login service");
    expect(getAuthCallbackErrorMessage('configuration')).toContain('misconfigured');
    expect(getAuthCallbackErrorMessage('callback')).toContain('invalid or expired');
  });

  it('does not expose an unknown query-string value', () => {
    expect(getAuthCallbackErrorMessage('sensitive-provider-detail')).toContain('invalid or expired');
    expect(getAuthCallbackErrorMessage(null)).toBeNull();
  });
});
