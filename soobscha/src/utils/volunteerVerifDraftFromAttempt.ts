import { VerificationAttemptResponse } from '../api/verifications';
import { CityOption } from '../api/locations';
import { CurrentVolunteer, UserContactChannel, VolunteerSkillCatalogItem } from '../api/volunteers';
import { DraftPhoto } from '../navigation/createHelpRequestTypes';
import {
  ContactChannelType,
  createEmptyVolunteerVerifDraft,
  DEFAULT_VOLUNTEER_CONTACTS,
  isoToDisplayDate,
  normalizePassportNumber,
  splitFullName,
  VolunteerSkillEvidenceDraft,
  VolunteerVerifDraft,
} from '../navigation/volunteerVerificationTypes';
import { formatContactForDisplay } from './contactValidation';
import { AttemptMediaRef, readPreferredContactType } from './verificationAttemptView';

function readString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === 'string' ? value : '';
}

function readMediaFiles(data: Record<string, unknown>, key: string): AttemptMediaRef[] {
  const value = data[key];
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { media_id: item };
      }
      if (item && typeof item === 'object' && typeof (item as AttemptMediaRef).media_id === 'string') {
        return item as AttemptMediaRef;
      }
      return null;
    })
    .filter((item): item is AttemptMediaRef => item != null);
}

function mediaRefToDraftPhoto(file: AttemptMediaRef, fileName: string): DraftPhoto {
  return {
    id: file.media_id,
    uri: file.url ?? '',
    fileName,
    contentType: 'image/jpeg',
    mediaId: file.media_id,
    kind: 'image',
  };
}

function mapChannelType(type: string, label?: string | null): ContactChannelType | null {
  if (type === 'telegram' || type === 'whatsapp' || type === 'email') return type;
  if (type === 'other' && (label === 'Max' || !label)) return 'max';
  if (type === 'max') return 'max';
  return null;
}

function mapPreferredType(preferred: string | null | undefined): ContactChannelType | '' {
  if (!preferred) return '';
  if (preferred === 'other') return 'max';
  if (preferred === 'telegram' || preferred === 'whatsapp' || preferred === 'email' || preferred === 'max') {
    return preferred;
  }
  return '';
}

function buildContactsFromChannels(channels: UserContactChannel[]): VolunteerVerifDraft['contacts'] {
  const contacts = DEFAULT_VOLUNTEER_CONTACTS.map((item) => ({ ...item }));

  for (const channel of channels) {
    const mappedType = mapChannelType(channel.type, channel.label);
    if (!mappedType) continue;

    const target = contacts.find((contact) => contact.type === mappedType);
    if (!target) continue;

    target.value = formatContactForDisplay(mappedType, channel.value) || channel.value;
  }

  return contacts;
}

function buildSkillsFromAttempt(
  attempt: VerificationAttemptResponse,
  catalog: VolunteerSkillCatalogItem[],
): VolunteerSkillEvidenceDraft[] {
  const evidence = attempt.category_data?.skills_evidence;
  const evidenceByCode = new Map<
    string,
    { photos: DraftPhoto[]; comment: string }
  >();

  if (Array.isArray(evidence)) {
    for (const item of evidence) {
      if (!item || typeof item !== 'object') continue;
      const skillCode = (item as { skill_code?: string }).skill_code ?? '';
      if (!skillCode) continue;

      const docs = readMediaFiles(item as Record<string, unknown>, 'supporting_document_files');
      const comment =
        typeof (item as { comment?: string }).comment === 'string'
          ? (item as { comment: string }).comment
          : '';

      evidenceByCode.set(skillCode, {
        comment,
        photos: docs.map((file, index) =>
          mediaRefToDraftPhoto(
            file,
            docs.length === 1 ? skillCode : `${skillCode}_${index + 1}`,
          ),
        ),
      });
    }
  }

  return catalog.map((item) => {
    const saved = evidenceByCode.get(item.code);
    return {
      skillCode: item.code,
      label: item.label,
      requiresDocument: item.requires_verified,
      selected: Boolean(saved),
      photos: saved?.photos ?? [],
      comment: saved?.comment ?? '',
    };
  });
}

function resolveCity(
  cityRaw: string,
  cities: CityOption[],
): Pick<VolunteerVerifDraft, 'city' | 'cityCode'> {
  if (!cityRaw) return { city: '', cityCode: '' };

  const byCode = cities.find((city) => city.code === cityRaw);
  if (byCode) return { city: byCode.label, cityCode: byCode.code };

  const byLabel = cities.find((city) => city.label === cityRaw);
  if (byLabel) return { city: byLabel.label, cityCode: byLabel.code };

  return { city: cityRaw, cityCode: cityRaw };
}

export function buildVolunteerVerifDraftFromAttempt(params: {
  attempt: VerificationAttemptResponse;
  volunteer: CurrentVolunteer;
  catalog: VolunteerSkillCatalogItem[];
  cities: CityOption[];
  channels: UserContactChannel[];
  preferredType?: string | null;
}): VolunteerVerifDraft {
  const { attempt, volunteer, catalog, cities, channels, preferredType } = params;
  const data = attempt.common_data ?? {};
  const nameFromAttempt = {
    lastName: readString(data, 'last_name'),
    firstName: readString(data, 'first_name'),
    middleName: readString(data, 'middle_name'),
  };
  const hasNameInAttempt = Boolean(nameFromAttempt.lastName || nameFromAttempt.firstName);
  const nameParts = hasNameInAttempt ? nameFromAttempt : splitFullName(volunteer.full_name);

  const cityRaw = readString(data, 'city') || volunteer.city || '';
  const city = resolveCity(cityRaw, cities);

  const idDocumentPhotos = readMediaFiles(data, 'id_document_files').map((file, index) =>
    mediaRefToDraftPhoto(file, `passport_${index + 1}`),
  );
  const selfiePhotos = readMediaFiles(data, 'selfie_with_id_files').map((file, index) =>
    mediaRefToDraftPhoto(file, `selfie_${index + 1}`),
  );

  const preferredFromAttempt = readPreferredContactType(attempt);
  const preferredContactType = mapPreferredType(preferredFromAttempt ?? preferredType);

  return {
    ...createEmptyVolunteerVerifDraft(),
    ...nameParts,
    birthDate: isoToDisplayDate(readString(data, 'birth_date')),
    ...city,
    passportSeriesNumber: normalizePassportNumber(readString(data, 'passport_series_number')),
    passportIssueDate: isoToDisplayDate(readString(data, 'passport_issue_date')),
    passportIssuedBy: readString(data, 'passport_issued_by'),
    idDocumentPhotos,
    selfiePhotos,
    contacts: buildContactsFromChannels(channels),
    preferredContactType,
    skills: buildSkillsFromAttempt(attempt, catalog),
  };
}
