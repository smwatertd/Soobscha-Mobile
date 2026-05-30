import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Avatar } from '../../components/Avatar';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import {
  ProfileCard,
  ProfileContactRow,
  ProfileIdentityCard,
  ProfileSectionHeader,
} from '../../components/beneficiary/profile/ProfileParts';
import { VisitorHelpRequestRow } from '../../components/visitor/VisitorHelpRequestRow';
import { useFeedback } from '../../providers/FeedbackProvider';
import { useVisitorBeneficiaryProfile } from '../../hooks/useVisitorBeneficiaryProfile';
import { useVisitorVolunteerProfile } from '../../hooks/useVisitorVolunteerProfile';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { openPublicProfileContact } from '../../utils/openPublicProfileContact';
import { VolunteerFeedItem } from '../volunteer/volunteerFeedTypes';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

const PREVIEW_LIMIT = 4;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VisitorProfile'>;
  route: RouteProp<RootStackParamList, 'VisitorProfile'>;
};

export function VisitorProfileScreen({ navigation, route }: Props) {
  const { userId, displayName, role = 'volunteer' } = route.params;

  if (role === 'beneficiary') {
    return <VisitorBeneficiaryProfile navigation={navigation} userId={userId} displayName={displayName} />;
  }

  return <VisitorVolunteerProfile navigation={navigation} userId={userId} displayName={displayName} />;
}

function VisitorBeneficiaryProfile({
  navigation,
  userId,
  displayName,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VisitorProfile'>;
  userId: string;
  displayName?: string;
}) {
  const insets = useSafeAreaInsets();
  const { showSnack } = useFeedback();
  const {
    profile,
    displayName: name,
    categoryLabel,
    contactRows,
    stats,
    buckets,
    loading,
    refreshing,
    error,
    reload,
  } = useVisitorBeneficiaryProfile(userId, displayName);

  const subtitleParts: string[] = [];
  if (profile?.age != null) subtitleParts.push(`${profile.age} лет`);
  if (profile?.city) subtitleParts.push(profile.city);
  const subtitle = subtitleParts.join(' · ');

  const openRequest = (item: VolunteerFeedItem) => {
    navigation.navigate('HelpRequestDetail', { helpRequestId: item.id });
  };

  const openAllRequests = (tab: 'active' | 'completed') => {
    navigation.navigate('VisitorBeneficiaryRequests', {
      userId,
      displayName: name,
      initialTab: tab,
    });
  };

  const handleContactPress = (index: number) => {
    const channel = profile?.contactChannels[index];
    if (!channel) return;
    void openPublicProfileContact(channel.type, channel.value).then((ok) => {
      if (!ok) showSnack('Не удалось открыть контакт');
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Профиль благополучателя" onBack={() => navigation.goBack()} />

      {loading && !profile ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.accent} size="large" />
        </View>
      ) : error && !profile ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void reload()}>
            <Text style={styles.retry}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void reload()} tintColor={T.accent} />
          }
        >
          <ProfileIdentityCard
            avatarName={name}
            displayName={name}
            roleLabel="Благополучатель"
            categoryLabel={categoryLabel ?? undefined}
            subtitle={subtitle || undefined}
            roleIcon="heart"
            avatarRing={T.accent}
            roleChipVariant="accent"
            showCameraBadge={false}
            stats={stats}
          />

          {profile?.isVerified ? (
            <View style={[styles.infoCard, shadowSm]}>
              <View style={styles.infoRow}>
                <Icon name="shield" size={16} color={T.success} strokeWidth={2.2} />
                <Text style={styles.infoText}>Верифицированный профиль</Text>
              </View>
            </View>
          ) : null}

          {contactRows.length > 0 ? (
            <>
              <ProfileSectionHeader title="Связаться" />
              <ProfileCard>
                {contactRows.map((row, index) => (
                  <Pressable key={`${row.name}-${index}`} onPress={() => handleContactPress(index)}>
                    <ProfileContactRow
                      emoji={row.emoji}
                      name={row.name}
                      value={row.value}
                      main={row.main}
                      last={index === contactRows.length - 1}
                    />
                  </Pressable>
                ))}
              </ProfileCard>
            </>
          ) : null}

          <ProfileSectionHeader
            title="Активные заявки"
            action={buckets.active.length > PREVIEW_LIMIT ? 'Все' : undefined}
            onActionPress={() => openAllRequests('active')}
          />
          {buckets.active.length === 0 ? (
            <Text style={styles.sectionHint}>Сейчас нет активных заявок</Text>
          ) : (
            <ProfileCard>
              {buckets.active.slice(0, PREVIEW_LIMIT).map((item, index, arr) => (
                <VisitorHelpRequestRow
                  key={item.id}
                  item={item}
                  variant="list"
                  last={index === arr.length - 1}
                  onPress={() => openRequest(item)}
                />
              ))}
            </ProfileCard>
          )}

          <ProfileSectionHeader
            title="Завершённые"
            action={buckets.completed.length > PREVIEW_LIMIT ? 'Все' : undefined}
            onActionPress={() => openAllRequests('completed')}
          />
          {buckets.completed.length === 0 ? (
            <Text style={styles.sectionHint}>Завершённых заявок пока нет</Text>
          ) : (
            <ProfileCard>
              {buckets.completed.slice(0, PREVIEW_LIMIT).map((item, index, arr) => (
                <VisitorHelpRequestRow
                  key={item.id}
                  item={item}
                  variant="list"
                  last={index === arr.length - 1}
                  onPress={() => openRequest(item)}
                />
              ))}
            </ProfileCard>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function VisitorVolunteerProfile({
  navigation,
  userId,
  displayName,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VisitorProfile'>;
  userId: string;
  displayName?: string;
}) {
  const insets = useSafeAreaInsets();
  const { profile, displayName: name, contactRows, skillList, loading, error, reload } =
    useVisitorVolunteerProfile(userId, displayName);
  const { showSnack } = useFeedback();

  const subtitleParts: string[] = [];
  if (profile?.age != null) subtitleParts.push(`${profile.age} лет`);
  if (profile?.city) subtitleParts.push(profile.city);

  const handleContactPress = (index: number) => {
    const channel = profile?.contactChannels[index];
    if (!channel) return;
    void openPublicProfileContact(channel.type, channel.value).then((ok) => {
      if (!ok) showSnack('Не удалось открыть контакт');
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Профиль волонтёра" onBack={() => navigation.goBack()} />

      {loading && !profile ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      ) : error && !profile ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void reload()}>
            <Text style={styles.retry}>Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
          <View style={[styles.identityCard, shadowSm]}>
            <Avatar name={name} size={72} ring={T.primary} />
            <View style={styles.identityBody}>
              <Text style={styles.displayName}>{name}</Text>
              <Chip kind="primary" size="sm" icon="handshake" label="Волонтёр" />
              {subtitleParts.length ? (
                <Text style={styles.memberSince}>{subtitleParts.join(' · ')}</Text>
              ) : null}
            </View>
          </View>

          {profile?.isVerified ? (
            <View style={[styles.infoCard, shadowSm]}>
              <View style={styles.infoRow}>
                <Icon name="shield" size={16} color={T.success} strokeWidth={2.2} />
                <Text style={styles.infoText}>Верифицированный профиль</Text>
              </View>
            </View>
          ) : null}

          {skillList.length > 0 ? (
            <>
              <ProfileSectionHeader title="Навыки" />
              <View style={styles.skillsWrap}>
                {skillList.map((skill) => (
                  <Chip key={skill} label={skill} size="sm" />
                ))}
              </View>
            </>
          ) : null}

          {contactRows.length > 0 ? (
            <>
              <ProfileSectionHeader title="Связаться" />
              <ProfileCard>
                {contactRows.map((row, index) => (
                  <Pressable key={`${row.name}-${index}`} onPress={() => handleContactPress(index)}>
                    <ProfileContactRow
                      emoji={row.emoji}
                      name={row.name}
                      value={row.value}
                      main={row.main}
                      last={index === contactRows.length - 1}
                    />
                  </Pressable>
                ))}
              </ProfileCard>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
  retry: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
  identityCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 14,
  },
  identityBody: { flex: 1, gap: 6 },
  displayName: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.3,
  },
  memberSince: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  infoCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 13, fontFamily: 'Manrope_500Medium', color: T.ink2 },
  sectionHint: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
});
