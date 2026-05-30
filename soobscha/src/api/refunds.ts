import { apiRequest } from './client';
import { getHelpRequestById } from './helpRequests';
import { RefundObligation } from './integrationTypes';

export type { RefundObligation };

export type RefundPaymentPreview = {
  id: string;
  created_at: string;
  amount_kopeks: number;
  status: string;
};

export type CreateRefundPaymentRequest = {
  amount_kopeks: number;
  idempotency_key: string;
};

export type CreateRefundPaymentResponse = {
  refund_id: string;
  status: string;
  confirmation_url: string;
};

export async function createMaterialRefundPayment(
  helpRequestId: string,
  body: CreateRefundPaymentRequest,
): Promise<CreateRefundPaymentResponse> {
  return apiRequest<CreateRefundPaymentResponse>(
    `/api/material-help-requests/${helpRequestId}/refunds`,
    { method: 'POST', body, auth: true },
  );
}

export async function getMaterialRefundObligation(
  helpRequestId: string,
): Promise<RefundObligation | null> {
  const request = await getHelpRequestById(helpRequestId);
  return request.financials?.refund_obligation ?? null;
}

export async function getMaterialRefundPayments(
  helpRequestId: string,
  obligation?: RefundObligation | null,
): Promise<RefundPaymentPreview[]> {
  void helpRequestId;
  void obligation;
  return [];
}
