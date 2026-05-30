import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { RADIUS, T } from '../theme/tokens';
import { Icon, IconName } from './Icon';
import { getPhoneAutofillProps, PhoneAutofillMode } from '../utils/autofillCredentials';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  icon?: IconName;
  suffix?: React.ReactNode;
  containerStyle?: ViewStyle;
};

export function TextField({
  label,
  error,
  icon,
  suffix,
  containerStyle,
  style,
  multiline,
  ...inputProps
}: Props) {
  const borderColor = error ? T.danger : T.border;

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          { borderColor },
        ]}
      >
        {icon && !multiline && <Icon name={icon} size={20} color={T.muted} />}
        <TextInput
          {...inputProps}
          multiline={multiline}
          placeholderTextColor={T.mutedSoft}
          style={[styles.input, multiline && styles.inputMultiline, style]}
        />
        {suffix}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function PhoneField({
  value,
  onChangeDigits,
  error,
  autofillMode = 'login',
  importantForAutofill,
}: {
  value: string;
  onChangeDigits: (digits: string) => void;
  error?: string;
  /** login — подстановка при входе; register — сохранение при регистрации */
  autofillMode?: PhoneAutofillMode;
  importantForAutofill?: 'yes' | 'no' | 'auto';
}) {
  const borderColor = error ? T.danger : T.border;
  const autofill = getPhoneAutofillProps(autofillMode);

  return (
    <View>
      <Text style={styles.label}>Номер телефона</Text>
      <View style={[styles.field, { borderColor }]}>
        <View style={styles.prefix}>
          <Text style={styles.flag}>🇷🇺</Text>
          <Text style={styles.prefixCode}>+7</Text>
        </View>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeDigits(t.replace(/\D/g, '').slice(0, 10))}
          keyboardType="phone-pad"
          placeholder="912 458 70 33"
          placeholderTextColor={T.mutedSoft}
          style={[styles.input, styles.phoneInput]}
          {...autofill}
          importantForAutofill={importantForAutofill ?? autofill.importantForAutofill}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function LogoMark() {
  return (
    <LinearGradient
      colors={[T.primary, T.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.logo}
    >
      <Icon name="heart" size={28} color="#fff" strokeWidth={2.2} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
  },
  fieldMultiline: {
    height: undefined,
    minHeight: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
    padding: 0,
    minWidth: 0,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  phoneInput: {
    letterSpacing: 0.4,
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: T.border,
    height: 24,
  },
  flag: {
    fontSize: 16,
  },
  prefixCode: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    marginTop: 6,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
