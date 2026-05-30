import { LinearGradient } from 'expo-linear-gradient';
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
import { getHelpRequestById, getSocialHelpRequestParticipants } from '../../api/helpRequests';
import { SocialHelpRequestParticipant, SocialHelpRequestSummary } from '../../api/integrationTypes';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { HelpRequestReasonSheet } from '../../components/beneficiary/detail/HelpRequestReasonSheet';
import { useFeedback } from '../../providers/FeedbackProvider';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryMeetingInProgress'>;
  route: RouteProp<RootStackParamList, 'BeneficiaryMeetingInProgress'>;
};

function formatElapsed(startedAt: Date): string {
  const diffMs = Date.now() - startedAt.getTime();
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':');
}

export function BeneficiaryMeetingInProgressScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { helpRequestId } = route.params;
  const { showError, showSnack } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<SocialHelpRequestSummary | null>(null);
  const [participants, setParticipants] = useState<SocialHelpRequestParticipant[]>([]);
  const [elapsed, setElapsed] = useState('0:00:00');
  const [interruptOpen, setInterruptOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHelpRequestById(helpRequestId);
      if (data.type !== 'SOCIAL') throw new Error('Это не социальная заявка');
      setRequest(data as SocialHelpRequestSummary);
      setParticipants(await getSocialHelpRequestParticipants(helpRequestId));
    } catch {
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [helpRequestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startedAt = useMemo(() => {
    const raw = (request as { started_at?: string } | null)?.started_at ?? request?.start_at;
    return raw ? new Date(raw) : new Date();
  }, [request]);

  useEffect(() => {
    const tick = () => setElapsed(formatElapsed(startedAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const showLoading = loading;

  const handleFinish = () => {
    navigation.navigate('BeneficiaryFinishMeeting', { helpRequestId });
  };

  if (showLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Заявка не найдена</Text>
        <Pressable onPress={load}>
          <Text style={styles.retry}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  const endTime = new Date(startedAt.getTime() + request.duration_minutes * 60_000);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Встреча идёт"
        subtitle={request.title}
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>В процессе</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <LinearGradient colors={[T.primary, T.primaryDark]} style={styles.timerCard}>
          <View style={styles.timerDecor} />
          <Text style={styles.timerLabel}>ИДЁТ УЖЕ</Text>
          <Text style={styles.timerValue}>{elapsed}</Text>
          <View style={styles.timerMeta}>
            <Icon name="clock" size={14} color="#fff" />
            <Text style={styles.timerMetaText}>
              Начато в {startedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · план до{' '}
              {endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>На месте сейчас</Text>
        <View style={[styles.listCard, shadowSm]}>
          {participants.map((person, index) => {
            const name = `${person.first_name} ${person.last_name}`.trim();
            const here = person.status !== 'NOT_ATTENDED';
            return (
              <View
                key={person.volunteer_user_id}
                style={[styles.personRow, index < participants.length - 1 && styles.personRowBorder, !here && { opacity: 0.5 }]}
              >
                <Avatar name={name} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{name}</Text>
                  <Text style={styles.personMeta}>{person.status}</Text>
                </View>
                {here ? (
                  <Chip kind="success" size="sm" icon="check" label="На месте" />
                ) : (
                  <Chip kind="danger" size="sm" label="Не пришёл" />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.warnCard}>
          <Icon name="info" size={20} color="#8B5E10" strokeWidth={2} />
          <Text style={styles.warnText}>
            <Text style={styles.warnBold}>Когда работа закончится</Text>
            {' — нажмите «Завершить» и отметьте, кто остался до конца, а кто ушёл раньше.'}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          kind="ghost"
          size="lg"
          labelColor={T.danger}
          style={{ flex: 1 }}
          onPress={() => setInterruptOpen(true)}
        >
          Прервать
        </Button>
        <Button
          kind="primary"
          size="lg"
          iconRight="arrowR"
          style={{ flex: 1.4, minWidth: 0 }}
          onPress={handleFinish}
        >
          Завершить встречу
        </Button>
      </View>

      {interruptOpen ? (
        <HelpRequestReasonSheet
          visible
          kind="interrupt"
          helpRequestId={helpRequestId}
          isMaterial={false}
          joinedVolunteers={participants.length}
          onClose={() => setInterruptOpen(false)}
          onSuccess={() => {
            setInterruptOpen(false);
            navigation.navigate('BeneficiaryHelpRequestDetail', { helpRequestId });
          }}
          onError={(message) => showError(message, { mode: 'snackbar' })}
          onSuccessMessage={(message) => showSnack(message, 'success')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  errorText: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: T.danger },
  retry: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: T.successSoft,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.success },
  liveText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.success,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  timerCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  timerDecor: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: T.accent,
    opacity: 0.22,
  },
  timerLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  timerValue: {
    fontSize: 36,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  timerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerMetaText: { fontSize: 12, fontFamily: 'Manrope_400Regular', color: 'rgba(255,255,255,0.85)' },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 10,
  },
  listCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
  },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  personRowBorder: { borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  personName: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: T.ink },
  personMeta: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  warnCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: T.warningSoft,
    borderRadius: 14,
    padding: 14,
  },
  warnText: { flex: 1, fontSize: 12, fontFamily: 'Manrope_400Regular', color: '#7A5210', lineHeight: 17 },
  warnBold: { fontFamily: 'Manrope_700Bold' },
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
});
