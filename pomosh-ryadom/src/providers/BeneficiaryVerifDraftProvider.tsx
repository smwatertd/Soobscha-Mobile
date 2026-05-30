import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getAvailableCities } from '../api/locations';
import { getErrorMessage } from '../api/errors';
import { createVerificationAttempt } from '../api/verifications';
import { getCurrentBeneficiary } from '../api/beneficiaries';
import { getMyContactChannels } from '../api/volunteers';
import { loadSession } from '../services/authStorage';
import {
  BeneficiaryVerifDraft,
  buildBeneficiaryVerificationPayload,
  createEmptyBeneficiaryVerifDraft,
} from '../navigation/beneficiaryVerificationTypes';
import { splitFullName } from '../navigation/volunteerVerificationTypes';
import {
  loadVerificationPreferredContact,
  saveVerificationPreferredContact,
} from '../utils/volunteerVerifStorage';

type BeneficiaryVerifDraftContextValue = {
  draft: BeneficiaryVerifDraft;
  patchDraft: (patch: Partial<BeneficiaryVerifDraft>) => void;
  resetDraft: () => void;
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  submit: () => Promise<{ attemptId: string }>;
  submitting: boolean;
};

const BeneficiaryVerifDraftContext = createContext<BeneficiaryVerifDraftContextValue | null>(null);

export function BeneficiaryVerifDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BeneficiaryVerifDraft>(createEmptyBeneficiaryVerifDraft);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const patchDraft = useCallback((patch: Partial<BeneficiaryVerifDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(createEmptyBeneficiaryVerifDraft());
    setInitialized(false);
  }, []);

  const reload = useCallback(async () => {
    const session = await loadSession();
    if (session?.role !== 'BENEFICIARY') {
      setInitialized(true);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [beneficiary, cities, channels, preferredStorage] = await Promise.all([
        getCurrentBeneficiary(),
        getAvailableCities().catch(() => []),
        getMyContactChannels().catch(() => []),
        loadVerificationPreferredContact(),
      ]);

      const nameParts = splitFullName(beneficiary.full_name);
      const cityLabel = beneficiary.city ?? '';
      const cityMatch = cities.find((city) => city.label === cityLabel);

      const contacts = createEmptyBeneficiaryVerifDraft().contacts.map((contact) => {
        const match = channels.find(
          (channel) => channel.type.toLowerCase() === contact.type,
        );
        return match ? { ...contact, value: match.value } : contact;
      });

      const preferredType =
        preferredStorage &&
        contacts.some((contact) => contact.type === preferredStorage && contact.value.trim())
          ? (preferredStorage as BeneficiaryVerifDraft['preferredContactType'])
          : '';

      setDraft((prev) => ({
        ...createEmptyBeneficiaryVerifDraft(),
        ...nameParts,
        city: cityLabel,
        cityCode: cityMatch?.code ?? '',
        category: prev.category,
        contacts,
        preferredContactType: preferredType,
      }));
      setInitialized(true);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Не удалось загрузить данные для верификации'));
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized && !loading) {
      void reload();
    }
  }, [initialized, loading, reload]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const response = await createVerificationAttempt(buildBeneficiaryVerificationPayload(draft));
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
      submit,
      submitting,
    }),
    [draft, patchDraft, resetDraft, loading, loadError, reload, submit, submitting],
  );

  return (
    <BeneficiaryVerifDraftContext.Provider value={value}>{children}</BeneficiaryVerifDraftContext.Provider>
  );
}

export function useBeneficiaryVerifDraft(): BeneficiaryVerifDraftContextValue {
  const context = useContext(BeneficiaryVerifDraftContext);
  if (!context) {
    throw new Error('useBeneficiaryVerifDraft must be used within BeneficiaryVerifDraftProvider');
  }
  return context;
}
