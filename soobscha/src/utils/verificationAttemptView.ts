import { VerificationAttemptResponse } from '../api/verifications';
import { UserContactChannel, VolunteerSkillCatalogItem } from '../api/volunteers';
import {
  formatContactForDisplay,
  normalizeContactValue,
} from './contactValidation';
import { ContactChannelType } from '../navigation/volunteerVerificationTypes';
import { isoToDisplayDate, normalizePassportNumber } from '../navigation/volunteerVerificationTypes';
import { getBeneficiaryCategoryLabel } from './beneficiaryCategory';
import { formatVerificationDate } from './verificationStatus';

export type AttemptMediaRef = {
  media_id: string;
  url?: string;
  expires_at?: string;
};

export type AttemptPhotoItem = {
  id: string;
  uri: string;
  caption: string;
  contentType: string;
};

export type AttemptContactRow = {
  type: string;
  label: string;
  value: string;
  emoji: string;
  isPrimary: boolean;
};

const CONTACT_EMOJI: Record<string, string> = {
  telegram: '💬',
  whatsapp: '💚',
  email: '📧',
  other: '🔵',
  max: '🔵',
};

export type AttemptSkillsView = {
  simpleLabels: string[];
  documentedLabels: string[];
  photoItems: AttemptPhotoItem[];
  totalCount: number;
};

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

function toPhotoItem(file: AttemptMediaRef, caption: string): AttemptPhotoItem {
  return {
    id: file.media_id,
    uri: file.url ?? '',
    caption,
    contentType: 'image/jpeg',
  };
}

export function buildPersonalRowsFromAttempt(attempt: VerificationAttemptResponse) {
  const data = attempt.common_data ?? {};
  const fullName = [
    readString(data, 'last_name'),
    readString(data, 'first_name'),
    readString(data, 'middle_name'),
  ]
    .filter(Boolean)
    .join(' ');

  const rows = [
    { label: 'ФИО', value: fullName },
    {
      label: 'Дата рождения',
      value: isoToDisplayDate(readString(data, 'birth_date')) || readString(data, 'birth_date'),
    },
    { label: 'Город', value: readString(data, 'city') },
    {
      label: 'Паспорт',
      value: normalizePassportNumber(readString(data, 'passport_series_number')),
    },
  ].filter((row) => row.value);

  return rows;
}

export function buildDocumentPhotosFromAttempt(
  attempt: VerificationAttemptResponse,
): AttemptPhotoItem[] {
  const data = attempt.common_data ?? {};
  const passportPhotos = readMediaFiles(data, 'id_document_files');
  const selfiePhotos = readMediaFiles(data, 'selfie_with_id_files');

  const items: AttemptPhotoItem[] = [];

  passportPhotos.forEach((file, index) => {
    const caption =
      passportPhotos.length === 1
        ? 'Паспорт'
        : index === 0
          ? 'Паспорт · разворот'
          : `Паспорт · ${index + 1}`;
    items.push(toPhotoItem(file, caption));
  });

  selfiePhotos.forEach((file, index) => {
    const caption = selfiePhotos.length === 1 ? 'Селфи с паспортом' : `Селфи · ${index + 1}`;
    items.push(toPhotoItem(file, caption));
  });

  return items;
}

export function buildSkillsViewFromAttempt(
  attempt: VerificationAttemptResponse,
  catalog: VolunteerSkillCatalogItem[],
): AttemptSkillsView {
  const labelByCode = new Map(catalog.map((item) => [item.code, item.label]));
  const requiresDocByCode = new Map(catalog.map((item) => [item.code, item.requires_verified]));

  const evidence = attempt.category_data?.skills_evidence;
  if (!Array.isArray(evidence) || !evidence.length) {
    return { simpleLabels: [], documentedLabels: [], photoItems: [], totalCount: 0 };
  }

  const simpleLabels: string[] = [];
  const documentedLabels: string[] = [];
  const photoItems: AttemptPhotoItem[] = [];

  for (const item of evidence) {
    if (!item || typeof item !== 'object') continue;
    const skillCode = (item as { skill_code?: string }).skill_code ?? '';
    if (!skillCode) continue;

    const label = labelByCode.get(skillCode) ?? skillCode;
    const docs = readMediaFiles(item as Record<string, unknown>, 'supporting_document_files');
    const requiresDoc = requiresDocByCode.get(skillCode) ?? docs.length > 0;

    if (requiresDoc || docs.length) {
      documentedLabels.push(label);
    } else {
      simpleLabels.push(label);
    }

    docs.forEach((file, index) => {
      photoItems.push(
        toPhotoItem(file, docs.length === 1 ? label : `${label} · ${index + 1}`),
      );
    });
  }

  return {
    simpleLabels,
    documentedLabels,
    photoItems,
    totalCount: simpleLabels.length + documentedLabels.length,
  };
}

export function documentCountFromAttempt(attempt: VerificationAttemptResponse): number {
  return buildDocumentPhotosFromAttempt(attempt).length;
}

export function skillsSummaryFromAttempt(
  attempt: VerificationAttemptResponse,
  catalog: VolunteerSkillCatalogItem[] = [],
): string {
  const view = buildSkillsViewFromAttempt(attempt, catalog);
  if (!view.totalCount) return '—';

  const parts: string[] = [];
  if (view.simpleLabels.length) {
    parts.push(`Без подтверждения: ${view.simpleLabels.join(', ')}`);
  }
  if (view.documentedLabels.length) {
    parts.push(`С документами: ${view.documentedLabels.join(', ')}`);
  }
  return parts.join('\n');
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
  other: 'Max',
  max: 'Max',
};

function mapContactType(type: string): ContactChannelType | null {
  if (type === 'other') return 'max';
  if (type === 'telegram' || type === 'whatsapp' || type === 'email' || type === 'max') {
    return type;
  }
  return null;
}

export function readPreferredContactType(attempt: VerificationAttemptResponse): string | null {
  const preferred = attempt.common_data?.preferred_contact_channel_type;
  return typeof preferred === 'string' && preferred.trim() ? preferred : null;
}

export function buildContactRowsFromChannels(
  channels: UserContactChannel[],
  preferredType?: string | null,
): AttemptContactRow[] {
  return channels.map((channel) => {
    const mappedType = mapContactType(channel.type);
    const label =
      channel.type === 'other'
        ? channel.label || CONTACT_TYPE_LABELS.other
        : CONTACT_TYPE_LABELS[channel.type] ?? channel.type;

    const value = mappedType
      ? formatContactForDisplay(mappedType, normalizeContactValue(mappedType, channel.value))
      : channel.value;

    const channelType = channel.type;
    const isPrimary = preferredType
      ? preferredType === 'other'
        ? channelType === 'other'
        : channelType === preferredType
      : false;

    return {
      type: channelType,
      label,
      value,
      emoji: CONTACT_EMOJI[channelType] ?? CONTACT_EMOJI.other,
      isPrimary,
    };
  });
}

export function attemptStatusSubtitle(attempt: VerificationAttemptResponse): string | undefined {
  switch (attempt.status) {
    case 'PENDING_MODERATION':
      return attempt.created_at
        ? `Заявка отправлена ${formatVerificationDate(attempt.created_at)}`
        : undefined;
    case 'APPROVED':
      return attempt.approved_at
        ? `Одобрена ${formatVerificationDate(attempt.approved_at)}`
        : undefined;
    case 'REJECTED':
      return attempt.rejected_at
        ? `Отказ от ${formatVerificationDate(attempt.rejected_at)}`
        : undefined;
    case 'REVOKED':
      return attempt.revoked_at
        ? `Отозвана ${formatVerificationDate(attempt.revoked_at)}`
        : undefined;
    default:
      return undefined;
  }
}

export function attemptReasonText(attempt: VerificationAttemptResponse): string | undefined {
  if (attempt.status === 'REJECTED') return attempt.rejection_reason ?? undefined;
  if (attempt.status === 'REVOKED') return attempt.revocation_reason ?? undefined;
  return undefined;
}

export function attemptReasonAuthor(attempt: VerificationAttemptResponse): string | undefined {
  const date =
    attempt.status === 'REJECTED'
      ? attempt.rejected_at
      : attempt.status === 'REVOKED'
        ? attempt.revoked_at
        : undefined;
  if (!date) return undefined;
  const formatted = formatVerificationDate(date);
  return formatted ? `Партнёр «Добро» · ${formatted}` : 'Партнёр «Добро»';
}

export function buildBeneficiaryCategoryRowsFromAttempt(
  attempt: VerificationAttemptResponse,
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const categoryLabel = getBeneficiaryCategoryLabel(attempt.category);
  if (categoryLabel) {
    rows.push({ label: 'Категория', value: categoryLabel });
  }

  const familyMembers = attempt.category_data?.family_members;
  if (Array.isArray(familyMembers) && familyMembers.length) {
    const count = familyMembers.length;
    const mod10 = count % 10;
    const mod100 = count % 100;
    const word =
      mod10 === 1 && mod100 !== 11
        ? 'человек'
        : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)
          ? 'человека'
          : 'человек';
    rows.push({ label: 'Состав семьи', value: `${count} ${word}` });
  }

  return rows;
}

export function buildCategoryDocumentPhotosFromAttempt(
  attempt: VerificationAttemptResponse,
): AttemptPhotoItem[] {
  const data = attempt.category_data ?? {};
  const buckets = [
    readMediaFiles(data, 'category_document_files'),
    readMediaFiles(data, 'supporting_document_files'),
    readMediaFiles(data, 'income_certificate_files'),
    readMediaFiles(data, 'family_composition_files'),
  ];

  const items: AttemptPhotoItem[] = [];
  for (const files of buckets) {
    files.forEach((file, index) => {
      items.push(toPhotoItem(file, files.length === 1 ? 'Справка' : `Справка · ${index + 1}`));
    });
  }
  return items;
}
