'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wedding, TrackerStatus } from '@/lib/types';
import { getWeddings, addWedding, updateWedding, deleteWedding } from '@/lib/storage';
import { daysUntil } from '@/lib/utils';
import WeddingCard from '@/components/WeddingCard';
import AddWeddingModal from '@/components/AddWeddingModal';
import DashboardStats from '@/components/DashboardStats';
import EmptyState from '@/components/EmptyState';

export default function Dashboard() {
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refreshWeddings = useCallback(() => {
    const all = getWeddings();
    // Sort: upcoming first (by date asc), then past
    all.sort((a, b) => {
      const aDays = daysUntil(a.date);
      const bDays = daysUntil(b.date);
      if (aDays >= 0 && bDays < 0) return -1;
      if (aDays < 0 && bDays >= 0) return 1;
      return a.date.localeCompare(b.date);
    });
    setWeddings(all);
  }, []);

  useEffect(() => {
    refreshWeddings();
    setLoaded(true);
  }, [refreshWeddings]);

  function handleAdd(data: {
    coupleName: string;
    date: string;
    location: string;
    venue?: string;
    flight?: {
      origin: string;
      destination: string;
      departureDate: string;
      returnDate: string;
    };
  }) {
    addWedding({
      coupleName: data.coupleName,
      date: data.date,
      location: data.location,
      venue: data.venue,
      flightStatus: data.flight ? 'watching' : 'not_started',
      hotelStatus: 'not_started',
      giftStatus: 'not_started',
      flight: data.flight
        ? {
            origin: data.flight.origin,
            destination: data.flight.destination,
            departureDate: data.flight.departureDate,
            returnDate: data.flight.returnDate,
            priceHistory: [],
          }
        : undefined,
    });
    refreshWeddings();
  }

  function handleStatusChange(
    id: string,
    field: 'flightStatus' | 'hotelStatus' | 'giftStatus',
    status: TrackerStatus
  ) {
    updateWedding(id, { [field]: status });
    refreshWeddings();
  }

  function handleDelete(id: string) {
    if (window.confirm('Remove this wedding? This cannot be undone.')) {
      deleteWedding(id);
      refreshWeddings();
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-300 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              MyWeddingTrips
            </h1>
            <p className="text-xs text-gray-400 font-medium">Wedding season, handled.</p>
          </div>
          {weddings.length > 0 && (
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white
                hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-900/10"
            >
              + Add Wedding
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {weddings.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <>
            <DashboardStats weddings={weddings} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weddings.map((wedding) => (
                <WeddingCard
                  key={wedding.id}
                  wedding={wedding}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Add modal */}
      <AddWeddingModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
