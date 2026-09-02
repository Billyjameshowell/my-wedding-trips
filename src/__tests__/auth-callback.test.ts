import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  cookies: vi.fn(),
  redirect: vi.fn((url: URL | string) =>
    new Response(null, { status: 307, headers: { location: String(url) } })
  ),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('next/server', () => ({
  NextResponse: { redirect: mocks.redirect },
}));

describe('auth callback', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://active-project.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
    mocks.cookies.mockResolvedValue({
      getAll: vi.fn(() => []),
      set: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('redirects home only after a successful code exchange', async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    mocks.createServerClient.mockReturnValue({ auth: { exchangeCodeForSession } });
    const { GET } = await import('@/app/auth/callback/route');

    const response = await GET(new Request('https://app.test/auth/callback?code=valid-code'));

    expect(exchangeCodeForSession).toHaveBeenCalledWith('valid-code');
    expect(response.headers.get('location')).toBe('https://app.test/');
  });

  it('redirects an exchange failure to login with a safe reason', async () => {
    mocks.createServerClient.mockReturnValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 },
        }),
      },
    });
    const { GET } = await import('@/app/auth/callback/route');

    const response = await GET(new Request('https://app.test/auth/callback?code=valid-code'));

    expect(response.headers.get('location')).toBe(
      'https://app.test/login?auth_error=unreachable'
    );
  });

  it('does not create a client when the callback code is missing', async () => {
    const { GET } = await import('@/app/auth/callback/route');

    const response = await GET(new Request('https://app.test/auth/callback'));

    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe(
      'https://app.test/login?auth_error=callback'
    );
  });

  it('reports server configuration failures without constructing a client', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'not-a-url');
    const { GET } = await import('@/app/auth/callback/route');

    const response = await GET(new Request('https://app.test/auth/callback?code=valid-code'));

    expect(mocks.createServerClient).not.toHaveBeenCalled();
    expect(response.headers.get('location')).toBe(
      'https://app.test/login?auth_error=configuration'
    );
  });
});
