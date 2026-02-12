'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AddWeddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
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
  }) => void | Promise<void>;
}

export default function AddWeddingModal({ isOpen, onClose, onAdd }: AddWeddingModalProps) {
  const [coupleName, setCoupleName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState('');
  const [showFlight, setShowFlight] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coupleName || !date || !location || submitting) return;

    setSubmitting(true);
    try {
      await onAdd({
        coupleName,
        date,
        location,
        venue: venue || undefined,
        flight: showFlight && origin && destination && departureDate && returnDate
          ? { origin: origin.toUpperCase(), destination: destination.toUpperCase(), departureDate, returnDate }
          : undefined,
      });

      // Reset only after successful add
      setCoupleName('');
      setDate('');
      setLocation('');
      setVenue('');
      setShowFlight(false);
      setOrigin('');
      setDestination('');
      setDepartureDate('');
      setReturnDate('');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative w-full max-w-lg bg-white rounded-2xl shadow-2xl',
        'animate-in fade-in slide-in-from-bottom-4 duration-300'
      )}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Add a Wedding</h2>
          <p className="text-sm text-gray-500 mb-6">Another one! Let&apos;s get organized.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Couple name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Who&apos;s getting married?
              </label>
              <input
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="Sarah & Mike"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                  transition-all placeholder:text-gray-300"
                required
                autoFocus
              />
            </div>

            {/* Date & Location row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Wedding Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                    transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Austin, TX"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                    transition-all placeholder:text-gray-300"
                  required
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Venue <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="The Grand Ballroom"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                  transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Flight toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowFlight(!showFlight)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span className={cn('transition-transform', showFlight && 'rotate-90')}>▸</span>
                ✈ Add flight details
              </button>

              {showFlight && (
                <div className="mt-3 space-y-3 pl-5 border-l-2 border-blue-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">From (Airport)</label>
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        placeholder="LAX"
                        maxLength={3}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                          transition-all placeholder:text-gray-300 placeholder:normal-case"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">To (Airport)</label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="AUS"
                        maxLength={3}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                          transition-all placeholder:text-gray-300 placeholder:normal-case"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Depart</label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Return</label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold
                  text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold
                  text-white hover:bg-gray-800 active:scale-[0.98] transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Wedding 🎉'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
