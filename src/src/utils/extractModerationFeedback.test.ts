import { describe, expect, it } from 'vitest';
import { extractModerationFeedback } from './extractModerationFeedback';

describe('extractModerationFeedback', () => {
  it('takes latest non-empty return and rejection reasons', () => {
    const history = [
      {
        return_reason: '  ',
        returned_at: '2026-05-20T10:00:00.000Z',
        created_at: '2026-05-20T10:00:00.000Z',
      },
      {
        return_reason: 'Добавьте документы',
        returned_at: '2026-05-22T10:00:00.000Z',
        created_at: '2026-05-22T10:00:00.000Z',
      },
      {
        return_reason: 'Уточните сумму',
        returned_at: '2026-05-23T10:00:00.000Z',
        created_at: '2026-05-23T10:00:00.000Z',
      },
      {
        rejection_reason: 'Нарушение правил',
        rejected_at: '2026-05-24T10:00:00.000Z',
        created_at: '2026-05-24T10:00:00.000Z',
      },
    ] as any[];

    const feedback = extractModerationFeedback(history as any);
    expect(feedback.returnReason).toBe('Уточните сумму');
    expect(feedback.rejectionReason).toBe('Нарушение правил');
    expect(feedback.returnedAt).toBe('2026-05-23T10:00:00.000Z');
    expect(feedback.rejectedAt).toBe('2026-05-24T10:00:00.000Z');
  });

  it('falls back to empty feedback when no reasons found', () => {
    expect(extractModerationFeedback([] as any)).toEqual({
      returnReason: undefined,
      returnedAt: undefined,
      rejectionReason: undefined,
      rejectedAt: undefined,
    });
  });
});
