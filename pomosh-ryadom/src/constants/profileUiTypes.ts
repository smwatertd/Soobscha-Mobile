import { IconName } from '../components/Icon';

export type ProfileStat = { value: string; label: string };
export type ProfilePersonalRow = { label: string; value: string; hint?: string; locked?: boolean };
export type ProfileMenuItem = {
  icon: IconName;
  label: string;
  sub?: string;
  color: string;
};
