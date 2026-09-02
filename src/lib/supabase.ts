import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfigurationError } from './supabase-config';

export { getSupabaseConfigurationError } from './supabase-config';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigurationError() === null;
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  return browserClient;
}
