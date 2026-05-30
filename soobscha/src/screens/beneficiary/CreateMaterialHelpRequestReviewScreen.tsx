import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  createMaterialHelpRequest,
  updateMaterialHelpRequest,
} from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
import { FieldError } from '../../components/beneficiary/create/FieldError';
import { HelpRequestEditFeedbackCard } from '../../components/beneficiary/create/HelpRequestEditFeedbackCard';
import { CreateRequestStepLayout } from '../../components/beneficiary/create/CreateRequestStepLayout';
import { Icon } from '../../components/Icon';
import { MediaFullscreenViewer } from '../../components/media/MediaFullscreenViewer';
import { MediaImageCarousel } from '../../components/media/MediaImageCarousel';
import { HelpRequestPreviewAuthor } from '../../components/beneficiary/create/HelpRequestPreviewAuthor';
import { ProgressBar } from '../../components/ProgressBar';
import {
  buildCreateMaterialHelpRequestPayload,
  buildUpdateMaterialHelpRequestPayload,
} from '../../navigation/createHelpRequestTypes';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useBeneficiaryPreviewProfile } from '../../hooks/useBeneficiaryPreviewProfile';
import { useMaterialHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { useFeedback } from '../../providers/FeedbackProvider';
import { isImageContentType } from '../../utils/helpRequestPhotos';
import { formatRublesPlain } from '../../utils/money';
import { INLINE_SECTION_BG, RADIUS, T, CARD_BG } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateMaterialHelpRequestReview'>;
};

const CHECKLIST = [
  'Сумма соответствует запланированным расходам',
  'Цель сбора описана понятно и без преувеличений',
  'Документы подтверждают цель',
];

export function CreateMaterialHelpRequestReviewScreen({ navigation }: Props) {
  const { showError, showSnack } = useFeedback();
  const {
    draft,
    getDraft,
    resetDraft,
    isEditMode,
    editingHelpRequestId,
    clearEdit,
    editModerationFeedback,
  } = useMaterialHelpRequestDraft();
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => CHECKLIST.map(() => false));
  const [checklistError, setChecklistError] = useState<string | undefined>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const beneficiaryProfile = useBeneficiaryPreviewProfile();

  const imageItems = useMemo(
    () => draft.photos.filter((photo) => isImageContentType(photo.contentType)),
    [draft.photos],
  );

  const allChecked = useMemo(() => checked.every(Boolean), [checked]);

  const toggleChecklistItem = (index: number) => {
    setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
    if (checklistError) {
      setChecklistError(undefined);
    }
  };

  const handleSubmit = async () => {
    if (!allChecked) {
      setChecklistError('Подтвердите все пункты перед отправкой');
      return;
    }

    setChecklistError(undefined);
    setSubmitting(true);
    try {
      const payload = isEditMode
        ? buildUpdateMaterialHelpRequestPayload(getDraft())
        : buildCreateMaterialHelpRequestPayload(getDraft());

      if (isEditMode && editingHelpRequestId) {
        await updateMaterialHelpRequest(editingHelpRequestId, payload);
        const requestId = editingHelpRequestId;
        resetDraft();
        clearEdit();
        navigation.reset({
          index: 1,
          routes: [
            { name: 'BeneficiaryMain' },
            { name: 'BeneficiaryHelpRequestDetail', params: { helpRequestId: requestId } },
          ],
        });
        showSnack('Сбор отправлен на повторную проверку', 'success');
        return;
      }

      const response = await createMaterialHelpRequest(payload);
      resetDraft();
      navigation.reset({
        index: 1,
        routes: [
          { name: 'BeneficiaryMain' },
          { name: 'BeneficiaryHelpRequestDetail', params: { helpRequestId: response.id } },
        ],
      });
    } catch (err) {
      showError(
        getErrorMessage(
          err,
          isEditMode ? 'Не удалось сохранить изменения' : 'Не удалось отправить сбор',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <CreateRequestStepLayout
        title={isEditMode ? 'Проверьте изменения' : 'Предпросмотр'}
        step={4}
        stepHint="сбор средств"
        variant="material"
        onBack={() => navigation.goBack()}
        onNext={handleSubmit}
        nextLabel={
          submitting
            ? 'Отправка…'
            : isEditMode
              ? 'Исправить и отправить'
              : 'Отправить на проверку'
        }
        nextIcon="check"
        nextDisabled={submitting}
      >
        {isEditMode && editModerationFeedback?.returnReason ? (
          <HelpRequestEditFeedbackCard feedback={editModerationFeedback} />
        ) : null}

        <Text style={styles.lead}>
          Так заявка будет выглядеть в ленте у волонтёров:
        </Text>

        <View style={styles.previewCard}>
          <View style={styles.previewHero}>
            <MediaImageCarousel
              items={draft.photos}
              onImagePress={(index) => {
                setViewerIndex(index);
                setViewerOpen(true);
              }}
            />
            <View style={styles.typeBadge}>
              <Icon name="coin" size={14} color={T.accentDark} strokeWidth={2.2} />
              <Text style={styles.typeBadgeText}>Сбор</Text>
            </View>
          </View>

          <View style={styles.previewBody}>
            <HelpRequestPreviewAuthor
              name={beneficiaryProfile.name}
              categoryLabel={beneficiaryProfile.categoryLabel}
            />
            <Text style={styles.previewTitle}>{draft.title}</Text>
            {draft.categoryLabel ? (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{draft.categoryLabel}</Text>
              </View>
            ) : null}
            <View style={styles.progressBlock}>
              <ProgressBar value={0} max={draft.amountRubles} color={T.accent} bg={T.accentSoft} height={6} />
              <View style={styles.progressRow}>
                <Text style={styles.progressCurrent}>0 ₽</Text>
                <Text style={styles.progressGoal}>
                  из {formatRublesPlain(draft.amountRubles)} ₽
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.noteBox}>
          <View style={styles.noteIcon}>
            <Icon name="shield" size={20} color="#8B5E10" strokeWidth={2} />
          </View>
          <View style={styles.noteBody}>
            <Text style={styles.noteTitle}>Что дальше?</Text>
            <Text style={styles.noteText}>
              Партнёр проверит цель сбора и документы до 24 часов. После одобрения сбор появится в ленте волонтёров.
            </Text>
          </View>
        </View>

        <Text style={styles.checklistTitle}>Перед отправкой</Text>
        {CHECKLIST.map((item, index) => (
          <Pressable
            key={item}
            onPress={() => toggleChecklistItem(index)}
            style={[styles.checkRow, index < CHECKLIST.length - 1 && styles.checkRowBorder]}
          >
            <View style={[styles.checkIcon, checked[index] && styles.checkIconOn]}>
              {checked[index] && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
            </View>
            <Text style={styles.checkText}>{item}</Text>
          </Pressable>
        ))}
        <FieldError message={checklistError} />

        {submitting && (
          <View style={styles.loading}>
            <ActivityIndicator color={T.accent} />
          </View>
        )}
      </CreateRequestStepLayout>

      <MediaFullscreenViewer
        visible={viewerOpen}
        items={imageItems}
        initialIndex={viewerIndex}
        subtitle="Фото сбора"
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 18,
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: INLINE_SECTION_BG,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  previewHero: {
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.accentDark,
  },
  previewBody: {
    padding: 14,
    gap: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: T.surface2,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  progressBlock: {
    marginTop: 4,
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  progressCurrent: {
    fontSize: 17,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.3,
  },
  progressGoal: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  noteBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: T.warningSoft,
    borderRadius: RADIUS.md,
  },
  noteIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBody: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: '#7A5210',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#7A5210',
    lineHeight: 18,
  },
  checklistTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginTop: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  checkRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkIconOn: {
    backgroundColor: T.accent,
    borderColor: T.accent,
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 20,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
