import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ProfileCard,
  ProfileContactRow,
  ProfileEditableRow,
  ProfileIdentityCard,
  ProfileMenuRow,
  ProfileSectionHeader,
  ProfileVerificationCard,
} from '../../components/beneficiary/profile/ProfileParts';
import { BottomNav, TabId } from '../../components/BottomNav';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { useVolunteerProfile } from '../../hooks/useVolunteerProfile';
import { useFeedback } from '../../providers/FeedbackProvider';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ProfileVerificationStatus } from '../../types/profileVerification';
import {
  resolveProfileVerificationPreview,
  resolveVolunteerProfileView,
} from '../../utils/resolveProfileView';
import { T, CARD_BG } from '../../theme/tokens';

type Props = {
  activeTab?: TabId;
  onTabPress?: (tab: TabId) => void;
  onLogout?: () => void;
  onOpenNotifications?: () => void;
  onOpenWatched?: () => void;
  onEditCity?: () => void;
  onOpenVerification?: (status: ProfileVerificationStatus) => void;
  onStartVerification?: () => void;
};

export function VolunteerProfileScreen({
  activeTab = 'profile',
  onTabPress,
  onLogout,
  onOpenNotifications,
  onOpenWatched,
  onEditCity,
  onOpenVerification,
  onStartVerification,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showConfirm } = useFeedback();
  const profile = useVolunteerProfile();
  const view = useMemo(() => resolveVolunteerProfileView(profile), [profile]);

  useFocusEffect(
    useCallback(() => {
      void profile.reload();
    }, [profile.reload]),
  );

  const verificationStatus = view.verificationStatus;
  const verificationPreview = resolveProfileVerificationPreview(
    verificationStatus,
    view.verificationDate,
    view.verificationReason,
  );

  const openVerification = () => {
    if (verificationStatus === 'none') {
      onStartVerification?.();
      return;
    }
    onOpenVerification?.(verificationStatus);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Мой профиль"
        right={
          <Pressable style={styles.settingsBtn} hitSlop={8}>
            <Icon name="settings" size={18} color={T.ink2} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={profile.loading} onRefresh={() => void profile.reload()} />
        }
      >
        {view.loading ? (
          <View style={styles.verifLoading}>
            <ActivityIndicator color={T.primary} size="small" />
          </View>
        ) : null}

        {view.error ? <Text style={styles.errorText}>{view.error}</Text> : null}

        {!view.loading ? (
          <ProfileIdentityCard
            avatarName={view.avatarName}
            displayName={view.displayName}
            roleLabel={view.roleLabel}
            subtitle={view.subtitle}
            roleIcon="handshake"
            roleChipVariant="primary"
            avatarRing={T.primary}
            cameraBadgeColor={T.primary}
            stats={view.stats}
          />
        ) : null}

        <ProfileVerificationCard
          key={verificationStatus}
          status={verificationStatus}
          date={verificationPreview.date}
          reason={verificationPreview.reason}
          onPress={openVerification}
          onActionPress={
            verificationStatus === 'none' ||
            verificationStatus === 'rejected' ||
            verificationStatus === 'revoked'
              ? onStartVerification
              : openVerification
          }
        />

        <ProfileSectionHeader title="Личные данные" />
        <ProfileCard>
          {view.personalRows.map((row, index) => (
            <ProfileEditableRow
              key={row.label}
              label={row.label}
              value={row.value}
              hint={row.hint}
              locked={row.locked}
              last={index === view.personalRows.length - 1}
              onPress={row.label === 'Город' && !row.locked ? onEditCity : undefined}
            />
          ))}
        </ProfileCard>

        <View style={styles.lockHint}>
          <Icon name="info" size={13} color={T.muted} />
          <Text style={styles.lockHintText}>
            Поля с замком меняются только через повторную верификацию.
          </Text>
        </View>

        <ProfileSectionHeader title="Контакты для связи" action="Изменить" />
        <ProfileCard>
          {view.contacts.length ? (
            view.contacts.map((contact, index) => (
              <ProfileContactRow
                key={`${contact.name}-${contact.value}`}
                emoji={contact.emoji}
                name={contact.name}
                value={contact.value}
                main={contact.main}
                last={index === view.contacts.length - 1}
              />
            ))
          ) : (
            <ProfileContactRow emoji="💬" name="Контакты" value="Не указаны" last />
          )}
        </ProfileCard>

        <ProfileCard>
          {view.menu.map((item, index) => (
            <ProfileMenuRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              sub={item.sub}
              color={item.color}
              last={index === view.menu.length - 1}
              onPress={
                item.label === 'Избранное'
                  ? onOpenWatched
                  : item.label === 'Уведомления'
                    ? onOpenNotifications
                    : undefined
              }
            />
          ))}
        </ProfileCard>

        <Button
          kind="ghost"
          size="md"
          icon="logout"
          labelColor={T.danger}
          onPress={() =>
            showConfirm({
              title: 'Выйти из аккаунта?',
              message: 'Потребуется снова ввести телефон и пароль для входа.',
              confirmLabel: 'Выйти',
              cancelLabel: 'Остаться',
              onConfirm: () => onLogout?.(),
            })
          }
        >
          Выйти из аккаунта
        </Button>
      </ScrollView>

      <BottomNav active={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  lockHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  lockHintText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 15,
  },
  verifLoading: {
    alignItems: 'center',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    marginBottom: 12,
  },
});
