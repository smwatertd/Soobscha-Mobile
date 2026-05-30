import { CreateVerificationAttemptRequest } from '../api/verifications';
import { BeneficiaryCategoryCode } from '../utils/beneficiaryCategory';
import { BENEFICIARY_VERIF_STEPS } from '../screens/beneficiary/verification/beneficiaryVerificationConfig';
import { DraftPhoto } from './createHelpRequestTypes';
import {
  ContactChannelType,
  DEFAULT_VOLUNTEER_CONTACTS,
  displayDateToIso,
  normalizePassportNumber,
  validateVolunteerVerifContacts,
  validateVolunteerVerifGeneral,
  VolunteerVerifContactDraft,
  VolunteerVerifDraft,
} from './volunteerVerificationTypes';
import { normalizeContactValue } from '../utils/contactValidation';

export { BENEFICIARY_VERIF_STEPS };

export type BeneficiaryFamilyMemberDraft = {
  id: string;
  displayName: string;
  relationLabel: string;
};

export type BeneficiaryVerifDraft = {
  category: BeneficiaryCategoryCode | '';
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  city: string;
  cityCode: string;
  passportSeriesNumber: string;
  passportIssueDate: string;
  passportIssuedBy: string;
  idDocumentPhotos: DraftPhoto[];
  selfiePhotos: DraftPhoto[];
  familyMembers: BeneficiaryFamilyMemberDraft[];
  categoryDocumentPhotos: DraftPhoto[];
  situationSummary: string;
  contacts: VolunteerVerifContactDraft[];
  preferredContactType: ContactChannelType | '';
};

export function createEmptyBeneficiaryVerifDraft(): BeneficiaryVerifDraft {
  return {
    category: '',
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '',
    city: '',
    cityCode: '',
    passportSeriesNumber: '',
    passportIssueDate: '',
    passportIssuedBy: '',
    idDocumentPhotos: [],
    selfiePhotos: [],
    familyMembers: [],
    categoryDocumentPhotos: [],
    situationSummary: '',
    contacts: DEFAULT_VOLUNTEER_CONTACTS.map((item) => ({ ...item })),
    preferredContactType: '',
  };
}

export function beneficiaryVerifFullName(draft: BeneficiaryVerifDraft): string {
  return [draft.lastName, draft.firstName, draft.middleName].filter(Boolean).join(' ');
}

export function validateBeneficiaryVerifCategory(draft: BeneficiaryVerifDraft): Record<string, string> {
  if (!draft.category) return { category: 'Выберите категорию получателя помощи' };
  return {};
}

export function validateBeneficiaryVerifGeneral(
  draft: BeneficiaryVerifDraft,
  knownCityCodes?: Set<string>,
): Record<string, string> {
  const volunteerShape: VolunteerVerifDraft = {
    ...createEmptyBeneficiaryVerifDraft(),
    lastName: draft.lastName,
    firstName: draft.firstName,
    middleName: draft.middleName,
    birthDate: draft.birthDate,
    city: draft.city,
    cityCode: draft.cityCode,
    passportSeriesNumber: draft.passportSeriesNumber,
    passportIssueDate: draft.passportIssueDate,
    passportIssuedBy: draft.passportIssuedBy,
    idDocumentPhotos: draft.idDocumentPhotos,
    selfiePhotos: draft.selfiePhotos,
    contacts: draft.contacts,
    preferredContactType: draft.preferredContactType,
    skills: [],
  };
  return validateVolunteerVerifGeneral(volunteerShape, knownCityCodes);
}

function hasUploadedMedia(photos: DraftPhoto[]): boolean {
  return photos.some((photo) => Boolean(photo.mediaId));
}

function photosUploading(photos: DraftPhoto[]): boolean {
  return photos.some((photo) => !photo.mediaId);
}

export function validateBeneficiaryVerifDetails(draft: BeneficiaryVerifDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft.familyMembers.length) {
    errors.familyMembers = 'Добавьте хотя бы одного члена семьи';
  } else {
    for (const member of draft.familyMembers) {
      if (!member.displayName.trim()) {
        errors.familyMembers = 'Укажите имя для каждого члена семьи';
        break;
      }
    }
  }

  if (!hasUploadedMedia(draft.categoryDocumentPhotos)) {
    errors.categoryDocumentPhotos = 'Загрузите хотя бы одну справку';
  } else if (photosUploading(draft.categoryDocumentPhotos)) {
    errors.categoryDocumentPhotos = 'Дождитесь загрузки справок';
  }

  return errors;
}

export function validateBeneficiaryVerifContacts(draft: BeneficiaryVerifDraft): Record<string, string> {
  const volunteerShape: VolunteerVerifDraft = {
    ...createEmptyBeneficiaryVerifDraft(),
    contacts: draft.contacts,
    preferredContactType: draft.preferredContactType,
    skills: [],
  };
  return validateVolunteerVerifContacts(volunteerShape);
}

export function buildBeneficiaryVerificationPayload(
  draft: BeneficiaryVerifDraft,
): CreateVerificationAttemptRequest {
  const birthIso = displayDateToIso(draft.birthDate);
  const passportIssueIso = displayDateToIso(draft.passportIssueDate);
  const categoryMediaIds = draft.categoryDocumentPhotos.flatMap((photo) =>
    photo.mediaId ? [photo.mediaId] : [],
  );

  const contactChannels = draft.contacts
    .filter((contact) => contact.value.trim())
    .map((contact) => ({
      type: contact.type === 'max' ? 'other' : contact.type,
      value: normalizeContactValue(contact.type, contact.value),
      ...(contact.type === 'max' ? { label: 'Max' } : {}),
    }));

  const preferredType =
    draft.preferredContactType === 'max' ? 'other' : draft.preferredContactType;

  const categoryData: Record<string, unknown> = {
    family_members: draft.familyMembers.map((member) => ({
      display_name: member.displayName.trim(),
      relation_label: member.relationLabel.trim() || undefined,
    })),
    ...(categoryMediaIds.length
      ? {
          income_certificate_files: categoryMediaIds.map((media_id) => ({ media_id })),
        }
      : {}),
    ...(draft.situationSummary.trim()
      ? { situation_summary: draft.situationSummary.trim() }
      : {}),
  };

  return {
    category: draft.category || null,
    common_data: {
      last_name: draft.lastName.trim(),
      first_name: draft.firstName.trim(),
      ...(draft.middleName.trim() ? { middle_name: draft.middleName.trim() } : {}),
      birth_date: birthIso,
      city: draft.cityCode || draft.city.trim(),
      passport_series_number: normalizePassportNumber(draft.passportSeriesNumber),
      passport_issue_date: passportIssueIso,
      passport_issued_by: draft.passportIssuedBy.trim(),
      id_document_files: draft.idDocumentPhotos.flatMap((photo) =>
        photo.mediaId ? [{ media_id: photo.mediaId }] : [],
      ),
      selfie_with_id_files: draft.selfiePhotos.flatMap((photo) =>
        photo.mediaId ? [{ media_id: photo.mediaId }] : [],
      ),
    },
    category_data: categoryData,
    contact_channels: contactChannels,
    preferred_contact_channel_type: preferredType,
  };
}
