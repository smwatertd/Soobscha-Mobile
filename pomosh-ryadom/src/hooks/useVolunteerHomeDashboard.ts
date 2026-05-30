import { useCallback, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { listMyDonations, VolunteerDonation } from '../api/donations';
import {
  getCurrentVolunteer,
  getCurrentVolunteerStats,
  listMySocialParticipations,
  VolunteerSocialParticipation,
} from '../api/volunteers';
import { formatKopeksRub } from '../utils/formatMoney';
import { splitFullName } from '../navigation/volunteerVerificationTypes';

const ACTIVE_STATUSES = new Set(['VOLUNTEER_RECRUITING', 'WAITING_START', 'IN_PROGRESS', 'COLLECTING']);
const COMPLETED_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'INTERRUPTED']);

export type VolunteerHomeDashboard = {
  loading: boolean;
  error: string | null;
  firstName: string;
  fullName: string;
  impactLabel: string;
  impactLine: string;
  impactSub: string;
  activeParticipations: VolunteerSocialParticipation[];
  activeDonations: VolunteerDonation[];
  recentCompletedParticipations: VolunteerSocialParticipation[];
  recentCompletedDonations: VolunteerDonation[];
  activeCount: number;
  reload: () => Promise<void>;
};

function firstNameFrom(fullName: string): string {
  const { firstName } = splitFullName(fullName);
  if (firstName.trim()) return firstName.trim();
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function formatHours(totalMinutes: number): string {
  const hours = Math.max(1, Math.round(totalMinutes / 60));
  const mod10 = hours % 10;
  const mod100 = hours % 100;
  if (mod10 === 1 && mod100 !== 11) return `${hours} час`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${hours} часа`;
  return `${hours} часов`;
}

function currentMonthLabel(): string {
  return new Date()
    .toLocaleDateString('ru-RU', { month: 'long' })
    .replace(/^./, (char) => char.toUpperCase());
}

export function useVolunteerHomeDashboard(): VolunteerHomeDashboard {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [fullName, setFullName] = useState('');
  const [impactLabel, setImpactLabel] = useState('');
  const [impactLine, setImpactLine] = useState('');
  const [impactSub, setImpactSub] = useState('');
  const [activeParticipations, setActiveParticipations] = useState<VolunteerSocialParticipation[]>([]);
  const [activeDonations, setActiveDonations] = useState<VolunteerDonation[]>([]);
  const [recentCompletedParticipations, setRecentCompletedParticipations] = useState<
    VolunteerSocialParticipation[]
  >([]);
  const [recentCompletedDonations, setRecentCompletedDonations] = useState<VolunteerDonation[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [volunteer, stats, participations, donations] = await Promise.all([
        getCurrentVolunteer(),
        getCurrentVolunteerStats(),
        listMySocialParticipations({ pageSize: 10 }),
        listMyDonations({ pageSize: 10 }),
      ]);

      setFullName(volunteer.full_name);
      setFirstName(firstNameFrom(volunteer.full_name));
      setImpactLabel(`ВАШ ВКЛАД В ${currentMonthLabel().toUpperCase()}`);

      const completedMinutes = participations.items
        .filter((item) => COMPLETED_STATUSES.has(item.help_request_status))
        .reduce((sum, item) => sum + (item.duration_minutes ?? 0), 0);

      setImpactLine(
        `${formatKopeksRub(stats.donations.total_kopeks)} · ${formatHours(completedMinutes)}`,
      );
      setImpactSub(
        `${stats.donations.count} пожертв. · ${stats.social_participations.completed} встреч`,
      );

      setActiveParticipations(
        participations.items.filter(
          (item) =>
            item.status === 'JOINED' && ACTIVE_STATUSES.has(item.help_request_status),
        ),
      );
      setActiveDonations(
        donations.items.filter(
          (item) =>
            item.status === 'SUCCEEDED' || ACTIVE_STATUSES.has(item.help_request_status ?? ''),
        ),
      );
      setRecentCompletedParticipations(
        participations.items.filter((item) => COMPLETED_STATUSES.has(item.help_request_status)).slice(0, 2),
      );
      setRecentCompletedDonations(
        donations.items.filter((item) => COMPLETED_STATUSES.has(item.help_request_status ?? '')).slice(0, 2),
      );
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void reload();
    });
    return () => task.cancel();
  }, [reload]);

  return {
    loading,
    error,
    firstName,
    fullName,
    impactLabel,
    impactLine,
    impactSub,
    activeParticipations,
    activeDonations,
    recentCompletedParticipations,
    recentCompletedDonations,
    activeCount: activeParticipations.length + activeDonations.length,
    reload,
  };
}
