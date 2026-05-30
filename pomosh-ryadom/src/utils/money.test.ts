import { describe, expect, it } from 'vitest';
import { formatRubles, formatRublesPlain, parseRublesInput, rublesToKopeks } from './money';

describe('money utils', () => {
  it('formats rubles and clamps negatives', () => {
    expect(formatRubles(1234)).toBe('1 234 ₽');
    expect(formatRubles(-10)).toBe('0 ₽');
  });

  it('parses mixed user input to integer rubles', () => {
    expect(parseRublesInput('12 345 ₽')).toBe(12345);
    expect(parseRublesInput('abc')).toBe(0);
  });

  it('converts rubles to kopeks with rounding', () => {
    expect(rublesToKopeks(10.8)).toBe(1100);
    expect(formatRublesPlain(1500)).toBe('1 500');
  });
});
