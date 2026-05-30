import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import { openMapRoute } from '../../../integrations/yandex/mapNavigation';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../../components/Avatar';
import { HelpRequestLocationPreview } from '../../../components/beneficiary/create/HelpRequestLocationPreview';
import { HelpRequestLocationMapModal } from '../../../components/map/HelpRequestLocationMapModal';
import { HelpRequestSkillsSummary } from '../../../components/beneficiary/create/HelpRequestSkillsSummary';
import { HelpRequestDetailMediaSection } from '../../../components/beneficiary/detail/HelpRequestDetailMediaSection';
import { HelpRequestModerationBanner } from '../../../components/beneficiary/detail/HelpRequestModerationBanner';
import { HelpRequestWorkflowBanner } from '../../../components/beneficiary/detail/HelpRequestWorkflowBanner';
import { DetailFactCard, VolunteerSectionHeader } from '../../../components/volunteer/VolunteerDetailParts';
import { Icon } from '../../../components/Icon';
import { ProgressBar } from '../../../components/ProgressBar';
import { StatusBadge } from '../../../components/StatusBadge';
import { BeneficiaryHelpRequestDetailData } from '../../../hooks/useBeneficiaryHelpRequestDetail';
import { useSkillLabelMap } from '../../../hooks/useSkillLabelMap';
import { formatVolunteerSkillCodes } from '../../../utils/volunteerSkillLabels';
import { formatDisplayLocation } from '../../../navigation/createHelpRequestTypes';
import { helpRequestStatusToBadge } from '../../../utils/helpRequestStatus';
import { getSocialWorkflowBanner } from '../../../utils/helpRequestWorkflowConfig';
import { splitHelpRequestMedia } from '../../../utils/parseHelpRequestMediaFiles';
import { INLINE_SECTION_BG, RADIUS, T, CARD_BG } from '../../../theme/tokens';
import { BeneficiaryRequestTimelineSection } from './BeneficiaryRequestTimelineSection';
import {
  formatDurationLabel,
  formatRecruitmentDeadline,
  formatSocialScheduleMeta,
  formatSocialWhenFact,
  participantDisplayName,
  volunteerShortageLabel,
} from './detailHelpers';

type Props = {
  data: BeneficiaryHelpRequestDetailData;
  onOpenMedia: (index: number) => void;
  onOpenVolunteers?: () => void;
  onEditRequest?: () => void;
  onWorkflowPress?: () => void;
};

export function BeneficiarySocialRequestDetail({
  data,
  onOpenMedia,
  onOpenVolunteers,
  onEditRequest,
  onWorkflowPress,
}: Props) {
  const { labelByCode } = useSkillLabelMap();
  const insets = useSafeAreaInsets();
  const [contactsOpen, setContactsOpen] = useState(false);
  const [locationMapVisible, setLocationMapVisible] = useState(false);

  const { request, participants, timeline, mediaItems, moderationFeedback, categoryLabel } = data;
  const badge = helpRequestStatusToBadge(request.status);

  const joined = request.participants?.joined ?? participants.length;
  const maxVolunteers = request.max_volunteers ?? 0;
  const minVolunteers = request.min_volunteers ?? 0;

  const showVolunteers =
    request.status === 'VOLUNTEER_RECRUITING' || request.status === 'WAITING_START';

  const showModerationBanner = ['PENDING_MODERATION', 'RETURNED_TO_REWORK', 'REJECTED'].includes(
    request.status,
  );

  const locationLabel = request.address_text
    ? formatDisplayLocation(request.place_name || request.address_text)
    : null;

  const scheduleMeta = useMemo(
    () => formatSocialScheduleMeta(request.start_at),
    [request.start_at],
  );

  const recruitmentDeadline = useMemo(
    () => formatRecruitmentDeadline(request.start_at),
    [request.start_at],
  );

  const volunteersNeeded = Math.max(0, minVolunteers - joined);
  const mapPoint =
    request.latitude != null && request.longitude != null
      ? { latitude: request.latitude, longitude: request.longitude }
      : null;

  const handleOpenMap = useCallback(() => {
    if (!mapPoint) return;
    setLocationMapVisible(true);
  }, [mapPoint]);

  const handleOpenRoute = useCallback(() => {
    if (!mapPoint) return;
    void openMapRoute(mapPoint, {
      label: locationLabel ?? request.address_text ?? request.title,
    });
  }, [mapPoint, locationLabel, request.address_text, request.title]);

  const { images, documents } = splitHelpRequestMedia(mediaItems);
  const fileCount = mediaItems.length;
  const whenFact = useMemo(
    () => formatSocialWhenFact(request.start_at, request.duration_minutes),
    [request.duration_minutes, request.start_at],
  );

  const workflowBanner = getSocialWorkflowBanner(request);

  return (
    <View style={styles.content}>
      <View style={styles.previewCard}>
        <HelpRequestDetailMediaSection
          mediaItems={mediaItems}
          placeholderIcon="handshake"
          accent={T.primary}
          embeddedInCard
          showDocuments={false}
          onOpenViewer={onOpenMedia}
        />
        <View style={styles.previewBody}>
          <View style={styles.badges}>
            <StatusBadge status={badge} />
            <View style={styles.typeChip}>
              <Icon name="handshake" size={12} color={T.primaryDark} strokeWidth={2} />
              <Text style={styles.typeChipText}>Делом</Text>
            </View>
            {categoryLabel ? (
              <View style={styles.categoryChip}>
                <Icon name="leaf" size={12} color={T.accentDark} strokeWidth={2} />
                <Text style={styles.categoryChipText}>{categoryLabel}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.previewTitle}>{request.title}</Text>

          <View style={styles.previewMeta}>
            <View style={styles.metaItem}>
              <Icon name="calendar" size={14} color={T.muted} />
              <Text style={styles.previewMetaText}>{scheduleMeta.when}</Text>
            </View>
            {locationLabel ? (
              <>
                <View style={styles.metaDot} />
                <View style={styles.metaItem}>
                  <Icon name="pin" size={14} color={T.muted} />
                  <Text style={styles.previewMetaText}>{locationLabel}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {showModerationBanner ? (
        <HelpRequestModerationBanner
          status={request.status}
          createdAt={request.created_at}
          feedback={moderationFeedback}
          onAction={
            request.status === 'RETURNED_TO_REWORK' ? onEditRequest : undefined
          }
        />
      ) : null}

      {workflowBanner ? (
        <View style={styles.workflowBanner}>
          <HelpRequestWorkflowBanner config={workflowBanner} onPress={onWorkflowPress} />
        </View>
      ) : null}

      {showVolunteers ? (
        <Pressable
          style={styles.volunteersCard}
          onPress={() => (onOpenVolunteers ? onOpenVolunteers() : setContactsOpen(true))}
        >
          <View style={styles.volunteersHeader}>
            <Text style={styles.volunteersTitle}>Откликнувшиеся волонтёры</Text>
            <View style={styles.volunteersCountRow}>
              <Text style={styles.volunteersCount}>
                {joined} / {maxVolunteers}
              </Text>
              <Icon name="chevR" size={14} color={T.primary} strokeWidth={2.4} />
            </View>
          </View>

          {maxVolunteers > 0 ? (
            <ProgressBar value={joined} max={maxVolunteers} color={T.primary} bg="#fff" height={6} />
          ) : null}

          {participants.length > 0 ? (
            <View style={styles.volunteerChips}>
              {participants.slice(0, 6).map((participant) => {
                const name = participantDisplayName(participant.first_name, participant.last_name);
                return (
                  <View key={participant.volunteer_user_id} style={styles.volunteerChip}>
                    <Avatar name={name} size={22} />
                    <Text style={styles.volunteerChipText}>{name}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {request.status === 'VOLUNTEER_RECRUITING' && volunteersNeeded > 0 ? (
            <Text style={styles.volunteersHint}>
              Нужен ещё{' '}
              <Text style={styles.volunteersHintBold}>
                {volunteersNeeded} {volunteerShortageLabel(volunteersNeeded)}
              </Text>
              , чтобы запустить заявку. Если до {recruitmentDeadline} не наберём, заявка автоматически
              отменится.
            </Text>
          ) : null}
        </Pressable>
      ) : null}

      {request.description ? (
        <>
          <VolunteerSectionHeader title="Описание" style={styles.sectionHeaderSpaced} />
          <Text style={styles.description}>{request.description}</Text>
        </>
      ) : null}

      <View style={styles.factsGrid}>
        <DetailFactCard
          icon="calendar"
          label="Когда"
          value={whenFact.value}
          sub={whenFact.sub}
          color={T.primary}
        />
        <DetailFactCard
          icon="pin"
          label="Где"
          value={locationLabel ?? '—'}
          sub={request.address_text ?? undefined}
          color={T.accent}
        />
        <DetailFactCard
          icon="user"
          label="Волонтёров"
          value={`${joined} из ${maxVolunteers || joined}`}
          sub={minVolunteers > 0 ? `мин. ${minVolunteers} — для запуска` : undefined}
          color={T.info}
        />
        <DetailFactCard
          icon="clock"
          label="Длительность"
          value={formatDurationLabel(request.duration_minutes)}
          sub={request.duration_minutes ? 'с перерывом' : undefined}
          color={T.muted}
        />
      </View>

      {mapPoint ? (
        <>
          <VolunteerSectionHeader
            title="Место встречи"
            action="На карте"
            onAction={handleOpenMap}
            style={styles.sectionHeaderSpaced}
          />
          <HelpRequestLocationPreview
            point={mapPoint}
            readOnly
            onMapPress={handleOpenMap}
            addressLabel={request.address_text ?? locationLabel}
          />
        </>
      ) : null}

      {request.items_to_bring?.length ? (
        <>
          <VolunteerSectionHeader title="Что взять с собой" style={styles.sectionHeaderSpaced} />
          <View style={styles.bringItemsChips}>
            {request.items_to_bring.map((item) => (
              <View key={item} style={styles.bringItemChip}>
                <Icon name="check" size={12} color={T.success} strokeWidth={3} />
                <Text style={styles.bringItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {request.required_skills?.length || request.preferred_skills?.length ? (
        <>
          <VolunteerSectionHeader
            title="Навыки"
            style={
              request.items_to_bring?.length
                ? styles.sectionHeaderAfterBring
                : styles.sectionHeaderSpaced
            }
          />
          <View style={styles.skillsWrap}>
            <HelpRequestSkillsSummary
              requiredSkills={request.required_skills ?? []}
              preferredSkills={request.preferred_skills ?? []}
              hideTitle
            />
          </View>
        </>
      ) : null}

      {fileCount > 0 ? (
        <>
          <VolunteerSectionHeader
            title="Файлы"
            action={fileCount > 3 ? `Все ${fileCount}` : undefined}
            style={styles.sectionHeaderSpaced}
          />
          {images.length > 0 ? (
            <View style={styles.photoGrid}>
              {images.slice(0, 3).map((item, index) => {
                const uri = item.previewUrl || item.url;
                return (
                  <Pressable key={item.mediaId} style={styles.photoCell} onPress={() => onOpenMedia(index)}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Icon name="camera" size={22} color={T.primary} strokeWidth={1.8} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {documents.length > 0 ? (
            <View style={styles.filesCard}>
              {documents.map((doc, index) => (
                <View
                  key={doc.mediaId}
                  style={[styles.fileRow, index < documents.length - 1 && styles.fileRowBorder]}
                >
                  <View style={styles.fileIcon}>
                    <Icon name="document" size={16} color={T.info} strokeWidth={2} />
                  </View>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {doc.fileName}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {request.additional_notes ? (
        <View style={styles.extraNotesBox}>
          <Text style={styles.sectionTitle}>Дополнительно</Text>
          <Text style={styles.extraNotesText}>{request.additional_notes}</Text>
        </View>
      ) : null}

      <VolunteerSectionHeader title="История заявки" style={styles.sectionHeaderSpaced} />
      <BeneficiaryRequestTimelineSection items={timeline} />

      <Modal
        visible={contactsOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setContactsOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setContactsOpen(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Откликнувшиеся волонтёры</Text>
            <Text style={styles.modalSubtitle}>
              {joined} из {maxVolunteers || joined}
            </Text>
            <View style={styles.modalList}>
              {participants.map((participant, index) => {
                const name = participantDisplayName(participant.first_name, participant.last_name);
                return (
                  <View
                    key={participant.volunteer_user_id}
                    style={[
                      styles.modalRow,
                      index < participants.length - 1 && styles.modalRowBorder,
                    ]}
                  >
                    <Avatar name={name} size={40} />
                    <View style={styles.modalRowBody}>
                      <Text style={styles.modalRowName}>{name}</Text>
                      {participant.skill_codes.length > 0 ? (
                        <Text style={styles.modalRowMeta}>
                          {formatVolunteerSkillCodes(participant.skill_codes, labelByCode)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
            <Pressable style={styles.modalCloseBtn} onPress={() => setContactsOpen(false)}>
              <Text style={styles.modalCloseText}>Закрыть</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {mapPoint ? (
        <HelpRequestLocationMapModal
          visible={locationMapVisible}
          requestPoint={mapPoint}
          addressLabel={request.address_text ?? locationLabel}
          onClose={() => setLocationMapVisible(false)}
          onRoutePress={handleOpenRoute}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewCard: {
    backgroundColor: INLINE_SECTION_BG,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewBody: {
    padding: 16,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: T.primarySoft,
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.primaryDark,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: T.accentSoft,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.accentDark,
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.mutedSoft,
  },
  previewMetaText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionHeaderSpaced: {
    marginTop: 22,
    marginBottom: 8,
  },
  sectionHeaderAfterBring: {
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 22,
    marginBottom: 18,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  bringItemsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  bringItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  bringItemText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.ink2,
  },
  skillsWrap: {
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  photoCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INLINE_SECTION_BG,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  filesCard: {
    backgroundColor: INLINE_SECTION_BG,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fileRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
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
    color: T.ink,
  },
  extraNotesBox: {
    paddingVertical: 4,
    gap: 4,
    marginTop: 8,
  },
  extraNotesText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 19,
  },
  volunteersCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 16,
    marginBottom: 16,
  },
  volunteersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  volunteersTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.primaryDark,
  },
  volunteersCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volunteersCount: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
    fontVariant: ['tabular-nums'],
  },
  volunteerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  volunteerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingRight: 10,
    paddingLeft: 4,
    backgroundColor: T.surface,
    borderRadius: RADIUS.pill,
  },
  volunteerChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  volunteersHint: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.primaryDark,
    lineHeight: 17,
    marginTop: 12,
  },
  volunteersHintBold: {
    fontFamily: 'Manrope_700Bold',
  },
  workflowBanner: {
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '78%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.border,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    marginTop: 4,
    marginBottom: 14,
  },
  modalList: {
    borderRadius: RADIUS.lg,
    backgroundColor: T.bg,
    overflow: 'hidden',
    marginBottom: 14,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  modalRowBody: {
    flex: 1,
    minWidth: 0,
  },
  modalRowName: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  modalRowMeta: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
  },
  modalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface2,
  },
  modalCloseText: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink2,
  },
});
