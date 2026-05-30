import { getVolunteerSkillCatalog, VolunteerSkillCatalogItem } from '../api/volunteers';
import { logger } from './logger';

export type { VolunteerSkillCatalogItem };

let cachedCatalog: VolunteerSkillCatalogItem[] | null = null;
let loadPromise: Promise<VolunteerSkillCatalogItem[]> | null = null;

function normalizeSkillCatalogItem(raw: unknown): VolunteerSkillCatalogItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const code = String(record.code ?? record.skill_code ?? record.skillCode ?? '').trim();
  const label = String(record.label ?? record.name ?? record.title ?? '').trim();
  if (!code || !label) return null;

  return {
    code,
    label,
    group: String(record.group ?? record.group_code ?? 'OTHER'),
    group_label: String(record.group_label ?? record.groupLabel ?? record.group ?? 'Прочее'),
    requires_verified: Boolean(record.requires_verified ?? record.requiresVerified ?? false),
  };
}

export function normalizeVolunteerSkillCatalogResponse(data: unknown): VolunteerSkillCatalogItem[] {
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : [];

  return rows
    .map(normalizeSkillCatalogItem)
    .filter((item): item is VolunteerSkillCatalogItem => item != null);
}

async function fetchSkillCatalogFromApi(): Promise<VolunteerSkillCatalogItem[]> {
  try {
    const data = await getVolunteerSkillCatalog();
    return normalizeVolunteerSkillCatalogResponse(data);
  } catch {
    return [];
  }
}

/** Один раз за сессию: каталог навыков. Повторные вызовы — из памяти. */
export async function ensureSkillCatalogLoaded(): Promise<VolunteerSkillCatalogItem[]> {
  if (cachedCatalog) return cachedCatalog;
  if (loadPromise) return loadPromise;

  loadPromise = fetchSkillCatalogFromApi().then((items) => {
    cachedCatalog = items;
    logger.api.debug('skill catalog loaded', { count: items.length });
    return items;
  });

  return loadPromise;
}

export function getVolunteerSkillCatalogItems(): VolunteerSkillCatalogItem[] {
  return cachedCatalog ?? [];
}

export function getSkillCatalogSnapshot(): VolunteerSkillCatalogItem[] | null {
  return cachedCatalog;
}

export function resetSkillCatalogForTests(): void {
  cachedCatalog = null;
  loadPromise = null;
}
