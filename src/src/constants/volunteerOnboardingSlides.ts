import { OnboardingGuideIllustrationVariant } from './beneficiaryOnboardingSlides';

export type VolunteerOnboardingSlide = {
  color: string;
  bg: string;
  tag: string;
  title: string;
  body: string;
  illu: OnboardingGuideIllustrationVariant;
};

export const VOLUNTEER_ONBOARDING_SLIDES: VolunteerOnboardingSlide[] = [
  {
    color: '#1F6F5C',
    bg: '#E1EFE2',
    tag: 'Шаг 1 из 4',
    title: 'Сообща',
    body: 'В приложении вы видите заявки людей, которым нужна поддержка — делом или пожертвованием. Покажем, как устроена лента и ваш профиль.',
    illu: 'welcome',
  },
  {
    color: '#446D9E',
    bg: '#E2EAF3',
    tag: 'Шаг 2 из 4',
    title: 'Найдите подходящую заявку',
    body: 'Фильтруйте по типу помощи, городу и навыкам. Откликайтесь на социальные заявки или поддерживайте материальные сборы.',
    illu: 'request',
  },
  {
    color: '#E89B5A',
    bg: '#FBE8D8',
    tag: 'Шаг 3 из 4',
    title: 'Верификация и навыки',
    body: 'Пройдите короткую проверку документов — так получатели доверяют вам. Укажите навыки: от уборки до перевозки с подтверждением.',
    illu: 'money',
  },
  {
    color: '#1F6F5C',
    bg: '#E1EFE2',
    tag: 'Шаг 4 из 4',
    title: 'Встречи и отчётность',
    body: 'На встрече отметьте, кто пришёл, и завершите помощь. После сбора средств получатель отправит отчёт — вы увидите результат.',
    illu: 'meeting',
  },
];
