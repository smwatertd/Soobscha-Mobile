/** Нормализует коды навыков из API (строка или { code / skill_code }). */
export function normalizeSkillCodeList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const codes: string[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      const code = item.trim();
      if (code) codes.push(code);
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const code = record.code ?? record.skill_code ?? record.skillCode;
    if (typeof code === 'string' && code.trim()) {
      codes.push(code.trim());
    }
  }
  return codes;
}
