import { describe, expect, it } from 'vitest';
import { getMaterialWorkflowBanner, getSocialWorkflowBanner } from './helpRequestWorkflowConfig';

describe('helpRequestWorkflowConfig', () => {
  it('returns social workflow banner for WAITING_START', () => {
    const banner = getSocialWorkflowBanner({ status: 'WAITING_START', start_at: '2026-06-01T10:00:00.000Z' } as any);
    expect(banner).not.toBeNull();
    expect(banner?.cta).toBe('Начать встречу');
    expect(banner?.sectionLabel).toBe('Встреча');
  });

  it('returns social live banner for IN_PROGRESS', () => {
    const banner = getSocialWorkflowBanner({ status: 'IN_PROGRESS', start_at: '2026-06-01T10:00:00.000Z' } as any);
    expect(banner?.live).toBe(true);
    expect(banner?.title).toBe('Встреча идёт');
  });

  it('returns material banner only for report statuses', () => {
    expect(getMaterialWorkflowBanner({ status: 'COLLECTING_FUNDS' } as any)).toBeNull();
    const overdue = getMaterialWorkflowBanner({ status: 'REPORT_OVERDUE' } as any);
    expect(overdue?.cta).toBe('Составить отчёт');
  });
});
