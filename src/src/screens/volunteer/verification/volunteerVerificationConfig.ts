import { IconName } from '../../../components/Icon';
import { ProfileVerificationStatus } from '../../../types/profileVerification';
import { T } from '../../../theme/tokens';

export const VOLUNTEER_VERIF_STEPS = 4;

export const VOLUNTEER_VERIF_STATUS_OPTIONS: {
  id: ProfileVerificationStatus;
  label: string;
}[] = [
  { id: 'none', label: 'Не пройдена' },
  { id: 'pending', label: 'На модерации' },
  { id: 'approved', label: 'Одобрено' },
  { id: 'rejected', label: 'Отклонено' },
  { id: 'revoked', label: 'Отозвано' },
];

export type VolunteerVerifContact = {
  emoji: string;
  name: string;
  value: string;
  main?: boolean;
};

export type VolunteerVerifUpload = {
  title: string;
  sub: string;
  color: string;
  done?: boolean;
  progress?: number;
};

export type VolunteerVerifSkillOption = {
  label: string;
  active?: boolean;
};

export type VolunteerVerifSkillDoc = {
  label: string;
  sub: string;
  color: string;
  active?: boolean;
  docName?: string;
};

export type VolunteerVerifReviewPhoto = {
  caption: string;
  color: string;
};

export type VolunteerVerifActiveStatus = Exclude<ProfileVerificationStatus, 'none'>;

export type VolunteerVerifActiveConfig = {
  title: string;
  sub: string;
  bannerBg: string;
  bannerColor: string;
  bannerIcon: IconName;
  bannerText: string;
  reasonTitle?: string;
  reasonLabel?: string;
  reasonText?: string;
  reasonAuthor?: string;
  btnLabel: string;
  btnDisabled?: boolean;
  hint?: string;
};

export const VOLUNTEER_VERIF_NONE: VolunteerVerifActiveConfig = {
  title: 'Верификация не пройдена',
  sub: 'Вы ещё не отправляли данные на проверку',
  bannerBg: '#E2EAF3',
  bannerColor: '#446D9E',
  bannerIcon: 'shield',
  bannerText:
    'Проверка займёт около 10 минут. Понадобятся паспорт, селфи с документом и подтверждение навыков.',
  btnLabel: 'Начать верификацию',
};

export const VOLUNTEER_VERIF_ACTIVE: Record<VolunteerVerifActiveStatus, VolunteerVerifActiveConfig> = {
  pending: {
    title: 'На проверке',
    sub: 'Заявка отправлена 21 мая в 14:22',
    bannerBg: T.warningSoft,
    bannerColor: '#8B5E10',
    bannerIcon: 'clock',
    bannerText:
      'Модератор обычно отвечает в течение 24 часов. Изменить данные сейчас нельзя — нужно дождаться проверки.',
    btnLabel: 'Обновить данные',
    btnDisabled: true,
    hint: 'Доступно после ответа модератора',
  },
  approved: {
    title: 'Верификация активна',
    sub: 'Одобрена 22 марта 2026 партнёром «Добро»',
    bannerBg: T.successSoft,
    bannerColor: T.success,
    bannerIcon: 'shield',
    bannerText: 'Все данные одобрены. Изменение данных запустит новую проверку.',
    btnLabel: 'Обновить данные',
  },
  rejected: {
    title: 'Отклонена',
    sub: 'Отказ от 21 мая, 18:04 · партнёр «Добро»',
    bannerBg: T.dangerSoft,
    bannerColor: T.danger,
    bannerIcon: 'warn',
    bannerText:
      'Партнёр оставил подробный комментарий — посмотрите ниже и отправьте заявку заново после правок.',
    reasonTitle: 'Причина отказа',
    reasonLabel: 'Нечитаемое селфи с паспортом',
    reasonText:
      'На фото блики, не видно лица. Сфотографируйте при дневном свете без отблесков и убедитесь, что лицо и паспорт хорошо различимы.',
    reasonAuthor: 'Партнёр «Добро» · 21 мая, 18:04',
    btnLabel: 'Исправить и отправить снова',
  },
  revoked: {
    title: 'Отозвана',
    sub: 'Отозвана партнёром 19 мая',
    bannerBg: T.surface2,
    bannerColor: T.muted,
    bannerIcon: 'eye',
    bannerText: 'Профиль временно ограничен. Чтобы вернуть доступ — отправьте данные заново.',
    reasonTitle: 'Причина отзыва',
    reasonLabel: 'Жалоба от пользователя',
    reasonText:
      'Получено сообщение о несоответствии данных в профиле. Просим повторно загрузить документы и обновить контактную информацию.',
    reasonAuthor: 'Партнёр «Добро» · 19 мая',
    btnLabel: 'Отправить данные заново',
  },
};
