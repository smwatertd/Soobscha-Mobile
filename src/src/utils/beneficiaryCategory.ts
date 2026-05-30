import { IconName } from '../components/Icon';
import { resolveBeneficiaryCategoryLabel } from '../services/labelCatalogState';

export type BeneficiaryCategoryCode =
  | 'DISABLED'
  | 'LOW_INCOME'
  | 'LARGE_FAMILY'
  | 'SINGLE_PARENT'
  | 'ELDERLY'
  | 'SICK'
  | 'DISASTER_VICTIM';

const LABELS: Record<BeneficiaryCategoryCode, string> = {
  DISABLED: 'Семья с инвалидом',
  LOW_INCOME: 'Малоимущая семья',
  LARGE_FAMILY: 'Многодетная семья',
  SINGLE_PARENT: 'Одинокий родитель',
  ELDERLY: 'Пенсионер',
  SICK: 'Больной',
  DISASTER_VICTIM: 'Пострадавший от ЧС',
};

/**
 * Категория пользователя — только тёплые тона (коралл, терракота, янтарь, роза).
 * Не пересекается с категорией помощи: social #E8E0F5 / #5A47A0, material #D0EDEA / #167068.
 */
export const BENEFICIARY_CATEGORY_PALETTE: Record<
  BeneficiaryCategoryCode,
  { color: string; bg: string }
> = {
  ELDERLY: { color: '#A04A62', bg: '#F8E4EB' },
  DISABLED: { color: '#9E4A42', bg: '#F5E0DC' },
  LOW_INCOME: { color: '#8B5E10', bg: '#F8E9C7' },
  LARGE_FAMILY: { color: '#7A4F1A', bg: '#F5EFE6' },
  SINGLE_PARENT: { color: '#C75653', bg: '#F8E5E3' },
  SICK: { color: '#B24A6E', bg: '#F5E6ED' },
  DISASTER_VICTIM: { color: '#A85C2E', bg: '#F5E4D6' },
};

/** Общий fallback — терракота, не фиолет и не бирюза */
const FALLBACK_PALETTE = { color: '#9E5340', bg: '#F3E6DE' };

/** Иконки категории — как в шаге верификации благополучателя */
const BENEFICIARY_CATEGORY_ICONS: Record<BeneficiaryCategoryCode, IconName> = {
  ELDERLY: 'user',
  DISABLED: 'heart',
  LOW_INCOME: 'wallet',
  LARGE_FAMILY: 'heart',
  SINGLE_PARENT: 'home',
  SICK: 'plus',
  DISASTER_VICTIM: 'warn',
};

export function getBeneficiaryCategoryIcon(code: string | null | undefined): IconName {
  if (!code) return 'user';
  return BENEFICIARY_CATEGORY_ICONS[code as BeneficiaryCategoryCode] ?? 'user';
}

export function getBeneficiaryCategoryLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return resolveBeneficiaryCategoryLabel(code) ?? LABELS[code as BeneficiaryCategoryCode] ?? null;
}

export const BENEFICIARY_CATEGORY_CODES = Object.keys(LABELS) as BeneficiaryCategoryCode[];

export function getBeneficiaryCategoryPalette(code: string | null | undefined): {
  color: string;
  bg: string;
} {
  if (!code) return FALLBACK_PALETTE;
  return BENEFICIARY_CATEGORY_PALETTE[code as BeneficiaryCategoryCode] ?? FALLBACK_PALETTE;
}
