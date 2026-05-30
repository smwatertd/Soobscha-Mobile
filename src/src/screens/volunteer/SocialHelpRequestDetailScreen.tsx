import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { openMapRoute } from '../../integrations/yandex/mapNavigation';
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
import {
  getHelpRequestById,
  getSocialHelpRequestParticipants,
  joinSocialHelpRequest,
} from '../../api/helpRequests';
import { getHelpRequestReport, ReportDetailsResponse } from '../../api/reports';
import { SocialHelpRequestSummary } from '../../api/integrationTypes';
import { resolveVolunteerJoinHelpRequestError } from '../../utils/volunteerJoinHelpRequestError';
import { HelpRequestLocationPreview } from '../../components/beneficiary/create/HelpRequestLocationPreview';
import { HelpRequestLocationMapModal } from '../../components/map/HelpRequestLocationMapModal';
import { HelpRequestSkillsSummary } from '../../components/beneficiary/create/HelpRequestSkillsSummary';
import { HelpRequestDetailMediaSection } from '../../components/beneficiary/detail/HelpRequestDetailMediaSection';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { BeneficiaryCategoryChip } from '../../components/BeneficiaryCategoryChip';
import { HelpRequestCategoryChip } from '../../components/HelpRequestCategoryChip';
import { HelpRequestTypeChip } from '../../components/HelpRequestTypeChip';
import { Icon, IconName } from '../../components/Icon';
import { MediaFullscreenViewer } from '../../components/media/MediaFullscreenViewer';
import { HelpRequestDetailChipsRow } from '../../components/volunteer/HelpRequestDetailChipsRow';
import { HelpRequestHeroTopActions } from '../../components/volunteer/HelpRequestHeroTopActions';
import { HelpRequestReportPreviewCard } from '../../components/volunteer/HelpRequestReportPreviewCard';
import { DetailFactCard, VolunteerSectionHeader } from '../../components/volunteer/VolunteerDetailParts';
import { useHelpRequestCategoryLabels } from '../../hooks/useHelpRequestCategoryLabels';
import { useFeedback } from '../../providers/FeedbackProvider';
import { formatDisplayLocation } from '../../navigation/createHelpRequestTypes';
import { HELP_REQUEST_DETAIL_HERO_HEIGHT } from '../../constants/helpRequestDetailLayout';
import { useHelpRequestBeneficiaryCategory } from '../../hooks/useHelpRequestBeneficiaryCategory';
import { useHelpRequestBeneficiaryName } from '../../hooks/useHelpRequestBeneficiaryName';
import { useHelpRequestWatch } from '../../hooks/useHelpRequestWatch';
import { readHelpRequestIsWatched } from '../../utils/helpRequestWatch';
import {
  parseHelpRequestMediaFiles,
  splitHelpRequestMedia,
} from '../../utils/parseHelpRequestMediaFiles';
import { BeneficiaryReportViewModel } from '../../utils/beneficiaryReportViewModel';
import { resolveVolunteerReportPreview } from '../../utils/volunteerHelpRequestReport';
import { RADIUS, T, shadowSm } from '../../theme/tokens';

type Props = {
  helpRequestId: string;
  onBack: () => void;
  onJoined?: (params: { title: string; recipient: string }) => void;
  onOpenVolunteers?: (params: { helpRequestId: string; scheduleLabel?: string }) => void;
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

export function SocialHelpRequestDetailScreen({
  helpRequestId,
  onBack,
  onJoined,
  onOpenVolunteers,
  onOpenVisitorProfile,
  onOpenReport,
}: Props) {
  const insets = useSafeAreaInsets();
  const { showError } = useFeedback();
  const { resolveCategoryLabel } = useHelpRequestCategoryLabels();
  const [request, setRequest] = useState<SocialHelpRequestSummary | null>(null);
  const [participants, setParticipants] = useState<
    Awaited<ReturnType<typeof getSocialHelpRequestParticipants>>
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [reportRaw, setReportRaw] = useState<ReportDetailsResponse | null>(null);
  const [locationMapVisible, setLocationMapVisible] = useState(false);
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
      if (data.type !== 'SOCIAL') {
        throw new Error('Это не социальная заявка');
      }
      setRequest(data as SocialHelpRequestSummary);
      const people = await getSocialHelpRequestParticipants(helpRequestId).catch(() => []);
      setParticipants(people);
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
    setJoined(false);
    setHeroSlideIndex(0);
  }, [load]);

  const handleToggleWatch = () => {
    void toggleWatch().catch((err) => {
      showError(err instanceof Error ? err.message : 'Не удалось обновить избранное');
    });
  };

  const joinedCount = request?.participants?.joined ?? participants.length;
  const minVolunteers = request?.min_volunteers ?? 0;
  const maxVolunteers = request?.max_volunteers ?? joinedCount;
  const needMore = Math.max(0, minVolunteers - joinedCount);

  const isDone = request?.status === 'COMPLETED';

  const canJoin =
    request &&
    !isDone &&
    (request.status === 'VOLUNTEER_RECRUITING' || request.status === 'WAITING_START') &&
    joinedCount < maxVolunteers;

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
    () => resolveVolunteerReportPreview(helpRequestId, false, isDone ? reportRaw : null),
    [helpRequestId, isDone, reportRaw],
  );

  const handleOpenReport = useCallback(() => {
    if (!request || !onOpenReport) return;
    onOpenReport({ helpRequestId, title: request.title, isMaterial: false });
  }, [helpRequestId, onOpenReport, request]);

  const closed =
    request?.status === 'CANCELLED' || request?.status === 'INTERRUPTED';

  const { code: beneficiaryCategoryCode, label: beneficiaryCategory } =
    useHelpRequestBeneficiaryCategory(request?.beneficiary, request?.beneficiary_user_id);
  const beneficiaryName = useHelpRequestBeneficiaryName(
    request?.beneficiary,
    request?.beneficiary_user_id,
  );

  const showLoading = loading;
  const showErrorState = Boolean(error || !request);

  const locationLabel = request?.address_text
    ? formatDisplayLocation(request.place_name || request.address_text)
    : null;
  const mapPoint =
    request && request.latitude != null && request.longitude != null
      ? { latitude: request.latitude, longitude: request.longitude }
      : null;

  const handleOpenMap = useCallback(() => {
    if (!mapPoint) return;
    setLocationMapVisible(true);
  }, [mapPoint]);

  const handleOpenRoute = useCallback(() => {
    if (!mapPoint) return;
    void openMapRoute(mapPoint, {
      label: locationLabel ?? request?.address_text ?? request?.title,
    });
  }, [mapPoint, locationLabel, request?.address_text, request?.title]);

  const handleJoin = async () => {
    if (!request || !canJoin || joining || joined) return;
    setJoining(true);
    try {
      await joinSocialHelpRequest(request.id);
      setJoined(true);
      onJoined?.({
        title: request.title,
        recipient: beneficiaryName,
      });
      await load();
    } catch (err) {
      showError(
        resolveVolunteerJoinHelpRequestError(err, { requestStatus: request.status }),
      );
    } finally {
      setJoining(false);
    }
  };

  if (showLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
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

  const categoryLabel = resolveCategoryLabel(request.category);
  const mediaItems = parseHelpRequestMediaFiles(request.media_files);
  const { images, documents } = splitHelpRequestMedia(mediaItems);
  const fileCount = mediaItems.length;
  const scheduleLabel = formatDateShort(request.start_at);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${request.title}\n\nЗаявка в приложении «Сообща»`,
      });
    } catch {
      // пользователь отменил или шаринг недоступен
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.heroMedia}>
        {isDone ? <View style={styles.heroDoneTint} pointerEvents="none" /> : null}
        <HelpRequestDetailMediaSection
          mediaItems={mediaItems}
          placeholderIcon="handshake"
          accent={T.primary}
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
        {isDone ? (
          <View style={styles.doneBanner}>
            <View style={styles.doneBannerIcon}>
              <Icon name="check" size={20} color="#fff" strokeWidth={2.5} />
            </View>
            <View style={styles.doneBannerText}>
              <Text style={styles.doneBannerTitle}>
                Завершено{' '}
                {reportPreview?.report.created_at
                  ? new Date(reportPreview.report.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                    })
                  : formatDateShort(request.start_at)}
              </Text>
              <Text style={styles.doneBannerSub}>
                Помогли {beneficiaryName} · ~{Math.round(request.duration_minutes / 60) || 1} ч · команда из{' '}
                {joinedCount} {joinedCount === 1 ? 'человека' : 'человек'}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.title}>{request.title}</Text>

        <HelpRequestDetailChipsRow>
          <HelpRequestTypeChip type="social" completed={!!isDone} size="sm" />
          {categoryLabel ? (
            <HelpRequestCategoryChip
              type="social"
              categoryCode={request.category ?? ''}
              label={categoryLabel}
              size="sm"
            />
          ) : null}
        </HelpRequestDetailChipsRow>

        <View style={styles.authorCard}>
          <Pressable
            style={styles.authorPressable}
            disabled={!onOpenVisitorProfile}
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

        <View style={styles.factsGrid}>
          <DetailFactCard
            icon="calendar"
            label="Когда"
            value={formatDateShort(request.start_at)}
            sub={formatTimeRange(request.start_at, request.duration_minutes)}
          />
          <DetailFactCard
            icon="pin"
            label="Где"
            value={locationLabel ?? 'Адрес указан'}
            sub={request.address_text}
            color={T.accent}
          />
          <DetailFactCard
            icon="user"
            label={isDone ? 'Команда' : 'Волонтёров'}
            value={
              isDone
                ? `${joinedCount} ${joinedCount === 1 ? 'человек' : 'человека'}`
                : `${joinedCount} из ${maxVolunteers}`
            }
            sub={
              isDone
                ? participants
                    .slice(0, 3)
                    .map((p) => `${p.first_name} ${p.last_name[0]}.`)
                    .join(', ') || '—'
                : needMore > 0
                  ? `нужно ещё ${needMore}+`
                  : 'набор открыт'
            }
            color={T.info}
          />
          <DetailFactCard
            icon="clock"
            label="Длительность"
            value={
              isDone
                ? `${Math.round(request.duration_minutes / 60) || 1} ч`
                : `~${Math.round(request.duration_minutes / 60) || 1} ч`
            }
            sub={isDone ? 'фактически' : `${request.duration_minutes} мин`}
            color={T.muted}
          />
        </View>

        {mapPoint ? (
          <>
            <VolunteerSectionHeader
              title="Место встречи"
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
        ) : null}

        {isDone ? (
          <>
            <VolunteerSectionHeader title="Отчёт получателя" style={styles.sectionSpaced} />
            {reportPreview ? (
              <HelpRequestReportPreviewCard
                beneficiaryName={beneficiaryName}
                submittedAt={reportPreview.report.created_at}
                description={reportPreview.description}
                photoUris={reportPreview.photos.map((p) => p.preview_url || p.url || '')}
                rating={reportPreview.socialRating}
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

        {request.description ? (
          <>
            <VolunteerSectionHeader title="О заявке" style={styles.sectionSpaced} />
            <Text style={styles.description}>{request.description}</Text>
          </>
        ) : null}

        {fileCount > 0 ? (
          <>
            <VolunteerSectionHeader
              title="Файлы"
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
                          <Icon name="image" size={22} color={T.primary} />
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

        {request.items_to_bring?.length ? (
          <>
            <VolunteerSectionHeader title="Что взять с собой" style={styles.sectionSpaced} />
            <View style={styles.tags}>
              {request.items_to_bring.map((item) => (
                <View key={item} style={styles.tag}>
                  <Icon name="check" size={12} color={T.success} strokeWidth={3} />
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {request.required_skills?.length || request.preferred_skills?.length ? (
          <>
            <VolunteerSectionHeader title="Навыки" style={styles.sectionSpaced} />
            <HelpRequestSkillsSummary
              requiredSkills={request.required_skills ?? []}
              preferredSkills={request.preferred_skills ?? []}
              hideTitle
            />
          </>
        ) : null}

        {participants.length ? (
          <>
            <VolunteerSectionHeader
              title={isDone ? 'Кто помог' : 'Уже идут'}
              action={`Все ${participants.length}`}
              onAction={
                onOpenVolunteers
                  ? () =>
                      onOpenVolunteers({
                        helpRequestId,
                        scheduleLabel,
                      })
                  : undefined
              }
              style={styles.sectionSpaced}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.participantsRow}
            >
              {participants.slice(0, 8).map((person) => {
                const name = `${person.first_name} ${person.last_name}`.trim();
                return (
                  <Pressable
                    key={person.volunteer_user_id}
                    style={[styles.participantCard, shadowSm]}
                    disabled={!onOpenVisitorProfile}
                    onPress={() =>
                      onOpenVisitorProfile?.({
                        userId: person.volunteer_user_id,
                        displayName: name,
                        role: 'volunteer',
                      })
                    }
                  >
                    <Avatar name={name} size={42} />
                    <Text style={styles.participantName} numberOfLines={1}>
                      {person.first_name} {person.last_name[0]}.
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>

      {isDone ? (
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
          <View style={styles.footerTextWrap}>
            <Text style={styles.footerHint}>
              {closed ? 'Запись закрыта' : 'До набора нужны'}
            </Text>
            <Text style={styles.footerTitle}>
              {closed
                ? 'Набор завершён'
                : needMore > 0
                  ? `ещё ${needMore} волонтёр${needMore === 1 ? '' : 'а'}`
                  : joined
                    ? 'Вы записаны'
                    : 'Места есть'}
            </Text>
          </View>
          {canJoin ? (
            <Button
              kind={joined ? 'secondary' : 'primary'}
              size="lg"
              iconRight="arrowR"
              disabled={joining || joined}
              onPress={handleJoin}
            >
              {joining ? 'Запись…' : joined ? 'Записаны' : 'Записаться'}
            </Button>
          ) : (
            <Button kind="secondary" size="lg" disabled>
              {closed ? 'Запись закрыта' : 'Запись недоступна'}
            </Button>
          )}
        </View>
      )}

      {mapPoint ? (
        <HelpRequestLocationMapModal
          visible={locationMapVisible}
          requestPoint={mapPoint}
          addressLabel={request.address_text ?? locationLabel}
          onClose={() => setLocationMapVisible(false)}
          onRoutePress={handleOpenRoute}
        />
      ) : null}

      <MediaFullscreenViewer
        visible={viewerOpen}
        items={(isDone && reportPreview ? reportPreview.photos : images).map((item) => {
          const mediaId = 'mediaId' in item ? item.mediaId : item.media_id;
          const uri =
            ('previewUrl' in item ? item.previewUrl : item.preview_url) ||
            item.url ||
            '';
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

function formatDateShort(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTimeRange(startAt: string, durationMinutes: number): string {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const fmt = (d: Date) =>
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `с ${fmt(start)} до ${fmt(end)}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  heroMedia: { position: 'relative', backgroundColor: '#1a1a1a' },
  heroDoneTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${T.success}20`,
    zIndex: 1,
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
  sectionSpaced: {
    marginTop: 20,
    marginBottom: 10,
  },
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
    lineHeight: 17,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    lineHeight: 26,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  authorPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  factsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  description: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 22,
    marginBottom: 4,
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
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: T.bg,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  tagText: { fontSize: 13, fontFamily: 'Manrope_500Medium', color: T.ink2 },
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
  participantsRow: { gap: 10, paddingBottom: 8 },
  participantCard: {
    width: 96,
    backgroundColor: T.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  participantName: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerRow: { gap: 10 },
  footerPrimaryBtn: { flex: 1 },
  footerTextWrap: { flex: 1 },
  footerHint: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted },
  footerTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: T.ink, marginTop: 2 },
  errorText: { fontSize: 14, fontFamily: 'Manrope_500Medium', color: T.danger, textAlign: 'center' },
  retry: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.primary },
});
