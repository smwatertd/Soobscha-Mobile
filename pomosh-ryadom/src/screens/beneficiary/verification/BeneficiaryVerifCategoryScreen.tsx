import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BeneficiaryVerifCategoryCard,
  BeneficiaryVerifStepLayout,
} from '../../../components/beneficiary/verification/BeneficiaryVerifParts';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
  BENEFICIARY_VERIF_STEPS,
  validateBeneficiaryVerifCategory,
} from '../../../navigation/beneficiaryVerificationTypes';
import { useBeneficiaryVerifDraft } from '../../../providers/BeneficiaryVerifDraftProvider';
import {
  BENEFICIARY_VERIF_CATEGORY_OPTIONS,
  BeneficiaryVerifCategoryOption,
} from './beneficiaryVerificationConfig';
import { T } from '../../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryVerifCategory'>;
};

export function BeneficiaryVerifCategoryScreen({ navigation }: Props) {
  const { draft, patchDraft } = useBeneficiaryVerifDraft();
  const [error, setError] = useState<string | null>(null);
  const selectedCategory = draft.category || null;

  const handleNext = () => {
    const nextErrors = validateBeneficiaryVerifCategory(draft);
    if (Object.keys(nextErrors).length) {
      setError(nextErrors.category ?? 'Выберите категорию получателя помощи');
      return;
    }
    setError(null);
    navigation.navigate('BeneficiaryVerifGeneral');
  };

  return (
    <BeneficiaryVerifStepLayout
      title="К какой категории вы относитесь?"
      subtitle="От категории зависит, какие документы попросим"
      step={1}
      total={BENEFICIARY_VERIF_STEPS}
      backLabel="Отмена"
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      nextLabel={
        selectedOption
          ? `Продолжить как «${selectedOption.label}»`
          : 'Продолжить'
      }
    >

      {BENEFICIARY_VERIF_CATEGORY_OPTIONS.map((option) => (
        <BeneficiaryVerifCategoryCard
          key={option.code}
          option={option}
          selected={selectedCategory === option.code}
          onPress={() => {
            patchDraft({ category: option.code });
            if (error) setError(null);
          }}
        />
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Не нашли подходящую категорию? Напишите в поддержку — поможем подобрать верный вариант.
        </Text>
      </View>
    </BeneficiaryVerifStepLayout>
  );
}

const styles = StyleSheet.create({
  error: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.danger,
  },
  note: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  noteText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 18,
  },
});
