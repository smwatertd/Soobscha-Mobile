import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUserPublicProfile } from '../api/users';
import { UserPublicProfile } from '../types/userPublicProfile';
import { ProfileContactRow } from '../utils/profileContacts';
import { buildContactRowsFromChannels } from '../utils/verificationAttemptView';
import { ensureSkillCatalogLoaded } from '../services/skillCatalog';

export function useVisitorVolunteerProfile(userId: string, fallbackName?: string) {
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillLabels, setSkillLabels] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, catalog] = await Promise.all([
        getUserPublicProfile(userId),
        ensureSkillCatalogLoaded().catch(() => null),
      ]);
      setProfile(profileData);
      const labels: Record<string, string> = {};
      for (const skill of catalog) {
        labels[skill.code] = skill.label;
      }
      setSkillLabels(labels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayName = profile?.fullName || fallbackName || 'Волонтёр';
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

  const skillList = useMemo(() => {
    if (!profile?.skills.length) return [];
    return profile.skills.map((code) => skillLabels[code] ?? code);
  }, [profile?.skills, skillLabels]);

  return {
    profile,
    displayName,
    contactRows,
    skillList,
    loading,
    error,
    reload: load,
  };
}
