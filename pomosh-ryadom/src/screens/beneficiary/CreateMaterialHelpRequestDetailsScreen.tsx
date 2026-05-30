import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HelpRequestEditFeedbackCard } from '../../components/beneficiary/create/HelpRequestEditFeedbackCard';
import { HelpRequestCategoryPicker } from '../../components/beneficiary/create/HelpRequestCategoryPicker';
import { CreateRequestStepLayout } from '../../components/beneficiary/create/CreateRequestStepLayout';
import { TextField } from '../../components/TextField';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useMaterialHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { T } from '../../theme/tokens';
import { hasMaterialDraftContent } from '../../utils/createHelpRequestDraftUtils';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateMaterialHelpRequestDetails'>;
  route: RouteProp<RootStackParamList, 'CreateMaterialHelpRequestDetails'>;
};

type FieldErrors = {
  category?: string;
  title?: string;
  description?: string;
};

export function CreateMaterialHelpRequestDetailsScreen({ navigation, route }: Props) {
  const { draft, patchDraft, isEditMode, editModerationFeedback } = useMaterialHelpRequestDraft();
  const editMode = route.params.editMode ?? isEditMode;
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};

    if (!draft.category) {
      next.category = 'Выберите категорию сбора';
    }
    if (!draft.title.trim() || draft.title.trim().length < 5) {
      next.title = 'Укажите название сбора (не короче 5 символов)';
    }
    if (!draft.description.trim() || draft.description.trim().length < 20) {
      next.description = 'Опишите ситуацию подробнее (не короче 20 символов)';
    }

    return next;
  };

  const handleNext = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !draft.category) {
      return;
    }

    patchDraft({
      title: draft.title.trim(),
      description: draft.description.trim(),
    });
    navigation.navigate('CreateMaterialHelpRequestAmount', {
      type: 'material',
      category: draft.category,
      categoryLabel: draft.categoryLabel,
      title: draft.title.trim(),
      description: draft.description.trim(),
    });
  };

  const handleCategoryChange = (code: string, label: string) => {
    patchDraft({ category: code, categoryLabel: label });
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  return (
    <CreateRequestStepLayout
      title={editMode ? 'Изменить сбор' : 'Расскажите о сборе'}
      step={2}
      stepHint="сбор средств"
      variant="material"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      confirmDiscard={{
        hasChanges: hasMaterialDraftContent(draft),
        title: editMode ? 'Выйти без сохранения?' : 'Выйти из сбора?',
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
          label="Название сбора"
          value={draft.title}
          onChangeText={(value) => {
            patchDraft({ title: value });
            if (errors.title) {
              setErrors((prev) => ({ ...prev, title: undefined }));
            }
          }}
          placeholder="Сбор на реабилитацию после операции"
          error={errors.title}
        />
        <Text style={styles.helper}>
          Коротко и по-человечески — первое, что увидит волонтёр.
        </Text>
      </View>

      <HelpRequestCategoryPicker
        requestType="material"
        variant="chips"
        value={draft.category || null}
        selectedLabel={draft.categoryLabel}
        onChange={handleCategoryChange}
        error={errors.category}
      />

      <View style={styles.block}>
        <TextField
          label="Подробнее о ситуации"
          value={draft.description}
          onChangeText={(value) => {
            patchDraft({ description: value });
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: undefined }));
            }
          }}
          multiline
          numberOfLines={5}
          placeholder="Опишите, что произошло, что нужно и как изменится ситуация…"
          error={errors.description}
        />
        <Text style={styles.helper}>
          Эту часть прочитают партнёр и потенциальные волонтёры. Опишите конкретно: что произошло, что нужно, как изменится ситуация.
        </Text>
      </View>
    </CreateRequestStepLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
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
});
