import { VolunteerSkillCatalogItem } from '../api/volunteers';
import { VerificationAttemptResponse } from '../api/verifications';
import { VolunteerVerifReviewPhoto } from '../screens/volunteer/verification/volunteerVerificationConfig';
import { T } from '../theme/tokens';
import {
  AttemptContactRow,
  AttemptPhotoItem,
  AttemptSkillsView,
  buildBeneficiaryCategoryRowsFromAttempt,
  buildCategoryDocumentPhotosFromAttempt,
  buildContactRowsFromChannels,
  buildDocumentPhotosFromAttempt,
  buildPersonalRowsFromAttempt,
  buildSkillsViewFromAttempt,
} from './verificationAttemptView';

export type VerificationActiveRow = { label: string; value: string };

export type VerificationActiveSections = {
  /** Демо-данные, когда заявка на верификацию ещё не загружена. */
  usePreview: boolean;
  personalRows: VerificationActiveRow[];
  documentPhotos: AttemptPhotoItem[];
  documentPreviewPhotos: VolunteerVerifReviewPhoto[];
  skillsView: AttemptSkillsView | null;
  categoryRows: VerificationActiveRow[];
  categoryPhotos: AttemptPhotoItem[];
  categoryPreviewPhotos: VolunteerVerifReviewPhoto[];
  contactRows: AttemptContactRow[];
};

const SHARED_PERSONAL_ROWS: VerificationActiveRow[] = [
  { label: 'ФИО', value: 'Иванова Мария Сергеевна' },
  { label: 'Дата рождения', value: '14.03.1992' },
  { label: 'Пол', value: 'Женский' },
  { label: 'Город', value: 'Москва' },
  { label: 'Паспорт', value: '4514 №789 023' },
];

const SHARED_DOCUMENT_PREVIEW: VolunteerVerifReviewPhoto[] = [
  { caption: 'Паспорт · разворот', color: T.primary },
  { caption: 'Прописка', color: T.primary },
  { caption: 'Селфи с паспортом', color: T.accent },
];

const VOLUNTEER_SKILLS_PREVIEW: AttemptSkillsView = {
  simpleLabels: ['Уборка', 'Покупки', 'Сбор урожая'],
  documentedLabels: ['Перевозка пассажиров', 'Первая помощь'],
  photoItems: [],
  totalCount: 6,
};

const VOLUNTEER_SKILL_PHOTOS_PREVIEW: VolunteerVerifReviewPhoto[] = [
  { caption: 'Вод. удостоверение', color: T.success },
  { caption: 'Сертификат · ПП', color: T.success },
];

const BENEFICIARY_CATEGORY_ROWS: VerificationActiveRow[] = [
  { label: 'Категория', value: 'Малоимущая семья' },
  { label: 'Состав семьи', value: '4 человека' },
];

const BENEFICIARY_CATEGORY_PHOTOS_PREVIEW: VolunteerVerifReviewPhoto[] = [
  { caption: 'Доходы за 3 мес.', color: T.accent },
  { caption: 'Состав семьи', color: T.accent },
];

const SHARED_CONTACT_ROWS: AttemptContactRow[] = [
  {
    type: 'telegram',
    label: 'Telegram',
    value: '@maria_iv',
    emoji: '💬',
    isPrimary: true,
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    value: '+7 912 458 70 33',
    emoji: '💚',
    isPrimary: false,
  },
  {
    type: 'email',
    label: 'Email',
    value: 'm.ivanova@mail.ru',
    emoji: '📧',
    isPrimary: false,
  },
];

export function shouldUseVerificationActivePreview(
  attempt: VerificationAttemptResponse | null,
): boolean {
  return !attempt;
}

function withPreviewRows(actual: VerificationActiveRow[], preview: VerificationActiveRow[]): VerificationActiveRow[] {
  return actual.length ? actual : preview;
}

function photosWithUri(photos: AttemptPhotoItem[]): AttemptPhotoItem[] {
  return photos.filter((photo) => photo.uri);
}

export function resolveVerificationActiveSections({
  role,
  attempt,
  skillCatalog,
  contactRows,
}: {
  role: 'volunteer' | 'beneficiary';
  attempt: VerificationAttemptResponse | null;
  skillCatalog: VolunteerSkillCatalogItem[];
  contactRows: AttemptContactRow[];
}): VerificationActiveSections {
  const usePreview = shouldUseVerificationActivePreview(attempt);

  const personalRows = attempt ? buildPersonalRowsFromAttempt(attempt) : [];
  const documentPhotos = attempt ? buildDocumentPhotosFromAttempt(attempt) : [];
  const skillsView = attempt ? buildSkillsViewFromAttempt(attempt, skillCatalog) : null;
  const categoryRows = attempt ? buildBeneficiaryCategoryRowsFromAttempt(attempt) : [];
  const categoryPhotos = attempt ? buildCategoryDocumentPhotosFromAttempt(attempt) : [];

  const resolvedSkillsView =
    skillsView && skillsView.totalCount > 0
      ? skillsView
      : usePreview && role === 'volunteer'
        ? VOLUNTEER_SKILLS_PREVIEW
        : skillsView;

  const resolvedCategoryPhotos = photosWithUri(categoryPhotos);

  return {
    usePreview,
    personalRows: usePreview ? withPreviewRows(personalRows, SHARED_PERSONAL_ROWS) : personalRows,
    documentPhotos: photosWithUri(documentPhotos),
    documentPreviewPhotos: usePreview ? SHARED_DOCUMENT_PREVIEW : [],
    skillsView: resolvedSkillsView,
    categoryRows: usePreview ? withPreviewRows(categoryRows, BENEFICIARY_CATEGORY_ROWS) : categoryRows,
    categoryPhotos: resolvedCategoryPhotos,
    categoryPreviewPhotos: usePreview ? BENEFICIARY_CATEGORY_PHOTOS_PREVIEW : [],
    contactRows: contactRows.length ? contactRows : usePreview ? SHARED_CONTACT_ROWS : [],
  };
}

export function verificationActiveSkillPhotosPreview(
  skillsView: AttemptSkillsView | null,
  usePreview: boolean,
): VolunteerVerifReviewPhoto[] {
  const withUri = (skillsView?.photoItems ?? []).filter((photo) => photo.uri);
  if (withUri.length) {
    return withUri.map((photo) => ({
      caption: photo.caption,
      color: T.success,
    }));
  }
  return usePreview ? VOLUNTEER_SKILL_PHOTOS_PREVIEW : [];
}

export function verificationActiveCategoryPhotosPreview(
  photos: AttemptPhotoItem[],
  usePreview: boolean,
): VolunteerVerifReviewPhoto[] {
  const withUri = photosWithUri(photos);
  if (withUri.length) {
    return withUri.map((photo) => ({
      caption: photo.caption,
      color: T.accent,
    }));
  }
  return usePreview ? BENEFICIARY_CATEGORY_PHOTOS_PREVIEW : [];
}

export function hasVerificationPhotoContent(
  attemptPhotos: AttemptPhotoItem[],
  previewPhotos: VolunteerVerifReviewPhoto[],
): boolean {
  return photosWithUri(attemptPhotos).length > 0 || previewPhotos.length > 0;
}

export { buildContactRowsFromChannels };
