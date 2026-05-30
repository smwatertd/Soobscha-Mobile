import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createMaterialHelpRequestReport } from '../../api/helpRequests';
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

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryMaterialReport'>;

export function BeneficiaryMaterialReportScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showError } = useFeedback();
  const { helpRequestId, title, amountLabel } = route.params;

  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState<string | undefined>();
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [photosUploading, setPhotosUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const headerSubtitle = useMemo(() => {
    if (title && amountLabel) return `«${title}» · ${amountLabel}`;
    return title ?? amountLabel;
  }, [amountLabel, title]);

  const canSubmit =
    description.trim().length >= MIN_DESCRIPTION && !photosUploading && !submitting;

  const handleSubmit = async () => {
    const trimmed = description.trim();
    if (trimmed.length < MIN_DESCRIPTION) {
      setDescriptionError(`Опишите подробнее — минимум ${MIN_DESCRIPTION} символов`);
      return;
    }
    setDescriptionError(undefined);
    setSubmitting(true);
    try {
      await createMaterialHelpRequestReport(helpRequestId, {
        purchases_description: trimmed,
        media_ids: getDraftMediaIds(photos),
      });
      navigation.replace('BeneficiaryReportView', {
        helpRequestId,
        title,
        isMaterial: true,
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
      <ScreenHeader
        title="Отчёт по сбору"
        subtitle={headerSubtitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hintCard}>
          <Icon name="info" size={20} color={T.primary} strokeWidth={2} />
          <Text style={styles.hintText}>
            Опишите, на что вы потратили деньги, и приложите фото или сканы чеков. Партнёр
            проверит и подтвердит сумму. Если что-то не подтвердится — появится обязательство
            по возврату.
          </Text>
        </View>

        <TextField
          label="Опишите покупки и расходы"
          multiline
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (descriptionError) setDescriptionError(undefined);
          }}
          error={descriptionError}
          maxLength={MAX_DESCRIPTION}
          placeholder="Например: прошли курс реабилитации, купили ортопедические стельки и трость."
        />
        <Text style={styles.fieldHelper}>
          Расскажите, на что и в каком объёме потратили средства. Сумм построчно вводить не
          нужно — партнёр посчитает по чекам.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Фото и чеки</Text>
          <Text style={styles.sectionHint}>
            Приложите фото чеков, квитанций и результата. JPG, PNG, HEIC · до 50 МБ каждый.
          </Text>
          <HelpRequestPhotoPicker
            value={photos}
            onChange={setPhotos}
            onUploadingChange={setPhotosUploading}
            imagesOnly
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="ghost" size="lg" onPress={() => navigation.goBack()}>
          Отмена
        </Button>
        <Button
          kind="accent"
          size="lg"
          style={styles.submitBtn}
          iconRight="arrowR"
          onPress={() => void handleSubmit()}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  hintCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: RADIUS.md,
    backgroundColor: T.primarySoft,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 18,
  },
  fieldHelper: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 17,
    marginTop: -8,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 17,
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
  submitBtn: {
    flex: 1,
  },
});
