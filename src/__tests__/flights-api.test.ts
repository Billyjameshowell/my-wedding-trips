import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Next.js server modules before importing the route
vi.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  }
  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        body,
        status: init?.status ?? 200,
      }),
    },
  };
});

// We test the API logic directly by importing the GET handler
import { GET } from '@/app/api/flights/route';
import { NextRequest } from 'next/server';

describe('Flight API Route', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    // Ensure Amadeus credentials are NOT set by default (mock mode)
    vi.stubEnv('AMADEUS_API_KEY', '');
    vi.stubEnv('AMADEUS_API_SECRET', '');
  });

  it('returns 400 when required params are missing', async () => {
    const req = new NextRequest('http://localhost/api/flights');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when origin is missing', async () => {
    const req = new NextRequest('http://localhost/api/flights?destination=JFK&departureDate=2026-06-01');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when destination is missing', async () => {
    const req = new NextRequest('http://localhost/api/flights?origin=LAX&departureDate=2026-06-01');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when departureDate is missing', async () => {
    const req = new NextRequest('http://localhost/api/flights?origin=LAX&destination=JFK');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns mock data when Amadeus credentials not set', async () => {
    const req = new NextRequest(
      'http://localhost/api/flights?origin=LAX&destination=AUS&departureDate=2026-06-15&returnDate=2026-06-18'
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = (res as unknown as { body: Record<string, unknown> }).body;
    expect(body.source).toBe('mock');
    expect(body.lowestPrice).toBeGreaterThan(0);
    expect(body.currency).toBe('USD');
    expect(body.message).toContain('mock');
  });

  it('mock prices are in a reasonable range ($150-$500)', async () => {
    const req = new NextRequest(
      'http://localhost/api/flights?origin=LAX&destination=AUS&departureDate=2026-06-15'
    );
    const res = await GET(req);
    const body = (res as unknown as { body: Record<string, unknown> }).body;
    const price = body.lowestPrice as number;
    expect(price).toBeGreaterThanOrEqual(150);
    expect(price).toBeLessThanOrEqual(500);
  });
});
