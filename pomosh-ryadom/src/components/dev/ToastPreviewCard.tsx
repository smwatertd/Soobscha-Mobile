import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '../Icon';
import { ToastVariant } from '../feedback/Toast';
import { RADIUS, T, shadowLg } from '../../theme/tokens';

const VARIANTS: Record<ToastVariant, { accent: string; icon: IconName }> = {
  success: { accent: T.success, icon: 'check' },
  warning: { accent: T.warning, icon: 'warn' },
  danger: { accent: T.danger, icon: 'close' },
  info: { accent: T.info, icon: 'info' },
};

type Props = {
  title: string;
  body?: string;
  variant?: ToastVariant;
  actionLabel?: string;
};

/** Статичная карточка тоста для Dev UI (макет e-7). */
export function ToastPreviewCard({
  title,
  body,
  variant = 'info',
  actionLabel,
}: Props) {
  const palette = VARIANTS[variant];

  return (
    <View style={[styles.card, shadowLg]}>
      <View style={[styles.iconWrap, { backgroundColor: palette.accent }]}>
        <Icon name={palette.icon} size={18} color="#fff" strokeWidth={2.4} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {body ? (
          <Text style={styles.body} numberOfLines={3}>
            {body}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable hitSlop={8} style={styles.actionBtn}>
          <Text style={[styles.actionText, { color: palette.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: T.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  body: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 17,
    marginTop: 2,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
  },
});
