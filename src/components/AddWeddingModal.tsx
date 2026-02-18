'use client';

import { useRef, useState } from 'react';
import { AddWeddingInput } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AddWeddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: AddWeddingInput) => void | Promise<void>;
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
  const [formError, setFormError] = useState<string | null>(null);

  const departureDateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);

  function getFlightValidationError() {
    if (!showFlight) return null;

    const trimmedOrigin = origin.trim().toUpperCase();
    const trimmedDestination = destination.trim().toUpperCase();

    if (!trimmedOrigin || !trimmedDestination || !departureDate || !returnDate) {
      return 'Please complete all flight fields or remove flight details.';
    }

    const airportCode = /^[A-Z]{3}$/;
    if (!airportCode.test(trimmedOrigin) || !airportCode.test(trimmedDestination)) {
      return 'Airport codes must be exactly 3 letters (for example: LAX).';
    }

    if (returnDate < departureDate) {
      return 'Return date must be on or after departure date.';
    }

    return null;
  }

  function openReturnPicker() {
    returnDateRef.current?.focus();
    if (typeof returnDateRef.current?.showPicker === 'function') {
      returnDateRef.current.showPicker();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coupleName.trim() || !date || !location.trim() || submitting) return;

    const validationError = getFlightValidationError();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    const trimmedOrigin = origin.trim().toUpperCase();
    const trimmedDestination = destination.trim().toUpperCase();

    setSubmitting(true);
    try {
      await onAdd({
        coupleName: coupleName.trim(),
        date,
        location: location.trim(),
        venue: venue.trim() || undefined,
        flight: showFlight
          ? { origin: trimmedOrigin, destination: trimmedDestination, departureDate, returnDate }
          : undefined,
      });

      setCoupleName('');
      setDate('');
      setLocation('');
      setVenue('');
      setShowFlight(false);
      setOrigin('');
      setDestination('');
      setDepartureDate('');
      setReturnDate('');
      setFormError(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          'relative w-full max-w-lg bg-white rounded-2xl shadow-2xl',
          'animate-in fade-in slide-in-from-bottom-4 duration-300'
        )}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Add a Wedding</h2>
          <p className="text-sm text-gray-500 mb-6">Another one! Let&apos;s get organized.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Who&apos;s getting married?</label>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Wedding Date</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
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

            <div>
              <button
                type="button"
                onClick={() => {
                  setShowFlight(!showFlight);
                  setFormError(null);
                }}
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
                        onChange={(e) => {
                          setOrigin(e.target.value.trim().toUpperCase());
                          setFormError(null);
                        }}
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
                        onChange={(e) => {
                          setDestination(e.target.value.trim().toUpperCase());
                          setFormError(null);
                        }}
                        placeholder="AUS"
                        maxLength={3}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
                          transition-all placeholder:text-gray-300 placeholder:normal-case"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Travel Dates</label>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <input
                        ref={departureDateRef}
                        type="date"
                        value={departureDate}
                        max={returnDate || undefined}
                        onChange={(e) => {
                          const nextDepartureDate = e.target.value;
                          setDepartureDate(nextDepartureDate);
                          if (returnDate && returnDate < nextDepartureDate) {
                            setReturnDate(nextDepartureDate);
                          }
                          setFormError(null);
                          openReturnPicker();
                        }}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                      <span className="text-xs text-gray-400 font-semibold">→</span>
                      <input
                        ref={returnDateRef}
                        type="date"
                        value={returnDate}
                        min={departureDate || undefined}
                        onChange={(e) => {
                          setReturnDate(e.target.value);
                          setFormError(null);
                        }}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">Pick departure first, then return opens right away.</p>
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {formError}
              </div>
            )}

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
