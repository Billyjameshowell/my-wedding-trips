'use client';

import { TrackerStatus, STATUS_LABELS, STATUS_ORDER } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<TrackerStatus, { bg: string; text: string; ring: string }> = {
  not_started: { bg: 'bg-gray-100', text: 'text-gray-500', ring: 'ring-gray-200' },
  watching: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  booked: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  done: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
};

const STATUS_ICONS: Record<TrackerStatus, string> = {
  not_started: '○',
  watching: '◉',
  booked: '✓',
  done: '★',
};

interface StatusPillProps {
  label: string;
  icon: string;
  status: TrackerStatus;
  onChange: (status: TrackerStatus) => void;
  compact?: boolean;
}

export default function StatusPill({ label, icon, status, onChange, compact }: StatusPillProps) {
  const style = STATUS_STYLES[status];
  const currentIndex = STATUS_ORDER.indexOf(status);

  function cycleStatus() {
    const next = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];
    onChange(next);
  }

  return (
    <button
      onClick={cycleStatus}
      className={cn(
        'group relative flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 transition-all duration-200',
        'hover:scale-105 hover:shadow-md active:scale-95',
        style.bg,
        style.text,
        style.ring,
        compact && 'px-2 py-1 text-xs'
      )}
      title={`${label}: ${STATUS_LABELS[status]} — click to advance`}
    >
      <span className="text-sm">{icon}</span>
      {!compact && (
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      )}
      <span className={cn('text-[10px] font-bold uppercase', compact && 'text-[9px]')}>
        {STATUS_ICONS[status]} {STATUS_LABELS[status]}
      </span>

      {/* Progress dots */}
      <span className="flex gap-0.5 ml-1">
        {STATUS_ORDER.map((s, i) => (
          <span
            key={s}
            className={cn(
              'h-1 w-1 rounded-full transition-colors',
              i <= currentIndex ? 'bg-current opacity-80' : 'bg-current opacity-20'
            )}
          />
        ))}
      </span>
    </button>
  );
}
