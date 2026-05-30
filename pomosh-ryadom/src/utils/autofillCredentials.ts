import { Platform, TextInputProps } from 'react-native';

type PasswordAutofillMode = 'login' | 'register-new';

export function getPasswordAutofillProps(mode: PasswordAutofillMode): Pick<
  TextInputProps,
  'autoComplete' | 'textContentType' | 'importantForAutofill'
> {
  if (mode === 'login') {
    return {
      autoComplete: 'current-password',
      textContentType: 'password',
      importantForAutofill: 'yes',
    };
  }

  return {
    autoComplete: 'password-new',
    textContentType: 'newPassword',
    importantForAutofill: 'yes',
  };
}

export type PhoneAutofillMode = 'login' | 'register';

export function getPhoneAutofillProps(mode: PhoneAutofillMode): Pick<
  TextInputProps,
  'autoComplete' | 'textContentType' | 'importantForAutofill'
> {
  if (mode === 'login') {
    return {
      autoComplete: 'username',
      textContentType: 'username',
      importantForAutofill: 'yes',
    };
  }

  return {
    autoComplete: 'username-new',
    textContentType: Platform.OS === 'ios' ? 'telephoneNumber' : 'username',
    importantForAutofill: 'yes',
  };
}
