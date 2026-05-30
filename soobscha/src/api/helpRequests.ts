import { apiRequest } from './client';
import { buildQuery } from './query';
import {
  CreateMaterialHelpRequestRequest,
  CreateMaterialHelpRequestResponse,
  CreateSocialHelpRequestRequest,
  CreateSocialHelpRequestResponse,
  UpdateMaterialHelpRequestRequest,
  UpdateSocialHelpRequestRequest,
  HelpRequestDetail,
  HelpRequestType,
  HelpRequestVersion,
  MapPoint,
  PaginatedResponse,
  SocialHelpRequestParticipant,
  SocialHelpRequestSummary,
} from './integrationTypes';
import { buildHelpRequestsListQuery } from '../utils/helpRequestsListQuery';
import { applyHelpRequestSummaryFilters } from '../utils/applyHelpRequestSummaryFilters';
import {
  filterVisitorVisibleHelpRequests,
  VISITOR_BENEFICIARY_VISIBLE_STATUSES,
} from '../utils/visitorBeneficiaryHelpRequests';
import { VolunteerMapFilters } from '../types/volunteerMapFilters';

export type CodeLabel = { code: string; label: string };

export type HelpRequestCategoriesResponse = {
  material: CodeLabel[];
  social: CodeLabel[];
};

export type HelpRequestSummary = SocialHelpRequestSummary | Record<string, unknown>;

export type GetHelpRequestsParams = {
  page?: number;
  pageSize?: number;
  type?: HelpRequestType;
  statuses?: string[];
  /** UUID благополучателя — заявки конкретного пользователя */
  userId?: string;
  orderBy?: 'created_at' | 'distance';
  orderDesc?: boolean;
  dateFrom?: string;
  dateTo?: string;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  availableToMe?: boolean;
};

export async function getHelpRequests(
  params?: GetHelpRequestsParams,
): Promise<PaginatedResponse<HelpRequestSummary>> {
  const qs = buildQuery({
    page: params?.page ?? 1,
    'page-size': params?.pageSize ?? 50,
    type: params?.type,
    statuses: params?.statuses,
    user_id: params?.userId,
    'order-by': params?.orderBy ?? 'created_at',
    'order-desc': params?.orderDesc ?? true,
    'date-from': params?.dateFrom,
    'date-to': params?.dateTo,
    latitude: params?.latitude,
    longitude: params?.longitude,
    'max-distance-km': params?.maxDistanceKm,
    'available-to-me': params?.availableToMe ? true : undefined,
  });

  return apiRequest<PaginatedResponse<HelpRequestSummary>>(`/api/help-requests${qs}`, {
    auth: true,
  });
}

const MAP_SOCIAL_STATUSES = ['VOLUNTEER_RECRUITING', 'WAITING_START', 'IN_PROGRESS'];
const MAP_MATERIAL_STATUSES = ['COLLECTING_FUNDS'];

async function fetchMapPinsForType(
  type: HelpRequestType,
  statuses: string[],
  pageSize: number,
  query: Omit<GetHelpRequestsParams, 'page' | 'pageSize' | 'type' | 'statuses'>,
): Promise<HelpRequestSummary[]> {
  const collected: HelpRequestSummary[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 5) {
    const response = await getHelpRequests({
      page,
      pageSize,
      type,
      statuses,
      ...query,
    });
    collected.push(...response.items);
    hasMore = response.has_more;
    page += 1;
  }

  return collected;
}

/** Заявки с координатами для карты волонтёра (социальные + материальные с адресом). */
export async function getHelpRequestsForMap(
  filters: VolunteerMapFilters,
  userLocation?: MapPoint | null,
  pageSize = 100,
): Promise<HelpRequestSummary[]> {
  const query = buildHelpRequestsListQuery(filters, userLocation);
  const tasks: Promise<HelpRequestSummary[]>[] = [];

  if (filters.social) {
    tasks.push(fetchMapPinsForType('SOCIAL', MAP_SOCIAL_STATUSES, pageSize, query));
  }
  if (filters.material) {
    tasks.push(fetchMapPinsForType('MATERIAL', MAP_MATERIAL_STATUSES, pageSize, query));
  }

  if (tasks.length === 0) {
    return [];
  }

  const chunks = await Promise.all(tasks);
  return applyHelpRequestSummaryFilters(chunks.flat(), filters);
}

/** @deprecated Используйте getHelpRequestsForMap */
export async function getSocialHelpRequestsForMap(pageSize = 100): Promise<SocialHelpRequestSummary[]> {
  const items = await fetchMapPinsForType('SOCIAL', MAP_SOCIAL_STATUSES, pageSize, {});
  return items.filter((item) => item.type === 'SOCIAL') as SocialHelpRequestSummary[];
}

export async function getHelpRequestById(helpRequestId: string): Promise<HelpRequestDetail> {
  return apiRequest<HelpRequestDetail>(`/api/help-requests/${helpRequestId}`, { auth: true });
}

export async function watchHelpRequest(helpRequestId: string): Promise<void> {
  await apiRequest<null>(`/api/help-requests/${helpRequestId}/watch`, {
    method: 'PUT',
    auth: true,
  });
}

export async function unwatchHelpRequest(helpRequestId: string): Promise<void> {
  await apiRequest<null>(`/api/help-requests/${helpRequestId}/watch`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function getHelpRequestHistory(helpRequestId: string): Promise<HelpRequestVersion[]> {
  return apiRequest<HelpRequestVersion[]>(`/api/help-requests/${helpRequestId}/history`, {
    auth: true,
  });
}

export type DecideSocialHelpRequestRelevanceRequest = {
  confirmed: boolean;
  reason_text?: string | null;
};

export async function decideSocialHelpRequestRelevance(
  helpRequestId: string,
  body: DecideSocialHelpRequestRelevanceRequest,
): Promise<void> {
  await apiRequest<null>(`/api/social-help-requests/${helpRequestId}/relevance`, {
    method: 'POST',
    auth: true,
    body,
  });
}

export async function startSocialHelpRequestExecution(
  helpRequestId: string,
  body: { attended_volunteer_ids: string[] },
): Promise<void> {
  await apiRequest<null>(`/api/social-help-requests/${helpRequestId}/start-execution`, {
    method: 'POST',
    auth: true,
    body,
  });
}

export async function finishSocialHelpRequestExecution(
  helpRequestId: string,
  body: { completed_volunteer_ids: string[] },
): Promise<void> {
  await apiRequest<null>(`/api/social-help-requests/${helpRequestId}/finish-execution`, {
    method: 'POST',
    auth: true,
    body,
  });
}

export async function getSocialHelpRequestParticipants(
  helpRequestId: string,
): Promise<SocialHelpRequestParticipant[]> {
  return apiRequest<SocialHelpRequestParticipant[]>(
    `/api/social-help-requests/${helpRequestId}/participants`,
    { auth: true },
  );
}

export async function getHelpRequestCategories(): Promise<HelpRequestCategoriesResponse> {
  return apiRequest<HelpRequestCategoriesResponse>('/api/help-requests/categories', { auth: true });
}

export async function joinSocialHelpRequest(helpRequestId: string): Promise<void> {
  await apiRequest<null>(`/api/social-help-requests/${helpRequestId}/join`, {
    method: 'POST',
    auth: true,
  });
}

export async function createSocialHelpRequest(
  payload: CreateSocialHelpRequestRequest,
): Promise<CreateSocialHelpRequestResponse> {
  return apiRequest<CreateSocialHelpRequestResponse>('/api/social-help-requests', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function updateSocialHelpRequest(
  helpRequestId: string,
  payload: UpdateSocialHelpRequestRequest,
): Promise<HelpRequestDetail> {
  return apiRequest<HelpRequestDetail>(`/api/social-help-requests/${helpRequestId}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

export async function createMaterialHelpRequest(
  payload: CreateMaterialHelpRequestRequest,
): Promise<CreateMaterialHelpRequestResponse> {
  return apiRequest<CreateMaterialHelpRequestResponse>('/api/material-help-requests', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export async function updateMaterialHelpRequest(
  helpRequestId: string,
  payload: UpdateMaterialHelpRequestRequest,
): Promise<HelpRequestDetail> {
  return apiRequest<HelpRequestDetail>(`/api/material-help-requests/${helpRequestId}`, {
    method: 'PUT',
    auth: true,
    body: payload,
  });
}

export type HelpRequestReasonCodesByType = {
  cancellation: CodeLabel[];
  interruption: CodeLabel[];
};

export type HelpRequestReasonCodesResponse = {
  material: HelpRequestReasonCodesByType;
  social: HelpRequestReasonCodesByType;
};

export async function getHelpRequestReasonCodes(): Promise<HelpRequestReasonCodesResponse> {
  return apiRequest<HelpRequestReasonCodesResponse>('/api/help-requests/reason-codes', {
    auth: true,
  });
}

export async function cancelHelpRequest(
  helpRequestId: string,
  body: { reason: string; code: string },
): Promise<HelpRequestDetail> {
  return apiRequest<HelpRequestDetail>(`/api/help-requests/${helpRequestId}/cancel`, {
    method: 'POST',
    auth: true,
    body,
  });
}

export async function interruptHelpRequest(
  helpRequestId: string,
  body: { reason: string; code: string },
): Promise<HelpRequestDetail> {
  return apiRequest<HelpRequestDetail>(`/api/help-requests/${helpRequestId}/interrupt`, {
    method: 'POST',
    auth: true,
    body,
  });
}

export type CreateSocialHelpRequestReportRequest = {
  work_description: string;
  media_ids?: string[];
};

export type CreateSocialHelpRequestReportResponse = {
  id: string;
  help_request_id: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export async function createSocialHelpRequestReport(
  helpRequestId: string,
  body: CreateSocialHelpRequestReportRequest,
): Promise<CreateSocialHelpRequestReportResponse> {
  return apiRequest<CreateSocialHelpRequestReportResponse>(
    `/api/social-help-requests/${helpRequestId}/reports`,
    {
      method: 'POST',
      auth: true,
      body,
    },
  );
}

export type CreateMaterialHelpRequestPayoutRequest = {
  payout_method_id: string;
  amount_kopeks: number;
  idempotency_key: string;
  currency?: string;
};

export type CreateMaterialHelpRequestPayoutResponse = {
  payout_id: string;
  payment_id: string;
  status: string;
};

export async function createMaterialHelpRequestPayout(
  helpRequestId: string,
  body: CreateMaterialHelpRequestPayoutRequest,
): Promise<CreateMaterialHelpRequestPayoutResponse> {
  return apiRequest<CreateMaterialHelpRequestPayoutResponse>(
    `/api/material-help-requests/${helpRequestId}/payouts`,
    {
      method: 'POST',
      auth: true,
      body,
    },
  );
}

export type CreateMaterialHelpRequestReportRequest = {
  purchases_description: string;
  media_ids?: string[];
};

export async function createMaterialHelpRequestReport(
  helpRequestId: string,
  body: CreateMaterialHelpRequestReportRequest,
): Promise<CreateSocialHelpRequestReportResponse> {
  return apiRequest<CreateSocialHelpRequestReportResponse>(
    `/api/material-help-requests/${helpRequestId}/reports`,
    {
      method: 'POST',
      auth: true,
      body,
    },
  );
}

/** Заявки благополучателя для публичного профиля (с подгрузкой страниц). */
export async function getBeneficiaryPublicHelpRequests(
  beneficiaryUserId: string,
  options?: { pageSize?: number; maxPages?: number },
): Promise<HelpRequestSummary[]> {
  const pageSize = options?.pageSize ?? 20;
  const maxPages = options?.maxPages ?? 5;
  const collected: HelpRequestSummary[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    const response = await getHelpRequests({
      page,
      pageSize,
      userId: beneficiaryUserId,
      statuses: [...VISITOR_BENEFICIARY_VISIBLE_STATUSES],
      orderDesc: true,
    });
    collected.push(...filterVisitorVisibleHelpRequests(response.items));
    hasMore = response.has_more;
    page += 1;
  }

  return collected;
}
