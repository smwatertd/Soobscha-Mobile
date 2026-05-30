import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HelpRequestPhotoPicker } from '../../../components/beneficiary/create/HelpRequestPhotoPicker';
import { TextField } from '../../../components/TextField';
import {
  VolunteerVerifInfoBanner,
  VolunteerVerifSectionLabel,
  VolunteerVerifSkillChips,
  VolunteerVerifStepLayout,
} from '../../../components/volunteer/verification/VolunteerVerifParts';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
  validateVolunteerVerifSkills,
  VOLUNTEER_VERIF_STEPS,
  VolunteerSkillEvidenceDraft,
} from '../../../navigation/volunteerVerificationTypes';
import { useVolunteerVerifDraft } from '../../../providers/VolunteerVerifDraftProvider';
import { T, CARD_BG, RADIUS, shadowSm } from '../../../theme/tokens';
import { clearFieldError } from '../../../utils/formErrors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerVerifSkills'>;
};

export function VolunteerVerifSkillsScreen({ navigation }: Props) {
  const { draft, patchDraft, loading } = useVolunteerVerifDraft();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const simpleSkills = draft.skills.filter((skill) => !skill.requiresDocument);
  const documentedSkills = draft.skills.filter((skill) => skill.requiresDocument);

  const toggleSkill = (skillCode: string) => {
    patchDraft({
      skills: draft.skills.map((skill) =>
        skill.skillCode === skillCode ? { ...skill, selected: !skill.selected } : skill,
      ),
    });
    if (errors.skills) setErrors((prev) => clearFieldError(prev, 'skills'));
  };

  const updateSkill = (skillCode: string, patch: Partial<VolunteerSkillEvidenceDraft>) => {
    patchDraft({
      skills: draft.skills.map((skill) =>
        skill.skillCode === skillCode ? { ...skill, ...patch } : skill,
      ),
    });
  };

  const handleNext = () => {
    const nextErrors = validateVolunteerVerifSkills(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    navigation.navigate('VolunteerVerifReview');
  };

  if (loading && !draft.skills.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  return (
    <VolunteerVerifStepLayout
      title="Навыки и подтверждение"
      subtitle="Чем подробнее, тем больше заявок вам подходит"
      step={3}
      total={VOLUNTEER_VERIF_STEPS}
      onBack={() => navigation.navigate('VolunteerVerifContacts')}
      onNext={handleNext}
    >
      <VolunteerVerifInfoBanner text="Для некоторых навыков нужно подтверждение документом — иначе они недоступны при отклике на заявку." />

      {errors.skills ? <Text style={styles.error}>{errors.skills}</Text> : null}

      {simpleSkills.length ? (
        <>
          <VolunteerVerifSectionLabel>Не требуют подтверждения</VolunteerVerifSectionLabel>
          <VolunteerVerifSkillChips
            items={simpleSkills.map((skill) => ({
              key: skill.skillCode,
              label: skill.label,
              active: skill.selected,
              onPress: () => toggleSkill(skill.skillCode),
            }))}
          />
        </>
      ) : null}

      {documentedSkills.length ? (
        <>
          <VolunteerVerifSectionLabel>Нужны документы</VolunteerVerifSectionLabel>
          {documentedSkills.map((skill) => (
            <View key={skill.skillCode} style={[styles.skillCard, shadowSm]}>
              <Text style={styles.skillTitle}>{skill.label}</Text>
              <VolunteerVerifSkillChips
                items={[
                  {
                    key: `${skill.skillCode}-toggle`,
                    label: skill.selected ? 'Выбрано' : 'Выбрать',
                    active: skill.selected,
                    onPress: () => toggleSkill(skill.skillCode),
                  },
                ]}
              />
              {skill.selected ? (
                <View style={styles.skillBody}>
                  <HelpRequestPhotoPicker
                    value={skill.photos}
                    onChange={(photos) => {
                      updateSkill(skill.skillCode, { photos });
                      if (errors[`skill_${skill.skillCode}`]) {
                        setErrors((prev) => clearFieldError(prev, `skill_${skill.skillCode}`));
                      }
                    }}
                    maxFiles={3}
                    imagesOnly
                    purpose="VERIFICATION"
                    error={errors[`skill_${skill.skillCode}`]}
                  />
                  <TextField
                    label="Комментарий"
                    value={skill.comment}
                    onChangeText={(comment) => updateSkill(skill.skillCode, { comment })}
                    multiline
                    style={{ minHeight: 72, textAlignVertical: 'top' }}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

      {!draft.skills.length ? (
        <Text style={styles.empty}>Каталог навыков пуст или не загрузился. Вернитесь на шаг 1 и обновите данные.</Text>
      ) : null}
    </VolunteerVerifStepLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.bg,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    marginBottom: 10,
  },
  skillCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.borderSoft,
    padding: 14,
    marginBottom: 12,
  },
  skillTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 8,
  },
  skillBody: {
    marginTop: 12,
    gap: 10,
  },
  empty: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 19,
  },
});
