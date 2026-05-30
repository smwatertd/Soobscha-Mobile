import { StyleSheet, TextInput } from 'react-native';
import { getPasswordAutofillProps } from '../utils/autofillCredentials';

type Props = {
  value: string;
  mode: 'login' | 'register-new';
};

/** Скрытое поле для Autofill — связывает телефон и пароль при сохранении в Google/Apple. */
export function AutofillHiddenPasswordField({ value, mode }: Props) {
  if (!value) return null;

  const autofill = getPasswordAutofillProps(mode);

  return (
    <TextInput
      value={value}
      editable={false}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
      caretHidden
      {...autofill}
      style={styles.hidden}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
    left: 0,
    top: 0,
  },
});
