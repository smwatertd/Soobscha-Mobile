import { apiRequest } from './client';

export type ReportStatus =
  | 'PENDING_MODERATION'
  | 'RETURNED_TO_REWORK'
  | 'APPROVED'
  | 'REJECTED';

export type MaterialReportSettlementStatus = 'AWAITING_REFUND' | 'EXPENSES_VERIFIED';

export type ReportMediaFile = {
  media_id: string;
  url: string;
  preview_url?: string | null;
  file_name?: string | null;
  content_type?: string | null;
};

export type MaterialReportPayload = {
  purchases_description: string;
};

export type SocialReportPayload = {
  work_description: string;
};

export type ReportDetailsResponse = {
  id: string;
  help_request_id: string;
  help_request_type: string;
  status: ReportStatus;
  settlement_status: MaterialReportSettlementStatus | null;
  payload: MaterialReportPayload | SocialReportPayload;
  media_files: ReportMediaFile[];
  created_at: string;
  updated_at: string;
  available_actions: string[];
  spent_confirmed_kopeks?: number | null;
  return_reason?: string | null;
  rejection_reason?: string | null;
  returned_at?: string | null;
  rejected_at?: string | null;
  approved_at?: string | null;
  settlement_reviewed_at?: string | null;
};

export async function getHelpRequestReport(helpRequestId: string): Promise<ReportDetailsResponse> {
  return apiRequest<ReportDetailsResponse>(`/api/help-requests/${helpRequestId}/report`, {
    auth: true,
  });
}
