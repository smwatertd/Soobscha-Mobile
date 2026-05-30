import { getBeneficiaryCategoryLabel } from './beneficiaryCategory';

export type HelpRequestBeneficiaryPublic = {
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  full_name?: string | null;
  /** API: BeneficiaryPublicSummaryResponse.base_category */
  base_category?: string | null;
  baseCategory?: string | null;
  /** legacy / mock */
  category?: string | null;
  beneficiary_category?: string | null;
  city?: string | null;
};

function readCategoryCodeFromRecord(record: Record<string, unknown>): string | null {
  const candidates = [
    record.base_category,
    record.baseCategory,
    record.category,
    record.beneficiary_category,
    record.beneficiaryCategory,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export function parseHelpRequestBeneficiary(
  raw: unknown,
): HelpRequestBeneficiaryPublic | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as HelpRequestBeneficiaryPublic;
}

/** Категория из ответа GET /api/users/{id} или вложенного beneficiary. */
export function getCategoryCodeFromPublicProfile(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const direct = readCategoryCodeFromRecord(record);
  if (direct) return direct;
  const nested = record.beneficiary ?? record.profile ?? record.beneficiary_profile;
  if (nested && typeof nested === 'object') {
    return readCategoryCodeFromRecord(nested as Record<string, unknown>);
  }
  return null;
}

const BENEFICIARY_NAME_FALLBACK = 'Благополучатель';

/** Фамилия, имя и отчество в порядке, принятом для ФИО в РФ. */
export function formatBeneficiaryDisplayName(parts: {
  lastName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  fullName?: string | null;
}): string {
  const full = parts.fullName?.trim();
  if (full) return full;

  const name = [parts.lastName, parts.firstName, parts.middleName]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ');

  return name || BENEFICIARY_NAME_FALLBACK;
}

export function getHelpRequestBeneficiaryName(raw: unknown): string {
  const b = parseHelpRequestBeneficiary(raw);
  if (!b) return BENEFICIARY_NAME_FALLBACK;
  return formatBeneficiaryDisplayName({
    lastName: b.last_name,
    firstName: b.first_name,
    middleName: b.middle_name,
    fullName: b.full_name,
  });
}

export function isPlaceholderBeneficiaryName(name: string): boolean {
  return name.trim() === BENEFICIARY_NAME_FALLBACK;
}

export function getHelpRequestBeneficiaryCategoryCode(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  return readCategoryCodeFromRecord(raw as Record<string, unknown>);
}

export function getHelpRequestBeneficiaryCategoryLabel(raw: unknown): string | null {
  return getBeneficiaryCategoryLabel(getHelpRequestBeneficiaryCategoryCode(raw));
}
