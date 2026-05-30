import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { formatMoneyRub } from '../../utils/formatMoney';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  amountRub: number;
  title: string;
  recipient: string;
  kind?: 'donation' | 'join';
  onClose: () => void;
  onGoHome: () => void;
};

export function VolunteerSuccessScreen({
  amountRub,
  title,
  recipient,
  kind = 'donation',
  onClose,
  onGoHome,
}: Props) {
  const insets = useSafeAreaInsets();
  const isDonation = kind === 'donation';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
          <Icon name="close" size={18} color={T.ink2} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <View style={styles.iconRing} />
          <View style={styles.iconCircle}>
            <Icon name="check" size={56} color="#fff" strokeWidth={2.8} />
          </View>
        </View>

        <Text style={styles.title}>Спасибо!</Text>
        <Text style={styles.subtitle}>
          {isDonation ? (
            <>
              Вы перевели <Text style={styles.bold}>{formatMoneyRub(amountRub)}</Text> на сбор «{title}».
              {recipient ? ` ${recipient} получит уведомление.` : ''}
            </>
          ) : (
            <>Вы записались на «{title}». Организатор получит уведомление.</>
          )}
        </Text>

        <View style={[styles.summaryCard, shadowSm]}>
          <Row label="Получатель" value={recipient || '—'} />
          {isDonation ? <Row label="Сумма" value={formatMoneyRub(amountRub)} /> : null}
          <Row label="Заявка" value={title} last />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button kind="primary" size="lg" full onPress={onGoHome}>
          На главную
        </Button>
      </View>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  topBar: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconWrap: { position: 'relative', marginBottom: 28 },
  iconRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: T.successSoft,
    top: -30,
    left: -30,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: T.success,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.7,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  bold: { fontFamily: 'Manrope_700Bold', color: T.ink },
  summaryCard: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  rowLabel: { fontSize: 13, fontFamily: 'Manrope_400Regular', color: T.muted },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
});
