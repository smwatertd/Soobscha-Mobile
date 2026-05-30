import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createSocialHelpRequest, updateSocialHelpRequest } from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
import { FieldError } from '../../components/beneficiary/create/FieldError';
import { HelpRequestEditFeedbackCard } from '../../components/beneficiary/create/HelpRequestEditFeedbackCard';
import { CreateRequestStepLayout } from '../../components/beneficiary/create/CreateRequestStepLayout';
import { Icon } from '../../components/Icon';
import { MediaFullscreenViewer } from '../../components/media/MediaFullscreenViewer';
import { MediaImageCarousel } from '../../components/media/MediaImageCarousel';
import { HelpRequestSkillsSummary } from '../../components/beneficiary/create/HelpRequestSkillsSummary';
import { Chip } from '../../components/Chip';
import { HelpRequestPreviewAuthor } from '../../components/beneficiary/create/HelpRequestPreviewAuthor';
import {
  buildCreateSocialHelpRequestPayload,
  buildUpdateSocialHelpRequestPayload,
  formatDisplayLocation,
  formatSelectedDateTime,
  formatVolunteerRange,
  sortDraftPhotos,
} from '../../navigation/createHelpRequestTypes';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import { useSocialHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { useBeneficiaryPreviewProfile } from '../../hooks/useBeneficiaryPreviewProfile';
import { isImageContentType } from '../../utils/helpRequestPhotos';
import { INLINE_SECTION_BG, RADIUS, T, CARD_BG } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateHelpRequestReview'>;
};

const CHECKLIST = [
  'Адрес соответствует тому, куда подъедут волонтёры',
  'Фото показывают задачу так, как она есть',
  'В описании нет личных данных третьих лиц',
];

export function CreateHelpRequestReviewScreen({ navigation }: Props) {
  const { showError, showSnack } = useFeedback();
  const {
    draft,
    getDraft,
    resetDraft,
    isEditMode,
    editingHelpRequestId,
    clearEdit,
    editModerationFeedback,
  } = useSocialHelpRequestDraft();
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => CHECKLIST.map(() => false));
  const [checklistError, setChecklistError] = useState<string | undefined>();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const beneficiaryProfile = useBeneficiaryPreviewProfile();

  const imageItems = useMemo(
    () =>
      sortDraftPhotos(draft.photos.filter((photo) => isImageContentType(photo.contentType))),
    [draft.photos],
  );

  const typeLabel = 'Своим временем';
  const typeIcon = 'handshake' as const;

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
        ? buildUpdateSocialHelpRequestPayload(getDraft())
        : buildCreateSocialHelpRequestPayload(getDraft());

      if (isEditMode && editingHelpRequestId) {
        await updateSocialHelpRequest(editingHelpRequestId, payload);
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
        showSnack('Заявка отправлена на повторную проверку', 'success');
        return;
      }

      const response = await createSocialHelpRequest(payload);
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
          isEditMode ? 'Не удалось сохранить изменения' : 'Не удалось отправить заявку',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <CreateRequestStepLayout
        title={isEditMode ? 'Проверьте изменения' : 'Проверьте заявку'}
        step={5}
        onBack={() => navigation.goBack()}
        onNext={handleSubmit}
        nextLabel={
          submitting ? 'Отправка…' : isEditMode ? 'Исправить и отправить' : 'Отправить'
        }
        nextIcon="check"
        nextDisabled={submitting}
      >
        {isEditMode && editModerationFeedback?.returnReason ? (
          <HelpRequestEditFeedbackCard feedback={editModerationFeedback} />
        ) : null}

        <View style={styles.previewCard}>
          <MediaImageCarousel
            items={draft.photos}
            onImagePress={(index) => {
              setViewerIndex(index);
              setViewerOpen(true);
            }}
          />
          <View style={styles.previewBody}>
            <HelpRequestPreviewAuthor
              name={beneficiaryProfile.name}
              categoryLabel={beneficiaryProfile.categoryLabel}
            />
            <View style={styles.previewChips}>
              <View style={styles.typeChip}>
                <Icon name={typeIcon} size={13} color={T.primaryDark} />
                <Text style={styles.typeChipText}>{typeLabel}</Text>
              </View>
              {beneficiaryProfile.categoryLabel ? (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{beneficiaryProfile.categoryLabel}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.previewTitle}>{draft.title}</Text>
            <View style={styles.previewMeta}>
              <View style={styles.metaItem}>
                <Icon name="calendar" size={13} color={T.muted} />
                <Text style={styles.metaText}>{formatSelectedDateTime(draft.dateIso, draft.time)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="pin" size={13} color={T.muted} />
                <Text style={styles.metaText}>{formatDisplayLocation(draft.address)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="user" size={13} color={T.muted} />
                <Text style={styles.metaText}>
                  {formatVolunteerRange(draft.minVolunteers, draft.maxVolunteers)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <HelpRequestSkillsSummary
          requiredSkills={draft.requiredSkills}
          preferredSkills={draft.preferredSkills}
        />

        {draft.bringItems.length > 0 ? (
          <View style={styles.bringItemsBox}>
            <Text style={styles.bringItemsTitle}>Что взять с собой</Text>
            <View style={styles.bringItemsChips}>
              {draft.bringItems.map((item) => (
                <Chip key={item} label={item} active />
              ))}
            </View>
          </View>
        ) : null}

        {draft.extraNotes ? (
          <View style={styles.extraNotesBox}>
            <Text style={styles.extraNotesTitle}>Дополнительно</Text>
            <Text style={styles.extraNotesText}>{draft.extraNotes}</Text>
          </View>
        ) : null}

        <View style={styles.noteBox}>
          <View style={styles.noteIcon}>
            <Icon name="shield" size={20} color="#8B5E10" strokeWidth={2} />
          </View>
          <View style={styles.noteBody}>
            <Text style={styles.noteTitle}>Что дальше?</Text>
            <Text style={styles.noteText}>
              {isEditMode
                ? 'После отправки заявка снова уйдёт на проверку партнёру. Обычно ответ приходит в течение 24 часов.'
                : 'Партнёр проверит заявку до 24 часов и пришлёт уведомление. После одобрения волонтёры увидят её в ленте.'}
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
            <ActivityIndicator color={T.primary} />
          </View>
        )}
      </CreateRequestStepLayout>

      <MediaFullscreenViewer
        visible={viewerOpen}
        items={imageItems}
        initialIndex={viewerIndex}
        subtitle="Фото заявки"
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    backgroundColor: INLINE_SECTION_BG,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: 4,
  },
  previewBody: {
    padding: 16,
    gap: 8,
  },
  previewChips: {
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
    backgroundColor: T.primarySoft,
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primaryDark,
  },
  categoryChip: {
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
  previewTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 21,
  },
  previewMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    flexShrink: 1,
  },
  bringItemsBox: {
    paddingVertical: 4,
    gap: 10,
  },
  bringItemsTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  bringItemsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  extraNotesBox: {
    paddingVertical: 4,
    gap: 4,
  },
  extraNotesTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  extraNotesText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 19,
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
    backgroundColor: T.primary,
    borderColor: T.primary,
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
