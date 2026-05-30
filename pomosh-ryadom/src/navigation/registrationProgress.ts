export const REGISTRATION_TOTAL_STEPS = 3;

export type RegistrationStepId = 'role' | 'profile' | 'password' | 'phone';

export const REGISTRATION_STEPS: Record<
  RegistrationStepId,
  { index: number; title: string; subHeader: string; showHeaderStep: boolean }
> = {
  role: {
    index: 1,
    title: 'Выбор роли',
    subHeader: 'Шаг 1 из 3 · регистрация',
    showHeaderStep: true,
  },
  profile: {
    index: 1,
    title: 'Расскажите о себе',
    subHeader: 'Шаг 1 из 3 · регистрация',
    showHeaderStep: false,
  },
  password: {
    index: 2,
    title: 'Придумайте пароль',
    subHeader: 'Шаг 2 из 3 · регистрация',
    showHeaderStep: false,
  },
  phone: {
    index: 3,
    title: 'Номер телефона',
    subHeader: 'Шаг 3 из 3 · регистрация',
    showHeaderStep: true,
  },
};

export function registrationStepLabel(id: RegistrationStepId): string {
  const { index } = REGISTRATION_STEPS[id];
  return `Шаг ${index}/${REGISTRATION_TOTAL_STEPS}`;
}
