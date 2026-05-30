export type MediaPurpose = 'VERIFICATION' | 'WORKFLOW' | 'AVATAR';

export type MediaDownloadUrlResponse = {
  media_id: string;
  url: string;
  preview_url?: string | null;
  expires_at: string;
};

export type InitMediaUploadRequest = {
  purpose: MediaPurpose;
  file_name: string;
  content_type: string;
  checksum_sha256?: string | null;
};

export type InitMediaUploadResponse = {
  media_id: string;
  upload_url: string;
  upload_method: string;
  upload_headers: Record<string, string>;
  expires_at: string;
};

export type CompleteMediaUploadResponse = {
  media_id: string;
  status: string;
};

export type MediaVariant = 'preview' | 'full';

export type CachedMediaUrl = {
  mediaId: string;
  variant: MediaVariant;
  url: string;
  expiresAt: number;
};

export type UploadMediaInput = {
  purpose: MediaPurpose;
  uri: string;
  fileName: string;
  contentType: string;
  onProgress?: (progress: number) => void;
};

export type UploadMediaResult = {
  mediaId: string;
};

export type DevicePlatform = 'android' | 'ios';

export type NotificationEntityType = 'help_request' | 'verification_attempt' | 'help_request_report';

export type NotificationType =
  | 'help_request.approved'
  | 'help_request.rejected'
  | 'help_request.returned_to_rework'
  | 'help_request.cancelled'
  | 'help_request.interrupted'
  | 'help_request.submitted_for_moderation'
  | 'verification.approved'
  | 'verification.rejected'
  | 'verification.revoked'
  | 'verification.submitted_for_moderation'
  | 'report.approved'
  | 'report.rejected'
  | 'report.returned_to_rework'
  | 'report.submitted_for_moderation'
  | 'social_help_request.relevance_confirmation_required'
  | 'social_help_request.volunteer_joined'
  | 'social_help_request.cancelled'
  | 'social_help_request.execution_started'
  | 'social_help_request.execution_finished'
  | 'donation.received';

export type NotificationResponse = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entity_type: NotificationEntityType | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type PaginatedResponse<T> = {
  page: number;
  page_size: number;
  total_count: number;
  has_more: boolean;
  items: T[];
};

export type HelpRequestType = 'MATERIAL' | 'SOCIAL';

export type SocialHelpRequestSummary = {
  media_files: MediaDownloadUrlResponse[];
  id: string;
  beneficiary_user_id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  status: string;
  report_status: string;
  min_volunteers: number;
  max_volunteers: number;
  start_at: string;
  duration_minutes: number;
  required_skills: string[];
  preferred_skills: string[];
  items_to_bring: string[];
  additional_notes?: string | null;
  latitude: number;
  longitude: number;
  address_text: string;
  place_name?: string | null;
  created_at: string;
  updated_at: string;
  beneficiary?: unknown | null;
  participants?: SocialHelpRequestParticipantsSummary | null;
  is_watched?: boolean;
};

export type CreateSocialHelpRequestRequest = {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  category: string;
  min_volunteers: number;
  max_volunteers: number;
  start_at: string;
  duration_minutes: number;
  required_skills: string[];
  preferred_skills?: string[];
  items_to_bring?: string[];
  additional_notes?: string | null;
  media_ids?: string[];
};

export type UpdateSocialHelpRequestRequest = CreateSocialHelpRequestRequest;

export type CreateMaterialHelpRequestRequest = {
  title: string;
  description: string;
  category: string;
  amount_required_kopeks: number;
  media_ids?: string[];
};

export type UpdateMaterialHelpRequestRequest = CreateMaterialHelpRequestRequest;

export type CreateMaterialHelpRequestResponse = {
  id: string;
};

export type CreateSocialHelpRequestResponse = {
  id: string;
  beneficiary_user_id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  status: string;
  min_volunteers: number;
  max_volunteers: number;
  start_at: string;
  duration_minutes: number;
  required_skills: string[];
  preferred_skills: string[];
  items_to_bring: string[];
  additional_notes?: string | null;
  latitude: number;
  longitude: number;
  address_text: string;
  place_name?: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialHelpRequestParticipantsSummary = {
  joined: number;
  attended: number;
  no_show: number;
  left_after_start: number;
  unjoined: number;
  total: number;
};

export type SocialHelpRequestParticipant = {
  volunteer_user_id: string;
  first_name: string;
  last_name: string;
  skill_codes: string[];
  avatar?: MediaDownloadUrlResponse | null;
  status: string;
  joined_at?: string | null;
};

export type HelpRequestVersion = Record<string, unknown> & {
  version_number?: number;
  status?: string;
  created_at?: string;
  approved_at?: string | null;
  returned_at?: string | null;
  return_reason?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  type?: string;
};

export type RefundObligation = {
  id: string;
  status: string;
  required_kopeks: number;
  returned_kopeks: number;
  remaining_kopeks: number;
  completed_at?: string | null;
};

export type MaterialHelpRequestFinancials = {
  requested_kopeks?: number;
  collected_kopeks?: number;
  withdrawn_kopeks?: number;
  available_for_withdrawal_kopeks?: number;
  pending_donations_kopeks?: number;
  remaining_to_collect_kopeks?: number;
  returned_kopeks?: number;
  refund_obligation?: RefundObligation | null;
  /** @deprecated legacy field names */
  amount_requested_kopeks?: number;
  amount_collected_kopeks?: number;
  amount_spent_kopeks?: number;
};

export type MaterialHelpRequestDonationsSummary = {
  count: number;
  succeeded_count: number;
  pending_count: number;
};

export type HelpRequestDetail = SocialHelpRequestSummary & {
  type: string;
  available_actions?: string[];
  financials?: MaterialHelpRequestFinancials;
  donations?: MaterialHelpRequestDonationsSummary;
  amount_requested_kopeks?: number;
  amount_collected_kopeks?: number;
};

export type MapBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export type MapPoint = {
  latitude: number;
  longitude: number;
};

export type PushNotificationPayload = {
  type?: NotificationType | string;
  entity_type?: NotificationEntityType | string;
  entity_id?: string;
  title?: string;
  body?: string;
};

export type NotificationRoute =
  | { screen: 'HelpRequestDetail'; helpRequestId: string }
  | { screen: 'VerificationStatus' }
  | { screen: 'Notifications' }
  | { screen: 'Unknown' };
