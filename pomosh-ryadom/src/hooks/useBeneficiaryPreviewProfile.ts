import { useEffect, useState } from 'react';
import { getCurrentBeneficiary } from '../api/beneficiaries';
import { getLatestVerificationAttempt } from '../api/verifications';
import { getBeneficiaryCategoryLabel } from '../utils/beneficiaryCategory';

export type BeneficiaryPreviewProfile = {
  name: string;
  categoryLabel: string | null;
  loading: boolean;
};

export function useBeneficiaryPreviewProfile(): BeneficiaryPreviewProfile {
  const [profile, setProfile] = useState<BeneficiaryPreviewProfile>({
    name: '',
    categoryLabel: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [beneficiary, verification] = await Promise.all([
          getCurrentBeneficiary(),
          getLatestVerificationAttempt(),
        ]);

        if (cancelled) return;

        setProfile({
          name: beneficiary.full_name,
          categoryLabel: getBeneficiaryCategoryLabel(verification?.category),
          loading: false,
        });
      } catch {
        if (!cancelled) {
          setProfile((prev) => ({ ...prev, loading: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
}
