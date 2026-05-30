import { HelpRequestVersion } from '../api/integrationTypes';

export type ModerationFeedback = {
  returnReason?: string;
  rejectionReason?: string;
  returnedAt?: string;
  rejectedAt?: string;
};

function pickLatestString(
  history: HelpRequestVersion[],
  field: 'return_reason' | 'rejection_reason',
  dateField: 'returned_at' | 'rejected_at',
): { text?: string; at?: string } {
  let best: { text?: string; at?: string; ts: number } | null = null;

  for (const version of history) {
    const text = version[field];
    if (typeof text !== 'string' || !text.trim()) continue;

    const at = version[dateField];
    const ts =
      typeof at === 'string' && at
        ? new Date(at).getTime()
        : typeof version.created_at === 'string'
          ? new Date(version.created_at).getTime()
          : 0;

    if (!best || ts >= best.ts) {
      best = { text: text.trim(), at: typeof at === 'string' ? at : undefined, ts };
    }
  }

  return best ? { text: best.text, at: best.at } : {};
}

export function extractModerationFeedback(history: HelpRequestVersion[]): ModerationFeedback {
  const returned = pickLatestString(history, 'return_reason', 'returned_at');
  const rejected = pickLatestString(history, 'rejection_reason', 'rejected_at');

  return {
    returnReason: returned.text,
    returnedAt: returned.at,
    rejectionReason: rejected.text,
    rejectedAt: rejected.at,
  };
}
