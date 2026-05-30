import { Gender, RegistrationRole } from '../api/types';

export type RegisterStep1Params = {
  role: RegistrationRole;
};

export type RegisterStep2Params = RegisterStep1Params & {
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: Gender;
};

export type RegisterPhoneParams = RegisterStep2Params & {
  password: string;
};

export type RegisterOtpParams = {
  role: RegistrationRole;
  phoneDigits: string;
  password: string;
  verificationId: string;
  devOtpCode?: string;
};

export function registrationDisplayName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function formatPhoneForDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(-10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}

export function genderLabel(gender: Gender): string {
  switch (gender) {
    case 'FEMALE':
      return 'Женский';
    case 'male':
      return 'Мужской';
    case 'PREFER_NOT_TO_SAY':
      return 'Не указывать';
    default:
      return gender;
  }
}
