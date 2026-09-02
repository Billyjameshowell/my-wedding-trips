import { createServerClient } from '@supabase/ssr';
import { describeAuthError } from '@/lib/auth-errors';
import { getSupabaseConfigurationError } from '@/lib/supabase-config';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function loginErrorRedirect(origin: string, reason: string) {
  const url = new URL('/login', origin);
  url.searchParams.set('auth_error', reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return loginErrorRedirect(origin, 'callback');
  }

  if (getSupabaseConfigurationError()) {
    return loginErrorRedirect(origin, 'configuration');
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const { kind } = describeAuthError(error);
      return loginErrorRedirect(
        origin,
        kind === 'configuration' || kind === 'unreachable' ? kind : 'callback'
      );
    }
  } catch (error) {
    const { kind } = describeAuthError(error);
    return loginErrorRedirect(
      origin,
      kind === 'configuration' || kind === 'unreachable' ? kind : 'callback'
    );
  }

  return NextResponse.redirect(`${origin}/`);
}
