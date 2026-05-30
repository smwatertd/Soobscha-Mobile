import { UserContactChannel } from '../api/volunteers';
import { buildContactRowsFromChannels, readPreferredContactType } from './verificationAttemptView';
import { VerificationAttemptResponse } from '../api/verifications';
import { formatPhoneContactDisplay } from './phone';

export type ProfileContactRow = {
  emoji: string;
  name: string;
  value: string;
  main?: boolean;
};

export function mapProfileContacts(
  channels: UserContactChannel[],
  attempt?: VerificationAttemptResponse | null,
  phoneNumber?: string | null,
): ProfileContactRow[] {
  const preferredType = attempt ? readPreferredContactType(attempt) : null;
  const rows = buildContactRowsFromChannels(channels, preferredType).map((row) => ({
    emoji: row.emoji,
    name: row.label,
    value: row.value,
    main: row.isPrimary,
  }));

  if (phoneNumber?.trim()) {
    const phoneRow: ProfileContactRow = {
      emoji: '📞',
      name: 'Звонок',
      value: formatPhoneContactDisplay(phoneNumber),
      main: rows.every((row) => !row.main),
    };
    return [phoneRow, ...rows.filter((row) => row.value.trim())];
  }

  return rows.filter((row) => row.value.trim());
}
