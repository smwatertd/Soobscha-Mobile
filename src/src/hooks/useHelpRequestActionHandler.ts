import { useCallback, useState } from 'react';
import { HelpRequestReasonActionKind } from '../components/beneficiary/detail/HelpRequestReasonSheet';
import { HelpRequestActionId } from '../utils/helpRequestAvailableActions';
import { useFeedback } from '../providers/FeedbackProvider';

type Params = {
  onSessionExpired?: () => void;
  onSuccess?: () => void;
  onEditHelpRequest?: () => void;
  onConfirmRelevance?: () => void;
  onCreatePayout?: () => void;
  onCreateReport?: () => void;
};

export function useHelpRequestActionHandler({
  onSessionExpired,
  onSuccess,
  onEditHelpRequest,
  onConfirmRelevance,
  onCreatePayout,
  onCreateReport,
}: Params) {
  const { showError, showSnack } = useFeedback();
  const [reasonSheet, setReasonSheet] = useState<HelpRequestReasonActionKind | null>(null);

  const closeReasonSheet = useCallback(() => {
    setReasonSheet(null);
  }, []);

  const handleReasonSuccess = useCallback(() => {
    setReasonSheet(null);
    onSuccess?.();
  }, [onSuccess]);

  const handleAction = useCallback(
    async (actionId: HelpRequestActionId) => {
      switch (actionId) {
        case 'cancel':
          setReasonSheet('cancel');
          return;
        case 'interrupt':
          setReasonSheet('interrupt');
          return;
        case 'update':
          if (onEditHelpRequest) {
            onEditHelpRequest();
            return;
          }
          showError('Редактирование заявки скоро будет доступно в приложении');
          return;
        case 'create_payout':
          if (onCreatePayout) {
            onCreatePayout();
            return;
          }
          showError('Запрос выплаты скоро будет доступен в приложении');
          return;
        case 'create_report':
          if (onCreateReport) {
            onCreateReport();
            return;
          }
          showError('Подготовка отчёта скоро будет доступна в приложении');
          return;
        case 'confirm_relevance':
          if (onConfirmRelevance) {
            onConfirmRelevance();
            return;
          }
          showError('Подтверждение актуальности скоро будет доступно в приложении');
          return;
        default:
          showError('Действие пока не поддерживается в приложении');
      }
    },
    [onConfirmRelevance, onCreatePayout, onCreateReport, onEditHelpRequest, showError],
  );

  return {
    handleAction,
    reasonSheet,
    closeReasonSheet,
    handleReasonSuccess,
    showReasonError: (message: string) => showError(message, { mode: 'snackbar' }),
    showReasonSuccess: (message: string) => showSnack(message, 'success'),
    onSessionExpired,
  };
}
