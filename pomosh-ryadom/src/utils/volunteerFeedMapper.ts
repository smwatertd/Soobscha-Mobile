import { HelpRequestSummary } from '../api/helpRequests';
import { MediaDownloadUrlResponse, SocialHelpRequestSummary } from '../api/integrationTypes';
import { VolunteerFeedItem } from '../screens/volunteer/volunteerFeedTypes';
import {
  getHelpRequestBeneficiaryCategoryCode,
  getHelpRequestBeneficiaryCategoryLabel,
  getHelpRequestBeneficiaryName,
} from './helpRequestBeneficiary';
import { resolveCategoryLabel } from './helpRequestCategoryLabels';
import { buildHelpRequestImageSlides } from './parseHelpRequestMediaFiles';
import { readHelpRequestIsWatched } from './helpRequestWatch';
import { resolveHelpRequestWatchedState } from '../services/helpRequestWatch';

function asSocial(item: HelpRequestSummary): SocialHelpRequestSummary | null {
  if (item.type !== 'SOCIAL') return null;
  return item as SocialHelpRequestSummary;
}

function beneficiaryName(item: HelpRequestSummary): string {
  return getHelpRequestBeneficiaryName(item.beneficiary);
}

function beneficiaryCategoryCode(item: HelpRequestSummary): string | null {
  return getHelpRequestBeneficiaryCategoryCode(item.beneficiary);
}

function beneficiaryCategory(item: HelpRequestSummary): string | null {
  return getHelpRequestBeneficiaryCategoryLabel(item.beneficiary);
}

function categoryCode(item: HelpRequestSummary): string {
  return typeof item.category === 'string' ? item.category : '';
}

function categoryLabel(item: HelpRequestSummary): string {
  const code = categoryCode(item);
  return resolveCategoryLabel(code);
}

function mediaFiles(item: HelpRequestSummary): MediaDownloadUrlResponse[] | undefined {
  const raw = item as Record<string, unknown>;
  const files = raw.media_files;
  return Array.isArray(files) ? (files as MediaDownloadUrlResponse[]) : undefined;
}

function firstImageUri(item: HelpRequestSummary): string | undefined {
  const files = mediaFiles(item);
  if (!files?.length) return undefined;
  const media = files[0];
  return media.preview_url || media.url;
}

function distanceKm(item: HelpRequestSummary): number | undefined {
  const raw = item as Record<string, unknown>;
  const value = raw.distance_km ?? raw.distanceKm;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function mapHelpRequestToVolunteerFeedItem(item: HelpRequestSummary): VolunteerFeedItem {
  const id = typeof item.id === 'string' ? item.id : '';
  const social = asSocial(item);
  const files = mediaFiles(item);
  const mediaSlides = buildHelpRequestImageSlides(files);
  const imageUri = mediaSlides[0]?.uri ?? firstImageUri(item);
  const km = distanceKm(item);
  const isWatched = resolveHelpRequestWatchedState(id, readHelpRequestIsWatched(item));

  if (item.type === 'MATERIAL') {
    const raw = item as Record<string, unknown>;
    const financials = raw.financials as
      | {
          requested_kopeks?: number;
          collected_kopeks?: number;
          amount_requested_kopeks?: number;
          amount_collected_kopeks?: number;
        }
      | undefined;
    const donations = raw.donations as { count?: number; donors_count?: number } | undefined;
    const goalKopeks =
      financials?.requested_kopeks ??
      financials?.amount_requested_kopeks ??
      (typeof raw.amount_requested_kopeks === 'number' ? raw.amount_requested_kopeks : 0);
    const collectedKopeks =
      financials?.collected_kopeks ??
      financials?.amount_collected_kopeks ??
      (typeof raw.amount_collected_kopeks === 'number' ? raw.amount_collected_kopeks : 0);
    const goal = goalKopeks > 0 ? goalKopeks / 100 : undefined;
    const collected = goalKopeks > 0 ? collectedKopeks / 100 : undefined;
    const donorCount = donations?.count ?? donations?.donors_count;

    return {
      id,
      type: 'material',
      title: typeof item.title === 'string' ? item.title : 'Материальная заявка',
      author: beneficiaryName(item),
      categoryCode: categoryCode(item),
      reqCategory: categoryLabel(item),
      benCategory: beneficiaryCategory(item),
      benCategoryCode: beneficiaryCategoryCode(item),
      status: typeof item.status === 'string' ? item.status : 'unknown',
      mediaSlides,
      imageUri,
      goal,
      collected,
      donors: donorCount,
      daysLeft: undefined,
      isWatched,
    };
  }

  const joined = social?.participants?.joined ?? 0;
  const max = social?.max_volunteers ?? joined;
  const min = social?.min_volunteers ?? 0;
  const startAt = social?.start_at
    ? new Date(social.start_at).toLocaleString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined;

  return {
    id,
    type: 'social',
    title: social?.title ?? 'Социальная заявка',
    author: beneficiaryName(item),
    categoryCode: categoryCode(item),
    reqCategory: categoryLabel(item),
    benCategory: beneficiaryCategory(item),
    benCategoryCode: beneficiaryCategoryCode(item),
    status: typeof item.status === 'string' ? item.status : 'unknown',
    mediaSlides,
    imageUri,
    date: startAt,
    startAtIso: social?.start_at,
    distanceKm: km,
    volunteers: { current: joined, min, max },
    isWatched,
  };
}
