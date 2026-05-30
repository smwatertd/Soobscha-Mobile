import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { InteractionManager } from 'react-native';
import { getAvailableCities } from '../api/locations';
import { getErrorMessage } from '../api/errors';
import {
  createVerificationAttempt,
  VerificationAttemptResponse,
} from '../api/verifications';
import {
  getCurrentVolunteer,
  getMyContactChannels,
} from '../api/volunteers';
import { ensureSkillCatalogLoaded } from '../services/skillCatalog';
import {
  buildVolunteerVerificationPayload,
  createEmptyVolunteerVerifDraft,
  splitFullName,
  VolunteerSkillEvidenceDraft,
  VolunteerVerifDraft,
} from '../navigation/volunteerVerificationTypes';
import { buildVolunteerVerifDraftFromAttempt } from '../utils/volunteerVerifDraftFromAttempt';
import {
  loadVerificationPreferredContact,
  saveVerificationPreferredContact,
} from '../utils/volunteerVerifStorage';
import { loadSession } from '../services/authStorage';

type VolunteerVerifDraftContextValue = {
  draft: VolunteerVerifDraft;
  patchDraft: (patch: Partial<VolunteerVerifDraft>) => void;
  resetDraft: () => void;
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  loadDraftForUpdate: (attempt: VerificationAttemptResponse) => Promise<void>;
  submit: () => Promise<{ attemptId: string }>;
  submitting: boolean;
};

const VolunteerVerifDraftContext = createContext<VolunteerVerifDraftContextValue | null>(null);

export function VolunteerVerifDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<VolunteerVerifDraft>(createEmptyVolunteerVerifDraft);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const patchDraft = useCallback((patch: Partial<VolunteerVerifDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(createEmptyVolunteerVerifDraft());
    setInitialized(false);
  }, []);

  const reload = useCallback(async () => {
    const session = await loadSession();
    if (session?.role !== 'VOLUNTEER') {
      setInitialized(true);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [volunteer, catalog, cities] = await Promise.all([
        getCurrentVolunteer(),
        ensureSkillCatalogLoaded(),
        getAvailableCities().catch(() => []),
      ]);

      const nameParts = splitFullName(volunteer.full_name);
      const cityLabel = volunteer.city ?? '';
      const cityMatch = cities.find((city) => city.label === cityLabel);
      const skills: VolunteerSkillEvidenceDraft[] = catalog.map((item) => ({
        skillCode: item.code,
        label: item.label,
        requiresDocument: item.requires_verified,
        selected: false,
        photos: [],
        comment: '',
      }));

      setDraft((prev) => ({
        ...createEmptyVolunteerVerifDraft(),
        ...nameParts,
        city: cityLabel,
        cityCode: cityMatch?.code ?? '',
        skills,
        contacts: prev.contacts.length ? prev.contacts : createEmptyVolunteerVerifDraft().contacts,
      }));
      setInitialized(true);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Не удалось загрузить данные для верификации'));
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDraftForUpdate = useCallback(async (attempt: VerificationAttemptResponse) => {
    const session = await loadSession();
    if (session?.role !== 'VOLUNTEER') {
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [volunteer, catalog, cities, channels, preferredStorage] = await Promise.all([
        getCurrentVolunteer(),
        ensureSkillCatalogLoaded(),
        getAvailableCities().catch(() => []),
        getMyContactChannels().catch(() => []),
        loadVerificationPreferredContact(),
      ]);

      setDraft(
        buildVolunteerVerifDraftFromAttempt({
          attempt,
          volunteer,
          catalog,
          cities,
          channels,
          preferredType: preferredStorage,
        }),
      );
      setInitialized(true);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Не удалось загрузить данные для обновления'));
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized || loading) return;
    const task = InteractionManager.runAfterInteractions(() => {
      void reload();
    });
    return () => task.cancel();
  }, [initialized, loading, reload]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await createVerificationAttempt(buildVolunteerVerificationPayload(draft));
      if (draft.preferredContactType) {
        const preferred =
          draft.preferredContactType === 'max' ? 'other' : draft.preferredContactType;
        await saveVerificationPreferredContact(preferred);
      }
      return { attemptId: response.id };
    } finally {
      setSubmitting(false);
    }
  }, [draft]);

  const value = useMemo(
    () => ({
      draft,
      patchDraft,
      resetDraft,
      loading,
      loadError,
      reload,
      loadDraftForUpdate,
      submit,
      submitting,
    }),
    [draft, patchDraft, resetDraft, loading, loadError, reload, loadDraftForUpdate, submit, submitting],
  );

  return (
    <VolunteerVerifDraftContext.Provider value={value}>{children}</VolunteerVerifDraftContext.Provider>
  );
}

export function useVolunteerVerifDraft(): VolunteerVerifDraftContextValue {
  const context = useContext(VolunteerVerifDraftContext);
  if (!context) {
    throw new Error('useVolunteerVerifDraft must be used within VolunteerVerifDraftProvider');
  }
  return context;
}
