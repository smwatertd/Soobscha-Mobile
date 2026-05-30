import { apiRequest } from './client';
import { HelpRequestSummary } from './helpRequests';
import { PaginatedResponse } from './integrationTypes';
import { buildQuery } from './query';

export type VolunteerSkillCatalogItem = {
  code: string;
  label: string;
  group: string;
  group_label: string;
  requires_verified: boolean;
};

export type CurrentVolunteer = {
  user_id: string;
  full_name: string;
  full_name_source?: string;
  city?: string | null;
  phone_number?: string | null;
};

export async function getVolunteerSkillCatalog(): Promise<VolunteerSkillCatalogItem[]> {
  return apiRequest<VolunteerSkillCatalogItem[]>('/api/volunteers/skills/catalog', {
    auth: true,
  });
}

export async function getMyWatchedHelpRequests(params?: {
  page?: number;
  pageSize?: number;
  orderBy?: 'created_at' | 'distance';
  orderDesc?: boolean;
}): Promise<PaginatedResponse<HelpRequestSummary>> {
  const qs = buildQuery({
    page: params?.page ?? 1,
    'page-size': params?.pageSize ?? 20,
    'order-by': params?.orderBy ?? 'created_at',
    'order-desc': params?.orderDesc ?? true,
  });
  return apiRequest<PaginatedResponse<HelpRequestSummary>>(
    `/api/volunteers/me/watched-help-requests${qs}`,
    { auth: true },
  );
}

export async function getCurrentVolunteer(): Promise<CurrentVolunteer> {
  return apiRequest<CurrentVolunteer>('/api/volunteers/me', { auth: true });
}

export async function updateCurrentVolunteerCity(city: string | null): Promise<CurrentVolunteer> {
  return apiRequest<CurrentVolunteer>('/api/volunteers/me/city', {
    method: 'PUT',
    auth: true,
    body: { city },
  });
}

export type VolunteerStats = {
  donations: {
    count: number;
    total_kopeks: number;
  };
  social_participations: {
    active: number;
    completed: number;
    joined_but_not_attended: number;
    left_early: number;
    withdrawn_before_confirmation: number;
  };
};

export async function getCurrentVolunteerStats(): Promise<VolunteerStats> {
  return apiRequest<VolunteerStats>('/api/volunteers/me/stats', { auth: true });
}

export type UserContactChannel = {
  id: string;
  type: string;
  value: string;
  label?: string | null;
};

export async function getMyContactChannels(): Promise<UserContactChannel[]> {
  return apiRequest<UserContactChannel[]>('/api/users/me/contact-channels', { auth: true });
}

export type VolunteerSocialParticipation = {
  help_request_id: string;
  help_request_title: string;
  help_request_status: string;
  start_at: string;
  duration_minutes: number;
  status: string;
  joined_at?: string | null;
  image_uri?: string | null;
  distance_km?: number | null;
};

export async function listMySocialParticipations(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<VolunteerSocialParticipation>> {
  const qs = buildQuery({
    status: params?.status,
    page: params?.page ?? 1,
    'page-size': params?.pageSize ?? 20,
  });
  return apiRequest<PaginatedResponse<VolunteerSocialParticipation>>(
    `/api/volunteers/me/social-participations${qs}`,
    { auth: true },
  );
}
