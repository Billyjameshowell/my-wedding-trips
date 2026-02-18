'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wedding, TrackerStatus, AddWeddingInput } from './types';
import { createClient, isSupabaseConfigured } from './supabase';
import * as localStorage from './storage';
import * as database from './database';
import type { User } from '@supabase/supabase-js';

export function useWeddings() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSupabase = isSupabaseConfigured();

  const loadWeddings = useCallback(async () => {
    try {
      if (isOnline) {
        const data = await database.fetchWeddings();
        setWeddings(sortWeddings(data));
      } else {
        setWeddings(sortWeddings(localStorage.getWeddings()));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Load failed: ${msg}`);
    }
  }, [isOnline]);

  useEffect(() => {
    async function init() {
      if (hasSupabase) {
        const supabase = createClient();
        if (!supabase) {
          setLoading(false);
          return;
        }
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) {
          setUser(u);
          setIsOnline(true);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setIsOnline(!!session?.user);
        });

        setLoading(false);
        return () => subscription.unsubscribe();
      }
      setLoading(false);
    }
    init();
  }, [hasSupabase]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadWeddings();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [isOnline, loadWeddings]);

  const addWedding = useCallback(async (data: AddWeddingInput): Promise<boolean> => {
    setError(null);
    try {
      if (isOnline) {
        const result = await database.createWedding(data);
        if (!result) {
          setError('Failed to save wedding. Check browser console for details.');
          return false;
        }
      } else {
        localStorage.addWedding({
          coupleName: data.coupleName,
          date: data.date,
          location: data.location,
          venue: data.venue,
          flightStatus: data.flight ? 'watching' : 'not_started',
          hotelStatus: 'not_started',
          giftStatus: 'not_started',
          flight: data.flight ? {
            origin: data.flight.origin.toUpperCase(),
            destination: data.flight.destination.toUpperCase(),
            departureDate: data.flight.departureDate,
            returnDate: data.flight.returnDate,
            priceHistory: [],
          } : undefined,
        });
      }
      await loadWeddings();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Add failed: ${msg}`);
      return false;
    }
  }, [isOnline, loadWeddings]);

  const updateStatus = useCallback(async (
    id: string,
    field: 'flightStatus' | 'hotelStatus' | 'giftStatus',
    status: TrackerStatus
  ) => {
    if (isOnline) {
      await database.updateWeddingDB(id, { [field]: status } as Record<string, TrackerStatus>);
    } else {
      localStorage.updateWedding(id, { [field]: status });
    }
    await loadWeddings();
  }, [isOnline, loadWeddings]);

  const updateDetails = useCallback(async (id: string, updates: Partial<Wedding>) => {
    if (isOnline) {
      await database.updateWeddingDB(id, updates);
    } else {
      localStorage.updateWedding(id, updates);
    }
    await loadWeddings();
  }, [isOnline, loadWeddings]);

  const removeWedding = useCallback(async (id: string) => {
    if (isOnline) {
      await database.deleteWeddingDB(id);
    } else {
      localStorage.deleteWedding(id);
    }
    await loadWeddings();
  }, [isOnline, loadWeddings]);

  const signOut = useCallback(async () => {
    if (hasSupabase) {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setIsOnline(false);
    }
  }, [hasSupabase]);

  const clearError = useCallback(() => setError(null), []);

  return {
    weddings,
    user,
    loading,
    isOnline,
    hasSupabase,
    error,
    addWedding,
    updateStatus,
    updateDetails,
    removeWedding,
    signOut,
    clearError,
    refresh: loadWeddings,
  };
}

function sortWeddings(weddings: Wedding[]): Wedding[] {
  return [...weddings].sort((a, b) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const aDate = new Date(a.date + 'T00:00:00');
    const bDate = new Date(b.date + 'T00:00:00');
    const aFuture = aDate >= now;
    const bFuture = bDate >= now;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return aDate.getTime() - bDate.getTime();
  });
}
