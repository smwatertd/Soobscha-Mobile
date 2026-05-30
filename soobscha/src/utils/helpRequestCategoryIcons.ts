import { IconName } from '../components/Icon';
import { MATERIAL_CHIP_ICONS } from '../components/beneficiary/create/HelpRequestCategoryPicker';

const SOCIAL_CATEGORY_ICONS: Record<string, IconName> = {
  DELIVERY: 'car',
  TRANSPORTATION: 'car',
  HOUSEHOLD_HELP: 'leaf',
  CARE_ASSISTANCE: 'heart',
  MEDICAL_ACCOMPANIMENT: 'heart',
  DOCUMENTS_HELP: 'document',
  EDUCATION_TUTORING: 'document',
  EMOTIONAL_SUPPORT: 'handshake',
  REPAIR_HELP: 'edit',
  CLEANING: 'leaf',
  FURNITURE: 'document',
  REPAIR: 'edit',
  COMPANION: 'handshake',
  GARDEN: 'leaf',
  OTHER: 'plus',
};

export function helpRequestCategoryIcon(
  type: 'material' | 'social',
  code: string,
): IconName | undefined {
  if (!code) return undefined;
  if (type === 'material') {
    return MATERIAL_CHIP_ICONS[code as keyof typeof MATERIAL_CHIP_ICONS];
  }
  return SOCIAL_CATEGORY_ICONS[code] ?? 'document';
}
