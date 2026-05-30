import { describe, expect, it } from 'vitest';
import { formatCityMetaLine, formatCityPopulationCount } from './cityDisplay';

describe('formatCityPopulationCount', () => {
  it('formats millions and thousands', () => {
    expect(formatCityPopulationCount(13_000_000)).toBe('13 млн жителей');
    expect(formatCityPopulationCount(335_000)).toBe('335 тыс. жителей');
  });
});

describe('formatCityMetaLine', () => {
  it('prefers description over population', () => {
    expect(
      formatCityMetaLine({
        code: 'x',
        label: 'X',
        description: 'Столица России',
        population: 13_000_000,
      }),
    ).toBe('Столица России');
  });

  it('builds region and population from API fields', () => {
    expect(
      formatCityMetaLine({
        code: 'podolsk',
        label: 'Подольск',
        region: 'Московская обл.',
        population: 335_000,
      }),
    ).toBe('Московская обл. · 335 тыс. жителей');
  });
});
