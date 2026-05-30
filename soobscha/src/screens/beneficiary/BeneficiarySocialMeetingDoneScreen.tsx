import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { formatDurationLabel } from './detail/detailHelpers';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiarySocialMeetingDone'>;
  route: RouteProp<RootStackParamList, 'BeneficiarySocialMeetingDone'>;
};

export function BeneficiarySocialMeetingDoneScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { helpRequestId, title, participants, durationMinutes } = route.params;
  const finishedAt = new Date();
  const finishedLabel = finishedAt.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const helpersCount = participants.filter((p) => p.finished).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title="Встреча завершена"
        subtitle={title}
        onBack={() => navigation.navigate('BeneficiaryHelpRequestDetail', { helpRequestId })}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <LinearGradient colors={[T.success, '#3D6D45']} style={styles.successCard}>
          <View style={styles.successDecor} />
          <View style={styles.successBody}>
            <View style={styles.successMetaRow}>
              <Icon name="check" size={18} color="#fff" strokeWidth={2.6} />
              <Text style={styles.successMeta}>Завершено {finishedLabel}</Text>
            </View>
            <Text style={styles.successTitle}>Спасибо за добрую работу!</Text>
            <Text style={styles.successSub}>
              {durationMinutes
                ? `Длилась ${formatDurationLabel(durationMinutes).replace('~', '')}`
                : 'Встреча завершена'}
              {' · '}
              {helpersCount}{' '}
              {helpersCount === 1 ? 'волонтёр помог' : 'волонтёра помогли'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.reportCard}>
          <View style={styles.reportIcon}>
            <Icon name="document" size={18} color="#8B5E10" strokeWidth={2} />
          </View>
          <View style={styles.reportBody}>
            <Text style={styles.reportTitle}>Отчёт ещё не составлен</Text>
            <Text style={styles.reportText}>
              Расскажите коротко, как всё прошло. До конца дня — без напоминания, после — придёт
              уведомление.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Кто помогал · {participants.length} человека</Text>
        <View style={[styles.listCard, shadowSm]}>
          {participants.map((person, index) => (
            <View
              key={person.id}
              style={[styles.personRow, index < participants.length - 1 && styles.personRowBorder]}
            >
              <Avatar name={person.name} size={36} />
              <Text style={styles.personName}>{person.name}</Text>
              <Chip
                size="sm"
                kind={person.finished ? 'success' : 'warning'}
                label={person.finished ? 'был до конца' : 'ушёл раньше'}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          kind="primary"
          size="lg"
          full
          iconRight="arrowR"
          onPress={() =>
            navigation.navigate('BeneficiaryReport', {
              helpRequestId,
            })
          }
        >
          Составить отчёт
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  successCard: {
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
  },
  successDecor: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    opacity: 0.12,
  },
  successBody: { position: 'relative', zIndex: 1 },
  successMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  successMeta: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  successTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 24,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  reportCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: T.warningSoft,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${T.warning}22`,
    padding: 14,
    marginBottom: 14,
  },
  reportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportBody: { flex: 1, minWidth: 0 },
  reportTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#7A5210',
  },
  reportText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#7A5210',
    marginTop: 4,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 10,
  },
  listCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  personRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  personName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
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
