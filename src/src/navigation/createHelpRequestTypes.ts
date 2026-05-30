import {
  CreateMaterialHelpRequestRequest,
  CreateSocialHelpRequestRequest,
  UpdateMaterialHelpRequestRequest,
  UpdateSocialHelpRequestRequest,
} from '../api/integrationTypes';

export type HelpRequestType = 'social' | 'material';

export type DraftPhoto = {
  id: string;
  uri: string;
  fileName: string;
  contentType: string;
  mediaId?: string;
  kind?: 'image' | 'document';
  /** Порядок добавления пользователем (для media_ids и отображения). */
  sortIndex?: number;
};

export function sortDraftPhotos(photos: DraftPhoto[]): DraftPhoto[] {
  return [...photos].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
}

export function nextDraftPhotoSortIndex(photos: DraftPhoto[]): number {
  if (!photos.length) return 0;
  return Math.max(...photos.map((photo) => photo.sortIndex ?? 0)) + 1;
}

export type CreateHelpRequestDetailsParams = {
  type: HelpRequestType;
} & HelpRequestEditFlowParams;

export type CreateHelpRequestDetailsDraft = {
  type: HelpRequestType;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  dateIso: string;
  time: string;
  address: string;
  latitude: number;
  longitude: number;
  minVolunteers: number;
  maxVolunteers: number;
  requiredSkills: string[];
  preferredSkills: string[];
  photos: DraftPhoto[];
  durationMinutes?: number;
};

export type HelpRequestEditFlowParams = {
  editMode?: boolean;
};

export const ADDITIONAL_NOTES_MAX_LENGTH = 1000;
export const DEFAULT_DURATION_MINUTES = 120;

export function getDraftMediaIds(photos: DraftPhoto[]): string[] {
  return sortDraftPhotos(photos).flatMap((photo) => (photo.mediaId ? [photo.mediaId] : []));
}

export function buildStartAtIso(dateIso: string, time: string): string {
  return new Date(`${dateIso}T${time}:00`).toISOString();
}

export type CreateHelpRequestSkillsParams = { type: 'social' } | undefined;

export type CreateHelpRequestConditionsParams = CreateHelpRequestDetailsDraft;

export type CreateHelpRequestConditionsDraft = CreateHelpRequestDetailsDraft & {
  bringItems: string[];
  extraNotes: string;
  safetyAccepted: boolean;
};

export type CreateHelpRequestReviewParams = CreateHelpRequestConditionsDraft;

export type CreateMaterialHelpRequestDetailsParams = {
  type: 'material';
} & HelpRequestEditFlowParams;

export type CreateMaterialHelpRequestDetailsDraft = {
  type: 'material';
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
};

export type CreateMaterialHelpRequestAmountParams = CreateMaterialHelpRequestDetailsDraft;

export type CreateMaterialHelpRequestAmountDraft = CreateMaterialHelpRequestDetailsDraft & {
  amountRubles: number;
  photos: DraftPhoto[];
};

export type CreateMaterialHelpRequestReviewParams = CreateMaterialHelpRequestAmountDraft;

export const MATERIAL_AMOUNT_MIN_RUB = 1_000;
export const MATERIAL_AMOUNT_MAX_RUB = 5_000_000;
export const MATERIAL_AMOUNT_DOCS_THRESHOLD_RUB = 100_000;

export const SOCIAL_CREATE_REQUEST_STEPS = 5;
export const MATERIAL_CREATE_REQUEST_STEPS = 4;
/** @deprecated Используйте SOCIAL_CREATE_REQUEST_STEPS / MATERIAL_CREATE_REQUEST_STEPS */
export const CREATE_REQUEST_STEPS = SOCIAL_CREATE_REQUEST_STEPS;

export const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00', '18:00'];

export const DEFAULT_BRING_ITEMS = [
  'Перчатки',
  'Удобную обувь',
  'Хорошее настроение',
  'Воду',
  'Документ',
  'Свой инвентарь',
];

export const MAX_BRING_ITEMS = 10;

const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function formatSelectedDateTime(dateIso: string, time: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const weekday = WEEKDAYS_SHORT[date.getDay()];
  return `${weekday}, ${day} ${month}, ${time}`;
}

export function formatShortLocation(address: string): string {
  const parts = address.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || address;
}

export function formatDisplayLocation(address: string): string {
  let parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return address;
  if (parts[0] === 'Россия') {
    parts = parts.slice(1);
  }
  parts = parts.filter((part, index) => index === 0 || part !== parts[index - 1]);
  return parts.join(', ');
}

export function formatVolunteerRange(min: number, max: number): string {
  return `${min}–${max} чел.`;
}

function buildSocialHelpRequestPayloadBase(
  draft: CreateHelpRequestReviewParams,
): CreateSocialHelpRequestRequest {
  const mediaIds = getDraftMediaIds(draft.photos);
  const additionalNotes = draft.extraNotes.trim();

  return {
    latitude: draft.latitude,
    longitude: draft.longitude,
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category || 'OTHER',
    required_skills: draft.requiredSkills,
    min_volunteers: draft.minVolunteers,
    max_volunteers: draft.maxVolunteers,
    start_at: buildStartAtIso(draft.dateIso, draft.time),
    duration_minutes: draft.durationMinutes ?? DEFAULT_DURATION_MINUTES,
    ...(draft.preferredSkills.length ? { preferred_skills: draft.preferredSkills } : {}),
    ...(draft.bringItems.length ? { items_to_bring: draft.bringItems } : {}),
    ...(additionalNotes ? { additional_notes: additionalNotes } : {}),
    ...(mediaIds.length ? { media_ids: mediaIds } : {}),
  };
}

export function buildCreateSocialHelpRequestPayload(
  draft: CreateHelpRequestReviewParams,
): CreateSocialHelpRequestRequest {
  return buildSocialHelpRequestPayloadBase(draft);
}

export function buildUpdateSocialHelpRequestPayload(
  draft: CreateHelpRequestReviewParams,
): UpdateSocialHelpRequestRequest {
  return buildSocialHelpRequestPayloadBase(draft);
}

function buildMaterialHelpRequestPayloadBase(
  draft: CreateMaterialHelpRequestReviewParams,
): CreateMaterialHelpRequestRequest {
  const mediaIds = getDraftMediaIds(draft.photos);

  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category || 'OTHER',
    amount_required_kopeks: Math.round(draft.amountRubles * 100),
    ...(mediaIds.length ? { media_ids: mediaIds } : {}),
  };
}

export function buildCreateMaterialHelpRequestPayload(
  draft: CreateMaterialHelpRequestReviewParams,
): CreateMaterialHelpRequestRequest {
  return buildMaterialHelpRequestPayloadBase(draft);
}

export function buildUpdateMaterialHelpRequestPayload(
  draft: CreateMaterialHelpRequestReviewParams,
): UpdateMaterialHelpRequestRequest {
  return buildMaterialHelpRequestPayloadBase(draft);
}
