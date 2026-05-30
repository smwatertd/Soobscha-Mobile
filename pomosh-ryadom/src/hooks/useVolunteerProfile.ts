import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconName } from '../components/Icon';
import { getCurrentVolunteer, getCurrentVolunteerStats, getMyContactChannels } from '../api/volunteers';
import { formatKopeksRub } from '../utils/formatMoney';
import { mapProfileContacts } from '../utils/profileContacts';
import { isoToDisplayDate, normalizePassportNumber } from '../navigation/volunteerVerificationTypes';
import { useVerificationStatus } from './useVerificationStatus';
import { useWatchedHelpRequestsCount } from './useWatchedHelpRequestsCount';

export type ProfileStat = { value: string; label: string };
export type ProfilePersonalRow = { label: string; value: string; hint?: string; locked?: boolean };
export type ProfileMenuItem = {
  icon: IconName;
  label: string;
  sub?: string;
  color: string;
};

const VOLUNTEER_MENU: ProfileMenuItem[] = [
  { icon: 'wallet', label: 'Способы оплаты', sub: 'Скоро', color: '#E89B5A' },
  { icon: 'bell', label: 'Уведомления', sub: 'Включены', color: '#446D9E' },
  { icon: 'qr', label: 'QR-код для связи', color: '#1F6F5C' },
  { icon: 'document', label: 'Договор и оферта', color: '#8A8A8A' },
];

function readAttemptString(data: Record<string, unknown> | undefined, key: string): string {
  const value = data?.[key];
  return typeof value === 'string' ? value : '';
}

export function useVolunteerProfile() {
  const verification = useVerificationStatus();
  const watchedCount = useWatchedHelpRequestsCount();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStat[]>([]);
  const [contacts, setContacts] = useState<ReturnType<typeof mapProfileContacts>>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [volunteer, volunteerStats, channels] = await Promise.all([
        getCurrentVolunteer(),
        getCurrentVolunteerStats(),
        getMyContactChannels().catch(() => []),
      ]);

      setDisplayName(volunteer.full_name);
      setCity(volunteer.city ?? null);
      setStats([
        {
          value: String(volunteerStats.social_participations.completed),
          label: 'встреч',
        },
        {
          value: formatKopeksRub(volunteerStats.donations.total_kopeks),
          label: 'помог',
        },
        {
          value: String(volunteerStats.donations.count),
          label: 'пожертв.',
        },
      ]);
      setContacts(mapProfileContacts(channels, verification.attempt, volunteer.phone_number));
    } catch {
      setError('Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [verification.attempt]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const commonData = verification.attempt?.common_data;

  const personalRows = useMemo<ProfilePersonalRow[]>(() => {
    const rows: ProfilePersonalRow[] = [
      {
        label: 'Город',
        value: city || readAttemptString(commonData, 'city') || 'Не указан',
        hint: 'можно поменять без проверки',
        locked: false,
      },
      {
        label: 'ФИО',
        value: displayName || '—',
        locked: true,
      },
    ];

    const birthDate =
      isoToDisplayDate(readAttemptString(commonData, 'birth_date')) ||
      readAttemptString(commonData, 'birth_date');
    if (birthDate) {
      rows.push({ label: 'Дата рождения', value: birthDate, locked: true });
    }

    const passport = normalizePassportNumber(readAttemptString(commonData, 'passport_series_number'));
    if (passport) {
      rows.push({ label: 'Паспорт', value: passport, locked: true });
    }

    return rows;
  }, [city, commonData, displayName]);

  const menu = useMemo<ProfileMenuItem[]>(
    () => [
      {
        icon: 'heart',
        label: 'Избранное',
        sub: watchedCount > 0 ? `${watchedCount} заявок` : 'Отслеживаемые заявки',
        color: '#C75653',
      },
      ...VOLUNTEER_MENU,
    ],
    [watchedCount],
  );

  return {
    loading: loading || verification.loading,
    error,
    reload,
    city,
    displayName,
    avatarName: displayName,
    roleLabel: 'Волонтёр',
    stats,
    verification,
    personalRows,
    contacts,
    menu,
  };
}
