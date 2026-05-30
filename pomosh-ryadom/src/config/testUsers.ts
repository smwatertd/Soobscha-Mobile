import { UserRole } from '../api/types';
import {
  extractPhoneDigits,
  formatPhoneDisplay,
  toApiPhone,
} from '../utils/phone';

export { extractPhoneDigits, formatPhoneDisplay, toApiPhone };

export type TestUser = {
  id: string;
  label: string;
  role: UserRole;
  /** 10 цифр без +7 */
  phoneDigits: string;
  password: string;
  iconColor: string;
  iconBg: string;
};

export const TEST_USERS: TestUser[] = [
  {
    id: 'beneficiary',
    label: 'Получатель помощи',
    role: 'BENEFICIARY',
    phoneDigits: '2669917509',
    password: 'K0XLZQb0NwD21gA',
    iconColor: '#1F6F5C',
    iconBg: '#E6F0EC',
  },
  {
    id: 'volunteer',
    label: 'Волонтер',
    role: 'VOLUNTEER',
    phoneDigits: '1627239565',
    password: 'JA6HJHDQlvOeg9O',
    iconColor: '#E89B5A',
    iconBg: '#FBEEDD',
  },
];
