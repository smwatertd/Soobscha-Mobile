import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
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
  getHelpRequestById,
  getSocialHelpRequestParticipants,
  startSocialHelpRequestExecution,
} from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
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
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryStartMeeting'>;
  route: RouteProp<RootStackParamList, 'BeneficiaryStartMeeting'>;
};

export function BeneficiaryStartMeetingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { helpRequestId } = route.params;
  const { showError, showSnack } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<SocialHelpRequestSummary | null>(null);
  const [participants, setParticipants] = useState<SocialHelpRequestParticipant[]>([]);
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [interruptOpen, setInterruptOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHelpRequestById(helpRequestId);
      if (data.type !== 'SOCIAL') throw new Error('Это не социальная заявка');
      const social = data as SocialHelpRequestSummary;
      setRequest(social);
      const people = await getSocialHelpRequestParticipants(helpRequestId);
      setParticipants(people);
      setPresentIds(new Set(people.map((p) => p.volunteer_user_id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [helpRequestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const minVolunteers = request?.min_volunteers ?? 1;
  const presentCount = presentIds.size;
  const canStart = presentCount >= minVolunteers;

  const handleConfirm = async () => {
    if (!canStart || submitting) return;
    setSubmitting(true);
    try {
      await startSocialHelpRequestExecution(helpRequestId, {
        attended_volunteer_ids: [...presentIds],
      });
      showSnack('Встреча начата', 'success');
      navigation.replace('BeneficiaryMeetingInProgress', { helpRequestId });
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось начать встречу'));
    } finally {
      setSubmitting(false);
    }
  };

  const when = request?.start_at
    ? new Date(request.start_at).toLocaleString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error ?? 'Заявка не найдена'}</Text>
        <Pressable onPress={load}>
          <Text style={styles.retry}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Старт встречи" subtitle="Отметьте, кто пришёл" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <View style={[styles.meetingCard, shadowSm]}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>
              {new Date(request.start_at)
                .toLocaleDateString('ru-RU', { weekday: 'short' })
                .replace('.', '')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
            <Text style={styles.dateNum}>
              {new Date(request.start_at).toLocaleDateString('ru-RU', { day: 'numeric' })}
            </Text>
            <Text style={styles.dateMonth}>
              {new Date(request.start_at).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.meetingTitle}>{request.title}</Text>
            <Text style={styles.meetingMeta}>
              {when} · {request.address_text}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.banner,
            canStart ? styles.bannerOk : styles.bannerWarn,
          ]}
        >
          <Icon
            name={canStart ? 'check' : 'warn'}
            size={20}
            color={canStart ? T.success : '#8B5E10'}
            strokeWidth={2.2}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, canStart ? styles.bannerTitleOk : styles.bannerTitleWarn]}>
              {canStart ? 'Можно начинать' : 'Недостаточно волонтёров'}
            </Text>
            <Text style={[styles.bannerText, canStart ? styles.bannerTextOk : styles.bannerTextWarn]}>
              Пришло{' '}
              <Text style={styles.bannerTextBold}>
                {presentCount} из {participants.length}
              </Text>
              {' · '}минимум для запуска —{' '}
              <Text style={styles.bannerTextBold}>{minVolunteers}</Text>
              {!canStart
                ? '. После подтверждения система автоматически прервёт заявку.'
                : ''}
            </Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Chip label={`Все · ${participants.length}`} active />
          <Chip label={`Пришли · ${presentCount}`} kind="success" icon="check" />
          <Chip label={`Нет · ${participants.length - presentCount}`} kind="danger" icon="close" />
        </View>

        <View style={[styles.listCard, shadowSm]}>
          {participants.map((person, index) => {
            const name = `${person.first_name} ${person.last_name}`.trim();
            const present = presentIds.has(person.volunteer_user_id);
            return (
              <View
                key={person.volunteer_user_id}
                style={[styles.personRow, index < participants.length - 1 && styles.personRowBorder]}
              >
                <Avatar name={name} size={40} />
                <View style={styles.personBody}>
                  <Text style={styles.personName}>{name}</Text>
                  <Text style={styles.personMeta}>
                    {person.skill_codes.length
                      ? `${person.skill_codes.length} навык${person.skill_codes.length > 1 ? 'а' : ''}`
                      : 'Волонтёр'}
                  </Text>
                </View>
                <PresenceToggle
                  present={present}
                  onChange={(next) => {
                    setPresentIds((prev) => {
                      const updated = new Set(prev);
                      if (next) updated.add(person.volunteer_user_id);
                      else updated.delete(person.volunteer_user_id);
                      return updated;
                    });
                  }}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Icon name="info" size={18} color={T.muted} strokeWidth={2} />
          <Text style={styles.infoText}>
            После старта изменить состав нельзя. Если волонтёр уйдёт во время работы — отметьте «ушёл
            раньше» в отчёте.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          kind="ghost"
          size="lg"
          labelColor={T.danger}
          style={{ flex: 1, minWidth: 0 }}
          onPress={() => setInterruptOpen(true)}
        >
          Прервать
        </Button>
        <Button
          kind="primary"
          size="lg"
          iconRight="check"
          style={{ flex: 1.4, minWidth: 0 }}
          disabled={!canStart || submitting}
          onPress={handleConfirm}
        >
          {submitting ? 'Запуск…' : 'Подтвердить состав'}
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

function PresenceToggle({
  present,
  onChange,
}: {
  present: boolean;
  onChange: (present: boolean) => void;
}) {
  return (
    <View style={styles.presenceToggle}>
      <Pressable
        onPress={() => onChange(true)}
        style={[styles.presenceOption, present && styles.presenceOptionActiveSuccess]}
      >
        <Icon name="check" size={12} color={present ? '#fff' : T.muted} strokeWidth={3} />
        <Text style={[styles.presenceOptionText, present && styles.presenceOptionTextActive]}>
          Пришёл
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(false)}
        style={[styles.presenceOption, !present && styles.presenceOptionActiveDanger]}
      >
        <Icon name="close" size={12} color={!present ? '#fff' : T.muted} strokeWidth={3} />
        <Text style={[styles.presenceOptionText, !present && styles.presenceOptionTextActive]}>
          Нет
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  errorText: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: T.danger, textAlign: 'center' },
  retry: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
  meetingCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
  },
  dateBox: {
    width: 50,
    height: 56,
    borderRadius: 12,
    backgroundColor: T.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
    textTransform: 'uppercase',
  },
  dateNum: { fontSize: 20, fontFamily: 'Manrope_800ExtraBold', color: T.primary, lineHeight: 22 },
  dateMonth: {
    fontSize: 9,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
    textTransform: 'uppercase',
  },
  meetingTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: T.ink, lineHeight: 20 },
  meetingMeta: { fontSize: 12, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 4 },
  banner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  bannerOk: { backgroundColor: T.successSoft, borderColor: `${T.success}22` },
  bannerWarn: { backgroundColor: T.warningSoft, borderColor: `${T.warning}22` },
  bannerTitle: { fontSize: 13, fontFamily: 'Manrope_700Bold' },
  bannerTitleOk: { color: T.success },
  bannerTitleWarn: { color: '#7A5210' },
  bannerText: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  bannerTextBold: { fontFamily: 'Manrope_700Bold' },
  bannerTextOk: { color: '#3D6940' },
  bannerTextWarn: { color: '#7A5210' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  listCard: { backgroundColor: CARD_BG, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 4 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  personRowBorder: { borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  personBody: { flex: 1, minWidth: 0 },
  personName: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink },
  personMeta: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  presenceToggle: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    backgroundColor: T.surface2,
    borderRadius: RADIUS.pill,
    flexShrink: 0,
  },
  presenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
  },
  presenceOptionActiveSuccess: {
    backgroundColor: T.success,
  },
  presenceOptionActiveDanger: {
    backgroundColor: T.danger,
  },
  presenceOptionText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
  },
  presenceOptionTextActive: {
    color: '#fff',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: T.surface2,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Manrope_400Regular', color: T.ink2, lineHeight: 17 },
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
