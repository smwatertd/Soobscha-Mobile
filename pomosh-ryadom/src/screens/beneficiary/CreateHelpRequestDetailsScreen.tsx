import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MapPoint } from '../../api/integrationTypes';
import { FieldError } from '../../components/beneficiary/create/FieldError';
import { HelpRequestEditFeedbackCard } from '../../components/beneficiary/create/HelpRequestEditFeedbackCard';
import { HelpRequestCategoryPicker } from '../../components/beneficiary/create/HelpRequestCategoryPicker';
import { HelpRequestLocationPreview } from '../../components/beneficiary/create/HelpRequestLocationPreview';
import { HelpRequestPhotoPicker } from '../../components/beneficiary/create/HelpRequestPhotoPicker';
import { LocationPickerModal } from '../../components/beneficiary/create/LocationPickerModal';
import { CounterControl } from '../../components/beneficiary/create/CounterControl';
import { CreateRequestStepLayout } from '../../components/beneficiary/create/CreateRequestStepLayout';
import { InlineCalendarPicker } from '../../components/beneficiary/create/InlineCalendarPicker';
import { TextField } from '../../components/TextField';
import { DraftPhoto, sortDraftPhotos } from '../../navigation/createHelpRequestTypes';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useSocialHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { T } from '../../theme/tokens';
import { hasSocialDraftContent } from '../../utils/createHelpRequestDraftUtils';
import { isImageContentType } from '../../utils/helpRequestPhotos';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateHelpRequestDetails'>;
  route: RouteProp<RootStackParamList, 'CreateHelpRequestDetails'>;
};

type FieldErrors = {
  category?: string;
  title?: string;
  description?: string;
  location?: string;
  volunteers?: string;
  photos?: string;
  documents?: string;
};

const MAX_SOCIAL_PHOTOS = 5;

function mergePhotoLists(images: DraftPhoto[], documents: DraftPhoto[]): DraftPhoto[] {
  return [...sortDraftPhotos(images), ...sortDraftPhotos(documents)];
}

export function CreateHelpRequestDetailsScreen({ navigation, route }: Props) {
  const {
    draft,
    location,
    patchDraft,
    isEditMode,
    editModerationFeedback,
  } = useSocialHelpRequestDraft();
  const editMode = route.params.editMode ?? isEditMode;
  const [photosUploading, setPhotosUploading] = useState(false);
  const [documentsUploading, setDocumentsUploading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const mapWasOpenRef = useRef(false);

  const imagePhotos = useMemo(
    () => sortDraftPhotos(draft.photos.filter((photo) => isImageContentType(photo.contentType))),
    [draft.photos],
  );
  const documentPhotos = useMemo(
    () =>
      sortDraftPhotos(draft.photos.filter((photo) => !isImageContentType(photo.contentType))),
    [draft.photos],
  );

  useEffect(() => {
    if (mapOpen) {
      mapWasOpenRef.current = true;
      return;
    }
    if (mapWasOpenRef.current) {
      mapWasOpenRef.current = false;
      Keyboard.dismiss();
    }
  }, [mapOpen]);

  const openMap = () => {
    Keyboard.dismiss();
    setMapOpen(true);
  };

  const closeMap = () => {
    Keyboard.dismiss();
    setMapOpen(false);
  };

  const validate = useCallback((): FieldErrors => {
    const next: FieldErrors = {};

    if (!draft.category) {
      next.category = 'Выберите категорию заявки';
    }
    if (!draft.title.trim() || draft.title.trim().length < 8) {
      next.title = 'Слишком коротко — минимум 8 символов';
    }
    if (!draft.description.trim() || draft.description.trim().length < 20) {
      next.description = 'Опишите подробнее, чтобы волонтёры понимали, что предстоит сделать';
    }
    if (!location) {
      next.location = 'Укажите место встречи на карте';
    }
    if (draft.minVolunteers > draft.maxVolunteers) {
      next.volunteers = 'Минимум не может быть больше максимума';
    }
    if (photosUploading) {
      next.photos = 'Дождитесь окончания загрузки файлов';
    } else {
      const failedPhotos = imagePhotos.filter((photo) => !photo.mediaId);
      if (failedPhotos.length) {
        next.photos = 'Загрузите файлы повторно или удалите неудачные';
      }
    }
    if (documentsUploading) {
      next.documents = 'Дождитесь окончания загрузки документов';
    } else {
      const failedDocs = documentPhotos.filter((photo) => !photo.mediaId);
      if (failedDocs.length) {
        next.documents = 'Загрузите документы повторно или удалите неудачные';
      }
    }

    return next;
  }, [
    draft.category,
    draft.description,
    draft.maxVolunteers,
    draft.minVolunteers,
    draft.title,
    documentPhotos,
    documentsUploading,
    imagePhotos,
    location,
    photosUploading,
  ]);

  const errors = useMemo(
    () => (submitAttempted ? validate() : {}),
    [submitAttempted, validate],
  );

  const handleNext = () => {
    setSubmitAttempted(true);
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0 || !location || !draft.category) {
      return;
    }

    patchDraft({
      title: draft.title.trim(),
      description: draft.description.trim(),
      address: draft.address.trim() || 'Место на карте',
      latitude: location.latitude,
      longitude: location.longitude,
    });
    navigation.navigate('CreateHelpRequestSkills');
  };

  const handleLocationConfirm = (point: MapPoint, nextAddress: string) => {
    patchDraft({
      latitude: point.latitude,
      longitude: point.longitude,
      address: nextAddress,
    });
    Keyboard.dismiss();
  };

  const handleImagePhotosChange = (nextImages: DraftPhoto[]) => {
    patchDraft({ photos: mergePhotoLists(nextImages, documentPhotos) });
  };

  const handleDocumentPhotosChange = (nextDocuments: DraftPhoto[]) => {
    patchDraft({ photos: mergePhotoLists(imagePhotos, nextDocuments) });
  };

  return (
    <>
      <CreateRequestStepLayout
        title={editMode ? 'Изменить заявку' : 'Опишите задачу'}
        step={2}
        onBack={() => navigation.goBack()}
        onNext={handleNext}
        formErrorCount={submitAttempted ? Object.keys(errors).length : 0}
        nextDisabled={submitAttempted && Object.keys(errors).length > 0}
        confirmDiscard={{
          hasChanges: hasSocialDraftContent(draft),
          title: editMode ? 'Выйти без сохранения?' : 'Выйти из заявки?',
          message: editMode
            ? 'Изменения на этом шаге не сохранятся.'
            : 'Черновик на этом шаге не сохранится.',
        }}
        contentStyle={styles.form}
      >
        {editMode && editModerationFeedback?.returnReason ? (
          <HelpRequestEditFeedbackCard feedback={editModerationFeedback} />
        ) : null}

        <View style={styles.block}>
          <TextField
            label="Название заявки"
            value={draft.title}
            onChangeText={(value) => patchDraft({ title: value })}
            placeholder="Помощь в уборке участка"
            error={errors.title}
          />
          <Text style={styles.helper}>
            Коротко и по-человечески — это первое, что увидит волонтёр.
          </Text>
        </View>

        <View style={styles.block}>
          <TextField
            label="Подробнее о задаче"
            value={draft.description}
            onChangeText={(value) => patchDraft({ description: value })}
            multiline
            numberOfLines={4}
            placeholder="Опишите, что нужно сделать и в каких условиях…"
            error={errors.description}
          />
        </View>

        <HelpRequestCategoryPicker
          requestType="social"
          variant="chips"
          value={draft.category || null}
          selectedLabel={draft.categoryLabel}
          onChange={(code, label) => patchDraft({ category: code, categoryLabel: label })}
          error={errors.category}
        />

        <InlineCalendarPicker
          selectedDateIso={draft.dateIso}
          selectedTime={draft.time}
          onDateChange={(dateIso) => patchDraft({ dateIso })}
          onTimeChange={(time) => patchDraft({ time })}
        />

        <View style={styles.block}>
          <Text style={styles.fieldLabel}>Адрес</Text>
          <HelpRequestLocationPreview point={location} onPress={openMap} compact />
          <FieldError message={errors.location} />
        </View>

        <View style={styles.block}>
          <Text style={styles.fieldLabel}>Сколько волонтёров нужно</Text>
          <View style={styles.counters}>
            <CounterControl
              label="Минимум"
              value={draft.minVolunteers}
              min={1}
              max={draft.maxVolunteers}
              onChange={(value) => patchDraft({ minVolunteers: value })}
            />
            <CounterControl
              label="Максимум"
              value={draft.maxVolunteers}
              min={draft.minVolunteers}
              max={20}
              onChange={(value) => patchDraft({ maxVolunteers: value })}
            />
          </View>
          <FieldError message={errors.volunteers} />
        </View>

        <View style={styles.block}>
          <Text style={styles.fieldLabel}>Фото для заявки</Text>
          <HelpRequestPhotoPicker
            value={imagePhotos}
            onChange={handleImagePhotosChange}
            onUploadingChange={setPhotosUploading}
            error={errors.photos}
            maxFiles={MAX_SOCIAL_PHOTOS}
            imagesOnly
          />
          <Text style={styles.helper}>
            До 5 фото · 50 МБ каждое · JPG, PNG, WebP — это поможет волонтёру понять, что предстоит сделать.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.fieldLabel}>Документы · по желанию</Text>
          <HelpRequestPhotoPicker
            value={documentPhotos}
            onChange={handleDocumentPhotosChange}
            onUploadingChange={setDocumentsUploading}
            error={errors.documents}
            documentsOnly
          />
          <Text style={styles.helper}>
            PDF, DOCX, XLSX · до 50 МБ каждый — план, инструкция, список вещей.
          </Text>
        </View>
      </CreateRequestStepLayout>

      <LocationPickerModal
        visible={mapOpen}
        initialPoint={location}
        initialAddress={draft.address}
        onClose={closeMap}
        onConfirm={handleLocationConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
    paddingTop: 8,
  },
  block: {
    gap: 8,
  },
  helper: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  counters: {
    flexDirection: 'row',
    gap: 10,
  },
});
