/** Стабильные поля для карточки «Идут на встречу», пока API не отдаёт city/rating/meetings. */
export function volunteerAttendingDisplayMeta(volunteerUserId: string): {
  meetingsCount: number;
  rating: number;
} {
  let hash = 0;
  for (let i = 0; i < volunteerUserId.length; i += 1) {
    hash = (hash * 31 + volunteerUserId.charCodeAt(i)) % 9973;
  }
  const meetingsCount = 2 + (hash % 22);
  const rating = Math.round((4.5 + (hash % 6) * 0.1) * 10) / 10;
  return { meetingsCount, rating };
}

export function extractCityFromAddress(address?: string | null): string | null {
  if (!address) return null;
  const trimmed = address.trim();
  if (!trimmed) return null;
  const comma = trimmed.indexOf(',');
  if (comma > 0) return trimmed.slice(0, comma).trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= 2) return trimmed;
  return words.slice(0, 2).join(' ');
}
