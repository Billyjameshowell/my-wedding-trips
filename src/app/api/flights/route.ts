import { NextRequest, NextResponse } from 'next/server';

// Amadeus OAuth token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const res = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY!,
      client_secret: process.env.AMADEUS_API_SECRET!,
    }),
  });

  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  };

  return cachedToken.token;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate');
  const returnDate = searchParams.get('returnDate');

  if (!origin || !destination || !departureDate) {
    return NextResponse.json({ error: 'Missing required params: origin, destination, departureDate' }, { status: 400 });
  }

  // Check for Amadeus credentials
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    // Return mock data when Amadeus isn't configured
    return NextResponse.json({
      source: 'mock',
      lowestPrice: Math.round(150 + Math.random() * 350),
      currency: 'USD',
      offers: [],
      message: 'Using mock prices. Set AMADEUS_API_KEY and AMADEUS_API_SECRET for real data.',
    });
  }

  try {
    const token = await getAmadeusToken();

    const params = new URLSearchParams({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate,
      adults: '1',
      nonStop: 'false',
      currencyCode: 'USD',
      max: '5',
    });

    if (returnDate) {
      params.set('returnDate', returnDate);
    }

    const res = await fetch(
      `https://api.amadeus.com/v2/shopping/flight-offers?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Amadeus API error:', res.status, errBody);
      return NextResponse.json({ error: 'Flight search failed', details: res.status }, { status: 502 });
    }

    const data = await res.json();
    const offers = (data.data || []).map((offer: Record<string, unknown>) => ({
      price: Number((offer.price as Record<string, unknown>)?.grandTotal),
      currency: (offer.price as Record<string, unknown>)?.currency,
      airlines: ((offer.itineraries as Array<Record<string, unknown>>)?.[0]?.segments as Array<Record<string, unknown>>)
        ?.map(s => s.carrierCode) || [],
      stops: ((offer.itineraries as Array<Record<string, unknown>>)?.[0]?.segments as unknown[])?.length - 1 || 0,
    }));

    const prices = offers.map((o: { price: number }) => o.price).filter((p: number) => p > 0);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

    return NextResponse.json({
      source: 'amadeus',
      lowestPrice,
      currency: 'USD',
      offers,
    });
  } catch (err) {
    console.error('Flight search error:', err);
    return NextResponse.json({ error: 'Flight search failed' }, { status: 500 });
  }
}
