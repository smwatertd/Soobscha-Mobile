import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  finishSocialHelpRequestExecution,
  getHelpRequestById,
  getSocialHelpRequestParticipants,
} from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
import { SocialHelpRequestParticipant, SocialHelpRequestSummary } from '../../api/integrationTypes';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFeedback } from '../../providers/FeedbackProvider';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type FinishStatus = 'FINISHED' | 'LEFT_AFTER_START';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryFinishMeeting'>;
  route: RouteProp<RootStackParamList, 'BeneficiaryFinishMeeting'>;
};

function isPresentAtStart(participant: SocialHelpRequestParticipant): boolean {
  return participant.status !== 'NOT_ATTENDED';
}

export function BeneficiaryFinishMeetingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { helpRequestId } = route.params;
  const { showError } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<SocialHelpRequestSummary | null>(null);
  const [participants, setParticipants] = useState<SocialHelpRequestParticipant[]>([]);
  const [statusById, setStatusById] = useState<Record<string, FinishStatus>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHelpRequestById(helpRequestId);
      if (data.type !== 'SOCIAL') throw new Error('Это не социальная заявка');
      setRequest(data as SocialHelpRequestSummary);
      const people = await getSocialHelpRequestParticipants(helpRequestId);
      const present = people.filter(isPresentAtStart);
      setParticipants(present);
      setStatusById(
        Object.fromEntries(present.map((p) => [p.volunteer_user_id, 'FINISHED' as FinishStatus])),
      );
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось загрузить данные'));
    } finally {
      setLoading(false);
    }
  }, [helpRequestId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const finishedCount = useMemo(
    () => Object.values(statusById).filter((status) => status === 'FINISHED').length,
    [statusById],
  );

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const completedIds = participants
        .filter((p) => statusById[p.volunteer_user_id] === 'FINISHED')
        .map((p) => p.volunteer_user_id);

      await finishSocialHelpRequestExecution(helpRequestId, {
        completed_volunteer_ids: completedIds,
      });

      navigation.replace('BeneficiarySocialMeetingDone', {
        helpRequestId,
        title: request?.title,
        participants: participants.map((p) => ({
          id: p.volunteer_user_id,
          name: `${p.first_name} ${p.last_name}`.trim(),
          finished: statusById[p.volunteer_user_id] === 'FINISHED',
        })),
        durationMinutes: request?.duration_minutes,
      });
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось завершить встречу'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Завершение встречи"
        subtitle="Отметьте, кто остался до конца"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <View style={styles.hintCard}>
          <Icon name="info" size={20} color={T.primary} strokeWidth={2} />
          <Text style={styles.hintText}>
            Кто не пришёл на встречу — уже отмечен на старте. Теперь зафиксируйте, кто работал
            до конца, а кто ушёл раньше. После — нужно будет составить отчёт.
          </Text>
        </View>

        <View style={styles.filterRow}>
          <Chip label={`Все · ${participants.length}`} active />
          <Chip label={`До конца · ${finishedCount}`} kind="success" icon="check" />
          <Chip
            label={`Ушли раньше · ${participants.length - finishedCount}`}
            kind="warning"
          />
        </View>

        <View style={[styles.listCard, shadowSm]}>
          {participants.map((person, index) => {
            const name = `${person.first_name} ${person.last_name}`.trim();
            const status = statusById[person.volunteer_user_id] ?? 'FINISHED';
            return (
              <View
                key={person.volunteer_user_id}
                style={[styles.personRow, index < participants.length - 1 && styles.personRowBorder]}
              >
                <Avatar name={name} size={40} />
                <View style={styles.personBody}>
                  <Text style={styles.personName}>{name}</Text>
                  <Text style={styles.personMeta}>Волонтёр</Text>
                </View>
                <FinishToggle
                  status={status}
                  onChange={(next) =>
                    setStatusById((prev) => ({ ...prev, [person.volunteer_user_id]: next }))
                  }
                />
              </View>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Icon name="clock" size={18} color={T.muted} strokeWidth={2} />
          <Text style={styles.infoText}>
            После завершения изменить состав нельзя. Отчёт можно составить сразу или вернуться
            к нему позже.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="ghost" size="lg" style={styles.footerSecondary} onPress={() => navigation.goBack()}>
          Назад
        </Button>
        <Button
          kind="primary"
          size="lg"
          iconRight="check"
          style={styles.footerPrimary}
          disabled={submitting}
          onPress={() => void handleFinish()}
        >
          {submitting ? 'Завершение…' : 'Завершить встречу'}
        </Button>
      </View>
    </View>
  );
}

function FinishToggle({
  status,
  onChange,
}: {
  status: FinishStatus;
  onChange: (status: FinishStatus) => void;
}) {
  const finished = status === 'FINISHED';
  return (
    <View style={styles.finishToggle}>
      <Pressable
        onPress={() => onChange('FINISHED')}
        style={[styles.finishOption, finished && styles.finishOptionActiveSuccess]}
      >
        <Icon name="check" size={12} color={finished ? '#fff' : T.muted} strokeWidth={3} />
        <Text style={[styles.finishOptionText, finished && styles.finishOptionTextActive]}>
          До конца
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('LEFT_AFTER_START')}
        style={[styles.finishOption, !finished && styles.finishOptionActiveWarning]}
      >
        <Text style={[styles.finishOptionText, !finished && styles.finishOptionTextActive]}>
          Ушёл раньше
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hintCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: T.primarySoft,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 14,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.primaryDark,
    lineHeight: 18,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  listCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  personRowBorder: { borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  personBody: { flex: 1, minWidth: 0 },
  personName: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink },
  personMeta: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: T.surface2,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 17,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  footerSecondary: { flex: 1, minWidth: 0 },
  footerPrimary: { flex: 1.4, minWidth: 0 },
  finishToggle: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    backgroundColor: T.surface2,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  finishOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
  },
  finishOptionActiveSuccess: { backgroundColor: T.success },
  finishOptionActiveWarning: { backgroundColor: T.warning },
  finishOptionText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
  },
  finishOptionTextActive: { color: '#fff' },
});
