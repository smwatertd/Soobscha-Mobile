import { VerificationAttemptStatus } from '../api/verifications';
import { ProfileVerificationStatus } from '../types/profileVerification';

export function mapVerificationAttemptStatus(
  status: VerificationAttemptStatus | null | undefined,
): ProfileVerificationStatus {
  switch (status) {
    case 'PENDING_MODERATION':
      return 'pending';
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case 'REVOKED':
      return 'revoked';
    default:
      return 'none';
  }
}

export function formatVerificationDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
