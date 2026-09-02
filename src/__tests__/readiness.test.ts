import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: HeadersInit }) => ({
      body,
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
    }),
  },
}));

const requiredEnvironment = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'AMADEUS_API_KEY',
  'AMADEUS_API_SECRET',
];

function configureEnvironment(supabaseUrl = 'https://example.supabase.co') {
  for (const key of requiredEnvironment) {
    vi.stubEnv(key, `${key.toLowerCase()}_value`);
  }
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
}

function responseBody<T>(response: unknown): T {
  return (response as { body: T }).body;
}

describe('readiness API', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('distinguishes missing Supabase configuration from an unreachable project', async () => {
    const { GET } = await import('@/app/api/readiness/route');

    const response = await GET();
    const body = responseBody<{
      ready: boolean;
      checks: {
        supabase: {
          configured: boolean;
          authConfigured: boolean;
          reachable: boolean | null;
        };
      };
    }>(response);

    expect(response.status).toBe(503);
    expect(body.ready).toBe(false);
    expect(body.checks.supabase.configured).toBe(false);
    expect(body.checks.supabase.authConfigured).toBe(false);
    expect(body.checks.supabase.reachable).toBeNull();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('reports ready only when the Supabase Auth health endpoint responds successfully', async () => {
    configureEnvironment();
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/readiness/route');

    const response = await GET();
    const body = responseBody<{ ready: boolean }>(response);

    expect(response.status).toBe(200);
    expect(body.ready).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('https://example.supabase.co/auth/v1/health'),
      expect.objectContaining({
        cache: 'no-store',
        headers: { apikey: 'next_public_supabase_publishable_key_value' },
      })
    );
  });

  it('checks Auth reachability even when server-only Supabase credentials are missing', async () => {
    configureEnvironment();
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/readiness/route');

    const response = await GET();
    const body = responseBody<{
      ready: boolean;
      checks: {
        supabase: {
          configured: boolean;
          missing: string[];
          authConfigured: boolean;
          reachable: boolean | null;
        };
      };
    }>(response);

    expect(response.status).toBe(503);
    expect(body.ready).toBe(false);
    expect(body.checks.supabase.configured).toBe(false);
    expect(body.checks.supabase.missing).toContain('SUPABASE_SECRET_KEY');
    expect(body.checks.supabase.authConfigured).toBe(true);
    expect(body.checks.supabase.reachable).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each([
    {
      name: 'a DNS or network failure',
      url: 'https://missing-project.supabase.co',
      fetchResult: () => Promise.reject(new TypeError('fetch failed')),
    },
    {
      name: 'a malformed project URL',
      url: 'not-a-url',
      fetchResult: () => Promise.resolve(new Response('{}', { status: 200 })),
    },
    {
      name: 'a non-success health response',
      url: 'https://paused-project.supabase.co',
      fetchResult: () => Promise.resolve(new Response('{}', { status: 503 })),
    },
  ])('reports not ready for $name', async ({ url, fetchResult }) => {
    configureEnvironment(url);
    vi.stubGlobal('fetch', vi.fn().mockImplementation(fetchResult));
    const { GET } = await import('@/app/api/readiness/route');

    const response = await GET();
    const body = responseBody<{
      ready: boolean;
      checks: {
        supabase: {
          configured: boolean;
          authConfigured: boolean;
          reachable: boolean | null;
        };
      };
    }>(response);

    expect(response.status).toBe(503);
    expect(body.ready).toBe(false);
    expect(body.checks.supabase.configured).toBe(true);
    expect(body.checks.supabase.authConfigured).toBe(true);
    expect(body.checks.supabase.reachable).toBe(false);
  });
});
