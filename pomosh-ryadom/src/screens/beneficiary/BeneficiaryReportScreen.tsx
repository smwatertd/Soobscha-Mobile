import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createSocialHelpRequestReport } from '../../api/helpRequests';
import { getErrorMessage } from '../../api/errors';
import { Button } from '../../components/Button';
import { HelpRequestPhotoPicker } from '../../components/beneficiary/create/HelpRequestPhotoPicker';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TextField } from '../../components/TextField';
import { DraftPhoto, getDraftMediaIds } from '../../navigation/createHelpRequestTypes';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';
import { RADIUS, T } from '../../theme/tokens';

const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 5000;

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryReport'>;

export function BeneficiaryReportScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showError } = useFeedback();

  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState<string | undefined>();
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [documents, setDocuments] = useState<DraftPhoto[]>([]);
  const [documentsUploading, setDocumentsUploading] = useState(false);
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    description.trim().length >= MIN_DESCRIPTION &&
    !photosUploading &&
    !documentsUploading &&
    !submitting;

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION) {
      setDescriptionError(`Опишите подробнее — минимум ${MIN_DESCRIPTION} символов`);
      return;
    }
    setDescriptionError(undefined);
    setSubmitting(true);
    try {
      await createSocialHelpRequestReport(route.params.helpRequestId, {
        work_description: trimmed,
        media_ids: [...getDraftMediaIds(photos), ...getDraftMediaIds(documents)],
      });
      navigation.replace('BeneficiaryReportView', {
        helpRequestId: route.params.helpRequestId,
        isMaterial: false,
      });
    } catch (err) {
      showError(getErrorMessage(err, 'Не удалось отправить отчёт'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Отчёт о выполнении" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Icon name="check" size={24} color="#fff" strokeWidth={2.5} />
          </View>
          <View style={styles.successBody}>
            <Text style={styles.successTitle}>Расскажите, как всё прошло</Text>
            <Text style={styles.successText}>
              Состав волонтёров уже зафиксирован при завершении встречи. Здесь — только текст,
              фото и оценка.
            </Text>
          </View>
        </View>

        <TextField
          label="Как всё прошло?"
          multiline
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            if (descriptionError) setDescriptionError(undefined);
          }}
          error={descriptionError}
          maxLength={MAX_DESCRIPTION}
          placeholder="Например: Алексей и Дмитрий помогли убрать листву со всего участка."
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Фото после</Text>
          <HelpRequestPhotoPicker
            value={photos}
            onChange={setPhotos}
            onUploadingChange={setPhotosUploading}
            imagesOnly
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Документы · по желанию</Text>
          <HelpRequestPhotoPicker
            value={documents}
            onChange={setDocuments}
            onUploadingChange={setDocumentsUploading}
            documentsOnly
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Оцените помощь</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => {
              const active = s <= rating;
              return (
                <Pressable key={s} onPress={() => setRating(s)} hitSlop={6}>
                  <Icon
                    name="star"
                    size={36}
                    color={active ? T.accent : T.border}
                    fill={active ? T.accent : 'none'}
                    strokeWidth={1.5}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="ghost" size="lg" style={styles.footerSecondary} onPress={() => navigation.goBack()}>
          Отмена
        </Button>
        <Button
          kind="primary"
          size="lg"
          iconRight="check"
          style={styles.footerPrimary}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? 'Отправка…' : 'Отправить на проверку'}
        </Button>
      </View>
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
  scrollContent: {
    paddingHorizontal: 20,
    gap: 18,
    paddingTop: 4,
  },
  successCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: T.successSoft,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  successIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: T.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBody: {
    flex: 1,
    minWidth: 0,
  },
  successTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: T.success,
  },
  successText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#3D6940',
    lineHeight: 17,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  footerSecondary: { flex: 1, minWidth: 0 },
  footerPrimary: { flex: 1, minWidth: 0 },
});
