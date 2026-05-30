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
  verificationActiveStyles,
} from '../../../components/verification/VerificationActiveParts';
import { getMyContactChannels } from '../../../api/volunteers';
import { useVerificationStatus } from '../../../hooks/useVerificationStatus';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { ProfileVerificationStatus } from '../../../types/profileVerification';
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
} from '../../../utils/verificationActivePreview';
import { loadVerificationPreferredContact } from '../../../utils/volunteerVerifStorage';
import {
  BENEFICIARY_VERIF_ACTIVE,
  BENEFICIARY_VERIF_NONE,
} from './beneficiaryVerificationConfig';
import { T } from '../../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryVerifActive'>;
  route: RouteProp<RootStackParamList, 'BeneficiaryVerifActive'>;
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

export function BeneficiaryVerifActiveScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { status: apiStatus, attempt, loading, reload } = useVerificationStatus();
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
        const channels = await getMyContactChannels();
        setContactRows(buildContactRowsFromChannels(channels, preferredFallback));
      } catch {
        setContactRows([]);
      }
    })();
  }, [attempt?.id]);

  const status: ProfileVerificationStatus =
    route.params?.status && route.params.status !== 'none' ? route.params.status : apiStatus;

  const isNone = status === 'none';
  const config = isNone ? BENEFICIARY_VERIF_NONE : BENEFICIARY_VERIF_ACTIVE[status];

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
        role: 'beneficiary',
        attempt,
        skillCatalog: [],
        contactRows,
      }),
    [attempt, contactRows],
  );

  const hasDocumentPhotos = hasVerificationPhotoContent(
    sections.documentPhotos,
    sections.documentPreviewPhotos,
  );
  const hasCategoryPhotos = hasVerificationPhotoContent(
    sections.categoryPhotos,
    sections.categoryPreviewPhotos,
  );
  const hasCategoryBlock = sections.categoryRows.length > 0 || hasCategoryPhotos;

  const openViewer = (photos: AttemptPhotoItem[], index: number) => {
    const items = toViewerItems(photos);
    if (!items.length) return;
    setViewerItems(items);
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const startFlow = () => {
    if (displayConfig.btnDisabled) return;
    navigation.navigate('BeneficiaryVerifCategory');
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

            {hasCategoryBlock ? (
              <VerificationActiveCard>
                <VerificationActiveBlockTitle>Категория получателя</VerificationActiveBlockTitle>
                {sections.categoryRows.map((row, index) => (
                  <VerificationActiveRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    last={index === sections.categoryRows.length - 1 && !hasCategoryPhotos}
                  />
                ))}
                {hasCategoryPhotos ? (
                  <VerificationActivePhotoGrid
                    attemptPhotos={sections.categoryPhotos}
                    previewPhotos={sections.categoryPreviewPhotos}
                    allowPreview={sections.usePreview}
                    onPhotoPress={(index) => openViewer(sections.categoryPhotos, index)}
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
              '· Документы категории получателя',
              '· Контакты для связи с волонтёрами',
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
        onPress={startFlow}
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
