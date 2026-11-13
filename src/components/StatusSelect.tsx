'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@ui-sdk/react/select';
import { STATUS_LABELS, STATUS_ORDER, TrackerStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_ITEMS = STATUS_ORDER.map((status) => ({
  value: status,
  label: STATUS_LABELS[status],
}));

const STATUS_STYLES: Record<TrackerStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700 ring-gray-300',
  watching: 'bg-amber-50 text-amber-800 ring-amber-300',
  booked: 'bg-blue-50 text-blue-800 ring-blue-300',
  done: 'bg-emerald-50 text-emerald-800 ring-emerald-300',
};

interface StatusSelectProps {
  label: string;
  icon: string;
  coupleName: string;
  status: TrackerStatus;
  onChange: (status: TrackerStatus) => void;
}

export default function StatusSelect({
  label,
  icon,
  coupleName,
  status,
  onChange,
}: StatusSelectProps) {
  return (
    <div className="flex items-center justify-between gap-3">
    <Select
      items={STATUS_ITEMS}
      value={status}
      onValueChange={(value) => {
        if (
          value === 'not_started' ||
          value === 'watching' ||
          value === 'booked' ||
          value === 'done'
        ) {
          onChange(value);
        }
      }}
    >
      <SelectLabel className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span aria-hidden="true">{icon}</span>
        {label}
        <span className="sr-only"> status for {coupleName}</span>
      </SelectLabel>
      <SelectTrigger
        className={cn(
          'w-auto shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1',
          STATUS_STYLES[status]
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    </div>
  );
}
