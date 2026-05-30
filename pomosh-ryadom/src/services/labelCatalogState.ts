type CodeLabel = { code: string; label: string };

/** Высота контента BottomNav без safe-area (для позиции geo-кнопки на карте). */
export const BOTTOM_NAV_BAR_HEIGHT = 56;

const FALLBACK_HELP_REQUEST_SOCIAL: CodeLabel[] = [
  { code: 'DELIVERY', label: 'Доставка' },
  { code: 'TRANSPORTATION', label: 'Сопровождение и транспорт' },
  { code: 'HOUSEHOLD_HELP', label: 'Помощь по дому' },
  { code: 'CARE_ASSISTANCE', label: 'Уход и присмотр' },
  { code: 'MEDICAL_ACCOMPANIMENT', label: 'Сопровождение к врачу' },
  { code: 'DOCUMENTS_HELP', label: 'Помощь с документами' },
  { code: 'EDUCATION_TUTORING', label: 'Обучение и репетиторство' },
  { code: 'EMOTIONAL_SUPPORT', label: 'Эмоциональная поддержка' },
  { code: 'REPAIR_HELP', label: 'Помощь с ремонтом' },
];

const FALLBACK_HELP_REQUEST_MATERIAL: CodeLabel[] = [
  { code: 'FOOD', label: 'Еда' },
  { code: 'MEDICINE', label: 'Лекарства' },
  { code: 'MEDICAL_SUPPLIES', label: 'Медицинские товары' },
  { code: 'CLOTHING', label: 'Одежда' },
  { code: 'HYGIENE', label: 'Гигиена' },
  { code: 'CHILDREN_GOODS', label: 'Детские товары' },
  { code: 'HOUSEHOLD_GOODS', label: 'Товары для дома' },
  { code: 'TRANSPORT', label: 'Транспорт' },
  { code: 'HOUSING_UTILITIES', label: 'ЖКХ' },
];

const FALLBACK_BENEFICIARY: CodeLabel[] = [
  { code: 'DISABLED', label: 'Инвалидность' },
  { code: 'LOW_INCOME', label: 'Малоимущий' },
  { code: 'LARGE_FAMILY', label: 'Многодетная семья' },
  { code: 'SINGLE_PARENT', label: 'Одинокий родитель' },
  { code: 'ELDERLY', label: 'Пожилой человек' },
  { code: 'SICK', label: 'Заболевание' },
  { code: 'DISASTER_VICTIM', label: 'Пострадавший от ЧС' },
];

function mergeIntoMap(target: Map<string, string>, items: CodeLabel[]): void {
  for (const item of items) {
    if (item.code && item.label?.trim()) {
      target.set(item.code, item.label.trim());
    }
  }
}

function buildMap(social: CodeLabel[], material: CodeLabel[]): Map<string, string> {
  const map = new Map<string, string>();
  mergeIntoMap(map, social);
  mergeIntoMap(map, material);
  return map;
}

let helpRequestLabelByCode = buildMap(FALLBACK_HELP_REQUEST_SOCIAL, FALLBACK_HELP_REQUEST_MATERIAL);
let beneficiaryLabelByCode = new Map(
  FALLBACK_BENEFICIARY.map((item) => [item.code, item.label] as const),
);

export function getHelpRequestCategoryLabelMap(): Map<string, string> {
  return helpRequestLabelByCode;
}

export function getBeneficiaryCategoryLabelMap(): Map<string, string> {
  return beneficiaryLabelByCode;
}

export function resolveHelpRequestCategoryLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return helpRequestLabelByCode.get(code) ?? null;
}

export function resolveBeneficiaryCategoryLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return beneficiaryLabelByCode.get(code) ?? null;
}

/** Подпись для бейджа: сначала API-справочник, иначе короткий fallback. */
export function resolveCategoryBadgeLabel(code: string | null | undefined): string {
  if (!code) return 'Заявка';
  const fromCatalog =
    helpRequestLabelByCode.get(code) ??
    beneficiaryLabelByCode.get(code);
  if (fromCatalog) return fromCatalog;
  return humanizeEnumCode(code);
}

export function humanizeEnumCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z]+$/i.test(trimmed) && trimmed.length <= 4) {
    return trimmed.toUpperCase();
  }
  return trimmed
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function setHelpRequestCategoryLabels(social: CodeLabel[], material: CodeLabel[]): void {
  helpRequestLabelByCode = buildMap(social, material);
}

export function setBeneficiaryCategoryLabels(items: CodeLabel[]): void {
  beneficiaryLabelByCode = new Map();
  mergeIntoMap(beneficiaryLabelByCode, items);
}

export function resetLabelCatalogStateForTests(): void {
  helpRequestLabelByCode = buildMap(FALLBACK_HELP_REQUEST_SOCIAL, FALLBACK_HELP_REQUEST_MATERIAL);
  beneficiaryLabelByCode = new Map(
    FALLBACK_BENEFICIARY.map((item) => [item.code, item.label] as const),
  );
}

export const LABEL_CATALOG_FALLBACKS = {
  social: FALLBACK_HELP_REQUEST_SOCIAL,
  material: FALLBACK_HELP_REQUEST_MATERIAL,
  beneficiary: FALLBACK_BENEFICIARY,
};
