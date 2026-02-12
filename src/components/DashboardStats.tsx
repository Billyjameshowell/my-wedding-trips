'use client';

import { Wedding } from '@/lib/types';
import { daysUntil } from '@/lib/utils';

interface DashboardStatsProps {
  weddings: Wedding[];
}

export default function DashboardStats({ weddings }: DashboardStatsProps) {
  const upcoming = weddings.filter((w) => daysUntil(w.date) >= 0);
  const allTrackers = weddings.flatMap((w) => [w.flightStatus, w.hotelStatus, w.giftStatus]);
  const doneCount = allTrackers.filter((s) => s === 'done' || s === 'booked').length;
  const totalCount = allTrackers.length;
  const watchingCount = allTrackers.filter((s) => s === 'watching').length;

  const nextWedding = upcoming.sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextDays = nextWedding ? daysUntil(nextWedding.date) : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <StatCard
        label="Weddings"
        value={upcoming.length.toString()}
        sub="upcoming"
        accent="bg-blue-50 text-blue-700"
      />
      <StatCard
        label="Next One"
        value={nextDays !== null ? `${nextDays}d` : '—'}
        sub={nextWedding?.coupleName || 'none'}
        accent="bg-amber-50 text-amber-700"
      />
      <StatCard
        label="Progress"
        value={totalCount > 0 ? `${Math.round((doneCount / totalCount) * 100)}%` : '—'}
        sub={`${doneCount}/${totalCount} items`}
        accent="bg-emerald-50 text-emerald-700"
      />
      <StatCard
        label="Watching"
        value={watchingCount.toString()}
        sub="prices tracked"
        accent="bg-purple-50 text-purple-700"
      />
    </div>
  );
}

function StatCard({ label, value, sub, accent }: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${accent}`}>
      <div className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-2xl font-black mt-1">{value}</div>
      <div className="text-xs opacity-70 truncate">{sub}</div>
    </div>
  );
}
