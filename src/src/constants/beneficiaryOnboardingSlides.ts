export type OnboardingGuideIllustrationVariant = 'welcome' | 'request' | 'money' | 'meeting';

export type BeneficiaryOnboardingSlide = {
  color: string;
  bg: string;
  tag: string;
  title: string;
  body: string;
  illu: OnboardingGuideIllustrationVariant;
};

export const BENEFICIARY_ONBOARDING_SLIDES: BeneficiaryOnboardingSlide[] = [
  {
    color: '#1E7A4F',
    bg: '#DDEFE3',
    tag: 'Шаг 1 из 4',
    title: 'Помощь в одно касание',
    body: 'Тысячи людей помогают друг другу через платформу — кто-то делом, кто-то деньгами. Покажем, как всё устроено.',
    illu: 'welcome',
  },
  {
    color: '#E07A3F',
    bg: '#FBE8D8',
    tag: 'Шаг 2 из 4',
    title: 'Заявка — это ваш запрос',
    body: 'Опишите, что нужно. Прикрепите фото и документы. Партнёр-модератор проверит заявку в течение 24 часов, и она появится в общей ленте.',
    illu: 'request',
  },
  {
    color: '#1E7A4F',
    bg: '#DDEFE3',
    tag: 'Шаг 3 из 4',
    title: 'Деньги под надёжной защитой',
    body: 'Деньги пожертвований хранятся на счёте платформы, пока сбор не закроется. После работы — выплата по реквизитам, которые вы укажете. Комиссии нет.',
    illu: 'money',
  },
  {
    color: '#446D9E',
    bg: '#E2EAF3',
    tag: 'Шаг 4 из 4',
    title: 'Встречи с волонтёрами',
    body: 'Социальные заявки — это живые встречи. Назначьте дату, нужное число волонтёров и место. На встрече вы отметите, кто пришёл, потом — пришлёте отчёт.',
    illu: 'meeting',
  },
];
