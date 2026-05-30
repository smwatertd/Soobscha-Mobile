import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HelpRequestSkillsPicker } from '../../components/beneficiary/create/HelpRequestSkillsPicker';
import { CreateRequestStepLayout } from '../../components/beneficiary/create/CreateRequestStepLayout';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useSocialHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { T } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateHelpRequestSkills'>;
};

export function CreateHelpRequestSkillsScreen({ navigation }: Props) {
  const { draft, patchDraft } = useSocialHelpRequestDraft();
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const skillsError = useMemo(() => {
    if (!submitAttempted) return undefined;
    if (!draft.requiredSkills.length) {
      return 'Выберите хотя бы один обязательный навык';
    }
    return undefined;
  }, [draft.requiredSkills.length, submitAttempted]);

  const handleNext = () => {
    setSubmitAttempted(true);
    if (!draft.requiredSkills.length) {
      return;
    }
    navigation.navigate('CreateHelpRequestConditions');
  };

  return (
    <CreateRequestStepLayout
      title="Навыки волонтёров"
      step={3}
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      formErrorCount={skillsError ? 1 : 0}
      nextDisabled={submitAttempted && Boolean(skillsError)}
      confirmDiscard={{
        hasChanges:
          draft.requiredSkills.length > 0 || draft.preferredSkills.length > 0,
      }}
      contentStyle={styles.form}
    >
      <Text style={styles.lead}>
        Укажите, какие умения нужны для задачи. Обязательные навыки влияют на подбор волонтёров.
      </Text>
      <HelpRequestSkillsPicker
        requiredSkills={draft.requiredSkills}
        preferredSkills={draft.preferredSkills}
        onRequiredChange={(codes) => patchDraft({ requiredSkills: codes })}
        onPreferredChange={(codes) => patchDraft({ preferredSkills: codes })}
        requiredError={skillsError}
      />
    </CreateRequestStepLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
    paddingTop: 8,
  },
  lead: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 19,
  },
});
