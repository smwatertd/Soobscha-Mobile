import { useCallback, useEffect, useState } from 'react';
import { VerificationAttemptResponse, getLatestVerificationAttempt } from '../api/verifications';
import { getErrorMessage } from '../api/errors';
import { ProfileVerificationStatus } from '../types/profileVerification';
import { formatVerificationDate, mapVerificationAttemptStatus } from '../utils/verificationStatus';

export type VerificationStatusState = {
  attempt: VerificationAttemptResponse | null;
  status: ProfileVerificationStatus;
  approvedDate?: string;
  reason?: string;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useVerificationStatus(): VerificationStatusState {
  const [attempt, setAttempt] = useState<VerificationAttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const latest = await getLatestVerificationAttempt();
      setAttempt(latest);
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось загрузить статус верификации'));
      setAttempt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const status = mapVerificationAttemptStatus(attempt?.status);
  const approvedDate =
    status === 'approved' ? formatVerificationDate(attempt?.approved_at ?? attempt?.created_at) : undefined;
  const reason =
    status === 'rejected'
      ? attempt?.rejection_reason ?? undefined
      : status === 'revoked'
        ? attempt?.revocation_reason ?? undefined
        : undefined;

  return {
    attempt,
    status,
    approvedDate,
    reason,
    loading,
    error,
    reload,
  };
}
