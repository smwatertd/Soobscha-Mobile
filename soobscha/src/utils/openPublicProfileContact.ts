import { Linking } from 'react-native';
import { ContactChannelType } from '../navigation/volunteerVerificationTypes';
import { extractPhoneDigits } from './phone';

function asContactType(type: string): ContactChannelType | null {
  if (
    type === 'telegram' ||
    type === 'whatsapp' ||
    type === 'email' ||
    type === 'max' ||
    type === 'other'
  ) {
    return type;
  }
  return null;
}

export async function openPublicProfileContact(type: string, value: string): Promise<boolean> {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const channelType = asContactType(type);
  let url: string | null = null;

  if (channelType === 'telegram') {
    const handle = trimmed.replace(/^@/, '');
    url = `https://t.me/${encodeURIComponent(handle)}`;
  } else if (channelType === 'whatsapp' || channelType === 'max') {
    const digits = extractPhoneDigits(trimmed);
    if (digits) url = `https://wa.me/${digits}`;
  } else if (channelType === 'email') {
    url = `mailto:${encodeURIComponent(trimmed)}`;
  }

  if (!url) return false;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
