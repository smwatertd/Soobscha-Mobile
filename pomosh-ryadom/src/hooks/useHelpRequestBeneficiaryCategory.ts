import { useEffect, useState } from 'react';
import { getUserPublicProfile } from '../api/users';
import { getBeneficiaryCategoryLabel } from '../utils/beneficiaryCategory';
import {
  getCategoryCodeFromPublicProfile,
  getHelpRequestBeneficiaryCategoryCode,
} from '../utils/helpRequestBeneficiary';

export function useHelpRequestBeneficiaryCategory(
  beneficiary: unknown,
  beneficiaryUserId: string | undefined,
): { code: string | null; label: string | null } {
  const [code, setCode] = useState<string | null>(() =>
    getHelpRequestBeneficiaryCategoryCode(beneficiary),
  );

  useEffect(() => {
    const fromRequest = getHelpRequestBeneficiaryCategoryCode(beneficiary);
    if (fromRequest) {
      setCode(fromRequest);
      return;
    }
    if (!beneficiaryUserId) {
      setCode(null);
      return;
    }

    let cancelled = false;
    void getUserPublicProfile(beneficiaryUserId)
      .then((profile) => {
        if (cancelled) return;
        const fromProfile =
          profile.baseCategory ?? getCategoryCodeFromPublicProfile(profile as unknown as Record<string, unknown>);
        if (fromProfile) setCode(fromProfile);
      })
      .catch(() => {
        if (!cancelled) setCode(null);
      });

    return () => {
      cancelled = true;
    };
  }, [beneficiary, beneficiaryUserId]);

  const label = getBeneficiaryCategoryLabel(code);
  return { code, label };
}
