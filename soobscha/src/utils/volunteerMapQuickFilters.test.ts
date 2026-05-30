import { describe, expect, it } from 'vitest';
import { DEFAULT_VOLUNTEER_MAP_FILTERS } from '../types/volunteerMapFilters';
import { resolveMapQuickTypeFilter } from './volunteerMapQuickFilters';

describe('resolveMapQuickTypeFilter', () => {
  it('reflects available-to-me and type toggles from full filters', () => {
    expect(
      resolveMapQuickTypeFilter({
        ...DEFAULT_VOLUNTEER_MAP_FILTERS,
        availableToMe: true,
        social: true,
        material: true,
      }),
    ).toBe('available');

    expect(
      resolveMapQuickTypeFilter({
        ...DEFAULT_VOLUNTEER_MAP_FILTERS,
        availableToMe: false,
        social: true,
        material: false,
        socialCategories: ['CLEANING'],
        materialCategories: [],
      }),
    ).toBe('SOCIAL');

    expect(
      resolveMapQuickTypeFilter({
        ...DEFAULT_VOLUNTEER_MAP_FILTERS,
        social: false,
        material: true,
      }),
    ).toBe('MATERIAL');

    expect(
      resolveMapQuickTypeFilter({
        ...DEFAULT_VOLUNTEER_MAP_FILTERS,
        social: true,
        material: true,
      }),
    ).toBe('all');
  });
});
