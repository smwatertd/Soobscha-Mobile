import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../Icon';
import { RADIUS, T, shadowLg } from '../../theme/tokens';

type Props = {
  visible: boolean;
  message: string;
  title?: string;
  onClose: () => void;
};

export function ErrorModal({ visible, message, title = 'Ошибка', onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Закрыть" />

        <View style={[styles.card, shadowLg]}>
          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Закрыть"
          >
            <Icon name="close" size={28} color={T.muted} strokeWidth={2} />
          </Pressable>

          <View style={styles.iconWrap}>
            <Icon name="info" size={32} color={T.danger} strokeWidth={2} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable style={styles.actionBtn} onPress={onClose}>
            <Text style={styles.actionText}>Понятно</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 31, 27, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: T.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionBtn: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 15,
    fontFamily: 'Manrope_600SemiBold',
    color: '#fff',
  },
});
