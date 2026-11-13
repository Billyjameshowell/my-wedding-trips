'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@ui-sdk/react/button';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@ui-sdk/react/menu';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  createAlertDialogController,
} from '@ui-sdk/react/alert-dialog';
import { Wedding, TrackerStatus } from '@/lib/types';
import { formatDate, daysUntil, getDaysLabel, getUrgencyClass, cn } from '@/lib/utils';
import StatusSelect from './StatusSelect';

interface WeddingCardProps {
  wedding: Wedding;
  onStatusChange: (id: string, field: 'flightStatus' | 'hotelStatus' | 'giftStatus', status: TrackerStatus) => void;
  onDelete: (id: string) => void;
}

const secondaryButton =
  'flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50';
const dangerButton =
  'flex-1 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900';

export default function WeddingCard({ wedding, onStatusChange, onDelete }: WeddingCardProps) {
  const [confirmRemove] = useState(() => createAlertDialogController());
  const days = daysUntil(wedding.date);
  const isPast = days < 0;
  const allDone = wedding.flightStatus === 'done' && wedding.hotelStatus === 'done' && wedding.giftStatus === 'done';
  const completedCount = [wedding.flightStatus, wedding.hotelStatus, wedding.giftStatus]
    .filter((status) => status === 'done' || status === 'booked').length;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100',
        'transition-all duration-300 hover:shadow-lg hover:ring-gray-200',
        isPast && 'opacity-75'
      )}
    >
      <div className="h-1.5" style={{ backgroundColor: wedding.color }} />

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-gray-900">
              <Button
                render={<Link href={`/wedding/${wedding.id}`} />}
                className="text-left hover:text-blue-700"
              >
                <span className="sr-only">Wedding page for </span>
                {wedding.coupleName}
              </Button>
            </h3>
            <div className="mt-1 text-sm text-gray-600">
              <span aria-hidden="true">📍 </span>
              {wedding.location}
            </div>
          </div>

          <div className="flex items-start gap-1">
            <div className={cn('text-right', getUrgencyClass(days))}>
              <div className="text-2xl font-black leading-none">
                {days === 0 ? '🎉' : Math.abs(days)}
              </div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider">
                {getDaysLabel(days)}
              </div>
            </div>
            <Menu>
              <MenuTrigger
                aria-label={`Actions for ${wedding.coupleName}`}
                className="rounded-lg px-2 py-1 text-lg leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <span aria-hidden="true">⋯</span>
              </MenuTrigger>
              <MenuContent>
                <MenuItem render={<Link href={`/wedding/${wedding.id}`} />}>
                  Open wedding
                </MenuItem>
                <MenuItem destructive onSelect={() => confirmRemove.open()}>
                  Remove wedding
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{formatDate(wedding.date)}</span>
          {wedding.venue && (
            <>
              <span aria-hidden="true" className="text-gray-300">·</span>
              <span className="truncate">{wedding.venue}</span>
            </>
          )}
        </div>

        <div className="mb-4 h-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(completedCount / 3) * 100}%`,
              backgroundColor: wedding.color,
            }}
          />
        </div>

        <div className="space-y-2">
          <StatusSelect
            label="Flight"
            icon="✈"
            coupleName={wedding.coupleName}
            status={wedding.flightStatus}
            onChange={(status) => onStatusChange(wedding.id, 'flightStatus', status)}
          />
          <StatusSelect
            label="Hotel"
            icon="🏨"
            coupleName={wedding.coupleName}
            status={wedding.hotelStatus}
            onChange={(status) => onStatusChange(wedding.id, 'hotelStatus', status)}
          />
          <StatusSelect
            label="Gift"
            icon="🎁"
            coupleName={wedding.coupleName}
            status={wedding.giftStatus}
            onChange={(status) => onStatusChange(wedding.id, 'giftStatus', status)}
          />
        </div>

        {allDone && !isPast && (
          <div className="mt-3 rounded-lg bg-emerald-50 py-1.5 text-center text-sm font-semibold text-emerald-700">
            All set. You&apos;re ready for this one.
          </div>
        )}
      </div>

      <AlertDialog controller={confirmRemove}>
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogTitle>Remove {wedding.coupleName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This drops the wedding and its trip details. You can&apos;t undo it.
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogClose className={secondaryButton}>Cancel</AlertDialogClose>
            <AlertDialogClose
              className={dangerButton}
              value="confirm"
              data-agent-confirm={`Removes ${wedding.coupleName} and their trip details`}
              action={() => onDelete(wedding.id)}
            >
              Remove forever
            </AlertDialogClose>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
