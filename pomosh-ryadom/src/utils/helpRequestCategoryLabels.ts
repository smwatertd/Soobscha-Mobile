import { CodeLabel } from '../api/helpRequests';
import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';
import {
  getHelpRequestCategoryLabelMap,
  resolveCategoryBadgeLabel,
} from '../services/labelCatalogState';

export function buildHelpRequestCategoryLabelMap(
  categories: { social: CodeLabel[]; material: CodeLabel[] },
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of mergeHelpRequestCategoryOptions(categories.social, categories.material)) {
    map.set(item.code, item.label);
  }
  return map;
}

/** Социальные и материальные категории могут иметь одинаковый code (например OTHER). */
export function mergeHelpRequestCategoryOptions(
  social: CodeLabel[],
  material: CodeLabel[],
): CodeLabel[] {
  const map = new Map<string, string>();
  for (const item of [...social, ...material]) {
    if (!map.has(item.code)) {
      map.set(item.code, item.label);
    }
  }
  return [...map.entries()].map(([code, label]) => ({ code, label }));
}

export function resolveCategoryLabel(code: string, map?: Map<string, string>): string {
  if (!code) return 'Заявка';
  const catalog = map ?? getHelpRequestCategoryLabelMap();
  return catalog.get(code) ?? resolveCategoryBadgeLabel(code);
}

export function applyCategoryLabelsToFeedItems(
  items: VolunteerFeedItem[],
  map: Map<string, string>,
): VolunteerFeedItem[] {
  if (!map.size) return items;
  return items.map((item) => ({
    ...item,
    reqCategory: resolveCategoryLabel(item.categoryCode, map),
  }));
}
