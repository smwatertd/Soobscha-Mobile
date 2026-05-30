import { apiRequest } from './client';

export type MaterialHelpRequestPayoutStatus =
  | 'REQUESTED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | string;

export type MaterialHelpRequestPayout = {
  id: string;
  help_request_id: string;
  amount_kopeks: number;
  currency: string;
  status: MaterialHelpRequestPayoutStatus;
  created_at?: string;
  payout_method?: {
    display_name?: string;
    type?: string;
  } | null;
};

export async function getMaterialPayouts(helpRequestId: string): Promise<MaterialHelpRequestPayout[]> {
  return apiRequest<MaterialHelpRequestPayout[]>(
    `/api/material-help-requests/${helpRequestId}/payouts`,
    { auth: true },
  );
}
