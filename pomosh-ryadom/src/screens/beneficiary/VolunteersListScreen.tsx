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
  joinSocialHelpRequest,
} from '../../api/helpRequests';
import { resolveVolunteerJoinHelpRequestError } from '../../utils/volunteerJoinHelpRequestError';
import { SocialHelpRequestParticipant, SocialHelpRequestSummary } from '../../api/integrationTypes';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { ProgressBar } from '../../components/ProgressBar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { formatDisplayLocation } from '../../navigation/createHelpRequestTypes';
import { useFeedback } from '../../providers/FeedbackProvider';
import { useSkillLabelMap } from '../../hooks/useSkillLabelMap';
import { useVolunteerCityLabel } from '../../hooks/useVolunteerCityLabel';
import {
  extractCityFromAddress,
  volunteerAttendingDisplayMeta,
} from '../../utils/volunteerAttendingMeta';
import { formatVolunteerSkillCodes } from '../../utils/volunteerSkillLabels';
import { RADIUS, T, shadowSm } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteersList'>;
  route: RouteProp<RootStackParamList, 'VolunteersList'>;
};

export function VolunteersListScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { helpRequestId, mode = 'beneficiary' } = route.params;
  const isAttending = mode === 'attending';
  const { showError } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<SocialHelpRequestSummary | null>(null);
  const [participants, setParticipants] = useState<SocialHelpRequestParticipant[]>([]);
  const [joining, setJoining] = useState(false);
  const { labelByCode } = useSkillLabelMap();
  const viewerCity = useVolunteerCityLabel();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHelpRequestById(helpRequestId);
      if (data.type !== 'SOCIAL') throw new Error('Это не социальная заявка');
      setRequest(data as SocialHelpRequestSummary);
      const people = await getSocialHelpRequestParticipants(helpRequestId);
      setParticipants(people);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить список');
    } finally {
      setLoading(false);
    }
  }, [helpRequestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const joined = request?.participants?.joined ?? participants.length;
  const maxVolunteers = request?.max_volunteers ?? joined;
  const minVolunteers = request?.min_volunteers ?? 0;
  const needMore = Math.max(0, minVolunteers - joined);
  const canJoin =
    isAttending &&
    request &&
    (request.status === 'VOLUNTEER_RECRUITING' || request.status === 'WAITING_START') &&
    joined < maxVolunteers;

  const scheduleLabel = request?.start_at
    ? new Date(request.start_at).toLocaleString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : route.params.scheduleLabel;

  const isEmpty = participants.length === 0;

  const subtitle = isAttending
    ? `${joined} из ${maxVolunteers}${needMore > 0 ? ` · нужен ещё ${needMore} ${volunteerWord(needMore)}` : ''}`
    : `${joined} из ${maxVolunteers || minVolunteers} необходимых`;

  const handleJoin = async () => {
    if (!canJoin || joining) return;
    setJoining(true);
    try {
      await joinSocialHelpRequest(helpRequestId);
      await load();
      navigation.goBack();
    } catch (err) {
      showError(
        resolveVolunteerJoinHelpRequestError(err, { requestStatus: request?.status }),
      );
    } finally {
      setJoining(false);
    }
  };

  const title = request?.title ?? 'Заявка';
  const locationShort = request?.place_name
    ? formatDisplayLocation(request.place_name)
    : request?.address_text
      ? formatDisplayLocation(request.address_text)
      : null;
  const meetingCity =
    extractCityFromAddress(request?.address_text) ??
    extractCityFromAddress(request?.place_name) ??
    viewerCity ??
    'Москва';
  const timeRange =
    request?.start_at && request.duration_minutes
      ? formatTimeRange(request.start_at, request.duration_minutes)
      : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={isAttending ? 'Идут на встречу' : 'Записавшиеся волонтёры'}
        subtitle={subtitle}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retry}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: isAttending ? insets.bottom + 100 : insets.bottom + 20,
            }}
          >
            {isAttending ? (
              <View style={styles.meetingCard}>
                <View style={styles.meetingRow}>
                  {request?.start_at ? (
                    <MeetingDateBadge startAt={request.start_at} />
                  ) : (
                    <View style={styles.meetingDateFallback}>
                      <Icon name="calendar" size={20} color={T.primary} />
                    </View>
                  )}
                  <View style={styles.meetingText}>
                    <Text style={styles.meetingTitle} numberOfLines={2}>
                      {title}
                    </Text>
                    {timeRange || locationShort ? (
                      <Text style={styles.meetingSub} numberOfLines={2}>
                        {[timeRange, locationShort].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {maxVolunteers > 0 ? (
                  <>
                    <ProgressBar
                      value={joined}
                      max={maxVolunteers}
                      color={T.primary}
                      bg="#fff"
                      height={6}
                      style={{ marginTop: 12 }}
                    />
                    <View style={styles.meetingProgressLabels}>
                      <Text style={styles.meetingProgressText}>
                        {joined} из {maxVolunteers}
                      </Text>
                      {minVolunteers > 0 ? (
                        <Text style={styles.meetingProgressText}>≥ {minVolunteers} для запуска</Text>
                      ) : null}
                    </View>
                  </>
                ) : null}
              </View>
            ) : (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{scheduleLabel ?? 'Дата уточняется'}</Text>
                  <Text style={styles.summaryValue}>
                    {joined} / {maxVolunteers || '—'} волонтёров
                  </Text>
                </View>
                {maxVolunteers > 0 ? (
                  <ProgressBar value={joined} max={maxVolunteers} color={T.primary} bg="#fff" height={5} />
                ) : null}
              </View>
            )}

            {isAttending ? (
              <View style={styles.contactsHint}>
                <Icon name="info" size={18} color={T.accentDark} strokeWidth={2} />
                <Text style={styles.contactsHintText}>
                  Контакты других волонтёров не видны — общение с благополучателем идёт напрямую через его
                  профиль.
                </Text>
              </View>
            ) : null}

            {isEmpty && !isAttending ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Пока никто не записался</Text>
              </View>
            ) : (
              participants.map((person) => {
                const name = `${person.first_name} ${person.last_name}`.trim();
                if (isAttending) {
                  const { meetingsCount, rating } = volunteerAttendingDisplayMeta(
                    person.volunteer_user_id,
                  );
                  return (
                    <Pressable
                      key={person.volunteer_user_id}
                      style={[styles.attendingCard, shadowSm]}
                      onPress={() =>
                        navigation.navigate('VisitorProfile', {
                          userId: person.volunteer_user_id,
                          displayName: name,
                          role: 'volunteer',
                        })
                      }
                    >
                      <Avatar name={name} size={44} />
                      <View style={styles.attendingBody}>
                        <View style={styles.nameRow}>
                          <Text style={styles.personName} numberOfLines={1}>
                            {name}
                          </Text>
                          <Icon name="shield" size={12} color={T.success} strokeWidth={2.2} />
                        </View>
                        <View style={styles.attendingMetaRow}>
                          <Text style={styles.attendingMetaText}>{meetingCity}</Text>
                          <View style={styles.attendingDot} />
                          <Text style={styles.attendingMetaText}>
                            {meetingsCount} {meetingsWord(meetingsCount)}
                          </Text>
                          <View style={styles.attendingDot} />
                          <Icon name="star" size={10} color={T.accent} fill={T.accent} />
                          <Text style={styles.attendingRating}>{rating.toFixed(1)}</Text>
                        </View>
                        {person.joined_at ? (
                          <Text style={styles.attendingWhen}>{formatJoinedWhen(person.joined_at)}</Text>
                        ) : null}
                      </View>
                      <Icon name="chevR" size={18} color={T.mutedSoft} />
                    </Pressable>
                  );
                }

                return (
                  <View key={person.volunteer_user_id} style={styles.personCard}>
                    <Avatar name={name} size={48} ring={T.primarySoft} />
                    <View style={styles.personBody}>
                      <View style={styles.nameRow}>
                        <Text style={styles.personName} numberOfLines={1}>
                          {name}
                        </Text>
                        <Icon name="shield" size={14} color={T.success} strokeWidth={2.2} />
                      </View>
                      <View style={styles.badgeRow}>
                        <Chip kind="primary" size="sm" icon="handshake" label="Волонтёр" />
                      </View>
                      <Text style={styles.personMeta} numberOfLines={2}>
                        {formatVolunteerSkillCodes(person.skill_codes, labelByCode)}
                      </Text>
                    </View>
                    <Button
                      kind="primary"
                      size="sm"
                      iconRight="chevR"
                      style={styles.profileBtn}
                      onPress={() =>
                        navigation.navigate('VisitorProfile', {
                          userId: person.volunteer_user_id,
                          displayName: name,
                          role: 'volunteer',
                        })
                      }
                    >
                      Профиль
                    </Button>
                  </View>
                );
              })
            )}

            {isAttending && needMore > 0 ? (
              <View style={styles.emptySlot}>
                <View style={styles.emptySlotIcon}>
                  <Icon name="plus" size={20} color={T.muted} strokeWidth={2.2} />
                </View>
                <View style={styles.emptySlotBody}>
                  <Text style={styles.emptySlotTitle}>Ждём ещё {volunteerWord(needMore)}</Text>
                  <Text style={styles.emptySlotSub}>
                    Минимум для запуска — {minVolunteers} {volunteerWord(minVolunteers, 'genitive')}
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {isAttending ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              <Button
                kind="primary"
                size="lg"
                full
                iconRight="check"
                disabled={!canJoin || joining}
                onPress={() => void handleJoin()}
              >
                {joining ? 'Запись…' : 'Записаться вместе с ними'}
              </Button>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function MeetingDateBadge({ startAt }: { startAt: string }) {
  const date = new Date(startAt);
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('ru-RU', { month: 'short' });

  return (
    <View style={styles.meetingDateBadge}>
      <Text style={styles.meetingDateWeekday}>{weekday}</Text>
      <Text style={styles.meetingDateDay}>{day}</Text>
      <Text style={styles.meetingDateMonth}>{month}</Text>
    </View>
  );
}

function formatTimeRange(startAt: string, durationMinutes: number): string {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(start)} — ${fmt(end)}`;
}

function formatJoinedWhen(iso: string): string {
  const date = new Date(iso);
  const label = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  return `записался ${label}`;
}

function meetingsWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'встреча';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'встречи';
  return 'встреч';
}

function volunteerWord(count: number, form: 'nominative' | 'genitive' = 'nominative'): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (form === 'genitive') {
    if (mod10 === 1 && mod100 !== 11) return 'волонтёра';
    return 'волонтёров';
  }
  if (mod10 === 1 && mod100 !== 11) return 'волонтёр';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'волонтёра';
  return 'волонтёров';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyWrap: { paddingVertical: 32, alignItems: 'center' },
  errorText: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: T.danger, textAlign: 'center' },
  retry: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
  emptyText: { fontSize: 14, fontFamily: 'Manrope_400Regular', color: T.muted, textAlign: 'center' },
  summaryCard: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  summaryLabel: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: T.primaryDark },
  summaryValue: { fontSize: 12, fontFamily: 'Manrope_700Bold', color: T.primaryDark },
  meetingCard: {
    backgroundColor: T.primarySoft,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
  },
  meetingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meetingDateBadge: {
    width: 48,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSm,
  },
  meetingDateFallback: {
    width: 48,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingDateWeekday: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
    textTransform: 'uppercase',
  },
  meetingDateDay: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.primary,
    lineHeight: 22,
  },
  meetingDateMonth: {
    fontSize: 9,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primaryDark,
    textTransform: 'uppercase',
  },
  meetingText: { flex: 1, minWidth: 0 },
  meetingTitle: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink, lineHeight: 18 },
  meetingSub: { fontSize: 12, fontFamily: 'Manrope_500Medium', color: T.primaryDark, marginTop: 4 },
  meetingProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  meetingProgressText: { fontSize: 11, fontFamily: 'Manrope_700Bold', color: T.primaryDark },
  contactsHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: T.accentSoft,
    borderRadius: 12,
    marginBottom: 16,
  },
  contactsHintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: '#7A4F1A',
    lineHeight: 17,
  },
  attendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  attendingBody: { flex: 1, minWidth: 0 },
  attendingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  attendingMetaText: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  attendingDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.mutedSoft,
  },
  attendingRating: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  attendingWhen: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.mutedSoft,
    marginTop: 3,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: T.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: T.border,
    borderStyle: 'dashed',
  },
  emptySlotIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotBody: { flex: 1 },
  emptySlotTitle: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: T.ink2 },
  emptySlotSub: { fontSize: 11, fontFamily: 'Manrope_500Medium', color: T.muted, marginTop: 2 },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 14,
    marginBottom: 10,
  },
  personBody: { flex: 1, minWidth: 0, paddingRight: 4 },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  personName: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  personMeta: { fontSize: 13, fontFamily: 'Manrope_500Medium', color: T.ink2, marginTop: 2, lineHeight: 18 },
  profileBtn: { flexShrink: 0 },
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
