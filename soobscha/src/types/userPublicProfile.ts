import { UserContactChannel } from '../api/volunteers';

export type UserPublicProfileRole = 'BENEFICIARY' | 'VOLUNTEER';

export type UserPublicProfileAvatar = {
  mediaId: string;
  url: string;
};

export type UserPublicProfile = {
  userId: string;
  role: UserPublicProfileRole;
  firstName: string;
  lastName: string;
  fullName: string;
  age: number | null;
  isVerified: boolean;
  city: string | null;
  baseCategory: string | null;
  skills: string[];
  avatar: UserPublicProfileAvatar | null;
  contactChannels: UserContactChannel[];
  preferredContactChannelType: string | null;
};
