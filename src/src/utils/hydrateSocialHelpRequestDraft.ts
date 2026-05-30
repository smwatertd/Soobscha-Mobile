import { HelpRequestDetail } from '../api/integrationTypes';
import { DraftPhoto, CreateHelpRequestReviewParams, DEFAULT_DURATION_MINUTES } from '../navigation/createHelpRequestTypes';
import { parseHelpRequestMediaFiles, splitHelpRequestMedia } from './parseHelpRequestMediaFiles';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function startAtToDateParts(startAt: string): { dateIso: string; time: string } {
  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) {
    return { dateIso: '', time: '10:00' };
  }
  const dateIso = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  return { dateIso, time };
}

function mediaToDraftPhotos(request: HelpRequestDetail): DraftPhoto[] {
  const items = parseHelpRequestMediaFiles(request.media_files);
  const { images, documents } = splitHelpRequestMedia(items);

  return [...images, ...documents].map((item, index) => ({
    id: item.mediaId,
    uri: item.previewUrl || item.url || '',
    fileName: item.fileName,
    contentType: item.contentType,
    mediaId: item.mediaId,
    kind: item.contentType.startsWith('image/') ? 'image' : 'document',
    sortIndex: index,
  }));
}

export function hydrateSocialHelpRequestDraft(
  request: HelpRequestDetail,
  categoryLabel?: string,
): CreateHelpRequestReviewParams {
  const { dateIso, time } = startAtToDateParts(request.start_at);

  return {
    type: 'social',
    category: request.category,
    categoryLabel: categoryLabel ?? request.category,
    title: request.title,
    description: request.description,
    dateIso,
    time,
    address: request.address_text || request.place_name || '',
    latitude: request.latitude,
    longitude: request.longitude,
    minVolunteers: request.min_volunteers,
    maxVolunteers: request.max_volunteers,
    requiredSkills: request.required_skills ?? [],
    preferredSkills: request.preferred_skills ?? [],
    photos: mediaToDraftPhotos(request),
    bringItems: request.items_to_bring ?? [],
    extraNotes: request.additional_notes?.trim() ?? '',
    safetyAccepted: true,
    durationMinutes: request.duration_minutes ?? DEFAULT_DURATION_MINUTES,
  };
}
