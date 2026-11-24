'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@ui-sdk/react/button';
import { createDialogController } from '@ui-sdk/react/dialog';
import { TrackerStatus } from '@/lib/types';
import { useWeddings } from '@/lib/useWeddings';
import WeddingCard from '@/components/WeddingCard';
import AddWeddingModal, { AddWeddingTrigger } from '@/components/AddWeddingModal';
import DashboardStats from '@/components/DashboardStats';
import EmptyState from '@/components/EmptyState';

const primaryButton =
  'rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray-900/10 hover:bg-gray-800';

export default function Dashboard() {
  const {
    weddings,
    user,
    loading,
    hasSupabase,
    error,
    addWedding,
    updateStatus,
    removeWedding,
    signOut,
    clearError,
  } = useWeddings();
  const [addDialog] = useState(() => createDialogController());

  function handleStatusChange(
    id: string,
    field: 'flightStatus' | 'hotelStatus' | 'giftStatus',
    status: TrackerStatus
  ) {
    updateStatus(id, field, status);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">
              MyWeddingTrips
            </h1>
            <p className="text-xs font-medium text-gray-500">Wedding season, handled.</p>
          </div>
          <div className="flex items-center gap-3">
            {weddings.length > 0 && (
              <AddWeddingTrigger controller={addDialog} className={primaryButton}>
                Add a wedding
              </AddWeddingTrigger>
            )}
            {user ? (
              <Button
                onClick={signOut}
                className="text-sm font-semibold text-gray-600 hover:text-gray-800"
                title={user.email}
              >
                Sign out
              </Button>
            ) : hasSupabase ? (
              <Button
                render={<Link href="/login" />}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Sign in
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-red-800">Something went wrong</div>
              <div className="mt-0.5 break-all text-sm text-red-800">{error}</div>
            </div>
            <Button
              onClick={clearError}
              aria-label="Dismiss error"
              className="text-sm font-bold text-red-800"
            >
              <span aria-hidden="true">✕</span>
            </Button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {weddings.length === 0 ? (
          <EmptyState
            action={
              <AddWeddingTrigger controller={addDialog} className={primaryButton}>
                Add your first wedding
              </AddWeddingTrigger>
            }
          />
        ) : (
          <>
            <DashboardStats weddings={weddings} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {weddings.map((wedding) => (
                <WeddingCard
                  key={wedding.id}
                  wedding={wedding}
                  onStatusChange={handleStatusChange}
                  onDelete={removeWedding}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <AddWeddingModal controller={addDialog} onAdd={addWedding} />
    </div>
  );
}
