import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HelpRequestEditFeedbackCard } from '../../components/beneficiary/create/HelpRequestEditFeedbackCard';
import { CreateRequestStepLayout } from '../../components/beneficiary/create/CreateRequestStepLayout';
import { HelpRequestPhotoPicker } from '../../components/beneficiary/create/HelpRequestPhotoPicker';
import { MoneyAmountInput } from '../../components/beneficiary/create/MoneyAmountInput';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  MATERIAL_AMOUNT_DOCS_THRESHOLD_RUB,
  MATERIAL_AMOUNT_MAX_RUB,
  MATERIAL_AMOUNT_MIN_RUB,
} from '../../navigation/createHelpRequestTypes';
import { DraftPhoto, sortDraftPhotos } from '../../navigation/createHelpRequestTypes';
import { useMaterialHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { formatRublesPlain } from '../../utils/money';
import { MAX_HELP_REQUEST_PHOTOS } from '../../utils/helpRequestPhotos';
import { T } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateMaterialHelpRequestAmount'>;
};

const PUBLIC_PHOTO_MAX = 5;
const DOCUMENT_MAX = 10;

function isPublicPhoto(photo: DraftPhoto): boolean {
  return photo.kind !== 'document';
}

function isDocumentPhoto(photo: DraftPhoto): boolean {
  return photo.kind === 'document';
}

function mergePhotos(publicPhotos: DraftPhoto[], documents: DraftPhoto[]): DraftPhoto[] {
  return [...sortDraftPhotos(publicPhotos), ...sortDraftPhotos(documents)];
}

export function CreateMaterialHelpRequestAmountScreen({ navigation }: Props) {
  const { draft, patchDraft, getDraft, isEditMode, editModerationFeedback } =
    useMaterialHelpRequestDraft();
  const [photosUploading, setPhotosUploading] = useState(false);
  const [amountError, setAmountError] = useState<string | undefined>();
  const [publicPhotosError, setPublicPhotosError] = useState<string | undefined>();
  const [documentsError, setDocumentsError] = useState<string | undefined>();

  const publicPhotos = useMemo(
    () => sortDraftPhotos(draft.photos.filter(isPublicPhoto)),
    [draft.photos],
  );
  const documentPhotos = useMemo(
    () => sortDraftPhotos(draft.photos.filter(isDocumentPhoto)),
    [draft.photos],
  );

  const validate = (): boolean => {
    let valid = true;

    if (draft.amountRubles < MATERIAL_AMOUNT_MIN_RUB) {
      setAmountError(`Минимальная сумма — ${formatRublesPlain(MATERIAL_AMOUNT_MIN_RUB)} ₽`);
      valid = false;
    } else if (draft.amountRubles > MATERIAL_AMOUNT_MAX_RUB) {
      setAmountError(`Максимальная сумма — ${formatRublesPlain(MATERIAL_AMOUNT_MAX_RUB)} ₽`);
      valid = false;
    } else {
      setAmountError(undefined);
    }

    if (photosUploading) {
      setPublicPhotosError('Дождитесь окончания загрузки файлов');
      setDocumentsError('Дождитесь окончания загрузки файлов');
      valid = false;
    } else {
      const failedPublic = publicPhotos.filter((photo) => !photo.mediaId);
      const failedDocs = documentPhotos.filter((photo) => !photo.mediaId);
      if (failedPublic.length) {
        setPublicPhotosError('Загрузите фото повторно или удалите неудачные');
        valid = false;
      } else {
        setPublicPhotosError(undefined);
      }
      if (failedDocs.length) {
        setDocumentsError('Загрузите документы повторно или удалите неудачные');
        valid = false;
      } else {
        setDocumentsError(undefined);
      }
    }

    return valid;
  };

  const handleNext = () => {
    if (!validate()) return;
    navigation.navigate('CreateMaterialHelpRequestReview', getDraft());
  };

  return (
    <CreateRequestStepLayout
      title="Сумма и материалы"
      step={3}
      stepHint="сбор средств"
      variant="material"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      contentStyle={styles.form}
    >
      {isEditMode && editModerationFeedback?.returnReason ? (
        <HelpRequestEditFeedbackCard feedback={editModerationFeedback} />
      ) : null}

      <View style={styles.block}>
        <Text style={styles.fieldLabel}>Сколько нужно собрать</Text>
        <MoneyAmountInput
          valueRubles={draft.amountRubles}
          onChangeRubles={(value) => {
            patchDraft({ amountRubles: value });
            if (amountError) {
              setAmountError(undefined);
            }
          }}
          error={amountError}
          helper={`Минимум — ${formatRublesPlain(MATERIAL_AMOUNT_MIN_RUB)} ₽, максимум — ${formatRublesPlain(MATERIAL_AMOUNT_MAX_RUB)} ₽. При сумме ≥ ${formatRublesPlain(MATERIAL_AMOUNT_DOCS_THRESHOLD_RUB)} ₽ партнёр запросит подтверждающие документы.`}
        />
      </View>

      <View style={styles.block}>
        <View style={styles.sectionTitleRow}>
          <Icon name="eye" size={16} color={T.primary} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Публичные фото</Text>
          <Chip label="видят все" kind="primary" size="sm" />
        </View>
        <Text style={styles.sectionHint}>
          Эти фото увидят волонтёры в ленте. Покажите ситуацию — обычные снимки с телефона подходят.
        </Text>
        <HelpRequestPhotoPicker
          value={publicPhotos}
          onChange={(next) => {
            patchDraft({ photos: mergePhotos(next, documentPhotos) });
            if (publicPhotosError) setPublicPhotosError(undefined);
          }}
          onUploadingChange={setPhotosUploading}
          error={publicPhotosError}
          maxFiles={PUBLIC_PHOTO_MAX}
          imagesOnly
        />
        <Text style={styles.helper}>
          До {PUBLIC_PHOTO_MAX} фото · 50 МБ · JPG, PNG, WebP
        </Text>
      </View>

      <View style={styles.block}>
        <View style={styles.sectionTitleRow}>
          <Icon name="document" size={16} color={T.info} strokeWidth={2} />
          <Text style={styles.sectionTitle}>Документы</Text>
          <Chip label="по желанию" size="sm" />
        </View>
        <Text style={styles.sectionHint}>
          Дополнительные материалы — рецепт, выписка, направление. Помогают волонтёрам понять ситуацию глубже.
        </Text>
        <HelpRequestPhotoPicker
          value={documentPhotos}
          onChange={(next) => {
            patchDraft({ photos: mergePhotos(publicPhotos, next) });
            if (documentsError) setDocumentsError(undefined);
          }}
          onUploadingChange={setPhotosUploading}
          error={documentsError}
          maxFiles={DOCUMENT_MAX}
          documentsOnly
        />
        <Text style={styles.helper}>PDF, DOCX, XLSX · до 50 МБ каждый</Text>
      </View>
    </CreateRequestStepLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 22,
    paddingTop: 8,
  },
  block: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink2,
  },
  sectionHint: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 17,
  },
  helper: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 16,
  },
});
