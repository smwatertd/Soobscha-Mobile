import { IconName } from '../components/Icon';
import { ProfileVerificationStatus } from '../types/profileVerification';
import { ProfileContactRow } from '../utils/profileContacts';
import { T } from '../theme/tokens';

export type ProfileStat = { value: string; label: string };
export type ProfilePersonalRow = { label: string; value: string; hint?: string; locked?: boolean };
export type ProfileMenuItem = {
  icon: IconName;
  label: string;
  sub?: string;
  color: string;
};

/** ScreenProfile — screens-common.jsx */
export const VOLUNTEER_PROFILE_MOCK = {
  displayName: 'Мария Иванова',
  avatarName: 'Мария Иванова',
  roleLabel: 'Волонтёр',
  subtitle: 'На платформе с марта 2024',
  stats: [
    { value: '14', label: 'встреч' },
    { value: '12 700 ₽', label: 'помог' },
    { value: '38 ч', label: 'времени' },
  ] satisfies ProfileStat[],
  verification: {
    status: 'approved' as ProfileVerificationStatus,
    approvedDate: '22 марта 2024',
  },
  personalRows: [
    { label: 'Город', value: 'Москва', hint: 'можно поменять без проверки', locked: false },
    { label: 'ФИО', value: 'Иванова Мария Сергеевна', locked: true },
    { label: 'Дата рождения', value: '14.03.1992', locked: true },
    { label: 'Паспорт', value: '•••• №•••023', locked: true },
  ] satisfies ProfilePersonalRow[],
  contacts: [
    { emoji: '💬', name: 'Telegram', value: '@maria_iv', main: true },
    { emoji: '📧', name: 'Email', value: 'm.ivanova@mail.ru' },
    { emoji: '💚', name: 'WhatsApp', value: '+7 912 458 70 33' },
  ] satisfies ProfileContactRow[],
  menu: [
    { icon: 'wallet', label: 'Способы оплаты', sub: '2 карты', color: T.accent },
    { icon: 'bell', label: 'Уведомления', sub: 'Включены', color: T.info },
    { icon: 'qr', label: 'QR-код для связи', color: T.primary },
    { icon: 'document', label: 'Договор и оферта', color: T.muted },
  ] satisfies ProfileMenuItem[],
};

/** ScreenProfileBeneficiary — screens-common.jsx */
export const BENEFICIARY_PROFILE_MOCK = {
  displayName: 'Нина Петровна К.',
  avatarName: 'Нина Петровна',
  roleLabel: 'Благополучатель',
  categoryLabel: 'Пенсионер',
  stats: [
    { value: '7', label: 'заявок' },
    { value: '6', label: 'успешных' },
    { value: '285 200 ₽', label: 'получено' },
  ] satisfies ProfileStat[],
  verification: {
    status: 'pending' as ProfileVerificationStatus,
  },
  personalRows: [
    { label: 'Город', value: 'Подольск', hint: 'можно поменять без проверки', locked: false },
    { label: 'ФИО', value: 'Кузнецова Нина Петровна', locked: true },
    { label: 'Дата рождения', value: '08.11.1939', locked: true },
  ] satisfies ProfilePersonalRow[],
  categoryRows: [
    { label: 'Категория', value: 'Пенсионер один', locked: true },
    { label: 'Удостоверение пенсионера', value: 'Загружено · 2 файла', locked: true },
  ] satisfies ProfilePersonalRow[],
  defaultPayout: {
    display_name: 'Карта Мир •• 4287',
    is_default: true,
  },
  contacts: [
    { emoji: '📞', name: 'Звонок', value: '+7 916 234 12 88', main: true },
    { emoji: '💬', name: 'Telegram', value: '@nina_p' },
  ] satisfies ProfileContactRow[],
};
