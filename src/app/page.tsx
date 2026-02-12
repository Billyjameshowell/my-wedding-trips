'use client';

import { useState } from 'react';
import { TrackerStatus } from '@/lib/types';
import { useWeddings } from '@/lib/useWeddings';
import WeddingCard from '@/components/WeddingCard';
import AddWeddingModal from '@/components/AddWeddingModal';
import DashboardStats from '@/components/DashboardStats';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';

export default function Dashboard() {
  const {
    weddings,
    user,
    loading,
    hasSupabase,
    addWedding,
    updateStatus,
    removeWedding,
    signOut,
  } = useWeddings();
  const [showAdd, setShowAdd] = useState(false);

  function handleStatusChange(
    id: string,
    field: 'flightStatus' | 'hotelStatus' | 'giftStatus',
    status: TrackerStatus
  ) {
    updateStatus(id, field, status);
  }

  function handleDelete(id: string) {
    if (window.confirm('Remove this wedding? This cannot be undone.')) {
      removeWedding(id);
    }
  }

  if (loading) {
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
          <div className="flex items-center gap-3">
            {weddings.length > 0 && (
              <button
                onClick={() => setShowAdd(true)}
                className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white
                  hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-900/10"
              >
                + Add Wedding
              </button>
            )}
            {user ? (
              <button
                onClick={signOut}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title={user.email}
              >
                Sign Out
              </button>
            ) : hasSupabase ? (
              <Link
                href="/login"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign In
              </Link>
            ) : null}
          </div>
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
        onAdd={(data) => {
          addWedding(data);
          setShowAdd(false);
        }}
      />
    </div>
  );
}
