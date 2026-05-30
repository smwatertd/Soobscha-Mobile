import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrentBeneficiary, getCurrentBeneficiaryStats } from '../api/beneficiaries';
import { listPayoutMethods, PayoutMethod } from '../api/payoutMethods';
import { getMyContactChannels } from '../api/volunteers';
import { getBeneficiaryCategoryLabel } from '../utils/beneficiaryCategory';
import { formatKopeksRub } from '../utils/formatMoney';
import { mapProfileContacts } from '../utils/profileContacts';
import { isoToDisplayDate } from '../navigation/volunteerVerificationTypes';
import { formatVerificationDate } from '../utils/verificationStatus';
import { useVerificationStatus } from './useVerificationStatus';

export type ProfileStat = { value: string; label: string };
export type ProfilePersonalRow = { label: string; value: string; hint?: string; locked?: boolean };

function readAttemptString(data: Record<string, unknown> | undefined, key: string): string {
  const value = data?.[key];
  return typeof value === 'string' ? value : '';
}

export function useBeneficiaryProfile() {
  const verification = useVerificationStatus();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStat[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [contacts, setContacts] = useState<ReturnType<typeof mapProfileContacts>>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [beneficiary, beneficiaryStats, channels, methods] = await Promise.all([
        getCurrentBeneficiary(),
        getCurrentBeneficiaryStats(),
        getMyContactChannels().catch(() => []),
        listPayoutMethods().catch(() => []),
      ]);

      setDisplayName(beneficiary.full_name);
      setCity(beneficiary.city ?? null);
      setStats([
        { value: String(beneficiaryStats.totals.all), label: 'заявок' },
        { value: String(beneficiaryStats.totals.completed), label: 'успешных' },
        { value: formatKopeksRub(beneficiaryStats.financials.collected_kopeks), label: 'получено' },
      ]);
      setPayoutMethods(methods);
      setContacts(mapProfileContacts(channels, verification.attempt, beneficiary.phone_number));
    } catch {
      setError('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [verification.attempt]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const categoryLabel = getBeneficiaryCategoryLabel(verification.attempt?.category);
  const commonData = verification.attempt?.common_data;

  const personalRows = useMemo<ProfilePersonalRow[]>(() => {
    const rows: ProfilePersonalRow[] = [
      {
        label: 'Город',
        value: city || 'Не указан',
        hint: 'можно поменять без проверки',
        locked: false,
      },
      {
        label: 'ФИО',
        value: displayName || readAttemptString(commonData, 'first_name') || '—',
        locked: true,
      },
    ];

    const birthDate =
      isoToDisplayDate(readAttemptString(commonData, 'birth_date')) ||
      readAttemptString(commonData, 'birth_date');
    if (birthDate) {
      rows.push({ label: 'Дата рождения', value: birthDate, locked: true });
    }

    return rows;
  }, [city, commonData, displayName]);

  const categoryRows = useMemo<ProfilePersonalRow[]>(() => {
    if (!categoryLabel) return [];
    return [{ label: 'Категория', value: categoryLabel, locked: true }];
  }, [categoryLabel]);

  const verificationDate = useMemo(() => {
    if (verification.status === 'approved') return verification.approvedDate;
    if (verification.status === 'pending') {
      return formatVerificationDate(verification.attempt?.created_at);
    }
    return undefined;
  }, [verification.approvedDate, verification.attempt?.created_at, verification.status]);

  const defaultPayout = payoutMethods.find((method) => method.is_default) ?? payoutMethods[0];

  return {
    loading: loading || verification.loading,
    error,
    reload,
    city,
    displayName,
    avatarName: displayName,
    roleLabel: 'Благополучатель',
    categoryLabel,
    stats,
    verification: {
      status: verification.status,
      date: verificationDate,
      reason: verification.reason,
    },
    personalRows,
    categoryRows,
    defaultPayout,
    contacts,
  };
}
