'use client';

import { Wedding, TrackerStatus } from '@/lib/types';
import { formatDate, daysUntil, getDaysLabel, getUrgencyClass, cn } from '@/lib/utils';
import StatusPill from './StatusPill';
import Link from 'next/link';

interface WeddingCardProps {
  wedding: Wedding;
  onStatusChange: (id: string, field: 'flightStatus' | 'hotelStatus' | 'giftStatus', status: TrackerStatus) => void;
  onDelete: (id: string) => void;
}

export default function WeddingCard({ wedding, onStatusChange, onDelete }: WeddingCardProps) {
  const days = daysUntil(wedding.date);
  const isPast = days < 0;
  const allDone = wedding.flightStatus === 'done' && wedding.hotelStatus === 'done' && wedding.giftStatus === 'done';

  const completedCount = [wedding.flightStatus, wedding.hotelStatus, wedding.giftStatus]
    .filter((s) => s === 'done' || s === 'booked').length;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100',
        'transition-all duration-300 hover:shadow-lg hover:ring-gray-200',
        'hover:-translate-y-1',
        isPast && 'opacity-60'
      )}
    >
      {/* Color accent bar */}
      <div className="h-1.5" style={{ backgroundColor: wedding.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/wedding/${wedding.id}`}
              className="block group/link"
            >
              <h3 className="text-lg font-bold text-gray-900 truncate group-hover/link:text-blue-600 transition-colors">
                {wedding.coupleName}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">📍 {wedding.location}</span>
            </div>
          </div>

          {/* Days countdown */}
          <div className={cn('text-right flex-shrink-0 ml-3', getUrgencyClass(days))}>
            <div className="text-2xl font-black leading-none">
              {days === 0 ? '🎉' : Math.abs(days)}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mt-0.5">
              {getDaysLabel(days)}
            </div>
          </div>
        </div>

        {/* Date & venue */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <span className="font-medium">{formatDate(wedding.date)}</span>
          {wedding.venue && (
            <>
              <span className="text-gray-300">·</span>
              <span className="truncate">{wedding.venue}</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(completedCount / 3) * 100}%`,
              backgroundColor: wedding.color,
            }}
          />
        </div>

        {/* Status trackers */}
        <div className="flex flex-wrap gap-2">
          <StatusPill
            label="Flight"
            icon="✈"
            status={wedding.flightStatus}
            onChange={(s) => onStatusChange(wedding.id, 'flightStatus', s)}
            compact
          />
          <StatusPill
            label="Hotel"
            icon="🏨"
            status={wedding.hotelStatus}
            onChange={(s) => onStatusChange(wedding.id, 'hotelStatus', s)}
            compact
          />
          <StatusPill
            label="Gift"
            icon="🎁"
            status={wedding.giftStatus}
            onChange={(s) => onStatusChange(wedding.id, 'giftStatus', s)}
            compact
          />
        </div>

        {/* All done celebration */}
        {allDone && !isPast && (
          <div className="mt-3 text-center text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-lg py-1.5">
            All set! You&apos;re ready for this one ✨
          </div>
        )}
      </div>

      {/* Delete button - shows on hover */}
      <button
        onClick={() => onDelete(wedding.id)}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity
          text-gray-300 hover:text-red-400 text-sm p-1"
        title="Remove wedding"
      >
        ✕
      </button>
    </div>
  );
}
