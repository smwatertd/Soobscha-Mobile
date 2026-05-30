import { VolunteerSkillCatalogItem } from '../api/volunteers';
import { VerificationAttemptResponse } from '../api/verifications';
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
  personalRows: VerificationActiveRow[];
  documentPhotos: AttemptPhotoItem[];
  skillsView: AttemptSkillsView | null;
  categoryRows: VerificationActiveRow[];
  categoryPhotos: AttemptPhotoItem[];
  contactRows: AttemptContactRow[];
};

function photosWithUri(photos: AttemptPhotoItem[]): AttemptPhotoItem[] {
  return photos.filter((photo) => photo.uri);
}

export function resolveVerificationActiveSections({
  attempt,
  skillCatalog,
  contactRows,
}: {
  attempt: VerificationAttemptResponse | null;
  skillCatalog: VolunteerSkillCatalogItem[];
  contactRows: AttemptContactRow[];
}): VerificationActiveSections {
  if (!attempt) {
    return {
      personalRows: [],
      documentPhotos: [],
      skillsView: null,
      categoryRows: [],
      categoryPhotos: [],
      contactRows: contactRows.length ? contactRows : [],
    };
  }

  const documentPhotos = photosWithUri(buildDocumentPhotosFromAttempt(attempt));
  const skillsView = buildSkillsViewFromAttempt(attempt, skillCatalog);
  const categoryPhotos = photosWithUri(buildCategoryDocumentPhotosFromAttempt(attempt));

  return {
    personalRows: buildPersonalRowsFromAttempt(attempt),
    documentPhotos,
    skillsView: skillsView.totalCount > 0 ? skillsView : null,
    categoryRows: buildBeneficiaryCategoryRowsFromAttempt(attempt),
    categoryPhotos,
    contactRows,
  };
}

export function hasVerificationPhotos(photos: AttemptPhotoItem[]): boolean {
  return photosWithUri(photos).length > 0;
}

export { buildContactRowsFromChannels };
