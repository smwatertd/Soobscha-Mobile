import { ReportDetailsResponse } from '../api/reports';

export type SocialReportParticipantPreview = {
  name: string;
  attendance: 'ATTENDED' | 'LEFT_AFTER_START';
};

export type BeneficiaryReportViewModel = {
  report: ReportDetailsResponse;
  isMaterial: boolean;
  description: string;
  photos: ReportDetailsResponse['media_files'];
  documents: ReportDetailsResponse['media_files'];
  socialParticipants: SocialReportParticipantPreview[];
  socialRating: number | null;
  materialReceivedKopeks: number | null;
  materialConfirmedKopeks: number | null;
  materialRefundKopeks: number | null;
  moderationAuthor: string | null;
};

type BuildOptions = {
  collectedKopeks?: number | null;
};

function isMaterialReport(report: ReportDetailsResponse): boolean {
  return report.help_request_type.toUpperCase().includes('MATERIAL');
}

function splitMedia(report: ReportDetailsResponse) {
  const photos = report.media_files.filter((file) =>
    (file.content_type ?? '').startsWith('image/'),
  );
  const documents = report.media_files.filter(
    (file) => !(file.content_type ?? '').startsWith('image/'),
  );
  return { photos: photos.length ? photos : report.media_files.slice(0, 4), documents };
}

export function buildBeneficiaryReportViewModel(
  report: ReportDetailsResponse,
  options?: BuildOptions,
): BeneficiaryReportViewModel {
  const material = isMaterialReport(report);
  const { photos, documents } = splitMedia(report);
  const description = material
    ? (report.payload as { purchases_description?: string }).purchases_description ?? ''
    : (report.payload as { work_description?: string }).work_description ?? '';

  const confirmed = report.spent_confirmed_kopeks ?? null;
  const received = material ? (options?.collectedKopeks ?? null) : null;
  const refund =
    material && confirmed != null && received != null && confirmed < received
      ? received - confirmed
      : null;

  return {
    report,
    isMaterial: material,
    description,
    photos,
    documents: material ? documents : [],
    socialParticipants: [],
    socialRating: null,
    materialReceivedKopeks: material ? received : null,
    materialConfirmedKopeks: material ? confirmed : null,
    materialRefundKopeks: material ? refund : null,
    moderationAuthor: null,
  };
}

/** @deprecated Use buildBeneficiaryReportViewModel */
export function applyBeneficiaryReportDevPreview(
  report: ReportDetailsResponse,
  options?: BuildOptions,
): BeneficiaryReportViewModel {
  return buildBeneficiaryReportViewModel(report, options);
}
