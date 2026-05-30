import {
  ProfileMenuItem,
  ProfilePersonalRow,
  ProfileStat,
} from '../constants/profileMockData';
import { ProfileVerificationStatus } from '../types/profileVerification';
import { ProfileContactRow } from './profileContacts';

type VolunteerApiProfile = {
  loading: boolean;
  error: string | null;
  displayName: string;
  avatarName: string;
  roleLabel: string;
  stats: ProfileStat[];
  verification: {
    status: ProfileVerificationStatus;
    approvedDate?: string;
    reason?: string;
  };
  personalRows: ProfilePersonalRow[];
  contacts: ProfileContactRow[];
  menu: ProfileMenuItem[];
};

type BeneficiaryApiProfile = {
  loading: boolean;
  error: string | null;
  displayName: string;
  avatarName: string;
  roleLabel: string;
  categoryLabel: string | null;
  stats: ProfileStat[];
  verification: {
    status: ProfileVerificationStatus;
    date?: string;
    reason?: string;
  };
  personalRows: ProfilePersonalRow[];
  categoryRows: ProfilePersonalRow[];
  defaultPayout: { display_name: string; is_default: boolean } | null | undefined;
  contacts: ProfileContactRow[];
};

export type VolunteerProfileView = Omit<VolunteerApiProfile, 'loading' | 'error'> & {
  loading: boolean;
  error: string | null;
  subtitle?: string;
  verificationStatus: ProfileVerificationStatus;
  verificationDate?: string;
  verificationReason?: string;
};

export type BeneficiaryProfileView = Omit<BeneficiaryApiProfile, 'loading' | 'error'> & {
  loading: boolean;
  error: string | null;
  verificationStatus: ProfileVerificationStatus;
  verificationDate?: string;
  verificationReason?: string;
};

const MOCK_VERIFICATION_REASON = 'Нечёткое фото селфи';

export function resolveProfileVerificationPreview(
  status: ProfileVerificationStatus,
  sourceDate?: string,
  sourceReason?: string,
): { date?: string; reason?: string } {
  if (status === 'approved') {
    return { date: sourceDate ?? '22 марта 2024' };
  }
  if (status === 'rejected' || status === 'revoked') {
    return { reason: sourceReason ?? MOCK_VERIFICATION_REASON };
  }
  return {};
}

export function applyProfileVerificationDevOverride(
  sourceStatus: ProfileVerificationStatus,
): ProfileVerificationStatus {
  return sourceStatus;
}

export function resolveVolunteerProfileView(api: VolunteerApiProfile): VolunteerProfileView {
  const status = api.verification.status;
  const preview = resolveProfileVerificationPreview(
    status,
    api.verification.approvedDate,
    api.verification.reason,
  );

  return {
    loading: api.loading,
    error: api.error,
    displayName: api.displayName,
    avatarName: api.avatarName,
    roleLabel: api.roleLabel,
    stats: api.stats,
    personalRows: api.personalRows,
    contacts: api.contacts,
    menu: api.menu,
    verification: api.verification,
    verificationStatus: status,
    verificationDate: preview.date,
    verificationReason: preview.reason,
  };
}

export function resolveBeneficiaryProfileView(api: BeneficiaryApiProfile): BeneficiaryProfileView {
  const status = api.verification.status;
  const preview = resolveProfileVerificationPreview(
    status,
    api.verification.date,
    api.verification.reason,
  );

  return {
    loading: api.loading,
    error: api.error,
    displayName: api.displayName,
    avatarName: api.avatarName,
    roleLabel: api.roleLabel,
    categoryLabel: api.categoryLabel,
    stats: api.stats,
    personalRows: api.personalRows,
    categoryRows: api.categoryRows,
    defaultPayout: api.defaultPayout,
    contacts: api.contacts,
    verification: api.verification,
    verificationStatus: status,
    verificationDate: preview.date,
    verificationReason: preview.reason,
  };
}
