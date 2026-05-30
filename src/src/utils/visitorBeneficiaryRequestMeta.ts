import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';
import { formatMoneyRub } from './formatMoney';

/** Подпись под заголовком заявки в профиле благополучателя (для волонтёра). */
export function formatVisitorBeneficiaryRequestMeta(item: VolunteerFeedItem): string | null {
  const parts: string[] = [];

  if (item.reqCategory) {
    parts.push(item.reqCategory);
  }

  if (item.type === 'material') {
    const goal = item.goal ?? 0;
    const collected = item.collected ?? 0;
    if (goal > 0) {
      parts.push(`${formatMoneyRub(collected)} из ${formatMoneyRub(goal)}`);
    } else if (item.donors != null && item.donors > 0) {
      parts.push(`${item.donors} пожертвований`);
    }
  } else {
    if (item.date) {
      parts.push(item.date);
    }
    if (item.volunteers && item.volunteers.max > 0) {
      parts.push(`${item.volunteers.current}/${item.volunteers.max} волонтёров`);
    }
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
