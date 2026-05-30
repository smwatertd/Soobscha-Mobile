import { HelpRequestDetail, HelpRequestVersion } from '../api/integrationTypes';
import { IconName } from '../components/Icon';
import { formatHelpRequestDate, formatHelpRequestDateTime } from './helpRequestStatus';

export type HelpRequestTimelineItem = {
  id: string;
  date?: string;
  title: string;
  desc?: string;
  done: boolean;
  current: boolean;
  icon: IconName;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  terminal?: boolean;
};

type StepDef = {
  id: string;
  title: string;
  icon: IconName;
  match: (status: string) => boolean;
  isPast: (status: string) => boolean;
  desc?: (request: HelpRequestDetail, history: HelpRequestVersion[]) => string | undefined;
  date?: (request: HelpRequestDetail, history: HelpRequestVersion[]) => string | undefined;
};

function latestTimestamp(history: HelpRequestVersion[], field: string): string | undefined {
  let latest: string | undefined;
  for (const version of history) {
    const value = version[field];
    if (typeof value === 'string' && value) {
      if (!latest || new Date(value).getTime() > new Date(latest).getTime()) {
        latest = value;
      }
    }
  }
  return latest;
}

function formatTimelineDate(value?: string): string | undefined {
  if (!value) return undefined;
  return value.includes('T') ? formatHelpRequestDateTime(value) : formatHelpRequestDate(value);
}

const SOCIAL_STEPS: StepDef[] = [
  {
    id: 'created',
    title: 'Заявка создана',
    icon: 'document',
    match: (s) => s === 'PENDING_MODERATION',
    isPast: () => true,
    date: (request) => formatTimelineDate(request.created_at),
  },
  {
    id: 'approved',
    title: 'Заявка одобрена партнёром',
    icon: 'shield',
    match: (s) => s === 'VOLUNTEER_RECRUITING',
    isPast: (s) =>
      !['PENDING_MODERATION', 'RETURNED_TO_REWORK', 'REJECTED', 'CANCELLED'].includes(s),
    date: (_request, history) => formatTimelineDate(latestTimestamp(history, 'approved_at')),
    desc: () => 'Заявка опубликована для волонтёров',
  },
  {
    id: 'recruiting',
    title: 'Идёт набор волонтёров',
    icon: 'user',
    match: (s) => s === 'VOLUNTEER_RECRUITING',
    isPast: (s) =>
      ![
        'PENDING_MODERATION',
        'RETURNED_TO_REWORK',
        'VOLUNTEER_RECRUITING',
        'REJECTED',
        'CANCELLED',
      ].includes(s),
    desc: (request) => {
      const joined = request.participants?.joined;
      return joined !== undefined && joined > 0
        ? `${joined} ${joined === 1 ? 'человек откликнулся' : 'человека откликнулись'}`
        : undefined;
    },
  },
  {
    id: 'relevance',
    title: 'Подтверждение актуальности',
    icon: 'check',
    match: (s) => s === 'WAITING_RELEVANCE_CONFIRMATION',
    isPast: (s) =>
      ![
        'PENDING_MODERATION',
        'RETURNED_TO_REWORK',
        'VOLUNTEER_RECRUITING',
        'WAITING_RELEVANCE_CONFIRMATION',
        'REJECTED',
        'CANCELLED',
      ].includes(s),
    desc: () => 'Нужно подтвердить, что помощь всё ещё нужна',
  },
  {
    id: 'start',
    title: 'Старт встречи',
    icon: 'clock',
    match: (s) => s === 'WAITING_START' || s === 'IN_PROGRESS',
    isPast: (s) => ['IN_PROGRESS', 'WAITING_REPORT', 'REPORT_ON_MODERATION', 'COMPLETED'].includes(s),
    date: (request) => formatTimelineDate(request.start_at),
  },
  {
    id: 'report',
    title: 'Отчёт о выполнении',
    icon: 'document',
    match: (s) => s === 'WAITING_REPORT' || s === 'REPORT_ON_MODERATION',
    isPast: (s) => s === 'COMPLETED',
    desc: (request) =>
      request.status === 'WAITING_REPORT' ? 'Нужно подготовить отчёт о выполненной помощи' : undefined,
  },
];

const MATERIAL_STEPS: StepDef[] = [
  {
    id: 'created',
    title: 'Заявка создана',
    icon: 'document',
    match: (s) => s === 'PENDING_MODERATION',
    isPast: () => true,
    date: (request) => formatTimelineDate(request.created_at),
  },
  {
    id: 'approved',
    title: 'Заявка одобрена партнёром',
    icon: 'shield',
    match: (s) => s === 'COLLECTING_FUNDS',
    isPast: (s) => !['PENDING_MODERATION', 'RETURNED_TO_REWORK', 'REJECTED', 'CANCELLED'].includes(s),
    date: (_request, history) => formatTimelineDate(latestTimestamp(history, 'approved_at')),
  },
  {
    id: 'collecting',
    title: 'Идёт сбор средств',
    icon: 'coin',
    match: (s) => s === 'COLLECTING_FUNDS',
    isPast: (s) => !['PENDING_MODERATION', 'RETURNED_TO_REWORK', 'COLLECTING_FUNDS', 'REJECTED', 'CANCELLED'].includes(s),
  },
  {
    id: 'funded',
    title: 'Цель достигнута',
    icon: 'check',
    match: (s) => s === 'FUNDED',
    isPast: (s) => ['FUNDED', 'REPORT_ON_REVIEW', 'REPORT_OVERDUE', 'COMPLETED'].includes(s),
  },
  {
    id: 'report',
    title: 'Отчёт о расходовании',
    icon: 'document',
    match: (s) => s === 'REPORT_ON_REVIEW' || s === 'REPORT_OVERDUE',
    isPast: (s) => s === 'COMPLETED',
  },
];

function buildFromSteps(
  request: HelpRequestDetail,
  history: HelpRequestVersion[],
  steps: StepDef[],
): HelpRequestTimelineItem[] {
  const status = request.status;
  const currentIndex = steps.findIndex((step) => step.match(status));
  const resolvedCurrent =
    currentIndex >= 0
      ? currentIndex
      : Math.max(
          0,
          steps.findIndex((step) => !step.isPast(status)) === -1
            ? steps.length - 1
            : steps.findIndex((step) => !step.isPast(status)),
        );

  const isTerminal = ['COMPLETED', 'REJECTED', 'CANCELLED', 'INTERRUPTED'].includes(status);

  return steps.map((step, index) => ({
    id: step.id,
    title: step.title,
    icon: step.icon,
    date: step.date?.(request, history),
    desc: step.desc?.(request, history),
    done: isTerminal ? true : index < resolvedCurrent,
    current: !isTerminal && index === resolvedCurrent,
    tone: isTerminal && index === steps.length - 1 ? 'success' : 'default',
    terminal: isTerminal && index === steps.length - 1,
  }));
}

export function buildHelpRequestTimeline(
  request: HelpRequestDetail,
  history: HelpRequestVersion[],
): HelpRequestTimelineItem[] {
  if (request.status === 'RETURNED_TO_REWORK') {
    const returnedAt = formatTimelineDate(latestTimestamp(history, 'returned_at'));

    return [
      {
        id: 'created',
        title: 'Заявка создана',
        icon: 'document',
        done: true,
        current: false,
        tone: 'success',
        date: formatTimelineDate(request.created_at),
      },
      {
        id: 'rework',
        title: 'Нужны правки',
        icon: 'edit',
        done: false,
        current: true,
        tone: 'warning',
        terminal: true,
        date: returnedAt,
      },
    ];
  }

  if (request.status === 'REJECTED' || request.status === 'CANCELLED' || request.status === 'INTERRUPTED') {
    return [
      {
        id: 'created',
        title: 'Заявка создана',
        icon: 'document',
        done: true,
        current: false,
        tone: 'success',
        date: formatTimelineDate(request.created_at),
      },
      {
        id: 'closed',
        title:
          request.status === 'REJECTED'
            ? 'Заявка отклонена'
            : request.status === 'CANCELLED'
              ? 'Заявка отменена'
              : 'Выполнение прервано',
        icon: 'close',
        done: true,
        current: false,
        tone: 'danger',
        terminal: true,
      },
    ];
  }

  if (request.type === 'MATERIAL') {
    return buildFromSteps(request, history, MATERIAL_STEPS);
  }

  return buildFromSteps(request, history, SOCIAL_STEPS);
}
