import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBeneficiaryPublicHelpRequests } from '../api/helpRequests';
import { getUserPublicProfile } from '../api/users';
import { UserPublicProfile } from '../types/userPublicProfile';
import { ProfileContactRow } from '../utils/profileContacts';
import { buildContactRowsFromChannels } from '../utils/verificationAttemptView';
import { classifyVisitorBeneficiaryFeedItems } from '../utils/visitorBeneficiaryHelpRequests';
import { mapHelpRequestToVolunteerFeedItem } from '../utils/volunteerFeedMapper';
import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';
import { getBeneficiaryCategoryLabel } from '../utils/beneficiaryCategory';

export function useVisitorBeneficiaryProfile(userId: string, fallbackName?: string) {
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [requests, setRequests] = useState<VolunteerFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [profileData, requestItems] = await Promise.all([
          getUserPublicProfile(userId),
          getBeneficiaryPublicHelpRequests(userId),
        ]);
        setProfile(profileData);
        setRequests(requestItems.map(mapHelpRequestToVolunteerFeedItem));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void load('initial');
  }, [load]);

  const buckets = useMemo(() => classifyVisitorBeneficiaryFeedItems(requests), [requests]);

  const displayName = profile?.fullName || fallbackName || 'Благополучатель';
  const categoryLabel = getBeneficiaryCategoryLabel(profile?.baseCategory ?? null);
  const contactRows: ProfileContactRow[] = useMemo(() => {
    if (!profile) return [];
    return buildContactRowsFromChannels(
      profile.contactChannels,
      profile.preferredContactChannelType,
    ).map((row) => ({
      emoji: row.emoji,
      name: row.label,
      value: row.value,
      main: row.isPrimary,
    }));
  }, [profile]);

  const stats = useMemo(
    () => [
      { value: String(buckets.active.length), label: 'активных' },
      { value: String(buckets.completed.length), label: 'завершено' },
    ],
    [buckets.active.length, buckets.completed.length],
  );

  return {
    profile,
    displayName,
    categoryLabel,
    contactRows,
    stats,
    buckets,
    loading,
    refreshing,
    error,
    reload: () => load('refresh'),
  };
}
