import { helpRequestCategoryIcon } from './helpRequestCategoryIcons';

/** Холодные тона — только для категории помощи (не для категории пользователя). */
const HELP_REQUEST_CATEGORY_PALETTE = {
  social: { color: '#5A47A0', bg: '#E8E0F5' },
  material: { color: '#167068', bg: '#D0EDEA' },
} as const;

export function getHelpRequestCategoryChipPalette(type: 'material' | 'social'): {
  color: string;
  bg: string;
} {
  return HELP_REQUEST_CATEGORY_PALETTE[type];
}

export function getHelpRequestCategoryChipIcon(
  type: 'material' | 'social',
  code: string,
) {
  return helpRequestCategoryIcon(type, code) ?? (type === 'material' ? 'coin' : 'leaf');
}
