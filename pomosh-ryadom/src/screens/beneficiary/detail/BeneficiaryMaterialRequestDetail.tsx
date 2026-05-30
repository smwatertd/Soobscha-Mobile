import { Image } from 'expo-image';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { HelpRequestDetailMediaSection } from '../../../components/beneficiary/detail/HelpRequestDetailMediaSection';
import { HelpRequestModerationBanner } from '../../../components/beneficiary/detail/HelpRequestModerationBanner';
import { HelpRequestWorkflowBanner } from '../../../components/beneficiary/detail/HelpRequestWorkflowBanner';
import { MATERIAL_CHIP_ICONS } from '../../../components/beneficiary/create/HelpRequestCategoryPicker';
import { VolunteerSectionHeader } from '../../../components/volunteer/VolunteerDetailParts';
import { Chip } from '../../../components/Chip';
import { Icon } from '../../../components/Icon';
import { ProgressBar } from '../../../components/ProgressBar';
import { StatusBadge } from '../../../components/StatusBadge';
import { BeneficiaryHelpRequestDetailData } from '../../../hooks/useBeneficiaryHelpRequestDetail';
import { helpRequestStatusToBadge } from '../../../utils/helpRequestStatus';
import { getMaterialWorkflowBanner } from '../../../utils/helpRequestWorkflowConfig';
import { splitHelpRequestMedia } from '../../../utils/parseHelpRequestMediaFiles';
import { RADIUS, T, CARD_BG } from '../../../theme/tokens';
import { formatKopeks, getMaterialAmounts } from './detailHelpers';
import { MaterialCollectionExtras } from './MaterialCollectionExtras';
import { MaterialPayoutsSection } from './MaterialPayoutsSection';

type Props = {
  data: BeneficiaryHelpRequestDetailData;
  onOpenMedia: (index: number) => void;
  onEditRequest?: () => void;
  onWorkflowPress?: () => void;
  onOpenAllDonations?: () => void;
  onOpenAllPayouts?: () => void;
};

export function BeneficiaryMaterialRequestDetail({
  data,
  onOpenMedia,
  onEditRequest,
  onWorkflowPress,
  onOpenAllDonations,
  onOpenAllPayouts,
}: Props) {
  const { request, categoryLabel, mediaItems, moderationFeedback } = data;
  const status = request.status;
  const badge = helpRequestStatusToBadge(status);

  const isModeration = status === 'PENDING_MODERATION';
  const isRework = status === 'RETURNED_TO_REWORK';
  const isRejected = status === 'REJECTED';
  const isFunded = status === 'FUNDED';
  const isDone = status === 'COMPLETED';
  const isReport = status === 'REPORT_ON_REVIEW' || status === 'REPORT_OVERDUE';

  const { requested, collected, withdrawn, available } = getMaterialAmounts(request);
  const pct = requested > 0 ? Math.min(100, (collected / requested) * 100) : 0;
  const donationsCount = request.donations?.succeeded_count ?? request.donations?.count ?? 0;
  const avgDonation =
    donationsCount > 0 ? Math.round(collected / 100 / donationsCount) : 0;

  const progressMuted = isModeration || isRework || isRejected;
  const progressSuccess = isDone || isFunded || isReport;
  const showCollectionExtras = !progressMuted;
  const workflowBanner = getMaterialWorkflowBanner(request);
  const { images, documents } = splitHelpRequestMedia(mediaItems);
  const fileCount = mediaItems.length;

  return (
    <View style={styles.content}>
      <HelpRequestDetailMediaSection
        mediaItems={mediaItems}
        placeholderIcon="coin"
        accent={T.accent}
        onOpenViewer={onOpenMedia}
      />

      <View style={styles.badges}>
        <StatusBadge status={badge} />
        <View style={styles.typeChip}>
          <Icon name="coin" size={12} color={T.accentDark} strokeWidth={2} />
          <Text style={styles.typeChipText}>Денежный сбор</Text>
        </View>
        {categoryLabel ? (
          <Chip
            kind="default"
            size="sm"
            label={categoryLabel}
            icon={
              request.category
                ? MATERIAL_CHIP_ICONS[request.category as keyof typeof MATERIAL_CHIP_ICONS]
                : undefined
            }
          />
        ) : null}
      </View>

      <Text style={styles.title}>{request.title}</Text>

      {(isModeration || isRework || isRejected) && (
        <HelpRequestModerationBanner
          status={status}
          createdAt={request.created_at}
          feedback={moderationFeedback}
          variant="material"
          onAction={isRework ? onEditRequest : undefined}
        />
      )}

      {isFunded && (
        <View style={[styles.statusBanner, styles.statusBannerSuccess]}>
          <View style={styles.statusBannerIconSuccess}>
            <Icon name="check" size={20} color="#fff" strokeWidth={2.5} />
          </View>
          <View style={styles.statusBannerBody}>
            <Text style={[styles.statusBannerTitle, { color: T.success }]}>Сумма собрана!</Text>
            <Text style={styles.statusBannerDescSuccess}>
              Запросите выплату, проведите курс реабилитации и приложите отчёт с чеками.
            </Text>
          </View>
        </View>
      )}

      {workflowBanner ? (
        <HelpRequestWorkflowBanner
          config={workflowBanner}
          onPress={onWorkflowPress}
        />
      ) : null}

      <View
        style={[
          styles.progressCard,
          progressSuccess && styles.progressCardSuccess,
          progressMuted && styles.progressCardMuted,
        ]}
      >
        <View style={styles.amountRow}>
          <Text
            style={[
              styles.amountValue,
              progressSuccess && { color: T.success },
              !progressSuccess && { color: T.accentDark },
            ]}
          >
            {formatKopeks(isModeration || isRework ? 0 : collected)}
          </Text>
          <Text style={styles.amountGoal}>из {formatKopeks(requested)}</Text>
        </View>

        <ProgressBar
          value={progressMuted ? 0 : pct}
          color={progressSuccess ? T.success : T.accent}
          bg="#fff"
          height={10}
        />

        {progressMuted ? (
          <View style={styles.progressHint}>
            <Icon name="clock" size={14} color={T.muted} strokeWidth={2} />
            <Text style={styles.progressHintText}>Сбор начнётся после одобрения партнёром</Text>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatItem label="Собрано" value={`${Math.round(pct)}%`} />
            <StatItem label="Помогли" value={String(donationsCount)} />
            {avgDonation > 0 ? (
              <StatItem label="Средний донат" value={formatKopeks(avgDonation * 100)} />
            ) : (
              <StatItem label="Средний донат" value="—" />
            )}
          </View>
        )}
      </View>

      {(isFunded || isDone || isReport) && requested > 0 && (
        <MaterialPayoutsSection
          withdrawnKopeks={withdrawn}
          availableKopeks={available > 0 ? available : Math.max(0, requested - withdrawn)}
          payoutsCount={withdrawn > 0 ? 1 : 0}
          onOpenAllPayouts={onOpenAllPayouts}
        />
      )}

      {request.description ? (
        <>
          <VolunteerSectionHeader title="Описание" style={styles.sectionHeader} />
          <Text style={styles.description}>{request.description}</Text>
        </>
      ) : null}

      {fileCount > 0 ? (
        <>
          <VolunteerSectionHeader
            title="Файлы"
            action={fileCount > 3 ? `Все ${fileCount}` : undefined}
            style={styles.sectionHeader}
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
                        <Icon name="camera" size={22} color={T.accent} strokeWidth={1.8} />
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

      {showCollectionExtras ? (
        <MaterialCollectionExtras
          donationsCount={donationsCount}
          showChart={!progressMuted}
          showDonations={!progressMuted}
          onOpenAllDonations={donationsCount > 0 ? onOpenAllDonations : undefined}
        />
      ) : null}
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: T.accentSoft,
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.accentDark,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  statusBanner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: T.warningSoft,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${T.warning}22`,
    padding: 14,
  },
  statusBannerSuccess: {
    backgroundColor: T.successSoft,
    borderColor: `${T.success}22`,
  },
  statusBannerIconSuccess: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBannerBody: {
    flex: 1,
    minWidth: 0,
  },
  statusBannerTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#7A5210',
  },
  statusBannerDescSuccess: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#3D6940',
    marginTop: 3,
    lineHeight: 17,
  },
  progressCard: {
    backgroundColor: T.accentSoft,
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 8,
  },
  progressCardSuccess: {
    backgroundColor: T.successSoft,
  },
  progressCardMuted: {
    opacity: 0.85,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: -1,
  },
  amountGoal: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  progressHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressHintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  statValue: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.ink2,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 22,
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
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.surface2,
  },
  filesCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 14,
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
});
