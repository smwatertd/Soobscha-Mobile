import { IconName } from '../components/Icon';
import { MATERIAL_CHIP_ICONS } from '../components/beneficiary/create/HelpRequestCategoryPicker';

const SOCIAL_ICONS: Partial<Record<string, IconName>> = {
  DELIVERY: 'car',
  TRANSPORTATION: 'car',
  HOUSEHOLD_HELP: 'leaf',
  CARE_ASSISTANCE: 'heart',
  MEDICAL_ACCOMPANIMENT: 'heart',
  DOCUMENTS_HELP: 'document',
  EDUCATION_TUTORING: 'star',
  EMOTIONAL_SUPPORT: 'heart',
  REPAIR_HELP: 'edit',
  CLEANING: 'leaf',
  COMPANION: 'user',
  GARDEN: 'leaf',
  GARDENING: 'leaf',
  OTHER: 'plus',
};

const BENEFICIARY_ICONS: Partial<Record<string, IconName>> = {
  DISABLED: 'shield',
  LOW_INCOME: 'document',
  LARGE_FAMILY: 'heart',
  SINGLE_PARENT: 'star',
  ELDERLY: 'leaf',
  SICK: 'heart',
  DISASTER_VICTIM: 'pin',
};

export function resolveSocialFilterCategoryIcon(code: string): IconName | undefined {
  return SOCIAL_ICONS[code];
}

export function resolveMaterialFilterCategoryIcon(code: string): IconName | undefined {
  return MATERIAL_CHIP_ICONS[code as keyof typeof MATERIAL_CHIP_ICONS];
}

export function resolveBeneficiaryFilterCategoryIcon(code: string): IconName | undefined {
  return BENEFICIARY_ICONS[code];
}
