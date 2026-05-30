import { describe, expect, it } from 'vitest';
import {
  firstNameFromFullName,
  formatHelpRequestDate,
  helpRequestStatusToBadge,
  isInProgressHelpRequestStatus,
  statusesForBeneficiaryRequestsTab,
} from './helpRequestStatus';

describe('helpRequestStatus utils', () => {
  it('maps API status to badge code', () => {
    expect(helpRequestStatusToBadge('COLLECTING_FUNDS')).toBe('collecting');
    expect(helpRequestStatusToBadge('REPORT_ON_REVIEW')).toBe('report_on_review');
    expect(helpRequestStatusToBadge('REPORT_OVERDUE')).toBe('report_overdue');
    expect(helpRequestStatusToBadge('UNKNOWN_STATUS')).toBe('unknown_status');
  });

  it('returns statuses by tab', () => {
    expect(statusesForBeneficiaryRequestsTab('done')).toEqual(['COMPLETED']);
    expect(statusesForBeneficiaryRequestsTab('archive')).toContain('REJECTED');
    expect(statusesForBeneficiaryRequestsTab('active')).toContain('FUNDED');
  });

  it('checks in-progress status and formats names/date', () => {
    expect(isInProgressHelpRequestStatus('IN_PROGRESS')).toBe(true);
    expect(isInProgressHelpRequestStatus('COMPLETED')).toBe(false);
    expect(firstNameFromFullName('  Иван Петров ')).toBe('Иван');
    expect(formatHelpRequestDate('invalid')).toBe('invalid');
  });
});
