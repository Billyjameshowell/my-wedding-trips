import { countdownPhrase, getDaysLabel, getUrgencyClass, cn } from '@/lib/utils';

interface CountdownProps {
  days: number;
  size?: 'md' | 'lg';
}

export default function Countdown({ days, size = 'md' }: CountdownProps) {
  return (
    <p className={cn('ml-3 shrink-0 text-right', size === 'lg' && 'ml-4', getUrgencyClass(days))}>
      <span className="sr-only">{countdownPhrase(days)}</span>
      <span aria-hidden="true" className={cn('block font-black leading-none', size === 'lg' ? 'text-4xl' : 'text-2xl')}>
        {days === 0 ? '🎉' : Math.abs(days)}
      </span>
      <span aria-hidden="true" className="mt-0.5 block text-xs font-semibold">
        {getDaysLabel(days)}
      </span>
    </p>
  );
}
