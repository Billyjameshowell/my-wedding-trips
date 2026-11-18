export function formatDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysUntil(iso: string): number {
  const target = new Date(iso + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Short caption under the day count. The number is already shown, so this is only the unit. */
export function getDaysLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'day ago';
  if (days < 0) return 'days ago';
  return 'days';
}

/** One phrase for assistive tech, so the count and the unit are read together. */
export function countdownPhrase(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return '1 day ago';
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `${days} days away`;
}

export function getUrgencyClass(days: number): string {
  // Darker steps so the 11px caption clears 4.5:1 on white.
  if (days < 0) return 'text-gray-600';
  if (days <= 7) return 'text-red-700';
  if (days <= 30) return 'text-amber-800';
  return 'text-emerald-800';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
