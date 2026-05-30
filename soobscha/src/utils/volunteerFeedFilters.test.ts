import { describe, expect, it } from 'vitest';
import { applyVolunteerFeedFilters } from './volunteerFeedFilters';

const items = [
  {
    id: '1',
    type: 'social',
    title: 'Уборка парка',
    author: 'Иван',
    reqCategory: 'Экология',
    categoryCode: 'CLEANUP',
    daysLeft: 3,
  },
  {
    id: '2',
    type: 'material',
    title: 'Сбор на лечение',
    author: 'Мария',
    reqCategory: 'Реабилитация',
    categoryCode: 'REHAB',
    daysLeft: 10,
  },
  {
    id: '3',
    type: 'social',
    title: 'Сопровождение',
    author: 'Пётр',
    reqCategory: 'Сопровождение',
    categoryCode: 'COMPANION',
    daysLeft: 1,
  },
] as any[];

describe('applyVolunteerFeedFilters', () => {
  it('applies type + category + search filters', () => {
    const result = applyVolunteerFeedFilters(
      items as any,
      {
        social: true,
        material: false,
        socialCategories: ['COMPANION'],
        materialCategories: [],
        beneficiaryCategories: [],
        datePreset: null,
        sort: 'new',
        maxDistanceKm: 30,
      },
      'пётр',
    );
    expect(result.map((x) => x.id)).toEqual(['3']);
  });

  it('filters by max distance when slider is below default', () => {
    const withDistance = [
      ...items,
      {
        id: '4',
        type: 'social',
        title: 'Далеко',
        author: 'Анна',
        reqCategory: 'Уборка',
        categoryCode: 'CLEANUP',
        distanceKm: 25,
      },
    ] as typeof items;

    const result = applyVolunteerFeedFilters(
      withDistance as typeof items,
      {
        social: true,
        material: true,
        socialCategories: [],
        materialCategories: [],
        beneficiaryCategories: [],
        datePreset: null,
        sort: 'new',
        maxDistanceKm: 10,
      },
      '',
    );
    expect(result.map((x) => x.id)).toEqual(['1', '2', '3']);
    expect(result.find((x) => x.id === '4')).toBeUndefined();
  });

  it('filters material requests by material category', () => {
    const result = applyVolunteerFeedFilters(
      items as any,
      {
        social: false,
        material: true,
        socialCategories: [],
        materialCategories: ['REHAB'],
        beneficiaryCategories: [],
        datePreset: null,
        sort: 'new',
        maxDistanceKm: 30,
      },
      '',
    );
    expect(result.map((x) => x.id)).toEqual(['2']);
  });

  it('sorts by urgency', () => {
    const result = applyVolunteerFeedFilters(
      items as any,
      {
        social: true,
        material: true,
        socialCategories: [],
        materialCategories: [],
        beneficiaryCategories: [],
        datePreset: null,
        sort: 'urgent',
        maxDistanceKm: 30,
      },
      '',
    );
    expect(result.map((x) => x.id)).toEqual(['3', '1', '2']);
  });
});
