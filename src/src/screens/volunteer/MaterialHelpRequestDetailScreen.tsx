import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { HelpRequestLocationPreview } from '../../components/beneficiary/create/HelpRequestLocationPreview';
import { HelpRequestLocationMapModal } from '../../components/map/HelpRequestLocationMapModal';
import { openMapRoute } from '../../integrations/yandex/mapNavigation';
import { formatDisplayLocation } from '../../navigation/createHelpRequestTypes';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHelpRequestById } from '../../api/helpRequests';
import { getHelpRequestReport, ReportDetailsResponse } from '../../api/reports';
import { HelpRequestDetail } from '../../api/integrationTypes';
import { getMaterialDonations, DonationWithDonor } from '../../api/donations';
import { HelpRequestDetailMediaSection } from '../../components/beneficiary/detail/HelpRequestDetailMediaSection';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { BeneficiaryCategoryChip } from '../../components/BeneficiaryCategoryChip';
import { HelpRequestCategoryChip } from '../../components/HelpRequestCategoryChip';
import { HelpRequestTypeChip } from '../../components/HelpRequestTypeChip';
import { Icon } from '../../components/Icon';
import { MediaFullscreenViewer } from '../../components/media/MediaFullscreenViewer';
import { ProgressBar } from '../../components/ProgressBar';
import { HelpRequestDetailChipsRow } from '../../components/volunteer/HelpRequestDetailChipsRow';
import { HelpRequestHeroTopActions } from '../../components/volunteer/HelpRequestHeroTopActions';
import { HelpRequestReportPreviewCard } from '../../components/volunteer/HelpRequestReportPreviewCard';
import { VolunteerSectionHeader } from '../../components/volunteer/VolunteerDetailParts';
import { useHelpRequestCategoryLabels } from '../../hooks/useHelpRequestCategoryLabels';
import { HELP_REQUEST_DETAIL_HERO_HEIGHT } from '../../constants/helpRequestDetailLayout';
import { useHelpRequestBeneficiaryCategory } from '../../hooks/useHelpRequestBeneficiaryCategory';
import { useHelpRequestBeneficiaryName } from '../../hooks/useHelpRequestBeneficiaryName';
import { useHelpRequestWatch } from '../../hooks/useHelpRequestWatch';
import { useFeedback } from '../../providers/FeedbackProvider';
import { readHelpRequestIsWatched } from '../../utils/helpRequestWatch';
import { BeneficiaryReportViewModel } from '../../utils/beneficiaryReportViewModel';
import { resolveVolunteerReportPreview } from '../../utils/volunteerHelpRequestReport';
import { formatKopeksRub } from '../../utils/formatMoney';
import {
  parseHelpRequestMediaFiles,
  splitHelpRequestMedia,
} from '../../utils/parseHelpRequestMediaFiles';
import { RADIUS, T, shadowSm } from '../../theme/tokens';

type Props = {
  helpRequestId: string;
  onBack: () => void;
  onDonate: (params: { helpRequestId: string; title: string; recipient: string }) => void;
  onOpenVisitorProfile?: (params: {
    userId: string;
    displayName?: string;
    role?: 'volunteer' | 'beneficiary';
  }) => void;
  onOpenReport?: (params: {
    helpRequestId: string;
    title: string;
    isMaterial?: boolean;
  }) => void;
};

export function MaterialHelpRequestDetailScreen({
  helpRequestId,
  onBack,
  onDonate,
  onOpenVisitorProfile,
  onOpenReport,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showError } = useFeedback();
  const [request, setRequest] = useState<HelpRequestDetail | null>(null);
  const [donations, setDonations] = useState<DonationWithDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [locationMapVisible, setLocationMapVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [reportRaw, setReportRaw] = useState<ReportDetailsResponse | null>(null);
  const { resolveCategoryLabel } = useHelpRequestCategoryLabels();
  const apiWatched = request ? readHelpRequestIsWatched(request) : false;
  const { watched, toggling: watchToggling, toggleWatch } = useHelpRequestWatch(
    helpRequestId,
    apiWatched,
  );

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await getHelpRequestById(helpRequestId);
      if (data.type !== 'MATERIAL') {
        throw new Error('Это не материальная заявка');
      }
      setRequest(data);
      const recent = await getMaterialDonations(helpRequestId).catch(() => []);
      setDonations(recent.slice(0, 5));
      if (data.status === 'COMPLETED') {
        void getHelpRequestReport(helpRequestId)
          .then(setReportRaw)
          .catch(() => setReportRaw(null));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Не удалось загрузить заявку'));
    } finally {
      if (mode === 'initial') setLoading(false);
      else setRefreshing(false);
    }
  }, [helpRequestId]);

  const handleRefresh = useCallback(() => {
    void load('refresh');
  }, [load]);

  useEffect(() => {
    void load('initial');
    setHeroSlideIndex(0);
  }, [load]);

  const handleToggleWatch = () => {
    void toggleWatch().catch((err) => {
      showError(err instanceof Error ? err.message : 'Не удалось обновить избранное');
    });
  };

  const financials = useMemo(() => {
    const f = request?.financials;
    const goalKopeks =
      f?.requested_kopeks ??
      f?.amount_requested_kopeks ??
      request?.amount_requested_kopeks ??
      0;
    const collectedKopeks =
      f?.collected_kopeks ?? f?.amount_collected_kopeks ?? request?.amount_collected_kopeks ?? 0;
    return { goalKopeks, collectedKopeks };
  }, [request]);

  const pct =
    financials.goalKopeks > 0
      ? Math.min(100, (financials.collectedKopeks / financials.goalKopeks) * 100)
      : 0;

  const isDone = request?.status === 'COMPLETED';

  useEffect(() => {
    if (!isDone) {
      setReportRaw(null);
      return;
    }
    void getHelpRequestReport(helpRequestId)
      .then(setReportRaw)
      .catch(() => setReportRaw(null));
  }, [helpRequestId, isDone]);

  const reportPreview: BeneficiaryReportViewModel | null = useMemo(
    () => resolveVolunteerReportPreview(helpRequestId, true, isDone ? reportRaw : null),
    [helpRequestId, isDone, reportRaw],
  );

  const handleOpenReport = useCallback(() => {
    if (!request || !onOpenReport) return;
    const title = typeof request.title === 'string' ? request.title : 'Материальная заявка';
    onOpenReport({ helpRequestId, title, isMaterial: true });
  }, [helpRequestId, onOpenReport, request]);

  const done = request?.status === 'COMPLETED';
  const previewFinancials = {
    ...financials,
    pct: done ? 100 : pct,
    canDonate: !done && request?.status === 'COLLECTING_FUNDS',
    closed: request?.status === 'CANCELLED' || request?.status === 'INTERRUPTED',
    isDone: done,
  };

  const showDone = isDone || previewFinancials.isDone;

  const { code: beneficiaryCategoryCode, label: beneficiaryCategory } =
    useHelpRequestBeneficiaryCategory(request?.beneficiary, request?.beneficiary_user_id);
  const beneficiaryName = useHelpRequestBeneficiaryName(
    request?.beneficiary,
    request?.beneficiary_user_id,
  );

  const showLoading = loading;
  const showErrorState = Boolean(error || !request);

  if (showLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.accent} size="large" />
      </View>
    );
  }

  if (showErrorState || !request) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>
          {error?.message ?? 'Заявка не найдена'}
        </Text>
        <Pressable onPress={() => void load('initial')}>
          <Text style={styles.retry}>Повторить</Text>
        </Pressable>
        <Pressable onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={styles.retry}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  const city = (request.beneficiary as { city?: string } | undefined)?.city;
  const locationLabel = request.address_text
    ? formatDisplayLocation(request.place_name || request.address_text)
    : city ?? null;
  const mapPoint =
    request.latitude != null && request.longitude != null
      ? { latitude: request.latitude, longitude: request.longitude }
      : null;
  const title = typeof request.title === 'string' ? request.title : 'Материальная заявка';
  const description = typeof request.description === 'string' ? request.description : '';
  const categoryLabel = resolveCategoryLabel(request.category);
  const mediaItems = parseHelpRequestMediaFiles(request.media_files);
  const { images, documents } = splitHelpRequestMedia(mediaItems);
  const fileCount = mediaItems.length;
  const donorsCount = request.donations?.count ?? donations.length;

  const handleOpenMap = () => {
    if (!mapPoint) return;
    setLocationMapVisible(true);
  };

  const handleOpenRoute = () => {
    if (!mapPoint) return;
    void openMapRoute(mapPoint, {
      label: locationLabel ?? request.address_text ?? title,
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title}\n\nЗаявка в приложении «Сообща»`,
      });
    } catch {
      // отмена шаринга
    }
  };

  const progressAccent = showDone ? T.success : T.accent;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.heroMedia}>
        <View style={styles.heroAccentTint} pointerEvents="none" />
        {showDone ? <View style={styles.heroDoneTint} pointerEvents="none" /> : null}
        <HelpRequestDetailMediaSection
          mediaItems={mediaItems}
          placeholderIcon="coin"
          accent={T.accent}
          rounded={false}
          heroHeight={HELP_REQUEST_DETAIL_HERO_HEIGHT}
          showDocuments={false}
          onSlideChange={setHeroSlideIndex}
          onOpenViewer={(index) => {
            setViewerIndex(index);
            setViewerOpen(true);
          }}
        />
        <View style={[styles.heroOverlay, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onBack} style={styles.heroBtn}>
            <Icon name="chevL" size={22} color="#fff" />
          </Pressable>
          <HelpRequestHeroTopActions
            photoIndex={heroSlideIndex}
            photoTotal={images.length}
            liked={watched}
            watchDisabled={watchToggling}
            onShare={() => void handleShare()}
            onToggleLike={handleToggleWatch}
          />
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primary}
            colors={[T.primary]}
          />
        }
      >
        {showDone ? (
          <View style={styles.doneBanner}>
            <View style={styles.doneBannerIcon}>
              <Icon name="check" size={20} color="#fff" strokeWidth={2.5} />
            </View>
            <View style={styles.doneBannerText}>
              <Text style={styles.doneBannerTitle}>
                Сбор завершён{' '}
                {reportPreview?.report.created_at
                  ? new Date(reportPreview.report.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                    })
                  : ''}
              </Text>
              <Text style={styles.doneBannerSub}>Деньги выплачены получателю · отчёт ниже</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.title}>{title}</Text>

        <HelpRequestDetailChipsRow>
          <HelpRequestTypeChip type="material" completed={showDone} size="sm" />
          {categoryLabel ? (
            <HelpRequestCategoryChip
              type="material"
              categoryCode={request.category ?? ''}
              label={categoryLabel}
              size="sm"
            />
          ) : null}
        </HelpRequestDetailChipsRow>

        <View style={styles.authorCard}>
          <Pressable
            style={styles.authorPressable}
            disabled={!onOpenVisitorProfile || !request.beneficiary_user_id}
            onPress={() =>
              onOpenVisitorProfile?.({
                userId: request.beneficiary_user_id,
                displayName: beneficiaryName,
                role: 'beneficiary',
              })
            }
          >
            <Avatar name={beneficiaryName} size={44} />
            <View style={styles.authorText}>
              <Text style={styles.authorCaption}>Благополучатель</Text>
              <Text style={styles.authorName}>{beneficiaryName}</Text>
              <View style={styles.authorChips}>
                {beneficiaryCategory ? (
                  <BeneficiaryCategoryChip
                    label={beneficiaryCategory}
                    code={beneficiaryCategoryCode}
                    size="sm"
                  />
                ) : null}
                <View style={styles.authorVerified}>
                  <Icon name="shield" size={12} color={T.success} strokeWidth={2.2} />
                  <Text style={styles.authorMetaText}>Верифицирован</Text>
                </View>
              </View>
            </View>
            <Icon name="chevR" size={18} color={T.primary} />
          </Pressable>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.amountRow}>
            <Text style={[styles.collected, { color: showDone ? T.success : T.accentDark }]}>
              {formatKopeksRub(previewFinancials.collectedKopeks)}
            </Text>
            <Text style={styles.goal}>из {formatKopeksRub(previewFinancials.goalKopeks)}</Text>
          </View>
          <ProgressBar
            value={previewFinancials.pct}
            max={100}
            color={progressAccent}
            bg={T.surface2}
            height={8}
          />
          <View style={styles.statsRow}>
            <Stat label="Собрано" value={`${Math.round(previewFinancials.pct)}%`} />
            <Stat label="Помогли" value={String(donorsCount)} />
          </View>
        </View>

        {mapPoint ? (
          <>
            <VolunteerSectionHeader
              title="Место получения"
              action="На карте"
              onAction={handleOpenMap}
              style={styles.sectionSpaced}
            />
            <HelpRequestLocationPreview
              point={mapPoint}
              readOnly
              onMapPress={handleOpenMap}
              addressLabel={request.address_text ?? locationLabel}
            />
          </>
        ) : city ? (
          <View style={styles.cityCard}>
            <View style={styles.cityIcon}>
              <Icon name="pin" size={20} color={T.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cityLabel}>Город получателя</Text>
              <Text style={styles.cityValue}>{city}</Text>
            </View>
          </View>
        ) : null}

        {showDone ? (
          <>
            <VolunteerSectionHeader title="Отчёт от получателя" style={styles.sectionSpaced} />
            {reportPreview ? (
              <HelpRequestReportPreviewCard
                beneficiaryName={beneficiaryName}
                submittedAt={reportPreview.report.created_at}
                description={reportPreview.description}
                photoUris={reportPreview.photos.map((p) => p.preview_url || p.url || '')}
                documents={reportPreview.documents.map((doc) => ({
                  fileName: doc.file_name ?? 'Документ',
                  url: doc.url,
                }))}
                accent="accent"
                onPress={onOpenReport ? handleOpenReport : undefined}
                onPhotoPress={(index) => {
                  setViewerIndex(index);
                  setViewerOpen(true);
                }}
              />
            ) : (
              <Text style={styles.reportHint}>
                Отчёт появится здесь после публикации. Нажмите «Открыть отчёт» внизу экрана.
              </Text>
            )}
          </>
        ) : null}

        {description ? (
          <>
            <VolunteerSectionHeader title="О заявке" style={styles.sectionSpaced} />
            <Text style={styles.description}>{description}</Text>
          </>
        ) : null}

        {fileCount > 0 ? (
          <>
            <VolunteerSectionHeader
              title="Файлы заявки"
              action={fileCount > 4 ? `Все ${fileCount}` : undefined}
              style={styles.sectionSpaced}
            />
            {images.length > 0 ? (
              <View style={styles.photoGrid}>
                {images.slice(0, 4).map((item, index) => {
                  const uri = item.previewUrl || item.url;
                  return (
                    <Pressable
                      key={item.mediaId}
                      style={[styles.photoCell, index === 0 && styles.photoCellLarge]}
                      onPress={() => {
                        setViewerIndex(index);
                        setViewerOpen(true);
                      }}
                    >
                      {uri ? (
                        <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Icon name="image" size={22} color={T.accent} />
                        </View>
                      )}
                      {index === 3 && images.length > 4 ? (
                        <View style={styles.photoMore}>
                          <Text style={styles.photoMoreText}>+{images.length - 4}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            {documents.length > 0 ? (
              <View style={[styles.filesCard, shadowSm, images.length > 0 && styles.filesCardSpaced]}>
                {documents.map((doc, index) => (
                  <Pressable
                    key={doc.mediaId}
                    style={[styles.fileRow, index < documents.length - 1 && styles.fileRowBorder]}
                    onPress={() => {
                      if (doc.url) void Linking.openURL(doc.url);
                    }}
                  >
                    <View style={styles.fileIcon}>
                      <Icon name="document" size={16} color={T.info} strokeWidth={2} />
                    </View>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {doc.fileName}
                    </Text>
                    <Icon name="chevR" size={16} color={T.muted} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        {!showDone && donations.length > 0 ? (
          <>
            <VolunteerSectionHeader
              title="Последние пожертвования"
              style={{ marginTop: 16, marginBottom: 12 }}
            />
            <View style={styles.donorsCard}>
              {donations.map((donation, index) => (
                <View
                  key={donation.id}
                  style={[styles.donorRow, index < donations.length - 1 && styles.donorRowBorder]}
                >
                  <Avatar name={donation.donor?.display_name ?? 'Аноним'} size={36} />
                  <View style={styles.donorBody}>
                    <View style={styles.donorTop}>
                      <Text style={styles.donorName}>
                        {donation.donor?.is_anonymous
                          ? 'Аноним'
                          : donation.donor?.display_name ?? 'Донор'}
                      </Text>
                      <Text style={styles.donorAmount}>
                        +{formatKopeksRub(donation.amount_kopeks)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      {showDone ? (
        <View style={[styles.footer, styles.footerRow, { paddingBottom: insets.bottom + 12 }]}>
          <Button kind="ghost" size="lg" icon="heart" onPress={() => void handleShare()}>
            Поделиться
          </Button>
          <Button
            kind="primary"
            size="lg"
            iconRight="arrowR"
            style={styles.footerPrimaryBtn}
            onPress={handleOpenReport}
            disabled={!onOpenReport}
          >
            Открыть отчёт
          </Button>
        </View>
      ) : (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {previewFinancials.canDonate ? (
            <Button
              kind="accent"
              size="lg"
              full
              iconRight="arrowR"
              onPress={() => onDonate({ helpRequestId, title, recipient: beneficiaryName })}
            >
              Помочь
            </Button>
          ) : (
            <Button kind="secondary" size="lg" full disabled>
              {previewFinancials.closed ? 'Сбор закрыт' : 'Сбор завершён'}
            </Button>
          )}
        </View>
      )}

      {mapPoint ? (
        <HelpRequestLocationMapModal
          visible={locationMapVisible}
          requestPoint={mapPoint}
          title="Место получения"
          addressLabel={request.address_text ?? locationLabel}
          onClose={() => setLocationMapVisible(false)}
          onRoutePress={handleOpenRoute}
        />
      ) : null}

      <MediaFullscreenViewer
        visible={viewerOpen}
        items={(showDone && reportPreview ? reportPreview.photos : images).map((item) => {
          const mediaId = 'mediaId' in item ? item.mediaId : item.media_id;
          const uri =
            ('previewUrl' in item ? item.previewUrl : item.preview_url) || item.url || '';
          const fileName = 'fileName' in item ? item.fileName : item.file_name;
          const contentType = 'contentType' in item ? item.contentType : item.content_type;
          return { id: mediaId, uri, fileName, contentType };
        })}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  heroMedia: { position: 'relative', backgroundColor: '#1a1a1a' },
  heroAccentTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${T.accent}12`,
    zIndex: 1,
  },
  heroDoneTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${T.success}20`,
    zIndex: 2,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 4,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: T.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionSpaced: { marginTop: 20, marginBottom: 10 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.successSoft,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: `${T.success}22`,
    padding: 14,
    marginBottom: 14,
  },
  doneBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBannerText: { flex: 1, minWidth: 0 },
  doneBannerTitle: { fontSize: 14, fontFamily: 'Manrope_800ExtraBold', color: T.success },
  doneBannerSub: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: '#3D6940',
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    lineHeight: 26,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  progressCard: {
    backgroundColor: T.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 16,
    marginBottom: 14,
  },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  collected: {
    fontSize: 28,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: -0.8,
  },
  goal: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.muted },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 15, fontFamily: 'Manrope_800ExtraBold', color: T.ink },
  statLabel: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  authorCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 14,
    marginBottom: 14,
    backgroundColor: T.bg,
  },
  authorPressable: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorText: { flex: 1 },
  authorCaption: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    marginBottom: 2,
  },
  authorName: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink },
  authorChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  authorVerified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorMetaText: { fontSize: 12, fontFamily: 'Manrope_400Regular', color: T.muted },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: T.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 14,
    marginBottom: 16,
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: T.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityLabel: { fontSize: 11, fontFamily: 'Manrope_600SemiBold', color: T.muted },
  cityValue: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink, marginTop: 2 },
  description: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 21,
  },
  reportHint: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  photoCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: T.surface2,
  },
  photoCellLarge: {
    width: '65%',
    aspectRatio: 4 / 3,
  },
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoMore: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,18,12,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoMoreText: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
  },
  filesCard: {
    backgroundColor: T.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  filesCardSpaced: {
    marginTop: 10,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  fileRowBorder: { borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  fileIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: T.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  donorsCard: {
    backgroundColor: T.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  donorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  donorRowBorder: { borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  donorBody: { flex: 1 },
  donorTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  donorName: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: T.ink },
  donorAmount: { fontSize: 14, fontFamily: 'Manrope_800ExtraBold', color: T.accent },
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
  footerRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  footerPrimaryBtn: { flex: 1 },
  errorText: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: T.danger, textAlign: 'center' },
  retry: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
});
