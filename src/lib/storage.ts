'use client';

import { Wedding, CARD_COLORS } from './types';

const STORAGE_KEY = 'myweddingtrips_weddings';

export function getWeddings(): Wedding[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Wedding[];
  } catch {
    return [];
  }
}

export function saveWeddings(weddings: Wedding[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weddings));
}

export function generateId(): string {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getNextColor(weddings: Wedding[]): string {
  const usedColors = weddings.map((w) => w.color);
  const available = CARD_COLORS.filter((c) => !usedColors.includes(c));
  if (available.length > 0) return available[0];
  return CARD_COLORS[weddings.length % CARD_COLORS.length];
}

export function addWedding(wedding: Omit<Wedding, 'id' | 'createdAt' | 'color'>): Wedding {
  const weddings = getWeddings();
  const newWedding: Wedding = {
    ...wedding,
    id: generateId(),
    createdAt: new Date().toISOString(),
    color: getNextColor(weddings),
  };
  weddings.push(newWedding);
  saveWeddings(weddings);
  return newWedding;
}

export function updateWedding(id: string, updates: Partial<Wedding>): Wedding | null {
  const weddings = getWeddings();
  const index = weddings.findIndex((w) => w.id === id);
  if (index === -1) return null;
  weddings[index] = { ...weddings[index], ...updates };
  saveWeddings(weddings);
  return weddings[index];
}

export function deleteWedding(id: string): boolean {
  const weddings = getWeddings();
  const filtered = weddings.filter((w) => w.id !== id);
  if (filtered.length === weddings.length) return false;
  saveWeddings(filtered);
  return true;
}

export function addPriceToHistory(weddingId: string, price: number): boolean {
  const weddings = getWeddings();
  const wedding = weddings.find((w) => w.id === weddingId);
  if (!wedding?.flight) return false;

  wedding.flight.priceHistory.push({
    date: new Date().toISOString(),
    price,
  });
  saveWeddings(weddings);
  return true;
}
