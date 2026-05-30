import { IconName } from '../../../components/Icon';
import { ProfileVerificationStatus } from '../../../types/profileVerification';
import {
  BENEFICIARY_CATEGORY_PALETTE,
  BeneficiaryCategoryCode,
} from '../../../utils/beneficiaryCategory';
import { T } from '../../../theme/tokens';

export const BENEFICIARY_VERIF_STEPS = 4;

export type BeneficiaryVerifCategoryOption = {
  code: BeneficiaryCategoryCode;
  label: string;
  description: string;
  examples: string[];
  icon: IconName;
  color: string;
  colorBg: string;
};

function categoryOption(
  option: Omit<BeneficiaryVerifCategoryOption, 'color' | 'colorBg'>,
): BeneficiaryVerifCategoryOption {
  const palette = BENEFICIARY_CATEGORY_PALETTE[option.code];
  return { ...option, color: palette.color, colorBg: palette.bg };
}

export const BENEFICIARY_VERIF_CATEGORY_OPTIONS: BeneficiaryVerifCategoryOption[] = [
  categoryOption({
    code: 'ELDERLY',
    label: 'Пенсионер',
    description: 'Одинокий пенсионер или пара пожилых людей без постоянной помощи рядом.',
    examples: ['Удостоверение пенсионера', 'Справка о составе семьи'],
    icon: 'user',
  }),
  categoryOption({
    code: 'DISABLED',
    label: 'Семья с инвалидом',
    description: 'Семья, где есть человек с инвалидностью и нужна регулярная поддержка.',
    examples: ['Справка об инвалидности', 'Документы опекуна'],
    icon: 'heart',
  }),
  categoryOption({
    code: 'LOW_INCOME',
    label: 'Малоимущая семья',
    description: 'Семья с доходом ниже прожиточного минимума по региону.',
    examples: ['Справка о доходах', 'Справка из соцзащиты'],
    icon: 'wallet',
  }),
  categoryOption({
    code: 'LARGE_FAMILY',
    label: 'Многодетная семья',
    description: 'Семья с тремя и более несовершеннолетними детьми.',
    examples: ['Удостоверение многодетной', 'Свидетельства о рождении'],
    icon: 'heart',
  }),
  categoryOption({
    code: 'SINGLE_PARENT',
    label: 'Одинокий родитель',
    description: 'Родитель, воспитывающий ребёнка без постоянной поддержки второго родителя.',
    examples: ['Свидетельство о рождении', 'Справка о семейном положении'],
    icon: 'home',
  }),
  categoryOption({
    code: 'SICK',
    label: 'Больной',
    description: 'Человек с тяжёлым или длительным заболеванием, ограничивающим самостоятельность.',
    examples: ['Выписка или справка', 'Заключение врача'],
    icon: 'plus',
  }),
  categoryOption({
    code: 'DISASTER_VICTIM',
    label: 'Пострадавший от ЧС',
    description: 'Пострадавший от пожара, наводнения или другой чрезвычайной ситуации.',
    examples: ['Справка МЧС', 'Акт обследования жилья'],
    icon: 'warn',
  }),
];

export type BeneficiaryVerifActiveStatus = Exclude<ProfileVerificationStatus, 'none'>;

export type BeneficiaryVerifActiveConfig = {
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

export const BENEFICIARY_VERIF_NONE: BeneficiaryVerifActiveConfig = {
  title: 'Верификация не пройдена',
  sub: 'Вы ещё не отправляли данные на проверку',
  bannerBg: '#E2EAF3',
  bannerColor: '#446D9E',
  bannerIcon: 'shield',
  bannerText:
    'Проверка займёт около 10 минут. Понадобятся паспорт, селфи с документом и документы категории получателя.',
  btnLabel: 'Начать верификацию',
};

export const BENEFICIARY_VERIF_ACTIVE: Record<BeneficiaryVerifActiveStatus, BeneficiaryVerifActiveConfig> = {
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
