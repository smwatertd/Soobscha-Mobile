import { IconName } from '../components/Icon';
import { resolveHelpRequestCategoryLabel } from '../services/labelCatalogState';

/**
 * @deprecated Список для макета. В UI фильтров используйте `ensureLabelCatalogLoaded().social`.
 * Оставлен для подписей в тестах/legacy.
 */
export const VOLUNTEER_SOCIAL_HELP_TYPE_FILTERS: {
  code: string;
  label: string;
  icon: IconName;
}[] = [
  { code: 'CLEANING', label: 'Уборка', icon: 'leaf' },
  { code: 'SHOPPING', label: 'Покупки', icon: 'document' },
  { code: 'DELIVERY', label: 'Перевозка', icon: 'car' },
  { code: 'MEDICINE', label: 'Лекарства', icon: 'heart' },
  { code: 'GROCERIES', label: 'Продукты', icon: 'document' },
  { code: 'DOG_WALK', label: 'Прогулка', icon: 'heart' },
  { code: 'REPAIR', label: 'Ремонт', icon: 'edit' },
  { code: 'COMPANION', label: 'Сопровождение', icon: 'user' },
  { code: 'HARVEST', label: 'Урожай', icon: 'leaf' },
];

const LABEL_BY_CODE = Object.fromEntries(
  VOLUNTEER_SOCIAL_HELP_TYPE_FILTERS.map((item) => [item.code, item.label]),
) as Record<string, string>;

export function getVolunteerSocialHelpTypeLabel(code: string): string {
  return resolveHelpRequestCategoryLabel(code) ?? LABEL_BY_CODE[code] ?? code;
}
