import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar } from '../../../components/Avatar';
import { HelpRequestPhotoPicker } from '../../../components/beneficiary/create/HelpRequestPhotoPicker';
import { Icon } from '../../../components/Icon';
import { TextField } from '../../../components/TextField';
import {
  BeneficiaryVerifInfoBanner,
  BeneficiaryVerifSectionLabel,
  BeneficiaryVerifStepLayout,
} from '../../../components/beneficiary/verification/BeneficiaryVerifParts';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
  BENEFICIARY_VERIF_STEPS,
  BeneficiaryFamilyMemberDraft,
  validateBeneficiaryVerifDetails,
} from '../../../navigation/beneficiaryVerificationTypes';
import { useBeneficiaryVerifDraft } from '../../../providers/BeneficiaryVerifDraftProvider';
import { getBeneficiaryCategoryLabel } from '../../../utils/beneficiaryCategory';
import { RADIUS, T, CARD_BG } from '../../../theme/tokens';
import { clearFieldError } from '../../../utils/formErrors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryVerifDetails'>;
};

function createMemberId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function BeneficiaryVerifDetailsScreen({ navigation }: Props) {
  const { draft, patchDraft } = useBeneficiaryVerifDraft();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const categoryLabel = getBeneficiaryCategoryLabel(draft.category) ?? 'Категория';

  const handleAddMember = () => {
    const member: BeneficiaryFamilyMemberDraft = {
      id: createMemberId(),
      displayName: '',
      relationLabel: '',
    };
    patchDraft({ familyMembers: [...draft.familyMembers, member] });
    if (errors.familyMembers) {
      setErrors((prev) => clearFieldError(prev, 'familyMembers'));
    }
  };

  const handleRemoveMember = (id: string) => {
    patchDraft({ familyMembers: draft.familyMembers.filter((member) => member.id !== id) });
  };

  const handleUpdateMember = (
    id: string,
    patch: Partial<Pick<BeneficiaryFamilyMemberDraft, 'displayName' | 'relationLabel'>>,
  ) => {
    patchDraft({
      familyMembers: draft.familyMembers.map((member) =>
        member.id === id ? { ...member, ...patch } : member,
      ),
    });
    if (errors.familyMembers) {
      setErrors((prev) => clearFieldError(prev, 'familyMembers'));
    }
  };

  const handleNext = () => {
    const nextErrors = validateBeneficiaryVerifDetails(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    navigation.navigate('BeneficiaryVerifContacts');
  };

  return (
    <BeneficiaryVerifStepLayout
      title="Документы и состав семьи"
      subtitle={`Категория: ${categoryLabel}`}
      step={3}
      total={BENEFICIARY_VERIF_STEPS}
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      backLabel="Назад"
    >
      <BeneficiaryVerifInfoBanner
        icon="document"
        text="Фото справок должны быть чёткими и читаемыми. Документы видит только модератор."
      />

      <BeneficiaryVerifSectionLabel>Справки</BeneficiaryVerifSectionLabel>
      <HelpRequestPhotoPicker
        value={draft.categoryDocumentPhotos}
        onChange={(categoryDocumentPhotos) => {
          patchDraft({ categoryDocumentPhotos });
          if (errors.categoryDocumentPhotos) {
            setErrors((prev) => clearFieldError(prev, 'categoryDocumentPhotos'));
          }
        }}
        maxFiles={8}
        purpose="VERIFICATION"
        error={errors.categoryDocumentPhotos}
      />
      <Text style={styles.helper}>
        Справка о доходах, составе семьи или другие документы по вашей категории
      </Text>

      <BeneficiaryVerifSectionLabel>Состав семьи</BeneficiaryVerifSectionLabel>
      <View style={styles.members}>
        {draft.familyMembers.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <Avatar name={member.displayName || '?'} size={32} />
            <View style={styles.memberFields}>
              <TextField
                label="Имя"
                value={member.displayName}
                onChangeText={(displayName) => handleUpdateMember(member.id, { displayName })}
                placeholder="Алексей К."
              />
              <TextField
                label="Кем приходится"
                value={member.relationLabel}
                onChangeText={(relationLabel) => handleUpdateMember(member.id, { relationLabel })}
                placeholder="Супруг · 41 год"
              />
            </View>
            <Pressable
              onPress={() => handleRemoveMember(member.id)}
              hitSlop={8}
              style={styles.memberRemove}
            >
              <Icon name="close" size={16} color={T.muted} />
            </Pressable>
          </View>
        ))}

        <Pressable onPress={handleAddMember} style={styles.addMemberBtn}>
          <Icon name="plus" size={18} color={T.primary} strokeWidth={2.2} />
          <Text style={styles.addMemberText}>Добавить члена семьи</Text>
        </Pressable>
      </View>
      {errors.familyMembers ? <Text style={styles.error}>{errors.familyMembers}</Text> : null}

      <BeneficiaryVerifSectionLabel>О ситуации</BeneficiaryVerifSectionLabel>
      <TextField
        label="Кратко о ситуации"
        value={draft.situationSummary}
        onChangeText={(situationSummary) => patchDraft({ situationSummary })}
        multiline
        numberOfLines={4}
        placeholder="Расскажите, почему вам нужна помощь…"
      />
    </BeneficiaryVerifStepLayout>
  );
}

const styles = StyleSheet.create({
  helper: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 16,
    marginTop: -4,
    marginBottom: 16,
  },
  members: {
    gap: 10,
    marginBottom: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  memberFields: {
    flex: 1,
    gap: 8,
  },
  memberRemove: {
    paddingTop: 28,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: T.border,
    backgroundColor: CARD_BG,
  },
  addMemberText: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
  },
  error: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.danger,
    marginBottom: 12,
  },
});
