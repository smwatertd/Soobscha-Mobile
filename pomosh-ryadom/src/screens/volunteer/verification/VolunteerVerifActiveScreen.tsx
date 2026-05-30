import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MediaFullscreenViewer, MediaViewerItem } from '../../../components/media/MediaFullscreenViewer';
import { ScreenHeader } from '../../../components/ScreenHeader';
import {
  VerificationActiveBanner,
  VerificationActiveBlockTitle,
  VerificationActiveCard,
  VerificationActiveContactRow,
  VerificationActiveEmptyState,
  VerificationActiveFooter,
  VerificationActivePhotoGrid,
  VerificationActiveReasonCard,
  VerificationActiveRow,
  VerificationActiveSectionTitle,
  VerificationActiveSkillsContent,
  verificationActiveStyles,
} from '../../../components/verification/VerificationActiveParts';
import { getMyContactChannels } from '../../../api/volunteers';
import {
  ensureSkillCatalogLoaded,
  getVolunteerSkillCatalogItems,
} from '../../../services/skillCatalog';
import { useVolunteerVerificationStatus } from '../../../hooks/useVolunteerVerificationStatus';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { ProfileVerificationStatus } from '../../../types/profileVerification';
import {
  VOLUNTEER_VERIF_ACTIVE,
  VOLUNTEER_VERIF_NONE,
} from './volunteerVerificationConfig';
import {
  AttemptPhotoItem,
  attemptReasonAuthor,
  attemptReasonText,
  attemptStatusSubtitle,
  readPreferredContactType,
} from '../../../utils/verificationAttemptView';
import {
  buildContactRowsFromChannels,
  hasVerificationPhotoContent,
  resolveVerificationActiveSections,
  verificationActiveSkillPhotosPreview,
} from '../../../utils/verificationActivePreview';
import { useVolunteerVerifDraft } from '../../../providers/VolunteerVerifDraftProvider';
import { loadVerificationPreferredContact } from '../../../utils/volunteerVerifStorage';
import { T } from '../../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerVerifActive'>;
  route: RouteProp<RootStackParamList, 'VolunteerVerifActive'>;
};

function toViewerItems(photos: AttemptPhotoItem[]): MediaViewerItem[] {
  return photos
    .filter((photo) => photo.uri)
    .map((photo) => ({
      id: photo.id,
      uri: photo.uri,
      fileName: photo.caption,
      contentType: photo.contentType,
      caption: photo.caption,
    }));
}

export function VolunteerVerifActiveScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { status: apiStatus, attempt, loading, reload } = useVolunteerVerificationStatus();
  const { loadDraftForUpdate, resetDraft, reload: reloadDraft } = useVolunteerVerifDraft();
  const [preparingUpdate, setPreparingUpdate] = useState(false);
  const [skillCatalog, setSkillCatalog] = useState(() => getVolunteerSkillCatalogItems());
  const [contactRows, setContactRows] = useState<ReturnType<typeof buildContactRowsFromChannels>>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerItems, setViewerItems] = useState<MediaViewerItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!attempt) return;

    void (async () => {
      const preferredFromAttempt = readPreferredContactType(attempt);
      const preferredFallback = preferredFromAttempt ?? (await loadVerificationPreferredContact());

      try {
        const [catalog, channels] = await Promise.all([
          ensureSkillCatalogLoaded(),
          getMyContactChannels(),
        ]);
        setSkillCatalog(catalog);
        setContactRows(buildContactRowsFromChannels(channels, preferredFallback));
      } catch {
        setSkillCatalog(getVolunteerSkillCatalogItems());
      }
    })();
  }, [attempt?.id]);

  const status: ProfileVerificationStatus =
    route.params?.status && route.params.status !== 'none' ? route.params.status : apiStatus;

  const isNone = status === 'none';
  const config = isNone ? VOLUNTEER_VERIF_NONE : VOLUNTEER_VERIF_ACTIVE[status];

  const displayConfig = useMemo(() => {
    if (isNone) return config;
    return {
      ...config,
      sub: attempt ? (attemptStatusSubtitle(attempt) ?? config.sub) : config.sub,
      reasonText: attempt ? (attemptReasonText(attempt) ?? config.reasonText) : config.reasonText,
      reasonAuthor: attempt ? (attemptReasonAuthor(attempt) ?? config.reasonAuthor) : config.reasonAuthor,
    };
  }, [attempt, config, isNone]);

  const sections = useMemo(
    () =>
      resolveVerificationActiveSections({
        role: 'volunteer',
        attempt,
        skillCatalog,
        contactRows,
      }),
    [attempt, contactRows, skillCatalog],
  );

  const skillsView = sections.skillsView;
  const skillPhotos = skillsView?.photoItems.filter((photo) => photo.uri) ?? [];
  const skillPhotosPreview = verificationActiveSkillPhotosPreview(skillsView, sections.usePreview);
  const hasDocumentPhotos = hasVerificationPhotoContent(
    sections.documentPhotos,
    sections.documentPreviewPhotos,
  );
  const hasSkillPhotos = hasVerificationPhotoContent(skillPhotos, skillPhotosPreview);
  const hasSkillsBlock = Boolean(skillsView?.totalCount || hasSkillPhotos);

  const openViewer = (photos: AttemptPhotoItem[], index: number) => {
    const items = toViewerItems(photos);
    if (!items.length) return;
    setViewerItems(items);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const startUpdate = async () => {
    if (displayConfig.btnDisabled) return;

    if (isNone || !attempt) {
      resetDraft();
      await reloadDraft();
      navigation.navigate('VolunteerVerifGeneral');
      return;
    }

    setPreparingUpdate(true);
    try {
      await loadDraftForUpdate(attempt);
      navigation.navigate('VolunteerVerifGeneral');
    } finally {
      setPreparingUpdate(false);
    }
  };

  const footerSpace = insets.bottom + (displayConfig.hint ? 132 : 108);

  if (loading && !attempt && !isNone) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Моя верификация" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[verificationActiveStyles.scrollContent, { paddingBottom: footerSpace }]}
        showsVerticalScrollIndicator={false}
      >
        <VerificationActiveBanner config={displayConfig} />
        <VerificationActiveReasonCard status={status} config={displayConfig} />

        {!isNone ? (
          <>
            <VerificationActiveSectionTitle title="Отправленные данные" />

            {sections.personalRows.length ? (
              <VerificationActiveCard>
                <VerificationActiveBlockTitle>Личные данные</VerificationActiveBlockTitle>
                {sections.personalRows.map((row, index) => (
                  <VerificationActiveRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    last={index === sections.personalRows.length - 1}
                  />
                ))}
              </VerificationActiveCard>
            ) : null}

            {hasDocumentPhotos ? (
              <VerificationActiveCard>
                <VerificationActiveBlockTitle
                  suffix={
                    sections.documentPhotos.length || sections.documentPreviewPhotos.length
                  }
                >
                  Фото документов
                </VerificationActiveBlockTitle>
                <VerificationActivePhotoGrid
                  attemptPhotos={sections.documentPhotos}
                  previewPhotos={sections.documentPreviewPhotos}
                  allowPreview={sections.usePreview}
                  onPhotoPress={(index) => openViewer(sections.documentPhotos, index)}
                />
              </VerificationActiveCard>
            ) : null}

            {hasSkillsBlock ? (
              <VerificationActiveCard>
                <VerificationActiveBlockTitle suffix={skillsView?.totalCount}>
                  Навыки
                </VerificationActiveBlockTitle>
                {skillsView ? (
                  <VerificationActiveSkillsContent
                    simpleLabels={skillsView.simpleLabels}
                    documentedLabels={skillsView.documentedLabels}
                  />
                ) : null}
                {hasSkillPhotos ? (
                  <VerificationActivePhotoGrid
                    attemptPhotos={skillPhotos}
                    previewPhotos={skillPhotosPreview}
                    allowPreview={sections.usePreview}
                    onPhotoPress={(index) => openViewer(skillPhotos, index)}
                  />
                ) : null}
              </VerificationActiveCard>
            ) : null}

            {sections.contactRows.length ? (
              <VerificationActiveCard last>
                <VerificationActiveBlockTitle>Контакты для связи</VerificationActiveBlockTitle>
                {sections.contactRows.map((row, index) => (
                  <VerificationActiveContactRow
                    key={`${row.type}-${row.label}`}
                    label={row.label}
                    value={row.value}
                    isPrimary={row.isPrimary}
                    last={index === sections.contactRows.length - 1}
                  />
                ))}
              </VerificationActiveCard>
            ) : null}
          </>
        ) : (
          <VerificationActiveEmptyState
            items={[
              '· Паспорт и селфи с документом',
              '· Контакты для связи с благополучателями',
              '· Навыки и подтверждающие материалы',
            ]}
          />
        )}
      </ScrollView>

      <VerificationActiveFooter
        bottomInset={insets.bottom}
        btnLabel={displayConfig.btnLabel}
        btnIcon={isNone ? 'plus' : 'edit'}
        btnDisabled={displayConfig.btnDisabled}
        hint={displayConfig.hint}
        loading={preparingUpdate}
        onPress={() => void startUpdate()}
      />

      <MediaFullscreenViewer
        visible={viewerVisible}
        items={viewerItems}
        initialIndex={viewerIndex}
        subtitle="Документы верификации"
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
});
