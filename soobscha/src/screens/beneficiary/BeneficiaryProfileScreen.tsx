import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeneficiaryBottomNav, BeneficiaryTabId } from '../../components/beneficiary/BeneficiaryBottomNav';
import {
  ProfileCard,
  ProfileContactRow,
  ProfileEditableRow,
  ProfileIdentityCard,
  ProfileMenuRow,
  ProfileSectionHeader,
  ProfileVerificationCard,
} from '../../components/beneficiary/profile/ProfileParts';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { useBeneficiaryProfile } from '../../hooks/useBeneficiaryProfile';
import { useFeedback } from '../../providers/FeedbackProvider';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ProfileVerificationStatus } from '../../types/profileVerification';
import {
  resolveBeneficiaryProfileView,
  resolveProfileVerificationPreview,
} from '../../utils/resolveProfileView';
import { T, CARD_BG } from '../../theme/tokens';

type Props = {
  activeTab?: BeneficiaryTabId;
  onTabPress?: (tab: BeneficiaryTabId) => void;
  unreadCount?: number;
  onLogout?: () => void;
  onEditCity?: () => void;
  onOpenVerification?: (status: ProfileVerificationStatus) => void;
  onStartVerification?: () => void;
};

export function BeneficiaryProfileScreen({
  activeTab = 'profile',
  onTabPress,
  unreadCount = 0,
  onLogout,
  onEditCity,
  onOpenVerification,
  onStartVerification,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showConfirm } = useFeedback();
  const profile = useBeneficiaryProfile();
  const view = useMemo(() => resolveBeneficiaryProfileView(profile), [profile]);

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

  const startVerification = () => {
    onStartVerification?.();
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
      >
        {view.loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={T.primary} size="small" />
          </View>
        ) : null}

        {view.error ? <Text style={styles.errorText}>{view.error}</Text> : null}

        {!view.loading ? (
          <ProfileIdentityCard
            avatarName={view.avatarName}
            displayName={view.displayName}
            roleLabel={view.roleLabel}
            categoryLabel={view.categoryLabel ?? undefined}
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
              ? startVerification
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

        {view.categoryRows.length ? (
          <>
            <ProfileSectionHeader title="Категория получателя" />
            <ProfileCard>
              {view.categoryRows.map((row, index) => (
                <ProfileEditableRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  locked={row.locked}
                  last={index === view.categoryRows.length - 1}
                />
              ))}
            </ProfileCard>
          </>
        ) : null}

        <ProfileSectionHeader title="Получение средств" action="История" />
        <ProfileCard>
          {view.defaultPayout ? (
            <ProfileMenuRow
              icon="wallet"
              label={view.defaultPayout.display_name}
              sub={view.defaultPayout.is_default ? 'Основная' : undefined}
              color={T.success}
            />
          ) : null}
          <ProfileMenuRow icon="plus" label="Добавить счёт или карту" color={T.muted} last />
        </ProfileCard>

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

      <BeneficiaryBottomNav
        active={activeTab}
        onTabPress={onTabPress}
        notificationsUnread={unreadCount}
      />
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
  loadingWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    marginBottom: 12,
  },
});
