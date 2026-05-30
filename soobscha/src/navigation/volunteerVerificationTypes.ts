import { CreateVerificationAttemptRequest } from '../api/verifications';
import { DraftPhoto } from './createHelpRequestTypes';
import {
  normalizeContactValue,
  validateContactValue,
} from '../utils/contactValidation';

export type ContactChannelType = 'email' | 'telegram' | 'whatsapp' | 'max';

export type VolunteerVerifContactDraft = {
  type: ContactChannelType;
  value: string;
  label: string;
};

export type VolunteerSkillEvidenceDraft = {
  skillCode: string;
  label: string;
  requiresDocument: boolean;
  selected: boolean;
  photos: DraftPhoto[];
  comment: string;
};

export type VolunteerVerifDraft = {
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
  contacts: VolunteerVerifContactDraft[];
  preferredContactType: ContactChannelType | '';
  skills: VolunteerSkillEvidenceDraft[];
};

export const VOLUNTEER_VERIF_STEPS = 4;

export const DEFAULT_VOLUNTEER_CONTACTS: VolunteerVerifContactDraft[] = [
  { type: 'telegram', value: '', label: 'Telegram' },
  { type: 'whatsapp', value: '', label: 'WhatsApp' },
  { type: 'email', value: '', label: 'Email' },
  { type: 'max', value: '', label: 'Max' },
];

export function createEmptyVolunteerVerifDraft(): VolunteerVerifDraft {
  return {
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
    contacts: DEFAULT_VOLUNTEER_CONTACTS.map((item) => ({ ...item })),
    preferredContactType: '',
    skills: [],
  };
}

export function splitFullName(fullName: string): Pick<VolunteerVerifDraft, 'lastName' | 'firstName' | 'middleName'> {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] ?? '',
    firstName: parts[1] ?? '',
    middleName: parts.slice(2).join(' '),
  };
}

export function isoToDisplayDate(iso: string): string {
  if (!iso) return '';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function displayDateToIso(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function formatPassportDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
}

export function normalizePassportNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
}

function hasUploadedMedia(photos: DraftPhoto[]): boolean {
  return photos.some((photo) => Boolean(photo.mediaId));
}

function photosUploading(photos: DraftPhoto[]): boolean {
  return photos.some((photo) => !photo.mediaId);
}

export function validateVolunteerVerifGeneral(
  draft: VolunteerVerifDraft,
  knownCityCodes?: Set<string>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft.lastName.trim()) errors.lastName = 'Укажите фамилию';
  if (!draft.firstName.trim()) errors.firstName = 'Укажите имя';
  if (!displayDateToIso(draft.birthDate)) errors.birthDate = 'Формат: ДД.ММ.ГГГГ';
  if (!draft.city.trim()) {
    errors.city = 'Выберите город из списка';
  } else if (knownCityCodes && draft.cityCode && !knownCityCodes.has(draft.cityCode)) {
    errors.city = 'Выберите город из списка';
  } else if (knownCityCodes && !draft.cityCode) {
    errors.city = 'Выберите город из списка';
  }

  const passport = normalizePassportNumber(draft.passportSeriesNumber);
  if (!/^\d{4} \d{6}$/.test(passport)) {
    errors.passportSeriesNumber = 'Формат: 1234 567890';
  }

  if (!displayDateToIso(draft.passportIssueDate)) {
    errors.passportIssueDate = 'Формат: ДД.ММ.ГГГГ';
  }

  if (!draft.passportIssuedBy.trim()) errors.passportIssuedBy = 'Укажите, кем выдан паспорт';
  if (!hasUploadedMedia(draft.idDocumentPhotos)) {
    errors.idDocumentPhotos = 'Загрузите фото паспорта';
  } else if (photosUploading(draft.idDocumentPhotos)) {
    errors.idDocumentPhotos = 'Дождитесь загрузки фото паспорта';
  }

  if (!hasUploadedMedia(draft.selfiePhotos)) {
    errors.selfiePhotos = 'Загрузите селфи с паспортом';
  } else if (photosUploading(draft.selfiePhotos)) {
    errors.selfiePhotos = 'Дождитесь загрузки селфи';
  }

  return errors;
}

export function validateVolunteerVerifContacts(draft: VolunteerVerifDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const activeContacts = draft.contacts.filter((contact) => contact.value.trim());

  if (!activeContacts.length) {
    errors.contacts = 'Укажите хотя бы один способ связи';
  }

  for (const contact of activeContacts) {
    const contactError = validateContactValue(contact.type, contact.value);
    if (contactError) {
      errors[`contact_${contact.type}`] = contactError;
    }
  }

  if (!draft.preferredContactType) {
    errors.preferredContactType = 'Выберите предпочтительный способ связи';
  } else if (!activeContacts.some((contact) => contact.type === draft.preferredContactType)) {
    errors.preferredContactType = 'Предпочтительный контакт должен быть заполнен';
  }

  return errors;
}

export function validateVolunteerVerifSkills(draft: VolunteerVerifDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const selected = draft.skills.filter((skill) => skill.selected);

  if (!selected.length) {
    errors.skills = 'Выберите хотя бы один навык';
    return errors;
  }

  for (const skill of selected) {
    if (skill.requiresDocument) {
      if (!hasUploadedMedia(skill.photos)) {
        errors[`skill_${skill.skillCode}`] = `Загрузите документ для «${skill.label}»`;
      } else if (photosUploading(skill.photos)) {
        errors[`skill_${skill.skillCode}`] = `Дождитесь загрузки документа для «${skill.label}»`;
      }
    }
  }

  return errors;
}

export function buildVolunteerVerificationPayload(draft: VolunteerVerifDraft): CreateVerificationAttemptRequest {
  const birthIso = displayDateToIso(draft.birthDate);
  const passportIssueIso = displayDateToIso(draft.passportIssueDate);

  const skillsEvidence = draft.skills
    .filter((skill) => skill.selected)
    .map((skill) => {
      const mediaIds = skill.photos.flatMap((photo) => (photo.mediaId ? [photo.mediaId] : []));
      return {
        skill_code: skill.skillCode,
        ...(mediaIds.length ? { supporting_document_files: mediaIds } : {}),
        ...(skill.comment.trim() ? { comment: skill.comment.trim() } : {}),
      };
    });

  const contactChannels = draft.contacts
    .filter((contact) => contact.value.trim())
    .map((contact) => ({
      type: contact.type === 'max' ? 'other' : contact.type,
      value: normalizeContactValue(contact.type, contact.value),
      ...(contact.type === 'max' ? { label: 'Max' } : {}),
    }));

  const preferredType =
    draft.preferredContactType === 'max' ? 'other' : draft.preferredContactType;

  return {
    category: null,
    common_data: {
      last_name: draft.lastName.trim(),
      first_name: draft.firstName.trim(),
      ...(draft.middleName.trim() ? { middle_name: draft.middleName.trim() } : {}),
      birth_date: birthIso,
      city: draft.cityCode || draft.city.trim(),
      passport_series_number: normalizePassportNumber(draft.passportSeriesNumber),
      passport_issue_date: passportIssueIso,
      passport_issued_by: draft.passportIssuedBy.trim(),
      id_document_files: draft.idDocumentPhotos.flatMap((photo) => (photo.mediaId ? [photo.mediaId] : [])),
      selfie_with_id_files: draft.selfiePhotos.flatMap((photo) => (photo.mediaId ? [photo.mediaId] : [])),
    },
    category_data: {
      skills_evidence: skillsEvidence,
    },
    contact_channels: contactChannels,
    preferred_contact_channel_type: preferredType,
  };
}

export function volunteerVerifFullName(draft: VolunteerVerifDraft): string {
  return [draft.lastName, draft.firstName, draft.middleName].filter(Boolean).join(' ');
}
