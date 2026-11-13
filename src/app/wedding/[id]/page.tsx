'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@ui-sdk/react/button';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@ui-sdk/react/dialog';
import { Field, FieldLabel } from '@ui-sdk/react/field';
import { Input } from '@ui-sdk/react/input';
import { Textarea } from '@ui-sdk/react/textarea';
import { Toast, ToastDescription, ToastRegion, ToastTitle, createToaster } from '@ui-sdk/react/toast';
import { TrackerStatus } from '@/lib/types';
import { useWeddings } from '@/lib/useWeddings';
import { formatDate, daysUntil, getDaysLabel, getUrgencyClass, cn } from '@/lib/utils';
import StatusSelect from '@/components/StatusSelect';
import DateField from '@/components/DateField';
import PriceChart from '@/components/PriceChart';

const primaryButton =
  'rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50';
const secondaryButton =
  'rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50';

export default function WeddingDetailPage() {
  const params = useParams();
  const { weddings, loading, updateStatus, updateDetails, savePriceCheck } = useWeddings();
  const [editing, setEditing] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [toaster] = useState(() => createToaster());
  const [editForm, setEditForm] = useState({
    coupleName: '',
    date: null as string | null,
    location: '',
    venue: '',
  });

  const wedding = weddings.find((item) => item.id === params.id);

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

  function handleEditOpen(open: boolean) {
    if (open && wedding) {
      setEditForm({
        coupleName: wedding.coupleName,
        date: wedding.date,
        location: wedding.location,
        venue: wedding.venue || '',
      });
    }
    setEditing(open);
  }

  function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!wedding || !editForm.date) return;
    updateDetails(wedding.id, {
      coupleName: editForm.coupleName.trim(),
      date: editForm.date,
      location: editForm.location.trim(),
      venue: editForm.venue.trim() || undefined,
    });
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-500">Loading…</div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-3 text-4xl" aria-hidden="true">🤔</div>
          <p className="mb-4 text-gray-600">Wedding not found</p>
          <Button
            render={<Link href="/" />}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const days = daysUntil(wedding.date);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: wedding.color }} />
        <div className="relative mx-auto max-w-2xl px-4 pt-6 pb-8">
          <Button
            render={<Link href="/" />}
            className="mb-4 text-sm text-gray-600 hover:text-gray-800"
          >
            Back to dashboard
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{wedding.coupleName}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-600">
                <span>{wedding.location}</span>
                <span aria-hidden="true" className="text-gray-300">·</span>
                <span>{formatDate(wedding.date)}</span>
                {wedding.venue && (
                  <>
                    <span aria-hidden="true" className="text-gray-300">·</span>
                    <span>{wedding.venue}</span>
                  </>
                )}
              </div>
            </div>
            <div className={cn('ml-4 shrink-0 text-right', getUrgencyClass(days))}>
              <div className="text-4xl font-black">{days === 0 ? '🎉' : Math.abs(days)}</div>
              <div className="text-xs font-semibold uppercase tracking-wider">{getDaysLabel(days)}</div>
            </div>
          </div>

          <Dialog open={editing} onOpenChange={handleEditOpen}>
            <DialogTrigger className="mt-3 text-sm font-semibold text-gray-600 hover:text-gray-800">
              Edit details
            </DialogTrigger>
            <DialogBackdrop />
            <DialogContent>
              <div>
                <DialogTitle>Edit {wedding.coupleName}</DialogTitle>
                <DialogDescription>Update the names, day, city, or venue.</DialogDescription>
              </div>
              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <Field name="edit-couple">
                  <FieldLabel>Couple</FieldLabel>
                  <Input
                    value={editForm.coupleName}
                    onValueChange={(value) => setEditForm({ ...editForm, coupleName: value })}
                    placeholder="Sarah & Mike"
                    autoComplete="off"
                    required
                  />
                </Field>
                <DateField
                  label="Wedding date"
                  name="edit-date"
                  value={editForm.date}
                  onValueChange={(value) => setEditForm({ ...editForm, date: value })}
                  required
                  calendarLabel="Show ceremony days"
                  monthNoun="ceremony"
                />
                <Field name="edit-location">
                  <FieldLabel>Location</FieldLabel>
                  <Input
                    value={editForm.location}
                    onValueChange={(value) => setEditForm({ ...editForm, location: value })}
                    placeholder="Austin, TX"
                    autoComplete="off"
                    required
                  />
                </Field>
                <Field name="edit-venue">
                  <FieldLabel>Venue</FieldLabel>
                  <Input
                    value={editForm.venue}
                    onValueChange={(value) => setEditForm({ ...editForm, venue: value })}
                    placeholder="The Grand Ballroom"
                    autoComplete="off"
                  />
                </Field>
                <div className="flex gap-3">
                  <DialogClose className={`flex-1 ${secondaryButton}`}>Cancel</DialogClose>
                  <Button type="submit" className={`flex-1 ${primaryButton}`}>
                    Save details
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900">Trip status</h2>
          <div className="space-y-3">
            <StatusSelect
              label="Flight"
              icon="✈"
              coupleName={wedding.coupleName}
              status={wedding.flightStatus}
              onChange={(status) => handleStatusChange('flightStatus', status)}
            />
            <StatusSelect
              label="Hotel"
              icon="🏨"
              coupleName={wedding.coupleName}
              status={wedding.hotelStatus}
              onChange={(status) => handleStatusChange('hotelStatus', status)}
            />
            <StatusSelect
              label="Gift"
              icon="🎁"
              coupleName={wedding.coupleName}
              status={wedding.giftStatus}
              onChange={(status) => handleStatusChange('giftStatus', status)}
            />
          </div>
        </div>

        {wedding.flight && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">Flight details</h2>
              {wedding.flightStatus !== 'done' && (
                <Button
                  onClick={handleCheckPrice}
                  disabled={priceLoading}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50"
                >
                  {priceLoading ? 'Checking…' : 'Check price now'}
                </Button>
              )}
            </div>

            <div className="mb-4 flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-black text-gray-900">{wedding.flight.origin}</div>
                <div className="text-xs text-gray-500">{formatDate(wedding.flight.departureDate)}</div>
              </div>
              <div className="flex flex-1 items-center gap-1">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm text-gray-400" aria-hidden="true">✈</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-gray-900">{wedding.flight.destination}</div>
                <div className="text-xs text-gray-500">{formatDate(wedding.flight.returnDate)}</div>
              </div>
            </div>

            {latestPrice && (
              <div className="animate-in mb-4 rounded-xl bg-blue-50 p-3 text-center">
                <div className="text-xs font-semibold text-blue-700">Current lowest fare</div>
                <div className="text-xl font-black text-blue-800">${latestPrice}</div>
              </div>
            )}

            {priceError && (
              <div className="animate-in mb-4 rounded-xl bg-red-50 p-3 text-center">
                <div className="text-sm font-semibold text-red-800">{priceError}</div>
              </div>
            )}

            {wedding.flightStatus === 'booked' && wedding.flight.pricePaid && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-center">
                <div className="text-xs font-semibold text-emerald-700">Booked for</div>
                <div className="text-xl font-black text-emerald-800">${wedding.flight.pricePaid}</div>
              </div>
            )}

            <PriceChart
              history={wedding.flight.priceHistory}
              threshold={wedding.flight.priceThreshold}
            />
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-900">Guest seat</h2>
          <p className="mb-4 text-sm text-gray-600">
            Invite your plus-one to view this wedding&apos;s trip details. One free guest per wedding.
          </p>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!guestEmail.trim()) return;
              const invited = guestEmail.trim();
              setGuestEmail('');
              toaster(`Invite noted for ${invited}`, {
                description: 'Sending a real guest invite is not wired up yet.',
              });
            }}
          >
            <Field name="guest-email" className="flex-1">
              <FieldLabel>Guest email</FieldLabel>
              <Input
                type="email"
                value={guestEmail}
                onValueChange={setGuestEmail}
                placeholder="partner@email.com"
                autoComplete="email"
                required
              />
            </Field>
            <Button type="submit" className={`sm:self-end ${primaryButton}`}>
              Send invite
            </Button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-900">Notes</h2>
          <div className="space-y-3">
            <NoteField
              key={`${wedding.id}-hotel`}
              label="Hotel details"
              name="hotel-details"
              value={wedding.hotelDetails || ''}
              placeholder="Hotel name, confirmation number, check-in and check-out"
              onCommit={(value) => updateDetails(wedding.id, { hotelDetails: value || undefined })}
            />
            <NoteField
              key={`${wedding.id}-gift`}
              label="Gift details"
              name="gift-details"
              value={wedding.giftDetails || ''}
              placeholder="Registry link, gift idea, or budget"
              onCommit={(value) => updateDetails(wedding.id, { giftDetails: value || undefined })}
            />
            <NoteField
              key={`${wedding.id}-notes`}
              label="Notes"
              name="notes"
              value={wedding.notes || ''}
              placeholder="Anything else to remember"
              onCommit={(value) => updateDetails(wedding.id, { notes: value || undefined })}
            />
          </div>
        </div>
      </div>

      <ToastRegion toaster={toaster} data-agent-hidden aria-label="Notices">
        {() => (
          <Toast>
            <ToastTitle />
            <ToastDescription />
          </Toast>
        )}
      </ToastRegion>
    </div>
  );
}

function NoteField({
  label,
  name,
  value,
  placeholder,
  onCommit,
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  return (
    <Field name={name}>
      <FieldLabel>{label}</FieldLabel>
      <Textarea
        defaultValue={value}
        placeholder={placeholder}
        rows={2}
        onValueChange={(next, details) => {
          if (details.source === 'agent' && next !== value) onCommit(next);
        }}
        onBlur={(event) => {
          const next = event.currentTarget.value;
          if (next !== value) onCommit(next);
        }}
      />
    </Field>
  );
}
