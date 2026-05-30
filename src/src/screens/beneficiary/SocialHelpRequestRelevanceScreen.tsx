import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { decideSocialHelpRequestRelevance } from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TextField } from '../../components/TextField';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'SocialHelpRequestRelevance'>;
  route: RouteProp<RootStackParamList, 'SocialHelpRequestRelevance'>;
};

export function SocialHelpRequestRelevanceScreen({ navigation, route }: Props) {
  const { helpRequestId, title, scheduleLabel } = route.params;
  const insets = useSafeAreaInsets();
  const { showSnack, showError } = useFeedback();
  const [declineMode, setDeclineMode] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (confirmed: boolean) => {
    if (!confirmed && declineMode && !reasonText.trim()) {
      showError('Кратко опишите, почему помощь больше не нужна');
      return;
    }

    setSubmitting(true);
    try {
      await decideSocialHelpRequestRelevance(helpRequestId, {
        confirmed,
        reason_text: confirmed ? null : reasonText.trim() || null,
      });
      showSnack(confirmed ? 'Актуальность подтверждена' : 'Заявка будет отменена');
      navigation.goBack();
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось отправить ответ'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Подтвердите актуальность" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, shadowSm]}>
            <View style={styles.iconWrap}>
              <Icon name="clock" size={24} color={T.warning} strokeWidth={2} />
            </View>
            <Text style={styles.cardTitle}>
              {title ? `«${title}»` : 'Ваша заявка'} всё ещё актуальна?
            </Text>
            {scheduleLabel ? (
              <Text style={styles.cardSub}>
                Запланировано: {scheduleLabel}. Подтвердите, что помощь по-прежнему нужна.
              </Text>
            ) : (
              <Text style={styles.cardSub}>
                Скоро наступит срок встречи — подтвердите, что помощь по-прежнему нужна.
              </Text>
            )}
          </View>

          {declineMode ? (
            <View style={styles.declineBlock}>
              <TextField
                label="Почему помощь больше не нужна"
                value={reasonText}
                onChangeText={setReasonText}
                multiline
                numberOfLines={4}
                placeholder="Кратко опишите ситуацию…"
              />
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {declineMode ? (
            <>
              <Button
                kind="ghost"
                size="lg"
                onPress={() => setDeclineMode(false)}
                disabled={submitting}
              >
                Назад
              </Button>
              <Button
                kind="secondary"
                size="lg"
                style={styles.footerPrimary}
                onPress={() => submit(false)}
                disabled={submitting}
              >
                {submitting ? 'Отправка…' : 'Отменить заявку'}
              </Button>
            </>
          ) : (
            <>
              <Button
                kind="ghost"
                size="lg"
                onPress={() => setDeclineMode(true)}
                disabled={submitting}
                style={{ borderColor: T.danger }}
                labelColor={T.danger}
              >
                Нет, не нужна
              </Button>
              <Button
                kind="primary"
                size="lg"
                style={styles.footerPrimary}
                onPress={() => submit(true)}
                disabled={submitting}
                iconRight={submitting ? undefined : 'check'}
              >
                {submitting ? 'Отправка…' : 'Да, всё ещё нужна'}
              </Button>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: T.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 22,
  },
  cardSub: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 20,
  },
  declineBlock: {
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
  footerPrimary: {
    flex: 1,
  },
});
