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

export function getDaysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days} days`;
  if (days <= 30) return `${Math.ceil(days / 7)} weeks`;
  return `${Math.ceil(days / 30)} months`;
}

export function getUrgencyClass(days: number): string {
  if (days < 0) return 'text-gray-400';
  if (days <= 7) return 'text-red-500';
  if (days <= 30) return 'text-amber-500';
  return 'text-emerald-500';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
