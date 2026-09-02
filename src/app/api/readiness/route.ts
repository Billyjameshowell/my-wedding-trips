import { NextResponse } from 'next/server';

const checks = {
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY'],
  stripe: ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID', 'STRIPE_WEBHOOK_SECRET'],
  app: ['NEXT_PUBLIC_APP_URL'],
  amadeus: ['AMADEUS_API_KEY', 'AMADEUS_API_SECRET'],
};

const SUPABASE_HEALTH_TIMEOUT_MS = 5_000;

async function isSupabaseReachable(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return false;

  try {
    const healthUrl = new URL('/auth/v1/health', url);
    const response = await fetch(healthUrl, {
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(SUPABASE_HEALTH_TIMEOUT_MS),
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const result: Record<
    string,
    { configured: boolean; missing: string[]; reachable?: boolean | null }
  > = Object.fromEntries(
    Object.entries(checks).map(([name, keys]) => [
      name,
      {
        configured: keys.every((key) => !!process.env[key]),
        missing: keys.filter((key) => !process.env[key]),
      },
    ])
  );

  result.supabase.reachable = result.supabase.configured
    ? await isSupabaseReachable()
    : null;

  const ready =
    Object.values(result).every((check) => check.configured) &&
    result.supabase.reachable === true;

  return NextResponse.json(
    {
      ready,
      checks: result,
    },
    {
      status: ready ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
