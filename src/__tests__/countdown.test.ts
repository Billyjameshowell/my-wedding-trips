import { describe, expect, it } from 'vitest';
import { countdownPhrase, getDaysLabel } from '@/lib/utils';

describe('countdown', () => {
  it('keeps the caption in days so it matches the number on the card', () => {
    expect(getDaysLabel(10)).toBe('days');
    expect(getDaysLabel(45)).toBe('days');
    expect(getDaysLabel(1)).toBe('Tomorrow');
    expect(getDaysLabel(0)).toBe('Today');
    expect(getDaysLabel(-1)).toBe('day ago');
    expect(getDaysLabel(-12)).toBe('days ago');

    expect(countdownPhrase(10)).toBe('10 days away');
    expect(countdownPhrase(45)).toBe('45 days away');
    expect(countdownPhrase(-12)).toBe('12 days ago');
  });
});
