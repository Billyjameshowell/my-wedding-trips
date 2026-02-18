import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window + localStorage for Node environment (storage.ts checks typeof window)
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const key in store) delete store[key]; }),
};

Object.defineProperty(globalThis, 'window', { value: globalThis, writable: true });
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

import * as storage from '@/lib/storage';
import { Wedding } from '@/lib/types';

describe('localStorage storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('returns empty array when no weddings stored', () => {
    const result = storage.getWeddings();
    expect(result).toEqual([]);
  });

  it('addWedding creates a wedding with id, createdAt, and color', () => {
    const w = storage.addWedding({
      coupleName: 'Alice & Bob',
      date: '2026-09-15',
      location: 'Denver, CO',
      flightStatus: 'not_started',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
    });

    expect(w.id).toBeTruthy();
    expect(w.createdAt).toBeTruthy();
    expect(w.color).toBeTruthy();
    expect(w.coupleName).toBe('Alice & Bob');
  });

  it('addWedding with flight data preserves flight info', () => {
    const w = storage.addWedding({
      coupleName: 'Sarah & Mike',
      date: '2026-06-20',
      location: 'Austin, TX',
      flightStatus: 'watching',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
      flight: {
        origin: 'LAX',
        destination: 'AUS',
        departureDate: '2026-06-19',
        returnDate: '2026-06-22',
        priceHistory: [],
      },
    });

    expect(w.flight).toBeDefined();
    expect(w.flight!.origin).toBe('LAX');
    expect(w.flight!.destination).toBe('AUS');
    expect(w.flight!.priceHistory).toEqual([]);
  });

  it('getWeddings returns stored weddings', () => {
    storage.addWedding({
      coupleName: 'Test 1',
      date: '2026-01-01',
      location: 'NYC',
      flightStatus: 'not_started',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
    });
    storage.addWedding({
      coupleName: 'Test 2',
      date: '2026-02-01',
      location: 'LA',
      flightStatus: 'not_started',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
    });

    const weddings = storage.getWeddings();
    expect(weddings).toHaveLength(2);
  });

  it('updateWedding modifies flight priceHistory', () => {
    const w = storage.addWedding({
      coupleName: 'Price Test',
      date: '2026-07-01',
      location: 'Miami, FL',
      flightStatus: 'watching',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
      flight: {
        origin: 'LAX',
        destination: 'MIA',
        departureDate: '2026-06-30',
        returnDate: '2026-07-03',
        priceHistory: [],
      },
    });

    const updated = storage.updateWedding(w.id, {
      flight: {
        ...w.flight!,
        priceHistory: [
          { date: '2026-02-18', price: 299 },
          { date: '2026-02-19', price: 275 },
        ],
      },
    });

    expect(updated).not.toBeNull();
    expect(updated!.flight!.priceHistory).toHaveLength(2);
    expect(updated!.flight!.priceHistory[0].price).toBe(299);
  });

  it('deleteWedding removes the wedding', () => {
    const w = storage.addWedding({
      coupleName: 'To Delete',
      date: '2026-01-01',
      location: 'Nowhere',
      flightStatus: 'not_started',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
    });

    expect(storage.deleteWedding(w.id)).toBe(true);
    expect(storage.getWeddings()).toHaveLength(0);
  });

  it('deleteWedding returns false for non-existent id', () => {
    expect(storage.deleteWedding('fake-id')).toBe(false);
  });

  it('addPriceToHistory appends price to flight priceHistory', () => {
    const w = storage.addWedding({
      coupleName: 'Price Track Test',
      date: '2026-08-01',
      location: 'Chicago, IL',
      flightStatus: 'watching',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
      flight: {
        origin: 'LAX',
        destination: 'ORD',
        departureDate: '2026-07-31',
        returnDate: '2026-08-03',
        priceHistory: [],
      },
    });

    expect(storage.addPriceToHistory(w.id, 299)).toBe(true);
    expect(storage.addPriceToHistory(w.id, 275)).toBe(true);

    const updated = storage.getWeddings().find(wed => wed.id === w.id)!;
    expect(updated.flight!.priceHistory).toHaveLength(2);
    expect(updated.flight!.priceHistory[0].price).toBe(299);
    expect(updated.flight!.priceHistory[1].price).toBe(275);
    expect(updated.flight!.priceHistory[0].date).toBeTruthy();
  });

  it('addPriceToHistory returns false when wedding has no flight', () => {
    const w = storage.addWedding({
      coupleName: 'No Flight',
      date: '2026-09-01',
      location: 'Portland, OR',
      flightStatus: 'not_started',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
    });

    expect(storage.addPriceToHistory(w.id, 200)).toBe(false);
  });

  it('addPriceToHistory returns false for non-existent wedding', () => {
    expect(storage.addPriceToHistory('fake-id', 200)).toBe(false);
  });
});
