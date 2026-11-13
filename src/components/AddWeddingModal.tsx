'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  type DialogController,
} from '@ui-sdk/react/dialog';
import { Button } from '@ui-sdk/react/button';
import { Field, FieldError, FieldLabel } from '@ui-sdk/react/field';
import { Input } from '@ui-sdk/react/input';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@ui-sdk/react/collapsible';
import { AddWeddingInput } from '@/lib/types';
import DateField from './DateField';

interface AddWeddingModalProps {
  controller: DialogController;
  onAdd: (data: AddWeddingInput) => Promise<boolean>;
}

const primaryButton =
  'rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50';
const secondaryButton =
  'rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50';

export function AddWeddingTrigger({
  controller,
  className,
  children,
}: {
  controller: DialogController;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogTrigger controller={controller} className={className}>
      {children}
    </DialogTrigger>
  );
}

export default function AddWeddingModal({ controller, onAdd }: AddWeddingModalProps) {
  const [coupleName, setCoupleName] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [venue, setVenue] = useState('');
  const [showFlight, setShowFlight] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<string | null>(null);
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function reset() {
    setCoupleName('');
    setDate(null);
    setLocation('');
    setVenue('');
    setShowFlight(false);
    setOrigin('');
    setDestination('');
    setDepartureDate(null);
    setReturnDate(null);
    setFormError(null);
  }

  function flightError() {
    if (!showFlight) return null;
    const trimmedOrigin = origin.trim().toUpperCase();
    const trimmedDestination = destination.trim().toUpperCase();
    if (!trimmedOrigin || !trimmedDestination || !departureDate || !returnDate) {
      return 'Complete every flight field, or close flight details.';
    }
    const airportCode = /^[A-Z]{3}$/;
    if (!airportCode.test(trimmedOrigin) || !airportCode.test(trimmedDestination)) {
      return 'Airport codes are 3 letters, like LAX.';
    }
    if (returnDate < departureDate) {
      return 'The return date has to be on or after departure.';
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validationError = flightError();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (!date) return;
    const flight = showFlight
      ? {
          origin: origin.trim().toUpperCase(),
          destination: destination.trim().toUpperCase(),
          departureDate,
          returnDate,
        }
      : undefined;
    if (flight && (!flight.departureDate || !flight.returnDate)) return;

    setFormError(null);
    setSubmitting(true);
    try {
      const added = await onAdd({
        coupleName: coupleName.trim(),
        date,
        location: location.trim(),
        venue: venue.trim() || undefined,
        flight: flight && flight.departureDate && flight.returnDate
          ? {
              origin: flight.origin,
              destination: flight.destination,
              departureDate: flight.departureDate,
              returnDate: flight.returnDate,
            }
          : undefined,
      });
      if (added) {
        reset();
        controller.close();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog controller={controller}>
      <DialogBackdrop />
      <DialogContent keepMounted>
        <div>
          <DialogTitle>Add a wedding</DialogTitle>
          <DialogDescription>Another one. Let&apos;s get organized.</DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field name="couple-name">
            <FieldLabel>Who&apos;s getting married?</FieldLabel>
            <Input
              value={coupleName}
              onValueChange={setCoupleName}
              placeholder="Sarah & Mike"
              autoComplete="off"
              required
              autoFocus
            />
            <FieldError match="valueMissing">Enter the couple&apos;s names.</FieldError>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateField
              label="Wedding date"
              name="wedding-date"
              value={date}
              onValueChange={setDate}
              required
              calendarLabel="Show ceremony days"
              monthNoun="ceremony"
            />
            <Field name="location">
              <FieldLabel>Location</FieldLabel>
              <Input
                value={location}
                onValueChange={setLocation}
                placeholder="Austin, TX"
                autoComplete="off"
                required
              />
              <FieldError match="valueMissing">Enter a city.</FieldError>
            </Field>
          </div>

          <Field name="venue">
            <FieldLabel>Venue</FieldLabel>
            <Input
              value={venue}
              onValueChange={setVenue}
              placeholder="The Grand Ballroom"
              autoComplete="off"
            />
          </Field>

          <Collapsible
            open={showFlight}
            onOpenChange={(open) => {
              setShowFlight(open);
              setFormError(null);
            }}
          >
            <CollapsibleTrigger className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              <span className="flight-chevron" aria-hidden="true">▸ </span>
              Add flight details
            </CollapsibleTrigger>
            <CollapsiblePanel className="mt-3 space-y-3 border-l-2 border-blue-100 pl-4">
              <div className="grid grid-cols-2 gap-3">
                <Field name="origin" invalid={formError ? true : undefined}>
                  <FieldLabel>From</FieldLabel>
                  <Input
                    value={origin}
                    onValueChange={(value) => {
                      setOrigin(value.toUpperCase().slice(0, 3));
                      setFormError(null);
                    }}
                    placeholder="LAX"
                    autoComplete="off"
                    maxLength={3}
                    required={showFlight}
                    className="uppercase"
                  />
                </Field>
                <Field name="destination" invalid={formError ? true : undefined}>
                  <FieldLabel>To</FieldLabel>
                  <Input
                    value={destination}
                    onValueChange={(value) => {
                      setDestination(value.toUpperCase().slice(0, 3));
                      setFormError(null);
                    }}
                    placeholder="AUS"
                    autoComplete="off"
                    maxLength={3}
                    required={showFlight}
                    className="uppercase"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DateField
                  label="Depart"
                  name="departure"
                  value={departureDate}
                  onValueChange={(next) => {
                    setDepartureDate(next);
                    setFormError(null);
                  }}
                  required={showFlight}
                  calendarLabel="Show outbound days"
                  monthNoun="outbound"
                />
                <DateField
                  label="Return"
                  name="return"
                  value={returnDate}
                  onValueChange={(next) => {
                    setReturnDate(next);
                    setFormError(null);
                  }}
                  required={showFlight}
                  min={departureDate ?? undefined}
                  calendarLabel="Show inbound days"
                  monthNoun="inbound"
                />
              </div>
            </CollapsiblePanel>
          </Collapsible>

          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {formError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <DialogClose className={`flex-1 ${secondaryButton}`}>Cancel</DialogClose>
            <Button type="submit" className={`flex-1 ${primaryButton}`} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save wedding'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
