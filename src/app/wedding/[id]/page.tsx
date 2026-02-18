'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TrackerStatus } from '@/lib/types';
import { useWeddings } from '@/lib/useWeddings';
import { formatDate, daysUntil, getDaysLabel, getUrgencyClass, cn } from '@/lib/utils';
import StatusPill from '@/components/StatusPill';
import PriceChart from '@/components/PriceChart';
import Link from 'next/link';

export default function WeddingDetailPage() {
  const params = useParams();
  const { weddings, loading, updateStatus, updateDetails, savePriceCheck } = useWeddings();
  const [editing, setEditing] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [editForm, setEditForm] = useState({
    coupleName: '',
    date: '',
    location: '',
    venue: '',
    notes: '',
    hotelDetails: '',
    giftDetails: '',
  });

  const wedding = weddings.find((w) => w.id === params.id);

  useEffect(() => {
    if (wedding) {
      setEditForm({
        coupleName: wedding.coupleName,
        date: wedding.date,
        location: wedding.location,
        venue: wedding.venue || '',
        notes: wedding.notes || '',
        hotelDetails: wedding.hotelDetails || '',
        giftDetails: wedding.giftDetails || '',
      });
    }
  }, [wedding]);

  async function handleCheckPrice() {
    if (!wedding?.flight) return;
    setPriceLoading(true);
    setPriceError(null);
    try {
      const searchParams = new URLSearchParams({
        origin: wedding.flight.origin,
        destination: wedding.flight.destination,
        departureDate: wedding.flight.departureDate,
        returnDate: wedding.flight.returnDate,
      });
      const res = await fetch(`/api/flights?${searchParams}`);
      const result = await res.json();
      if (!res.ok) {
        setPriceError(result.error || `Price check failed (${res.status})`);
      } else if (result.lowestPrice) {
        setLatestPrice(result.lowestPrice);
        // Persist to price history
        await savePriceCheck(wedding.id, result.lowestPrice);
      } else {
        setPriceError('No flight prices found for these dates.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setPriceError(`Price check failed: ${msg}`);
    }
    setPriceLoading(false);
  }

  function handleStatusChange(field: 'flightStatus' | 'hotelStatus' | 'giftStatus', status: TrackerStatus) {
    if (!wedding) return;
    updateStatus(wedding.id, field, status);
  }

  function handleSaveEdit() {
    if (!wedding) return;
    updateDetails(wedding.id, {
      coupleName: editForm.coupleName,
      date: editForm.date,
      location: editForm.location,
      venue: editForm.venue || undefined,
      notes: editForm.notes || undefined,
      hotelDetails: editForm.hotelDetails || undefined,
      giftDetails: editForm.giftDetails || undefined,
    });
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-300 text-lg">Loading...</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🤔</div>
          <p className="text-gray-500 mb-4">Wedding not found</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const days = daysUntil(wedding.date);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: wedding.color }} />
        <div className="relative max-w-2xl mx-auto px-4 pt-6 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            ← Dashboard
          </Link>

          {!editing ? (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-black text-gray-900">{wedding.coupleName}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-600">
                    <span>📍 {wedding.location}</span>
                    <span className="text-gray-300">·</span>
                    <span>{formatDate(wedding.date)}</span>
                    {wedding.venue && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span>{wedding.venue}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className={cn('text-right flex-shrink-0 ml-4', getUrgencyClass(days))}>
                  <div className="text-4xl font-black">{days === 0 ? '🎉' : Math.abs(days)}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider">{getDaysLabel(days)}</div>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Edit details
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.coupleName}
                onChange={(e) => setEditForm({ ...editForm, coupleName: e.target.value })}
                className="w-full text-2xl font-bold rounded-xl border border-gray-200 px-4 py-2
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Location"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  type="text"
                  value={editForm.venue}
                  onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                  placeholder="Venue"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                    hover:bg-gray-800 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600
                    hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status trackers */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Trip Status</h2>
          <div className="space-y-3">
            <StatusRow
              label="Flight"
              icon="✈"
              status={wedding.flightStatus}
              onChange={(s) => handleStatusChange('flightStatus', s)}
            />
            <StatusRow
              label="Hotel"
              icon="🏨"
              status={wedding.hotelStatus}
              onChange={(s) => handleStatusChange('hotelStatus', s)}
            />
            <StatusRow
              label="Gift"
              icon="🎁"
              status={wedding.giftStatus}
              onChange={(s) => handleStatusChange('giftStatus', s)}
            />
          </div>
        </div>

        {/* Flight details & price chart */}
        {wedding.flight && (
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Flight Details</h2>
              {wedding.flightStatus !== 'done' && (
                <button
                  onClick={handleCheckPrice}
                  disabled={priceLoading}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors
                    disabled:opacity-50"
                >
                  {priceLoading ? 'Checking...' : 'Check Price Now'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-black text-gray-900">{wedding.flight.origin}</div>
                <div className="text-xs text-gray-400">{formatDate(wedding.flight.departureDate)}</div>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-300 text-sm">✈</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-gray-900">{wedding.flight.destination}</div>
                <div className="text-xs text-gray-400">{formatDate(wedding.flight.returnDate)}</div>
              </div>
            </div>

            {/* Live price result */}
            {latestPrice && (
              <div className="mb-4 bg-blue-50 rounded-xl p-3 text-center animate-in">
                <div className="text-xs text-blue-600 font-semibold">Current lowest fare</div>
                <div className="text-xl font-black text-blue-700">${latestPrice}</div>
              </div>
            )}

            {/* Price check error */}
            {priceError && (
              <div className="mb-4 bg-red-50 rounded-xl p-3 text-center animate-in">
                <div className="text-xs text-red-600 font-semibold">{priceError}</div>
              </div>
            )}

            {wedding.flightStatus === 'booked' && wedding.flight.pricePaid && (
              <div className="mb-4 bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xs text-emerald-600 font-semibold">Booked for</div>
                <div className="text-xl font-black text-emerald-700">${wedding.flight.pricePaid}</div>
              </div>
            )}

            <PriceChart
              history={wedding.flight.priceHistory}
              threshold={wedding.flight.priceThreshold}
            />
          </div>
        )}

        {/* Guest seat */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Guest Seat</h2>
          <p className="text-xs text-gray-400 mb-4">
            Invite your plus-one to view this wedding&apos;s trip details. One free guest per wedding!
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="partner@email.com"
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                transition-all placeholder:text-gray-300"
            />
            <button
              onClick={async () => {
                if (!guestEmail) return;
                // For now, just show confirmation. Full Supabase integration sends real invite.
                setGuestMessage(`Invite sent to ${guestEmail}!`);
                setGuestEmail('');
                setTimeout(() => setGuestMessage(''), 3000);
              }}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              Invite
            </button>
          </div>
          {guestMessage && (
            <div className="mt-2 text-xs font-medium text-emerald-600 animate-in">{guestMessage}</div>
          )}
        </div>

        {/* Notes section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Notes</h2>
          <div className="space-y-3">
            <NoteField
              label="Hotel Details"
              value={wedding.hotelDetails || ''}
              placeholder="Hotel name, confirmation #, check-in/out dates..."
              onChange={(v) => updateDetails(wedding.id, { hotelDetails: v || undefined })}
            />
            <NoteField
              label="Gift Details"
              value={wedding.giftDetails || ''}
              placeholder="Registry link, gift idea, budget..."
              onChange={(v) => updateDetails(wedding.id, { giftDetails: v || undefined })}
            />
            <NoteField
              label="Notes"
              value={wedding.notes || ''}
              placeholder="Anything else to remember..."
              onChange={(v) => updateDetails(wedding.id, { notes: v || undefined })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, icon, status, onChange }: {
  label: string;
  icon: string;
  status: TrackerStatus;
  onChange: (s: TrackerStatus) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <StatusPill label={label} icon={icon} status={status} onChange={onChange} />
    </div>
  );
}

function NoteField({ label, value, placeholder, onChange }: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleBlur() {
    if (localValue !== value) onChange(localValue);
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
          transition-all placeholder:text-gray-300"
      />
    </div>
  );
}
