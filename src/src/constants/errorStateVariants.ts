export type ErrorStateVariant = 'network' | 'server' | 'payment-failed';

export const ERROR_STATE_VARIANTS: {
  id: ErrorStateVariant;
  label: string;
  title: string;
  message: string;
  icon: 'warn' | 'close';
  iconBg: string;
  iconColor: string;
  primaryLabel: string;
  secondaryLabel?: string;
}[] = [
  {
    id: 'network',
    label: 'Сеть',
    title: 'Нет подключения',
    message: 'Похоже, интернет пропал. Проверьте мобильную сеть или Wi-Fi и попробуйте ещё раз.',
    icon: 'warn',
    iconBg: '#FCE8E6',
    iconColor: '#C0392B',
    primaryLabel: 'Попробовать снова',
    secondaryLabel: 'Открыть сохранённое',
  },
  {
    id: 'server',
    label: '500',
    title: 'Что-то пошло не так',
    message:
      'На стороне сервера произошла ошибка. Мы уже знаем и работаем над этим. Попробуйте через минуту.',
    icon: 'warn',
    iconBg: '#FFF3D6',
    iconColor: '#8B5E10',
    primaryLabel: 'Попробовать снова',
    secondaryLabel: 'Связаться с поддержкой',
  },
  {
    id: 'payment-failed',
    label: 'Платёж',
    title: 'Платёж не прошёл',
    message:
      'Банк отклонил операцию. Деньги не списаны. Проверьте баланс или попробуйте другую карту.',
    icon: 'close',
    iconBg: '#FCE8E6',
    iconColor: '#C0392B',
    primaryLabel: 'Попробовать снова',
    secondaryLabel: 'Вернуться к заявке',
  },
];

export function getErrorStateConfig(variant: ErrorStateVariant) {
  return ERROR_STATE_VARIANTS.find((item) => item.id === variant) ?? ERROR_STATE_VARIANTS[0];
}
