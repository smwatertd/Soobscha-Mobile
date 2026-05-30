import { IconName } from '../components/Icon';

/**
 * @deprecated Список для макета. В UI фильтров используйте `ensureLabelCatalogLoaded().beneficiary`.
 */
export const BENEFICIARY_FILTER_CATEGORY_OPTIONS: {
  code: string;
  label: string;
  icon: IconName;
}[] = [
  { code: 'ELDERLY', label: 'Пенсионер', icon: 'leaf' },
  { code: 'LARGE_FAMILY', label: 'Многодетная', icon: 'heart' },
  { code: 'DISABLED', label: 'Инвалидность', icon: 'shield' },
  { code: 'LOW_INCOME', label: 'Малоимущие', icon: 'document' },
  { code: 'SINGLE_PARENT', label: 'Сироты', icon: 'star' },
  { code: 'DISASTER_VICTIM', label: 'Бездомные', icon: 'pin' },
  { code: 'ANIMALS', label: 'Животные', icon: 'heart' },
  { code: 'NGO', label: 'НКО', icon: 'star' },
];

export function getBeneficiaryFilterCategoryLabel(code: string): string | null {
  return BENEFICIARY_FILTER_CATEGORY_OPTIONS.find((item) => item.code === code)?.label ?? null;
}
