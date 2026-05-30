import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  BeneficiaryStats,
  getCurrentBeneficiary,
  getCurrentBeneficiaryStats,
  getMyHelpRequests,
} from '../api/beneficiaries';
import { getHelpRequestById, HelpRequestSummary } from '../api/helpRequests';
import { SocialHelpRequestSummary } from '../api/integrationTypes';
import { isSessionExpiredError } from '../services/authSession';
import {
  firstNameFromFullName,
  formatHelpRequestDate,
  formatHelpRequestDateTime,
  helpRequestStatusToBadge,
  DONE_HELP_REQUEST_STATUSES,
  IN_PROGRESS_HELP_REQUEST_STATUSES,
  isInProgressHelpRequestStatus,
} from '../utils/helpRequestStatus';

export type BeneficiaryActiveRequest = {
  id: string;
  type: string;
  title: string;
  statusBadge: string;
  meta: string;
  volunteerJoined?: number;
  volunteerMax?: number;
  volunteerMin?: number;
};

export type BeneficiaryHomeLifetimeStats = {
  collectedRubles: number;
  totalRequests: number;
  completedRequests: number;
};

export type BeneficiaryHomeClosedRequest = {
  id: string;
  type: string;
  title: string;
  meta: string;
};

export type BeneficiaryHomeData = {
  fullName: string;
  greetingName: string;
  activeRequest: BeneficiaryActiveRequest | null;
  lifetimeStats: BeneficiaryHomeLifetimeStats | null;
  closedRequests: BeneficiaryHomeClosedRequest[];
  totalRequestsCount: number;
};

function pickInProgressRequest(items: HelpRequestSummary[]): HelpRequestSummary | null {
  for (const item of items) {
    if (typeof item.status === 'string' && isInProgressHelpRequestStatus(item.status)) {
      return item;
    }
  }
  return null;
}

function buildActiveRequest(
  summary: HelpRequestSummary,
  detail?: SocialHelpRequestSummary | null,
): BeneficiaryActiveRequest {
  const status = typeof summary.status === 'string' ? summary.status : '';
  const type = typeof summary.type === 'string' ? summary.type : '';
  const title = typeof summary.title === 'string' ? summary.title : 'Заявка';
  const createdAt = typeof summary.created_at === 'string' ? summary.created_at : '';
  const startAt = typeof summary.start_at === 'string' ? summary.start_at : '';

  let meta = createdAt ? `опубликовано ${formatHelpRequestDate(createdAt)}` : '';
  if (type === 'SOCIAL' && startAt) {
    meta = `${formatHelpRequestDateTime(startAt)}${createdAt ? ` · опубликовано ${formatHelpRequestDate(createdAt)}` : ''}`;
  }

  const base: BeneficiaryActiveRequest = {
    id: typeof summary.id === 'string' ? summary.id : '',
    type,
    title,
    statusBadge: helpRequestStatusToBadge(status),
    meta,
  };

  if (type === 'SOCIAL') {
    const min = typeof summary.min_volunteers === 'number' ? summary.min_volunteers : undefined;
    const max = typeof summary.max_volunteers === 'number' ? summary.max_volunteers : undefined;
    const joined = detail?.participants?.joined;
    if (joined !== undefined && max !== undefined) {
      base.volunteerJoined = joined;
      base.volunteerMax = max;
      base.volunteerMin = min;
    }
  }

  return base;
}

function buildClosedRequest(summary: HelpRequestSummary): BeneficiaryHomeClosedRequest {
  const type = typeof summary.type === 'string' ? summary.type : '';
  const title = typeof summary.title === 'string' ? summary.title : 'Заявка';
  const createdAt = typeof summary.created_at === 'string' ? summary.created_at : '';
  const startAt = typeof summary.start_at === 'string' ? summary.start_at : '';

  let meta = createdAt ? formatHelpRequestDate(createdAt) : '';
  if (type === 'MATERIAL') {
    const collected = typeof summary.collected_kopeks === 'number' ? summary.collected_kopeks : 0;
    if (collected > 0) {
      const rubles = Math.round(collected / 100);
      meta = `Собрано ${rubles.toLocaleString('ru-RU')} ₽${meta ? ` · ${meta}` : ''}`;
    }
  } else if (startAt) {
    meta = formatHelpRequestDateTime(startAt);
  }

  return {
    id: typeof summary.id === 'string' ? summary.id : '',
    type,
    title,
    meta,
  };
}

export function useBeneficiaryHome(onSessionExpired?: () => void) {
  const [data, setData] = useState<BeneficiaryHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const [profile, requestsPage] = await Promise.all([
          getCurrentBeneficiary(),
          getMyHelpRequests({
            page: 1,
            pageSize: 20,
            orderDesc: true,
            statuses: [...IN_PROGRESS_HELP_REQUEST_STATUSES],
          }),
        ]);

        const activeSummary = pickInProgressRequest(requestsPage.items);
        let detail: SocialHelpRequestSummary | null = null;

        if (activeSummary?.type === 'SOCIAL' && typeof activeSummary.id === 'string') {
          try {
            detail = await getHelpRequestById(activeSummary.id);
          } catch {
            // progress block is optional
          }
        }

        let lifetimeStats: BeneficiaryHomeLifetimeStats | null = null;
        let totalRequestsCount = 0;
        let closedRequests: BeneficiaryHomeClosedRequest[] = [];

        if (!activeSummary) {
          try {
            const [stats, completedPage] = await Promise.all([
              getCurrentBeneficiaryStats(),
              getMyHelpRequests({
                page: 1,
                pageSize: 3,
                orderDesc: true,
                statuses: [...DONE_HELP_REQUEST_STATUSES],
              }),
            ]);
            lifetimeStats = {
              collectedRubles: Math.round(stats.financials.collected_kopeks / 100),
              totalRequests: stats.totals.all,
              completedRequests: stats.totals.completed,
            };
            totalRequestsCount = stats.totals.all;
            closedRequests = completedPage.items.map(buildClosedRequest);
          } catch {
            // stats block is optional
          }
        }

        const fullName = profile.full_name;
        setData({
          fullName,
          greetingName: firstNameFromFullName(fullName),
          activeRequest: activeSummary ? buildActiveRequest(activeSummary, detail) : null,
          lifetimeStats,
          closedRequests,
          totalRequestsCount,
        });
      } catch (err) {
        if (isSessionExpiredError(err)) {
          onSessionExpired?.();
          return;
        }
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onSessionExpired],
  );

  const refresh = useCallback(() => load('refresh'), [load]);

  useFocusEffect(
    useCallback(() => {
      load('initial');
    }, [load]),
  );

  return { data, loading, refreshing, error, refresh };
}
