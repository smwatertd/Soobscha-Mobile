import { apiRequest } from './client';
import { buildQuery } from './query';
import { CodeLabel, HelpRequestSummary } from './helpRequests';
import { PaginatedResponse } from './integrationTypes';

export type CurrentBeneficiary = {
  user_id: string;
  full_name: string;
  full_name_source: string;
  city?: string | null;
  phone_number?: string | null;
  avatar?: { media_id: string; url: string } | null;
};

export async function getCurrentBeneficiary(): Promise<CurrentBeneficiary> {
  return apiRequest<CurrentBeneficiary>('/api/beneficiaries/me', { auth: true });
}

export async function updateCurrentBeneficiaryCity(city: string | null): Promise<CurrentBeneficiary> {
  return apiRequest<CurrentBeneficiary>('/api/beneficiaries/me/city', {
    method: 'PUT',
    auth: true,
    body: { city },
  });
}

export async function getBeneficiaryCategories(): Promise<CodeLabel[]> {
  return apiRequest<CodeLabel[]>('/api/beneficiaries/categories', { auth: true });
}

export type BeneficiaryStats = {
  by_status: {
    material: Record<string, number>;
    social: Record<string, number>;
  };
  totals: {
    active: number;
    completed: number;
    all: number;
  };
  financials: {
    requested_kopeks: number;
    collected_kopeks: number;
    pending_donations_kopeks: number;
    withdrawn_kopeks: number;
    pending_payout_kopeks: number;
  };
};

export async function getCurrentBeneficiaryStats(): Promise<BeneficiaryStats> {
  return apiRequest<BeneficiaryStats>('/api/beneficiaries/me/stats', { auth: true });
}

export async function getMyHelpRequests(params?: {
  page?: number;
  pageSize?: number;
  type?: 'MATERIAL' | 'SOCIAL';
  statuses?: string[];
  orderDesc?: boolean;
}): Promise<PaginatedResponse<HelpRequestSummary>> {
  const qs = buildQuery({
    page: params?.page ?? 1,
    'page-size': params?.pageSize ?? 20,
    type: params?.type,
    statuses: params?.statuses,
    'order-by': 'created_at',
    'order-desc': params?.orderDesc ?? true,
  });

  return apiRequest<PaginatedResponse<HelpRequestSummary>>(`/api/beneficiaries/me/help-requests${qs}`, {
    auth: true,
  });
}
