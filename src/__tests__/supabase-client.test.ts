import { afterEach, describe, expect, it, vi } from 'vitest';

const createBrowserClientMock = vi.hoisted(() =>
  vi.fn(() => ({ auth: { signInWithPassword: vi.fn() } }))
);

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
}));

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  createBrowserClientMock.mockClear();
  vi.resetModules();
});

describe('browser Supabase client', () => {
  it('reports missing and placeholder configuration', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    let supabase = await import('@/lib/supabase');

    expect(supabase.getSupabaseConfigurationError()).toContain(
      'Set NEXT_PUBLIC_SUPABASE_URL'
    );
    expect(supabase.createClient()).toBeNull();

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'your-publishable-key';
    vi.resetModules();
    supabase = await import('@/lib/supabase');

    expect(supabase.getSupabaseConfigurationError()).toContain(
      'Replace the placeholder Supabase environment variables'
    );
    expect(supabase.createClient()).toBeNull();
  });

  it('creates one shared browser client for repeated calls', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://active-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';
    const { createClient } = await import('@/lib/supabase');

    const firstClient = createClient();
    const secondClient = createClient();

    expect(firstClient).toBe(secondClient);
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      'https://active-project.supabase.co',
      'publishable-key'
    );
  });
});
