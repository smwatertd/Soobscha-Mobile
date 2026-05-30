import { apiRequest } from './client';
import { UserPublicProfile } from '../types/userPublicProfile';
import { parseUserPublicProfile } from '../utils/parseUserPublicProfile';

/** Публичный профиль пользователя GET /api/users/{user_id}. */
export async function getUserPublicProfile(userId: string): Promise<UserPublicProfile> {
  const raw = await apiRequest<Record<string, unknown>>(`/api/users/${userId}`, { auth: true });
  return parseUserPublicProfile(raw);
}
