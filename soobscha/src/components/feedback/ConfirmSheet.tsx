import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../Button';
import { Icon, IconName } from '../Icon';
import { RADIUS, T } from '../../theme/tokens';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: IconName;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  icon = 'warn',
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const accent = destructive ? T.danger : T.primary;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.hero}>
            <View style={[styles.iconWrap, { backgroundColor: destructive ? T.dangerSoft : T.primarySoft }]}>
              <Icon name={icon} size={32} color={accent} strokeWidth={2} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.footer}>
            <Button kind="ghost" size="lg" style={styles.footerBtn} disabled={loading} onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              kind="primary"
              size="lg"
              style={[styles.footerBtn, destructive && styles.confirmDanger]}
              labelColor="#fff"
              disabled={loading}
              onPress={onConfirm}
            >
              {loading ? 'Подождите…' : confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,18,12,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.border,
    marginBottom: 18,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
  },
  confirmDanger: {
    backgroundColor: T.danger,
  },
});
