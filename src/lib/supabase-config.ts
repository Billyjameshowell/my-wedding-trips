export function getSupabaseConfigurationError(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable login.';
  }

  if (url.includes('your-project') || publishableKey === 'your-publishable-key') {
    return 'Replace the placeholder Supabase environment variables with credentials for an active project.';
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return 'NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL.';
    }
  } catch {
    return 'NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL.';
  }

  return null;
}
