import { useCallback, useEffect, useState } from 'react';
import { listMyDonations, VolunteerDonation } from '../api/donations';
import { listMySocialParticipations, VolunteerSocialParticipation } from '../api/volunteers';

const COMPLETED_REQUEST_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'INTERRUPTED']);
const ACTIVE_REQUEST_STATUSES = new Set(['VOLUNTEER_RECRUITING', 'WAITING_START', 'IN_PROGRESS', 'COLLECTING']);

export type VolunteerMyDeals = {
  loading: boolean;
  error: string | null;
  activeCount: number;
  completedCount: number;
  activeParticipations: VolunteerSocialParticipation[];
  activeDonations: VolunteerDonation[];
  completedParticipations: VolunteerSocialParticipation[];
  completedDonations: VolunteerDonation[];
  reload: () => Promise<void>;
};

export function useVolunteerMyDeals(): VolunteerMyDeals {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeParticipations, setActiveParticipations] = useState<VolunteerSocialParticipation[]>([]);
  const [activeDonations, setActiveDonations] = useState<VolunteerDonation[]>([]);
  const [completedParticipations, setCompletedParticipations] = useState<VolunteerSocialParticipation[]>([]);
  const [completedDonations, setCompletedDonations] = useState<VolunteerDonation[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [participations, donations] = await Promise.all([
        listMySocialParticipations({ pageSize: 50 }),
        listMyDonations({ pageSize: 50 }),
      ]);

      const activeP = participations.items.filter(
        (item) =>
          item.status === 'JOINED' && ACTIVE_REQUEST_STATUSES.has(item.help_request_status),
      );
      const completedP = participations.items.filter((item) =>
        COMPLETED_REQUEST_STATUSES.has(item.help_request_status),
      );

      const activeD = donations.items.filter((item) =>
        ACTIVE_REQUEST_STATUSES.has(item.help_request_status ?? ''),
      );
      const completedD = donations.items.filter((item) =>
        COMPLETED_REQUEST_STATUSES.has(item.help_request_status ?? ''),
      );

      setActiveParticipations(activeP);
      setCompletedParticipations(completedP);
      setActiveDonations(activeD);
      setCompletedDonations(completedD);
    } catch {
      setError('Не удалось загрузить дела');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    loading,
    error,
    activeCount: activeParticipations.length + activeDonations.length,
    completedCount: completedParticipations.length + completedDonations.length,
    activeParticipations,
    activeDonations,
    completedParticipations,
    completedDonations,
    reload,
  };
}
