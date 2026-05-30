import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../../api/errors';
import {
  VolunteerVerifDataRow,
  VolunteerVerifDraftPhotoGrid,
  VolunteerVerifInfoBanner,
  VolunteerVerifReviewBlock,
} from '../../../components/volunteer/verification/VolunteerVerifParts';
import {
  BeneficiaryVerifInfoBanner,
  BeneficiaryVerifStepLayout,
} from '../../../components/beneficiary/verification/BeneficiaryVerifParts';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
  BENEFICIARY_VERIF_STEPS,
  beneficiaryVerifFullName,
  validateBeneficiaryVerifCategory,
  validateBeneficiaryVerifContacts,
  validateBeneficiaryVerifDetails,
  validateBeneficiaryVerifGeneral,
} from '../../../navigation/beneficiaryVerificationTypes';
import {
  ContactChannelType,
  normalizePassportNumber,
} from '../../../navigation/volunteerVerificationTypes';
import { useFeedback } from '../../../providers/FeedbackProvider';
import { useBeneficiaryVerifDraft } from '../../../providers/BeneficiaryVerifDraftProvider';
import { getBeneficiaryCategoryLabel } from '../../../utils/beneficiaryCategory';
import { T } from '../../../theme/tokens';
import { formatContactForDisplay } from '../../../utils/contactValidation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryVerifReview'>;
};

const PREFERRED_LABELS: Record<ContactChannelType, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
  max: 'Max',
};

export function BeneficiaryVerifReviewScreen({ navigation }: Props) {
  const { showSnack } = useFeedback();
  const { draft, submit, submitting, resetDraft } = useBeneficiaryVerifDraft();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeContacts = draft.contacts.filter((contact) => contact.value.trim());
  const categoryLabel = getBeneficiaryCategoryLabel(draft.category) ?? '—';

  const handleSubmit = async () => {
    const validationErrors = {
      ...validateBeneficiaryVerifCategory(draft),
      ...validateBeneficiaryVerifGeneral(draft),
      ...validateBeneficiaryVerifDetails(draft),
      ...validateBeneficiaryVerifContacts(draft),
    };

    if (Object.keys(validationErrors).length) {
      setSubmitError('Проверьте данные на предыдущих шагах');
      return;
    }

    setSubmitError(null);
    try {
      await submit();
      resetDraft();
      navigation.reset({
        index: 1,
        routes: [
          { name: 'BeneficiaryMain' },
          { name: 'BeneficiaryVerifActive' },
        ],
      });
      showSnack('Заявка отправлена на проверку');
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Не удалось отправить заявку'));
    }
  };

  return (
    <BeneficiaryVerifStepLayout
      title="Проверьте данные"
      subtitle="После отправки начнётся проверка документов"
      step={4}
      total={BENEFICIARY_VERIF_STEPS}
      onBack={() => navigation.navigate('BeneficiaryVerifContacts')}
      onNext={handleSubmit}
      nextLabel="Отправить на проверку"
      nextIcon="check"
      nextLoading={submitting}
    >
      <VolunteerVerifReviewBlock
        title="Личные данные"
        icon="user"
        color={T.primary}
        onEdit={() => navigation.navigate('BeneficiaryVerifGeneral')}
      >
        <VolunteerVerifDataRow label="ФИО" value={beneficiaryVerifFullName(draft)} />
        <VolunteerVerifDataRow label="Дата рождения" value={draft.birthDate} />
        <VolunteerVerifDataRow label="Город" value={draft.city} />
        <VolunteerVerifDataRow
          label="Паспорт"
          value={normalizePassportNumber(draft.passportSeriesNumber)}
        />
        <VolunteerVerifDataRow label="Дата выдачи" value={draft.passportIssueDate} />
        <VolunteerVerifDataRow label="Кем выдан" value={draft.passportIssuedBy} last />
        <View style={styles.photoSection}>
          <Text style={styles.photoSectionLabel}>Фото паспорта</Text>
          <VolunteerVerifDraftPhotoGrid photos={draft.idDocumentPhotos} emptyLabel="Нет файлов" />
        </View>
        <View style={styles.photoSection}>
          <Text style={styles.photoSectionLabel}>Селфи</Text>
          <VolunteerVerifDraftPhotoGrid photos={draft.selfiePhotos} emptyLabel="Нет файлов" />
        </View>
      </VolunteerVerifReviewBlock>

      <VolunteerVerifReviewBlock
        title="Категория получателя"
        icon="document"
        color={T.accent}
        onEdit={() => navigation.navigate('BeneficiaryVerifCategory')}
      >
        <VolunteerVerifDataRow label="Категория" value={categoryLabel} />
        <VolunteerVerifDataRow
          label="Состав семьи"
          value={`${draft.familyMembers.length} чел.`}
          last={!draft.situationSummary.trim()}
        />
        {draft.situationSummary.trim() ? (
          <VolunteerVerifDataRow label="О ситуации" value={draft.situationSummary} last />
        ) : null}
        <View style={styles.photoSection}>
          <Text style={styles.photoSectionLabel}>Справки</Text>
          <VolunteerVerifDraftPhotoGrid
            photos={draft.categoryDocumentPhotos}
            emptyLabel="Нет файлов"
          />
        </View>
      </VolunteerVerifReviewBlock>

      <VolunteerVerifReviewBlock
        title="Контакты"
        icon="info"
        color={T.info}
        onEdit={() =>
          navigation.navigate('BeneficiaryVerifContacts', { returnToReview: true })
        }
      >
        {activeContacts.map((contact, index) => (
          <VolunteerVerifDataRow
            key={contact.type}
            label={contact.label}
            value={formatContactForDisplay(contact.type, contact.value)}
            last={index === activeContacts.length - 1 && !draft.preferredContactType}
          />
        ))}
        {draft.preferredContactType ? (
          <VolunteerVerifDataRow
            label="Предпочтительно"
            value={PREFERRED_LABELS[draft.preferredContactType]}
            last
          />
        ) : null}
      </VolunteerVerifReviewBlock>

      {submitError ? (
        <BeneficiaryVerifInfoBanner tone="warning" icon="warn" text={submitError} />
      ) : (
        <BeneficiaryVerifInfoBanner
          tone="warning"
          icon="clock"
          text="Проверка займёт до 24 часов. После отправки вы увидите статус «На модерации» и получите уведомление по результату."
        />
      )}
    </BeneficiaryVerifStepLayout>
  );
}

const styles = StyleSheet.create({
  photoSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  photoSectionLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
});
