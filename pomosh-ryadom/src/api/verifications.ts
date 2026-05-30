import { ApiClientError, apiRequest } from './client';

export type VerificationAttemptStatus =
  | 'PENDING_MODERATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';

export type VerificationFormFieldOption = {
  code: string;
  label: string;
};

export type VerificationFormField = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  multiple?: boolean | null;
  required_condition?: string | null;
  validation_pattern?: string | null;
  placeholder?: string | null;
  options?: VerificationFormFieldOption[] | null;
  item_schema?: VerificationFormField[] | null;
};

export type VerificationFormSchemaResponse = {
  role: string;
  category: string | null;
  common_data: VerificationFormField[];
  category_data: VerificationFormField[];
  contact_data?: VerificationFormField[];
};

export type ContactChannelInput = {
  type: string;
  value: string;
  label?: string | null;
};

export type CreateVerificationAttemptRequest = {
  category?: string | null;
  common_data: Record<string, unknown>;
  category_data: Record<string, unknown>;
  contact_channels: ContactChannelInput[];
  preferred_contact_channel_type: string;
};

export type VerificationAttemptResponse = {
  id: string;
  user_id: string;
  user_role?: string;
  category?: string | null;
  status: VerificationAttemptStatus;
  common_data?: Record<string, unknown>;
  category_data?: Record<string, unknown>;
  public_snapshot_json?: Record<string, unknown> | null;
  rejection_reason?: string | null;
  revocation_reason?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  revoked_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function getVerificationFormSchema(
  role = 'VOLUNTEER',
): Promise<VerificationFormSchemaResponse> {
  return apiRequest<VerificationFormSchemaResponse>(
    `/api/verifications/form-schema?role=${encodeURIComponent(role)}`,
    { auth: true },
  );
}

export async function getLatestVerificationAttempt(): Promise<VerificationAttemptResponse | null> {
  try {
    return await apiRequest<VerificationAttemptResponse>('/api/verifications/latest', { auth: true });
  } catch (err) {
    if (err instanceof ApiClientError && err.parsed.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function getVerificationAttemptById(
  attemptId: string,
): Promise<VerificationAttemptResponse> {
  return apiRequest<VerificationAttemptResponse>(`/api/verifications/${attemptId}`, { auth: true });
}

export async function createVerificationAttempt(
  body: CreateVerificationAttemptRequest,
): Promise<VerificationAttemptResponse> {
  return apiRequest<VerificationAttemptResponse>('/api/verifications/attempts', {
    method: 'POST',
    body,
    auth: true,
  });
}
