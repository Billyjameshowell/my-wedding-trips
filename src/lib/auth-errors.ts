import { isAuthRetryableFetchError } from '@supabase/supabase-js';

export type AuthErrorKind = 'credentials' | 'configuration' | 'unreachable' | 'unknown';

export interface AuthErrorMessage {
  kind: AuthErrorKind;
  message: string;
}

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  callback: 'That confirmation link is invalid or expired. Please request a new one.',
  configuration: 'Login is unavailable because the authentication service is misconfigured. Please contact support.',
  unreachable: "We can't reach the login service. Check your connection and try again. If this continues, the Supabase project may be unavailable.",
};

interface ErrorDetails {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
}

function getErrorDetails(error: unknown): ErrorDetails {
  return typeof error === 'object' && error !== null ? error : {};
}

export function describeAuthError(error: unknown): AuthErrorMessage {
  const details = getErrorDetails(error);
  const code = typeof details.code === 'string' ? details.code.toLowerCase() : '';
  const name = typeof details.name === 'string' ? details.name : '';
  const rawMessage = typeof details.message === 'string' ? details.message : '';
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    code === 'invalid_credentials' ||
    name === 'AuthInvalidCredentialsError' ||
    normalizedMessage.includes('invalid login credentials')
  ) {
    return {
      kind: 'credentials',
      message: 'Email or password is incorrect.',
    };
  }

  if (
    normalizedMessage.includes('invalid api key') ||
    normalizedMessage.includes('no api key found') ||
    normalizedMessage.includes('project not found')
  ) {
    return {
      kind: 'configuration',
      message: 'Login is unavailable because the authentication service is misconfigured. Please contact support.',
    };
  }

  if (
    isAuthRetryableFetchError(error) ||
    name === 'AuthRetryableFetchError' ||
    (name === 'TypeError' &&
      (normalizedMessage.includes('fetch') || normalizedMessage.includes('network'))) ||
    (typeof details.status === 'number' && details.status >= 500)
  ) {
    return {
      kind: 'unreachable',
      message: "We can't reach the login service. Check your connection and try again. If this continues, the Supabase project may be unavailable.",
    };
  }

  return {
    kind: 'unknown',
    message: rawMessage || 'Login failed unexpectedly. Please try again.',
  };
}

export function getAuthCallbackErrorMessage(reason: string | null): string | null {
  return reason ? CALLBACK_ERROR_MESSAGES[reason] ?? CALLBACK_ERROR_MESSAGES.callback : null;
}
