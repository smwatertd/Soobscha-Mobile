import { UserPublicProfile, UserPublicProfileRole } from '../types/userPublicProfile';
import { UserContactChannel } from '../api/volunteers';

function readString(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readNullableString(raw: Record<string, unknown>, key: string): string | null {
  const value = raw[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function readContactChannels(raw: Record<string, unknown>): UserContactChannel[] {
  const value = raw.contact_channels;
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const channel = item as Record<string, unknown>;
      const id = readString(channel, 'id');
      const type = readString(channel, 'type');
      const contactValue = readString(channel, 'value');
      if (!id || !type || !contactValue) return null;
      return {
        id,
        type,
        value: contactValue,
        label: readNullableString(channel, 'label'),
      };
    })
    .filter((item): item is UserContactChannel => item != null);
}

function readSkills(raw: Record<string, unknown>): string[] {
  const value = raw.skills;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function readAvatar(raw: Record<string, unknown>): UserPublicProfile['avatar'] {
  const avatar = raw.avatar;
  if (!avatar || typeof avatar !== 'object') return null;
  const record = avatar as Record<string, unknown>;
  const mediaId = readString(record, 'media_id');
  const url = readString(record, 'url');
  if (!mediaId || !url) return null;
  return { mediaId, url };
}

export function parseUserPublicProfile(raw: Record<string, unknown>): UserPublicProfile {
  const roleRaw = readString(raw, 'role').toUpperCase();
  const role: UserPublicProfileRole = roleRaw === 'VOLUNTEER' ? 'VOLUNTEER' : 'BENEFICIARY';
  const firstName = readString(raw, 'first_name');
  const lastName = readString(raw, 'last_name');
  const fullNameFromApi = readNullableString(raw, 'full_name');
  const fullName =
    fullNameFromApi || [lastName, firstName].filter(Boolean).join(' ') || 'Пользователь';
  const ageValue = raw.age;

  return {
    userId: readString(raw, 'user_id'),
    role,
    firstName,
    lastName,
    fullName,
    age: typeof ageValue === 'number' && Number.isFinite(ageValue) ? ageValue : null,
    isVerified: raw.is_verified === true,
    city: readNullableString(raw, 'city'),
    baseCategory: readNullableString(raw, 'base_category'),
    skills: readSkills(raw),
    avatar: readAvatar(raw),
    contactChannels: readContactChannels(raw),
    preferredContactChannelType: readNullableString(raw, 'preferred_contact_channel_type'),
  };
}
