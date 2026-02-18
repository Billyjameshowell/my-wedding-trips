'use client';

import { createClient } from './supabase';
import { Wedding, TrackerStatus, CARD_COLORS, AddWeddingInput } from './types';

function getSupabase() {
  const client = createClient();
  if (!client) throw new Error('Supabase not configured');
  return client;
}

// Convert DB row to our Wedding type
function toWedding(row: Record<string, unknown>, flight?: Record<string, unknown> | null, priceHistory?: Record<string, unknown>[]): Wedding {
  return {
    id: row.id as string,
    coupleName: row.couple_name as string,
    date: row.date as string,
    location: row.location as string,
    venue: (row.venue as string) || undefined,
    flightStatus: row.flight_status as TrackerStatus,
    hotelStatus: row.hotel_status as TrackerStatus,
    giftStatus: row.gift_status as TrackerStatus,
    hotelDetails: (row.hotel_details as string) || undefined,
    giftDetails: (row.gift_details as string) || undefined,
    notes: (row.notes as string) || undefined,
    color: row.color as string,
    createdAt: row.created_at as string,
    flight: flight ? {
      origin: flight.origin as string,
      destination: flight.destination as string,
      departureDate: flight.departure_date as string,
      returnDate: flight.return_date as string,
      pricePaid: flight.price_paid as number | undefined,
      priceThreshold: flight.price_threshold as number | undefined,
      priceHistory: (priceHistory || []).map(ph => ({
        date: ph.recorded_at as string,
        price: Number(ph.price),
      })),
    } : undefined,
  };
}

export async function fetchWeddings(): Promise<Wedding[]> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: weddings, error } = await supabase
    .from('weddings')
    .select('*')
    .order('date', { ascending: true });

  if (error || !weddings) {
    console.error('Failed to fetch weddings:', error);
    return [];
  }

  if (weddings.length === 0) {
    return [];
  }

  // Fetch flights for all weddings
  const weddingIds = weddings.map((w) => w.id);
  const { data: flights, error: flightsError } = await supabase
    .from('flights')
    .select('*')
    .in('wedding_id', weddingIds);

  if (flightsError) {
    console.error('Failed to fetch flights:', flightsError);
  }

  // Fetch price history for all flights
  const flightIds = (flights || []).map(f => f.id);
  const { data: priceHistories } = flightIds.length > 0
    ? await supabase
        .from('price_history')
        .select('*')
        .in('flight_id', flightIds)
        .order('recorded_at', { ascending: true })
    : { data: [] };

  return weddings.map(w => {
    const flight = flights?.find(f => f.wedding_id === w.id) || null;
    const history = flight
      ? (priceHistories || []).filter(ph => ph.flight_id === flight.id)
      : [];
    return toWedding(w, flight, history);
  });
}

export async function createWedding(data: AddWeddingInput): Promise<Wedding | null> {
  const supabase = getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Auth error in createWedding:', authError);
    throw new Error(`Not authenticated: ${authError?.message || 'no user'}`);
  }

  // Pick color
  const { data: existing } = await supabase
    .from('weddings')
    .select('color')
    .eq('user_id', user.id);
  const usedColors = (existing || []).map(w => w.color);
  const color = CARD_COLORS.find(c => !usedColors.includes(c)) || CARD_COLORS[0];

  const { data: wedding, error } = await supabase
    .from('weddings')
    .insert({
      user_id: user.id,
      couple_name: data.coupleName,
      date: data.date,
      location: data.location,
      venue: data.venue || null,
      flight_status: data.flight ? 'watching' : 'not_started',
      hotel_status: 'not_started',
      gift_status: 'not_started',
      color,
    })
    .select()
    .single();

  if (error || !wedding) {
    console.error('Failed to create wedding:', error);
    throw new Error(`DB insert failed: ${error?.message || 'unknown error'} (code: ${error?.code}, details: ${error?.details})`);
  }

  // Create flight if provided
  let flightRow = null;
  if (data.flight) {
    const { data: f, error: flightError } = await supabase
      .from('flights')
      .insert({
        wedding_id: wedding.id,
        origin: data.flight.origin.toUpperCase(),
        destination: data.flight.destination.toUpperCase(),
        departure_date: data.flight.departureDate,
        return_date: data.flight.returnDate,
      })
      .select()
      .single();

    if (flightError || !f) {
      console.error('Failed to create flight details:', flightError);
      const { error: rollbackError } = await supabase
        .from('weddings')
        .delete()
        .eq('id', wedding.id);

      if (rollbackError) {
        console.error('Rollback failed after flight creation error:', rollbackError);
      }

      throw new Error(`Flight insert failed: ${flightError?.message || 'unknown error'}`);
    }

    flightRow = f;
  }

  return toWedding(wedding, flightRow, []);
}

export async function updateWeddingDB(id: string, updates: Partial<{
  coupleName: string;
  date: string;
  location: string;
  venue: string;
  flightStatus: TrackerStatus;
  hotelStatus: TrackerStatus;
  giftStatus: TrackerStatus;
  hotelDetails: string;
  giftDetails: string;
  notes: string;
}>): Promise<boolean> {
  const supabase = getSupabase();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.coupleName !== undefined) dbUpdates.couple_name = updates.coupleName;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.venue !== undefined) dbUpdates.venue = updates.venue || null;
  if (updates.flightStatus !== undefined) dbUpdates.flight_status = updates.flightStatus;
  if (updates.hotelStatus !== undefined) dbUpdates.hotel_status = updates.hotelStatus;
  if (updates.giftStatus !== undefined) dbUpdates.gift_status = updates.giftStatus;
  if (updates.hotelDetails !== undefined) dbUpdates.hotel_details = updates.hotelDetails || null;
  if (updates.giftDetails !== undefined) dbUpdates.gift_details = updates.giftDetails || null;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

  const { error } = await supabase
    .from('weddings')
    .update(dbUpdates)
    .eq('id', id);

  return !error;
}

export async function deleteWeddingDB(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('weddings')
    .delete()
    .eq('id', id);

  return !error;
}

export async function addPriceToHistory(weddingId: string, price: number): Promise<boolean> {
  const supabase = getSupabase();

  // Find the flight for this wedding
  const { data: flight, error: flightError } = await supabase
    .from('flights')
    .select('id')
    .eq('wedding_id', weddingId)
    .single();

  if (flightError || !flight) {
    console.error('No flight found for wedding:', weddingId, flightError);
    return false;
  }

  const { error } = await supabase
    .from('price_history')
    .insert({
      flight_id: flight.id,
      price,
    });

  if (error) {
    console.error('Failed to save price history:', error);
    return false;
  }

  return true;
}

export async function inviteGuest(weddingId: string, email: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('guest_seats')
    .insert({
      wedding_id: weddingId,
      invited_email: email.toLowerCase(),
    });

  return !error;
}
