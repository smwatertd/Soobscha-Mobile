import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { createMaterialDonation } from '../../api/donations';
import { getErrorMessage } from '../../api/errors';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { TextField } from '../../components/TextField';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFeedback } from '../../providers/FeedbackProvider';
import { formatMoneyRub } from '../../utils/formatMoney';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  helpRequestId: string;
  title: string;
  recipient: string;
  onBack: () => void;
  onSuccess: (params: { amountRub: number; title: string; recipient: string }) => void;
  onPaymentError?: (params: { amountRub: number }) => void;
};

const PRESETS = [300, 500, 1000, 2000, 5000];

function createIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function VolunteerDonateScreen({
  helpRequestId,
  title,
  recipient,
  onBack,
  onSuccess,
  onPaymentError,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showError } = useFeedback();
  const [amount, setAmount] = useState(1000);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isSubmitting = submitting;

  const handleDonate = async () => {
    if (amount < 1 || isSubmitting) return;
    setSubmitting(true);
    try {
      const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? '';
      const returnUrl = apiUrl ? `${apiUrl.replace(/\/$/, '')}/donation/return` : 'https://example.com/donation/return';
      const response = await createMaterialDonation(helpRequestId, {
        amount_kopeks: amount * 100,
        return_url: returnUrl,
        idempotency_key: createIdempotencyKey(),
      });

      if (response.confirmation_url) {
        await Linking.openURL(response.confirmation_url);
      }

      onSuccess({ amountRub: amount, title, recipient });
    } catch (err) {
      if (onPaymentError) {
        onPaymentError({ amountRub: amount });
        return;
      }
      showError(getErrorMessage(err, 'Не удалось создать пожертвование'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Пожертвование" onBack={onBack} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <View style={[styles.recipientCard, shadowSm]}>
          <View style={styles.recipientIcon}>
            <Icon name="coin" size={22} color={T.accentDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recipientLabel}>Помогаете</Text>
            <Text style={styles.recipientTitle} numberOfLines={2}>
              {title}
            </Text>
          </View>
        </View>

        <Text style={styles.amountLabel}>СУММА ПОЖЕРТВОВАНИЯ</Text>
        <Text style={styles.amountValue}>{formatMoneyRub(amount)}</Text>

        <View style={styles.presets}>
          {PRESETS.map((preset) => (
            <Chip
              key={preset}
              label={formatMoneyRub(preset)}
              active={amount === preset}
              onPress={() => setAmount(preset)}
            />
          ))}
        </View>

        <TextField
          label="Сообщение получателю"
          value={message}
          onChangeText={setMessage}
          placeholder="Несколько слов поддержки (по желанию)"
          multiline
        />

        <View style={[styles.infoCard, shadowSm]}>
          <Icon name="shield" size={20} color={T.primary} />
          <Text style={styles.infoText}>
            Платёж проходит через защищённый шлюз. Комиссия — 0%.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="accent" size="lg" full disabled={isSubmitting} onPress={handleDonate}>
          {isSubmitting ? 'Открываем оплату…' : `Перевести ${formatMoneyRub(amount)}`}
        </Button>
        {isSubmitting ? <ActivityIndicator color={T.accent} style={{ marginTop: 8 }} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 18,
  },
  recipientIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: T.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientLabel: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted },
  recipientTitle: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink, marginTop: 2 },
  amountLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 44,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 16,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
});
