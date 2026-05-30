import { useCallback, useEffect, useState } from 'react';
import {
  getHelpRequestById,
  getHelpRequestHistory,
  getSocialHelpRequestParticipants,
} from '../api/helpRequests';
import {
  HelpRequestDetail,
  HelpRequestVersion,
  SocialHelpRequestParticipant,
} from '../api/integrationTypes';
import { isSessionExpiredError } from '../services/authSession';
import { ensureLabelCatalogLoaded } from '../services/labelCatalog';
import { extractModerationFeedback, ModerationFeedback } from '../utils/extractModerationFeedback';
import { buildHelpRequestTimeline, HelpRequestTimelineItem } from '../utils/helpRequestTimeline';
import {
  HelpRequestMediaItem,
  parseHelpRequestMediaFiles,
} from '../utils/parseHelpRequestMediaFiles';
import { SOCIAL_VOLUNTEER_PROGRESS_STATUSES } from '../utils/helpRequestStatus';

export type BeneficiaryHelpRequestDetailData = {
  request: HelpRequestDetail;
  categoryLabel?: string;
  participants: SocialHelpRequestParticipant[];
  timeline: HelpRequestTimelineItem[];
  mediaItems: HelpRequestMediaItem[];
  moderationFeedback: ModerationFeedback;
  history: HelpRequestVersion[];
  isSocial: boolean;
  isMaterial: boolean;
};

export function useBeneficiaryHelpRequestDetail(
  helpRequestId: string,
  onSessionExpired?: () => void,
) {
  const [data, setData] = useState<BeneficiaryHelpRequestDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [request, history] = await Promise.all([
          getHelpRequestById(helpRequestId),
          getHelpRequestHistory(helpRequestId).catch(() => [] as HelpRequestVersion[]),
        ]);
        const categories = await ensureLabelCatalogLoaded().catch(() => ({
          social: [],
          material: [],
          beneficiary: [],
        }));

        const isSocial = request.type === 'SOCIAL';
        const isMaterial = request.type === 'MATERIAL';

        let participants: SocialHelpRequestParticipant[] = [];
        if (
          isSocial &&
          (SOCIAL_VOLUNTEER_PROGRESS_STATUSES as readonly string[]).includes(request.status)
        ) {
          try {
            participants = await getSocialHelpRequestParticipants(helpRequestId);
          } catch {
            participants = [];
          }
        } else if (isSocial && (request.participants?.joined ?? 0) > 0) {
          try {
            participants = await getSocialHelpRequestParticipants(helpRequestId);
          } catch {
            participants = [];
          }
        }

        const categoryLabel =
          [...categories.social, ...categories.material].find((item) => item.code === request.category)
            ?.label ?? request.category;

        setData({
          request,
          categoryLabel,
          participants,
          timeline: buildHelpRequestTimeline(request, history),
          mediaItems: parseHelpRequestMediaFiles(request.media_files),
          moderationFeedback: extractModerationFeedback(history),
          history,
          isSocial,
          isMaterial,
        });
      } catch (err) {
        if (isSessionExpiredError(err)) {
          onSessionExpired?.();
          return;
        }
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заявку');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [helpRequestId, onSessionExpired],
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => load('refresh'),
  };
}
