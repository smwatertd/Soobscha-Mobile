import { HelpRequestDetail } from '../api/integrationTypes';
import { CreateMaterialHelpRequestReviewParams } from '../navigation/createHelpRequestTypes';
import { parseHelpRequestMediaFiles, splitHelpRequestMedia } from './parseHelpRequestMediaFiles';

function getRequestedKopeks(request: HelpRequestDetail): number {
  const financials = request.financials;
  return (
    financials?.requested_kopeks ??
    financials?.amount_requested_kopeks ??
    request.amount_requested_kopeks ??
    0
  );
}

function mediaToDraftPhotos(request: HelpRequestDetail) {
  const items = parseHelpRequestMediaFiles(request.media_files);
  const { images, documents } = splitHelpRequestMedia(items);

  return [...images, ...documents].map((item, index) => ({
    id: item.mediaId,
    uri: item.previewUrl || item.url || '',
    fileName: item.fileName,
    contentType: item.contentType,
    mediaId: item.mediaId,
    kind: item.contentType.startsWith('image/') ? ('image' as const) : ('document' as const),
    sortIndex: index,
  }));
}

export function hydrateMaterialHelpRequestDraft(
  request: HelpRequestDetail,
  categoryLabel?: string,
): CreateMaterialHelpRequestReviewParams {
  const requested = getRequestedKopeks(request);

  return {
    type: 'material',
    category: request.category,
    categoryLabel: categoryLabel ?? request.category,
    title: request.title ?? '',
    description: request.description ?? '',
    amountRubles: Math.round(requested / 100),
    photos: mediaToDraftPhotos(request),
  };
}
