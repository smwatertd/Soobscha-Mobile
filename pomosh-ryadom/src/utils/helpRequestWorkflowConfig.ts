import { HelpRequestDetail } from '../api/integrationTypes';
import { IconName } from '../components/Icon';
import { T } from '../theme/tokens';
import { formatSocialScheduleMeta } from '../screens/beneficiary/detail/detailHelpers';

export type WorkflowBannerConfig = {
  sectionLabel: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: IconName;
  backgroundColor: string;
  color: string;
  borderColor: string;
  live?: boolean;
};

export function getSocialWorkflowBanner(
  request: HelpRequestDetail,
): WorkflowBannerConfig | null {
  const schedule = formatSocialScheduleMeta(request.start_at);

  switch (request.status) {
    case 'WAITING_START':
      return {
        sectionLabel: 'Встреча',
        title: 'Скоро старт встречи',
        subtitle: `${schedule.when} · скоро начнём`,
        cta: 'Начать встречу',
        icon: 'flag',
        backgroundColor: T.accentSoft,
        color: T.accentDark,
        borderColor: `${T.accent}22`,
      };
    case 'IN_PROGRESS':
      return {
        sectionLabel: 'Встреча',
        title: 'Встреча идёт',
        subtitle: 'Откройте экран встречи, чтобы отметить участников',
        cta: 'Открыть встречу',
        icon: 'clock',
        backgroundColor: T.primarySoft,
        color: T.primaryDark,
        borderColor: `${T.primary}22`,
        live: true,
      };
    case 'WAITING_REPORT':
      return {
        sectionLabel: 'Отчёт',
        title: 'Встреча завершена',
        subtitle: 'Нужно составить отчёт о выполненной помощи',
        cta: 'Составить отчёт',
        icon: 'document',
        backgroundColor: T.warningSoft,
        color: '#7A5210',
        borderColor: `${T.warning}22`,
      };
    case 'REPORT_ON_REVIEW':
    case 'REPORT_ON_MODERATION':
      return {
        sectionLabel: 'Отчёт',
        title: 'Отчёт на проверке',
        subtitle: 'Партнёр проверяет отчёт — пришлём уведомление',
        cta: 'Открыть отчёт',
        icon: 'shield',
        backgroundColor: T.infoSoft,
        color: T.info,
        borderColor: `${T.info}22`,
      };
    case 'COMPLETED':
      return {
        sectionLabel: 'Отчёт',
        title: 'Заявка закрыта',
        subtitle: 'Партнёр одобрил отчёт',
        cta: 'Просмотреть отчёт',
        icon: 'check',
        backgroundColor: T.successSoft,
        color: T.success,
        borderColor: `${T.success}22`,
      };
    default:
      return null;
  }
}

export function getMaterialWorkflowBanner(
  request: HelpRequestDetail,
): WorkflowBannerConfig | null {
  switch (request.status) {
    case 'REPORT_OVERDUE':
      return {
        sectionLabel: 'Отчёт',
        title: 'Нужен отчёт о расходах',
        subtitle: 'Приложите чеки и описание покупок в течение 30 дней после выплаты',
        cta: 'Составить отчёт',
        icon: 'document',
        backgroundColor: T.warningSoft,
        color: '#7A5210',
        borderColor: `${T.warning}22`,
      };
    case 'REPORT_ON_REVIEW':
      return {
        sectionLabel: 'Отчёт',
        title: 'Отчёт на проверке',
        subtitle: 'Партнёр проверяет расходы — обычно до 48 часов',
        cta: 'Открыть отчёт',
        icon: 'shield',
        backgroundColor: T.infoSoft,
        color: T.info,
        borderColor: `${T.info}22`,
      };
    case 'COMPLETED':
      return {
        sectionLabel: 'Отчёт',
        title: 'Отчёт одобрен',
        subtitle: 'Партнёр принял отчёт и подтвердил расходы',
        cta: 'Просмотреть отчёт',
        icon: 'check',
        backgroundColor: T.successSoft,
        color: T.success,
        borderColor: `${T.success}22`,
      };
    default:
      return null;
  }
}
