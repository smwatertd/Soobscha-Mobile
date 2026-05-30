import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getErrorMessage } from '../../../api/errors';
import {
  VolunteerVerifDataRow,
  VolunteerVerifDraftPhotoGrid,
  VolunteerVerifInfoBanner,
  VolunteerVerifReviewBlock,
  VolunteerVerifStepLayout,
} from '../../../components/volunteer/verification/VolunteerVerifParts';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
  ContactChannelType,
  normalizePassportNumber,
  VOLUNTEER_VERIF_STEPS,
  volunteerVerifFullName,
} from '../../../navigation/volunteerVerificationTypes';
import { useFeedback } from '../../../providers/FeedbackProvider';
import { useVolunteerVerifDraft } from '../../../providers/VolunteerVerifDraftProvider';
import { T } from '../../../theme/tokens';
import { formatContactForDisplay } from '../../../utils/contactValidation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerVerifReview'>;
};

const PREFERRED_LABELS: Record<ContactChannelType, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
  max: 'Max',
};

export function VolunteerVerifReviewScreen({ navigation }: Props) {
  const { showSnack } = useFeedback();
  const { draft, submit, submitting, resetDraft } = useVolunteerVerifDraft();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedSkills = draft.skills.filter((skill) => skill.selected);
  const simpleSkills = selectedSkills.filter((skill) => !skill.requiresDocument);
  const documentedSkills = selectedSkills.filter((skill) => skill.requiresDocument);
  const activeContacts = draft.contacts.filter((contact) => contact.value.trim());
  const skillPhotos = selectedSkills.flatMap((skill) => skill.photos);

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await submit();
      resetDraft();
      navigation.reset({
        index: 1,
        routes: [
          { name: 'VolunteerMain', params: { initialTab: 'profile' } },
          { name: 'VolunteerVerifActive' },
        ],
      });
      showSnack('Заявка отправлена на проверку');
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Не удалось отправить заявку'));
    }
  };

  return (
    <VolunteerVerifStepLayout
      title="Проверьте данные"
      subtitle="После отправки начнётся проверка документов"
      step={4}
      total={VOLUNTEER_VERIF_STEPS}
      onBack={() => navigation.navigate('VolunteerVerifSkills')}
      onNext={handleSubmit}
      nextLabel="Отправить на проверку"
      nextIcon="check"
      nextLoading={submitting}
    >
      <VolunteerVerifReviewBlock
        title="Личные данные"
        icon="user"
        color="#1F6F5C"
        onEdit={() => navigation.navigate('VolunteerVerifGeneral')}
      >
        <VolunteerVerifDataRow label="ФИО" value={volunteerVerifFullName(draft)} />
        <VolunteerVerifDataRow label="Дата рождения" value={draft.birthDate} />
        <VolunteerVerifDataRow label="Город" value={draft.city} />
        <VolunteerVerifDataRow
          label="Паспорт"
          value={normalizePassportNumber(draft.passportSeriesNumber)}
        />
        <VolunteerVerifDataRow label="Дата выдачи" value={draft.passportIssueDate} />
        <VolunteerVerifDataRow label="Кем выдан" value={draft.passportIssuedBy} />
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
        title="Контакты"
        icon="info"
        color="#446D9E"
        onEdit={() => navigation.navigate('VolunteerVerifContacts')}
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

      <VolunteerVerifReviewBlock
        title="Навыки"
        icon="handshake"
        color="#4F8B5B"
        onEdit={() => navigation.navigate('VolunteerVerifSkills')}
      >
        {simpleSkills.length ? (
          <VolunteerVerifDataRow
            label="Без подтверждения"
            value={simpleSkills.map((skill) => skill.label).join(', ')}
          />
        ) : null}
        {documentedSkills.length ? (
          <>
            <VolunteerVerifDataRow
              label="С документами"
              value={documentedSkills.map((skill) => skill.label).join(', ')}
            />
            <VolunteerVerifDraftPhotoGrid photos={skillPhotos} emptyLabel="Нет документов" />
          </>
        ) : null}
        {!selectedSkills.length ? (
          <VolunteerVerifDataRow label="Навыки" value="Не выбраны" last />
        ) : null}
      </VolunteerVerifReviewBlock>

      {submitError ? (
        <VolunteerVerifInfoBanner tone="warning" icon="warn" text={submitError} />
      ) : (
        <VolunteerVerifInfoBanner
          tone="warning"
          icon="clock"
          text="Проверка займёт до 24 часов. После отправки вы увидите статус «На модерации» и получите уведомление по результату."
        />
      )}
    </VolunteerVerifStepLayout>
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
