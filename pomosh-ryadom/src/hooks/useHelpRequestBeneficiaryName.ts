import { useEffect, useMemo, useState } from 'react';
import { getUserPublicProfile } from '../api/users';
import {
  formatBeneficiaryDisplayName,
  getHelpRequestBeneficiaryName,
  isPlaceholderBeneficiaryName,
} from '../utils/helpRequestBeneficiary';

/** ФИ благополучателя из заявки или GET /api/users/{id}, если в summary нет имени. */
export function useHelpRequestBeneficiaryName(
  beneficiary: unknown,
  beneficiaryUserId: string | undefined,
): string {
  const fromRequest = useMemo(
    () => getHelpRequestBeneficiaryName(beneficiary),
    [beneficiary],
  );

  const [fromProfile, setFromProfile] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlaceholderBeneficiaryName(fromRequest) || !beneficiaryUserId) {
      setFromProfile(null);
      return;
    }

    let cancelled = false;
    void getUserPublicProfile(beneficiaryUserId)
      .then((profile) => {
        if (cancelled) return;
        const name = formatBeneficiaryDisplayName({
          lastName: profile.lastName,
          firstName: profile.firstName,
          fullName: profile.fullName,
        });
        if (!isPlaceholderBeneficiaryName(name)) {
          setFromProfile(name);
        }
      })
      .catch(() => {
        if (!cancelled) setFromProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [beneficiaryUserId, fromRequest]);

  return fromProfile ?? fromRequest;
}
