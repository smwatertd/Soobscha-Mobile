import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Button } from '../../components/Button';
import { Icon, IconName } from '../../components/Icon';
import { MediaFullscreenViewer } from '../../components/media/MediaFullscreenViewer';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useBeneficiaryHelpRequestDetail } from '../../hooks/useBeneficiaryHelpRequestDetail';
import { useHelpRequestActionHandler } from '../../hooks/useHelpRequestActionHandler';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import {
  HelpRequestActionButton,
  HelpRequestActionId,
  mapAvailableActions,
} from '../../utils/helpRequestAvailableActions';
import { isImageContentType } from '../../utils/helpRequestPhotos';
import { formatHelpRequestDate } from '../../utils/helpRequestStatus';
import { T } from '../../theme/tokens';
import { BeneficiaryMaterialRequestDetail } from './detail/BeneficiaryMaterialRequestDetail';
import { BeneficiarySocialRequestDetail } from './detail/BeneficiarySocialRequestDetail';
import { participantDisplayName, formatKopeks, getMaterialAmounts } from './detail/detailHelpers';
import { HelpRequestReasonSheet } from '../../components/beneficiary/detail/HelpRequestReasonSheet';
import { useMaterialHelpRequestDraft, useSocialHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { hydrateMaterialHelpRequestDraft } from '../../utils/hydrateMaterialHelpRequestDraft';
import { hydrateSocialHelpRequestDraft } from '../../utils/hydrateSocialHelpRequestDraft';

function shouldOpenReportCreate(status: string, availableActions?: string[]): boolean {
  if (status === 'WAITING_REPORT' || status === 'REPORT_OVERDUE') {
    return true;
  }
  return (availableActions ?? []).includes('CREATE_REPORT');
}

function shouldOpenReportView(status: string): boolean {
  return ['REPORT_ON_REVIEW', 'REPORT_ON_MODERATION', 'COMPLETED'].includes(status);
}

const FOOTER_ACTION_ORDER: HelpRequestActionId[] = [
  'start',
  'finish',
  'cancel',
  'update',
  'interrupt',
  'create_payout',
  'create_report',
  'confirm_relevance',
  'unknown',
];

function footerActionIcon(id: HelpRequestActionId): IconName | undefined {
  switch (id) {
    case 'start':
    case 'finish':
      return 'check';
    case 'cancel':
    case 'interrupt':
      return 'close';
    case 'update':
      return 'edit';
    case 'create_report':
      return 'document';
    case 'confirm_relevance':
      return 'check';
    default:
      return undefined;
  }
}
function sortFooterActions(actions: HelpRequestActionButton[]): HelpRequestActionButton[] {
  return [...actions].sort(
    (a, b) => FOOTER_ACTION_ORDER.indexOf(a.id) - FOOTER_ACTION_ORDER.indexOf(b.id),
  );
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryHelpRequestDetail'>;
  route: RouteProp<RootStackParamList, 'BeneficiaryHelpRequestDetail'>;
  onSessionExpired?: () => void;
};

export function BeneficiaryHelpRequestDetailScreen({
  navigation,
  route,
  onSessionExpired,
}: Props) {
  const { helpRequestId } = route.params;
  const insets = useSafeAreaInsets();
  const { showError, showSnack } = useFeedback();
  const { data, loading, refreshing, error, refresh } = useBeneficiaryHelpRequestDetail(
    helpRequestId,
    onSessionExpired,
  );

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const isMaterial = data?.isMaterial ?? false;
  const { beginEdit: beginSocialEdit } = useSocialHelpRequestDraft();
  const { beginEdit: beginMaterialEdit } = useMaterialHelpRequestDraft();

  const startEditHelpRequest = useCallback(() => {
    if (!data?.request) return;

    if (data.isMaterial) {
      beginMaterialEdit(
        helpRequestId,
        hydrateMaterialHelpRequestDraft(data.request, data.categoryLabel),
        data.moderationFeedback,
      );
      navigation.navigate('CreateMaterialHelpRequestDetails', { type: 'material', editMode: true });
      return;
    }

    beginSocialEdit(
      helpRequestId,
      hydrateSocialHelpRequestDraft(data.request, data.categoryLabel),
      data.moderationFeedback,
    );
    navigation.navigate('CreateHelpRequestDetails', { type: 'social', editMode: true });
  }, [beginMaterialEdit, beginSocialEdit, helpRequestId, navigation, data]);

  const scheduleLabel = useMemo(() => {
    if (!data?.request?.start_at) return undefined;
    return new Date(data.request.start_at).toLocaleString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [data?.request?.start_at]);

  const {
    handleAction,
    reasonSheet,
    closeReasonSheet,
    handleReasonSuccess,
    showReasonError,
    showReasonSuccess,
  } = useHelpRequestActionHandler({
    onSessionExpired,
    onSuccess: refresh,
    onEditHelpRequest: startEditHelpRequest,
    onConfirmRelevance: () => {
      if (!data?.request) return;
      navigation.navigate('SocialHelpRequestRelevance', {
        helpRequestId,
        title: data.request.title,
        scheduleLabel,
      });
    },
  });

  const joinedVolunteers =
    data?.request.participants?.joined ?? data?.participants.length ?? 0;

  const footerActions = useMemo(() => {
    const mapped = sortFooterActions(mapAvailableActions(data?.request.available_actions, isMaterial));

    if (isMaterial || !data?.request) return mapped;

    const status = data.request.status;
    const result = [...mapped];
    const hasStart = result.some((action) => action.id === 'start');
    const hasFinish = result.some((action) => action.id === 'finish');

    if (status === 'WAITING_START' && !hasStart) {
      result.unshift({
        id: 'start',
        raw: 'start_execution',
        label: 'Начать встречу',
        kind: 'primary',
      });
    }

    if (status === 'IN_PROGRESS' && !hasFinish) {
      result.unshift({
        id: 'finish',
        raw: 'finish_execution',
        label: 'Встреча идёт',
        kind: 'primary',
      });
    }

    return result.map((action) => {
      if (action.id === 'cancel') {
        return {
          ...action,
          label: status === 'PENDING_MODERATION' ? 'Отменить заявку' : 'Отменить',
          labelColor: '#C75653',
          kind: 'ghost' as const,
        };
      }
      return action;
    });
  }, [data?.request, isMaterial]);

  const handleOpenVolunteers = () => {
    navigation.navigate('VolunteersList', {
      helpRequestId,
      scheduleLabel,
    });
  };

  const handleOpenDonations = () => {
    if (!data?.request) return;
    const { collected } = getMaterialAmounts(data.request);
    const donationsCount =
      data.request.donations?.succeeded_count ??
      data.request.donations?.count ??
      0;
    navigation.navigate('BeneficiaryDonationsList', {
      helpRequestId,
      donationsCount,
      collectedKopeks: collected,
    });
  };

  const handleOpenPayouts = () => {
    if (!data?.request) return;
    const { withdrawn } = getMaterialAmounts(data.request);
    navigation.navigate('BeneficiaryPayoutsList', {
      helpRequestId,
      withdrawnKopeks: withdrawn,
    });
  };

  const handleOpenMaterialReportCreate = () => {
    const { requested } = data?.request
      ? getMaterialAmounts(data.request)
      : { requested: 0 };
    navigation.navigate('BeneficiaryMaterialReport', {
      helpRequestId,
      title: data?.request.title,
      amountLabel: requested > 0 ? formatKopeks(requested) : undefined,
    });
  };

  const handleOpenSocialReportCreate = () => {
    navigation.navigate('BeneficiaryReport', { helpRequestId });
  };

  const handleOpenReportView = () => {
    navigation.navigate('BeneficiaryReportView', {
      helpRequestId,
      title: data?.request.title,
      isMaterial,
    });
  };

  const handleOpenReport = () => {
    if (!data?.request) return;
    const { status, available_actions } = data.request;

    if (shouldOpenReportView(status) && !shouldOpenReportCreate(status, available_actions)) {
      handleOpenReportView();
      return;
    }

    if (shouldOpenReportCreate(status, available_actions)) {
      if (isMaterial) {
        handleOpenMaterialReportCreate();
      } else {
        handleOpenSocialReportCreate();
      }
      return;
    }

    handleOpenReportView();
  };

  const handleWorkflowPress = () => {
    if (!data?.request) return;
    const status = data.request.status;

    if (isMaterial) {
      handleOpenReport();
      return;
    }

    switch (status) {
      case 'WAITING_START':
        navigation.navigate('BeneficiaryStartMeeting', { helpRequestId });
        return;
      case 'IN_PROGRESS':
        navigation.navigate('BeneficiaryMeetingInProgress', { helpRequestId });
        return;
      case 'WAITING_REPORT':
      case 'REPORT_ON_REVIEW':
      case 'REPORT_ON_MODERATION':
      case 'COMPLETED':
        handleOpenReport();
        return;
      default:
        break;
    }
  };

  const handleFooterPress = (action: HelpRequestActionButton) => {
    switch (action.id) {
      case 'start':
        navigation.navigate('BeneficiaryStartMeeting', { helpRequestId });
        return;
      case 'finish':
        navigation.navigate('BeneficiaryMeetingInProgress', { helpRequestId });
        return;
      case 'create_payout':
        navigation.navigate('BeneficiaryPayoutRequest', {
          helpRequestId,
          title: data?.request.title ?? 'Мой сбор',
        });
        return;
      case 'create_report':
        handleOpenReport();
        return;
      default:
        handleAction(action.id);
    }
  };

  const imageViewerItems = useMemo(
    () =>
      (data?.mediaItems ?? [])
        .filter((item) => isImageContentType(item.contentType))
        .map((item) => ({
          id: item.mediaId,
          uri: item.previewUrl || item.url || '',
          fileName: item.fileName,
          contentType: item.contentType,
        }))
        .filter((item) => item.uri),
    [data?.mediaItems],
  );

  const viewerSubtitle = useMemo(() => {
    if (!data?.request) return 'Фото заявки';
    const date = formatHelpRequestDate(data.request.created_at);
    return isMaterial ? `Мой сбор · ${date}` : `Заявка · ${date}`;
  }, [data?.request, isMaterial]);

  const openMedia = (imageIndex: number) => {
    if (!imageViewerItems[imageIndex]) return;
    setViewerIndex(imageIndex);
    setViewerOpen(true);
  };

  const headerTitle = isMaterial ? 'Мой сбор' : 'Статус заявки';
  const showLoading = loading && !data;
  const showErrorState = Boolean(error || !data?.request);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader
        title={headerTitle}
        onBack={() => navigation.goBack()}
        right={<View style={styles.headerAction} />}
      />

      {showLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      ) : showErrorState ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? 'Заявка не найдена'}</Text>
          <Button kind="secondary" size="sm" onPress={refresh} style={{ marginTop: 12 }}>
            Повторить
          </Button>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: footerActions.length > 0 ? 16 : insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={T.primary} />
            }
          >
            {data ? (
              isMaterial ? (
                <BeneficiaryMaterialRequestDetail
                  data={data}
                  onOpenMedia={openMedia}
                  onWorkflowPress={handleWorkflowPress}
                  onOpenAllDonations={handleOpenDonations}
                  onOpenAllPayouts={handleOpenPayouts}
                />
              ) : (
                <BeneficiarySocialRequestDetail
                  data={data}
                  onOpenMedia={openMedia}
                  onOpenVolunteers={handleOpenVolunteers}
                  onWorkflowPress={handleWorkflowPress}
                />
              )
            ) : null}
          </ScrollView>

          {footerActions.length > 0 && (
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              {footerActions.map((action) => (
                <Button
                  key={action.raw}
                  kind={action.kind}
                  size="lg"
                  icon={footerActionIcon(action.id)}
                  labelColor={action.labelColor}
                  style={
                    footerActions.length > 1
                      ? action.kind === 'ghost'
                        ? styles.footerBtnSecondary
                        : styles.footerBtnPrimary
                      : styles.footerBtnSingle
                  }
                  onPress={() => handleFooterPress(action)}
                >
                  {action.label}
                </Button>
              ))}
            </View>
          )}
        </>
      )}

      <MediaFullscreenViewer
        visible={viewerOpen}
        items={imageViewerItems}
        initialIndex={viewerIndex}
        subtitle={viewerSubtitle}
        onClose={() => setViewerOpen(false)}
        onSaved={(message) => showSnack(message, 'success')}
        onError={(message) => showError(message, { mode: 'snackbar' })}
      />

      {reasonSheet ? (
        <HelpRequestReasonSheet
          visible
          kind={reasonSheet}
          helpRequestId={helpRequestId}
          isMaterial={isMaterial}
          joinedVolunteers={joinedVolunteers}
          onClose={closeReasonSheet}
          onSuccess={handleReasonSuccess}
          onSessionExpired={onSessionExpired}
          onError={showReasonError}
          onSuccessMessage={showReasonSuccess}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scroll: {
    flex: 1,
  },
  devPickerWrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerAction: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
  footerBtnSingle: {
    flex: 1,
    minWidth: 0,
  },
  footerBtnPrimary: {
    flex: 1.4,
    minWidth: 0,
  },
  footerBtnSecondary: {
    flex: 1,
    minWidth: 0,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
});
