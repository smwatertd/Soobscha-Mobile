import { VolunteerSkillCatalogItem } from '../api/volunteers';
import { humanizeEnumCode } from '../services/labelCatalogState';

/** Коды навыков в заявках иногда отличаются от кодов в каталоге волонтёра. */
const SKILL_CODE_ALIASES: Record<string, string> = {
  COMPANIONSHIP: 'COMPANION',
  GARDEN: 'GARDENING',
};

function lookupSkillLabel(code: string, labelByCode: Map<string, string>): string | undefined {
  const trimmed = code.trim();
  if (!trimmed) return undefined;

  const direct = labelByCode.get(trimmed);
  if (direct) return direct;

  const upper = trimmed.toUpperCase();
  const fromUpper = labelByCode.get(upper);
  if (fromUpper) return fromUpper;

  for (const [key, label] of labelByCode) {
    if (key.toUpperCase() === upper) return label;
  }

  return undefined;
}

export function buildSkillLabelMap(catalog: VolunteerSkillCatalogItem[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const item of catalog) {
    if (item.code && item.label?.trim()) {
      map.set(item.code, item.label.trim());
    }
  }

  for (const [from, to] of Object.entries(SKILL_CODE_ALIASES)) {
    const label = map.get(to);
    if (label && !map.has(from)) {
      map.set(from, label);
    }
  }

  return map;
}

export function resolveSkillLabel(code: string, labelByCode: Map<string, string>): string {
  const trimmed = code.trim();
  if (!trimmed) return '';

  const direct = lookupSkillLabel(trimmed, labelByCode);
  if (direct) return direct;

  const aliasTarget = SKILL_CODE_ALIASES[trimmed] ?? SKILL_CODE_ALIASES[trimmed.toUpperCase()];
  if (aliasTarget) {
    const aliasLabel = lookupSkillLabel(aliasTarget, labelByCode);
    if (aliasLabel) return aliasLabel;
  }

  for (const [from, to] of Object.entries(SKILL_CODE_ALIASES)) {
    if (to === trimmed || to === trimmed.toUpperCase()) {
      const reverseLabel = lookupSkillLabel(from, labelByCode);
      if (reverseLabel) return reverseLabel;
    }
  }

  return humanizeEnumCode(trimmed);
}

export function formatVolunteerSkillCodes(
  codes: string[],
  labelByCode: Map<string, string>,
): string {
  if (!codes.length) return 'Навыки не указаны';
  return codes.map((code) => resolveSkillLabel(code, labelByCode)).join(' · ');
}
