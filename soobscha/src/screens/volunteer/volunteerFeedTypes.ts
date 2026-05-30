import { HelpRequestImageSlide } from '../../utils/parseHelpRequestMediaFiles';

export type VolunteerFeedTabId = 'all' | 'social' | 'material';

export const VOLUNTEER_FEED_TABS = [
  { id: 'all' as const, label: 'Все', count: 0 },
  { id: 'social' as const, label: 'Делом', count: 0 },
  { id: 'material' as const, label: 'Деньгами', count: 0 },
];

export type VolunteerFeedItem = {
  id: string;
  type: 'material' | 'social';
  title: string;
  author: string;
  categoryCode: string;
  reqCategory: string;
  benCategory: string | null;
  benCategoryCode: string | null;
  status: string;
  mediaSlides?: HelpRequestImageSlide[];
  imageUri?: string;
  goal?: number;
  collected?: number;
  donors?: number;
  daysLeft?: number;
  date?: string;
  startAtIso?: string;
  distanceKm?: number;
  volunteers?: { current: number; min: number; max: number };
  isWatched?: boolean;
};
