import { ReportDetailsResponse } from '../api/reports';
import {
  BeneficiaryReportViewModel,
  buildBeneficiaryReportViewModel,
} from './beneficiaryReportViewModel';

export function resolveVolunteerReportPreview(
  helpRequestId: string,
  isMaterial: boolean,
  reportRaw: ReportDetailsResponse | null,
): BeneficiaryReportViewModel | null {
  void helpRequestId;
  void isMaterial;
  if (reportRaw) {
    return buildBeneficiaryReportViewModel(reportRaw);
  }
  return null;
}

export function canVolunteerViewHelpRequestReport(status: string | null | undefined): boolean {
  return status === 'COMPLETED';
}
