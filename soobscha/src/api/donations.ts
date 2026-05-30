import { apiRequest } from './client';
import { PaginatedResponse } from './integrationTypes';
import { buildQuery } from './query';

export type DonationDonor = {
  user_id?: string;
  display_name?: string;
  is_anonymous?: boolean;
};

export type DonationWithDonor = {
  id: string;
  help_request_id: string;
  donor?: DonationDonor | null;
  amount_kopeks: number;
  currency: string;
  status: string;
  created_at?: string;
  message?: string | null;
};

export type CreateDonationRequest = {
  amount_kopeks: number;
  return_url: string;
  idempotency_key: string;
};

export type CreateDonationResponse = {
  donation_id: string;
  payment_id: string;
  confirmation_url?: string | null;
  status: string;
};

export type VolunteerDonation = {
  id: string;
  help_request_id: string;
  help_request_title: string;
  amount_kopeks: number;
  currency: string;
  status: string;
  created_at: string;
  help_request_status?: string | null;
  help_request_goal_kopeks?: number | null;
  help_request_collected_kopeks?: number | null;
};

export async function createMaterialDonation(
  helpRequestId: string,
  body: CreateDonationRequest,
): Promise<CreateDonationResponse> {
  return apiRequest<CreateDonationResponse>(
    `/api/material-help-requests/${helpRequestId}/donations`,
    { method: 'POST', body, auth: true },
  );
}

export async function getMaterialDonations(helpRequestId: string): Promise<DonationWithDonor[]> {
  return apiRequest<DonationWithDonor[]>(
    `/api/material-help-requests/${helpRequestId}/donations`,
    { auth: true },
  );
}

export async function listMyDonations(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<VolunteerDonation>> {
  const qs = buildQuery({
    status: params?.status,
    page: params?.page ?? 1,
    'page-size': params?.pageSize ?? 20,
  });
  return apiRequest<PaginatedResponse<VolunteerDonation>>(`/api/volunteers/me/donations${qs}`, {
    auth: true,
  });
}
