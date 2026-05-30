import AsyncStorage from '@react-native-async-storage/async-storage';

export const VERIF_PREFERRED_CONTACT_KEY = 'volunteer_verif_preferred_contact';

export async function saveVerificationPreferredContact(type: string): Promise<void> {
  await AsyncStorage.setItem(VERIF_PREFERRED_CONTACT_KEY, type);
}

export async function loadVerificationPreferredContact(): Promise<string | null> {
  return AsyncStorage.getItem(VERIF_PREFERRED_CONTACT_KEY);
}
