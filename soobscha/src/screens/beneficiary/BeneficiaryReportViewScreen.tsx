import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../api/errors';
import { getHelpRequestById } from '../../api/helpRequests';
import { getHelpRequestReport, ReportDetailsResponse, ReportStatus } from '../../api/reports';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { Icon, IconName } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import { buildBeneficiaryReportViewModel } from '../../utils/beneficiaryReportViewModel';
import { formatHelpRequestDate } from '../../utils/helpRequestStatus';
import { RADIUS, T } from '../../theme/tokens';
import { formatKopeks } from './detail/detailHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryReportView'>;

type StatusConfig = {
  bg: string;
  color: string;
  icon: IconName;
  title: string;
  body: string;
  reasonLabel?: string;
};

function getReportStatusConfig(status: ReportStatus, isMaterial: boolean): StatusConfig {
  switch (status) {
    case 'PENDING_MODERATION':
      return {
        bg: T.warningSoft,
        color: '#8B5E10',
        icon: 'clock',
        title: 'На проверке',
        body: 'Партнёр обычно проверяет в течение 48 часов. Изменить отчёт можно будет, если попросит доработать.',
      };
    case 'APPROVED':
      return {
        bg: T.successSoft,
        color: T.success,
        icon: 'check',
        title: 'Одобрен',
        body: isMaterial
          ? 'Партнёр принял отчёт и подтвердил расходы. Смотрите ниже итоговую сумму.'
          : 'Партнёр одобрил отчёт. Заявка закрыта.',
      };
    case 'RETURNED_TO_REWORK':
      return {
        bg: T.warningSoft,
        color: '#8B5E10',
        icon: 'edit',
        title: 'На доработке',
        body: 'Партнёр оставил комментарии — поправьте описание или приложите дополнительные документы.',
        reasonLabel: 'Что нужно поправить',
      };
    case 'REJECTED':
      return {
        bg: T.dangerSoft,
        color: T.danger,
        icon: 'close',
        title: 'Отклонён',
        body: 'Отчёт не подтверждает целевое расходование средств.',
        reasonLabel: 'Причина отклонения',
      };
  }
}

export function BeneficiaryReportViewScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showError, showSnack } = useFeedback();
  const { helpRequestId, title, isMaterial, readOnly = false } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawReport, setRawReport] = useState<ReportDetailsResponse | null>(null);
  const [collectedKopeks, setCollectedKopeks] = useState<number | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const report = await getHelpRequestReport(helpRequestId);
      setRawReport(report);
      if (isMaterial) {
        const request = await getHelpRequestById(helpRequestId);
        const financials = request.financials;
        setCollectedKopeks(
          financials?.collected_kopeks ??
            financials?.amount_collected_kopeks ??
            request.amount_collected_kopeks ??
            null,
        );
      } else {
        setCollectedKopeks(null);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Не удалось загрузить отчёт'));
    } finally {
      setLoading(false);
    }
  }, [helpRequestId, isMaterial]);

  useEffect(() => {
    void load();
  }, [load]);

  const viewModel = useMemo(
    () =>
      rawReport
        ? buildBeneficiaryReportViewModel(rawReport, { collectedKopeks })
        : null,
    [rawReport, collectedKopeks],
  );

  const statusConfig = viewModel
    ? getReportStatusConfig(viewModel.report.status, viewModel.isMaterial)
    : null;

  const reasonText =
    viewModel?.report.return_reason ?? viewModel?.report.rejection_reason ?? null;

  const showSettlement =
    viewModel?.isMaterial &&
    viewModel.report.status === 'APPROVED' &&
    viewModel.materialConfirmedKopeks != null;

  const isPartialSettlement =
    viewModel?.materialRefundKopeks != null && viewModel.materialRefundKopeks > 0;

  const handleEditReport = () => {
    if (viewModel?.isMaterial) {
      navigation.navigate('BeneficiaryMaterialReport', {
        helpRequestId,
        title,
        amountLabel:
          viewModel.materialReceivedKopeks != null
            ? formatKopeks(viewModel.materialReceivedKopeks)
            : undefined,
      });
      return;
    }
    navigation.navigate('BeneficiaryReport', { helpRequestId });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={readOnly ? 'Отчёт' : 'Мой отчёт'}
        subtitle={title ? `«${title}»` : undefined}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      ) : error || !viewModel || !statusConfig ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Отчёт не найден'}</Text>
          <Button kind="secondary" size="sm" onPress={() => void load()} style={{ marginTop: 12 }}>
            Повторить
          </Button>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>Статус отчёта</Text>
            <StatusBanner
              config={statusConfig}
              submittedAt={viewModel.report.created_at}
            />

            {reasonText && statusConfig.reasonLabel ? (
              <ModerationReasonCard
                label={statusConfig.reasonLabel}
                text={reasonText}
                author={viewModel.moderationAuthor}
                rejected={viewModel.report.status === 'REJECTED'}
              />
            ) : null}

            {showSettlement ? (
              <SettlementCard
                partial={isPartialSettlement}
                receivedKopeks={viewModel.materialReceivedKopeks ?? 0}
                confirmedKopeks={viewModel.materialConfirmedKopeks ?? 0}
                refundKopeks={viewModel.materialRefundKopeks ?? 0}
                onOpenRefund={
                  readOnly
                    ? undefined
                    : () =>
                        navigation.navigate('BeneficiaryRefundObligation', {
                          helpRequestId,
                          title,
                          receivedKopeks: viewModel.materialReceivedKopeks ?? undefined,
                          confirmedKopeks: viewModel.materialConfirmedKopeks ?? undefined,
                        })
                }
              />
            ) : null}

            <Text style={styles.sectionLabel}>
              {readOnly ? 'Описание' : 'Что вы отправили'}
            </Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{viewModel.description}</Text>
            </View>

            {viewModel.photos.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Фото · {viewModel.photos.length}</Text>
                <View style={styles.photoGrid}>
                  {viewModel.photos.map((photo) => (
                    <View key={photo.media_id} style={styles.photoCell}>
                      {photo.preview_url || photo.url ? (
                        <Image
                          source={{ uri: photo.preview_url || photo.url }}
                          style={styles.photoImage}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Icon name="camera" size={20} color={T.muted} strokeWidth={1.8} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {viewModel.isMaterial && viewModel.documents.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Документы · {viewModel.documents.length}</Text>
                <View style={styles.documentsCard}>
                  {viewModel.documents.map((doc, index) => (
                    <DocumentRow
                      key={doc.media_id}
                      name={doc.file_name ?? 'Документ'}
                      bordered={index < viewModel.documents.length - 1}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {!viewModel.isMaterial && viewModel.socialParticipants.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>
                  Кто пришёл · {viewModel.socialParticipants.length}
                </Text>
                <View style={styles.participantsCard}>
                  {viewModel.socialParticipants.map((participant, index, list) => (
                    <ParticipantRow
                      key={participant.name}
                      name={participant.name}
                      attendance={participant.attendance}
                      bordered={index < list.length - 1}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {!viewModel.isMaterial && viewModel.socialRating != null ? (
              <>
                <Text style={styles.sectionLabel}>Оценка</Text>
                <View style={styles.ratingCard}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon
                        key={star}
                        name="star"
                        size={22}
                        color={T.accent}
                        fill={star <= viewModel.socialRating! ? T.accent : 'none'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingValue}>{viewModel.socialRating.toFixed(1)}</Text>
                </View>
              </>
            ) : null}
          </ScrollView>

          {!readOnly && viewModel.report.status === 'RETURNED_TO_REWORK' ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              <Button kind="primary" size="lg" full icon="edit" onPress={handleEditReport}>
                Исправить и отправить
              </Button>
            </View>
          ) : null}

          {!readOnly && viewModel.report.status === 'REJECTED' ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              <Button
                kind="ghost"
                size="lg"
                full
                icon="chat"
                onPress={() => showSnack('Напишите в поддержку через профиль')}
              >
                Связаться с поддержкой
              </Button>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function StatusBanner({
  config,
  submittedAt,
}: {
  config: StatusConfig;
  submittedAt: string;
}) {
  return (
    <View style={[styles.statusCard, { backgroundColor: config.bg, borderColor: `${config.color}22` }]}>
      <View style={styles.statusRow}>
        <View style={styles.statusIconWrap}>
          <Icon name={config.icon} size={20} color={config.color} strokeWidth={2} />
        </View>
        <View style={styles.statusBody}>
          <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
          <Text style={[styles.statusMeta, { color: config.color }]}>
            Отправлен {formatHelpRequestDate(submittedAt)}
          </Text>
          <Text style={[styles.statusBodyText, { color: config.color }]}>{config.body}</Text>
        </View>
      </View>
    </View>
  );
}

function ModerationReasonCard({
  label,
  text,
  author,
  rejected,
}: {
  label: string;
  text: string;
  author: string | null;
  rejected: boolean;
}) {
  const accent = rejected ? T.danger : '#8B5E10';
  const bg = rejected ? T.dangerSoft : T.warningSoft;

  return (
    <View style={[styles.reasonCard, { borderColor: accent }]}>
      <View style={[styles.reasonHead, { backgroundColor: bg }]}>
        <Icon name="chat" size={16} color={accent} strokeWidth={2.2} />
        <Text style={[styles.reasonHeadText, { color: accent }]}>{label}</Text>
      </View>
      <View style={styles.reasonBody}>
        <Text style={styles.reasonText}>{text}</Text>
        {author ? <Text style={styles.reasonAuthor}>{author}</Text> : null}
      </View>
    </View>
  );
}

function SettlementCard({
  partial,
  receivedKopeks,
  confirmedKopeks,
  refundKopeks,
  onOpenRefund,
}: {
  partial: boolean;
  receivedKopeks: number;
  confirmedKopeks: number;
  refundKopeks: number;
  onOpenRefund?: () => void;
}) {
  const color = partial ? '#8B5E10' : T.success;
  const bg = partial ? T.warningSoft : T.successSoft;

  return (
    <>
      <Text style={styles.sectionLabel}>Проверка расходов</Text>
      <View style={[styles.statusCard, { backgroundColor: bg, borderColor: `${color}22` }]}>
        <View style={styles.statusRow}>
          <View style={styles.statusIconWrap}>
            <Icon name={partial ? 'warn' : 'check'} size={20} color={color} strokeWidth={2} />
          </View>
          <View style={styles.statusBody}>
            <Text style={[styles.statusTitle, { color }]}>
              {partial ? 'Подтверждено частично' : 'Расходы подтверждены'}
            </Text>
            <Text style={[styles.statusBodyText, { color }]}>
              {partial
                ? 'Партнёр подтвердил часть расходов. По разнице создано обязательство на возврат.'
                : 'Партнёр подтвердил расходы на всю полученную сумму. Заявка закрыта.'}
            </Text>
          </View>
        </View>

        <View style={styles.settlementAmountsBox}>
          <View style={styles.settlementGrid}>
            <SettlementCell label="Получено" value={formatKopeks(receivedKopeks)} />
            <SettlementCell
              label="Подтверждено"
              value={formatKopeks(confirmedKopeks)}
              accent
              highlight={!partial}
            />
            {partial ? (
              <SettlementCell label="К возврату" value={formatKopeks(refundKopeks)} danger highlight />
            ) : null}
          </View>
        </View>

        {partial && onOpenRefund ? (
          <Button kind="primary" size="sm" iconRight="arrowR" onPress={onOpenRefund}>
            Открыть обязательство
          </Button>
        ) : null}
      </View>
    </>
  );
}

function SettlementCell({
  label,
  value,
  accent,
  danger,
  highlight,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.settlementCell, highlight && styles.settlementCellHighlight]}>
      <Text style={styles.settlementHint}>{label}</Text>
      <Text
        style={[
          styles.settlementValue,
          accent && { color: T.success },
          danger && { color: T.danger },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function DocumentRow({ name, bordered }: { name: string; bordered: boolean }) {
  return (
    <View style={[styles.documentRow, bordered && styles.documentRowBorder]}>
      <View style={styles.documentIcon}>
        <Icon name="document" size={18} color={T.info} strokeWidth={2} />
      </View>
      <Text style={styles.documentName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

function ParticipantRow({
  name,
  attendance,
  bordered,
}: {
  name: string;
  attendance: 'ATTENDED' | 'LEFT_AFTER_START';
  bordered: boolean;
}) {
  return (
    <View style={[styles.participantRow, bordered && styles.participantRowBorder]}>
      <Avatar name={name} size={32} />
      <Text style={styles.participantName}>{name}</Text>
      <Chip
        size="sm"
        kind={attendance === 'ATTENDED' ? 'success' : 'warning'}
        label={attendance === 'ATTENDED' ? 'был' : 'ушла раньше'}
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  devPickerWrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  statusCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBody: {
    flex: 1,
    minWidth: 0,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_800ExtraBold',
  },
  statusMeta: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    opacity: 0.85,
    marginTop: 3,
  },
  statusBodyText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 19,
    marginTop: 10,
  },
  reasonCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  reasonHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reasonHeadText: {
    fontSize: 12,
    fontFamily: 'Manrope_800ExtraBold',
  },
  reasonBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reasonText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 20,
    marginBottom: 10,
  },
  reasonAuthor: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  descriptionCard: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 22,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  photoCell: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.borderSoft,
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
  documentsCard: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  documentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.infoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  participantsCard: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  participantRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  participantName: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  ratingCard: {
    backgroundColor: T.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.5,
  },
  settlementAmountsBox: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  settlementGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  settlementCell: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
  },
  settlementCellHighlight: {
    backgroundColor: T.surface2,
  },
  settlementHint: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  settlementValue: {
    fontSize: 15,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
});
