import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../Icon';
import { OtpInput } from '../OtpInput';
import { T } from '../../theme/tokens';

type Props = {
  phoneFormatted: string;
  code: string;
  onCodeChange: (value: string) => void;
  otpError?: string;
  countdownLabel: string;
  canResend: boolean;
  resending: boolean;
  onResend: () => void;
  onChangePhone: () => void;
  footer: ReactNode;
};

export function OtpConfirmLayout({
  phoneFormatted,
  code,
  onCodeChange,
  otpError,
  countdownLabel,
  canResend,
  resending,
  onResend,
  onChangePhone,
  footer,
}: Props) {
  return (
    <>
      <View style={styles.hero}>
        <View style={styles.shieldWrap}>
          <Icon name="shield" size={32} color={T.primary} strokeWidth={2} />
        </View>
        <Text style={styles.heroText}>
          Мы отправили код на{'\n'}
          <Text style={styles.phoneBold}>{phoneFormatted}</Text>
        </Text>
        <Pressable onPress={onChangePhone} hitSlop={8}>
          <Text style={styles.changeLink}>Изменить номер</Text>
        </Pressable>
      </View>

      <OtpInput value={code} onChange={onCodeChange} error={otpError} />

      <View style={styles.resendRow}>
        {!canResend ? (
          <>
            <Icon name="clock" size={16} color={T.muted} />
            <Text style={styles.resendMuted}>
              Новый код через <Text style={styles.countdownBold}>{countdownLabel}</Text>
            </Text>
          </>
        ) : (
          <Pressable onPress={onResend} disabled={resending}>
            <Text style={styles.resendLink}>{resending ? 'Отправляем…' : 'Отправить код повторно'}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.spacer} />
      {footer}
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  shieldWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  phoneBold: {
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  changeLink: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 24,
  },
  resendMuted: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  countdownBold: {
    fontFamily: 'Manrope_700Bold',
    color: T.ink2,
    fontVariant: ['tabular-nums'],
  },
  resendLink: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  spacer: {
    flex: 1,
    minHeight: 12,
  },
});
