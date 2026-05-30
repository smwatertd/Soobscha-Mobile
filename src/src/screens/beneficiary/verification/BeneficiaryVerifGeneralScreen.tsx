import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HelpRequestPhotoPicker } from '../../../components/beneficiary/create/HelpRequestPhotoPicker';
import { Icon } from '../../../components/Icon';
import { TextField } from '../../../components/TextField';
import {
  BeneficiaryVerifInfoBanner,
  BeneficiaryVerifSectionLabel,
  BeneficiaryVerifStepLayout,
} from '../../../components/beneficiary/verification/BeneficiaryVerifParts';
import { getAvailableCities } from '../../../api/locations';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
  BENEFICIARY_VERIF_STEPS,
  validateBeneficiaryVerifGeneral,
} from '../../../navigation/beneficiaryVerificationTypes';
import { formatPassportDisplay } from '../../../navigation/volunteerVerificationTypes';
import { useBeneficiaryVerifDraft } from '../../../providers/BeneficiaryVerifDraftProvider';
import { RADIUS, T, CARD_BG } from '../../../theme/tokens';
import { formatDateInput } from '../../../utils/dateInput';
import { clearFieldError } from '../../../utils/formErrors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BeneficiaryVerifGeneral'>;
};

export function BeneficiaryVerifGeneralScreen({ navigation }: Props) {
  const { draft, patchDraft, loading, loadError, reload } = useBeneficiaryVerifDraft();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [knownCityCodes, setKnownCityCodes] = useState<Set<string> | undefined>();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cities = await getAvailableCities();
        if (cancelled) return;
        setKnownCityCodes(new Set(cities.map((city) => city.code)));

        if (draft.city && !draft.cityCode) {
          const match = cities.find((city) => city.label === draft.city);
          if (match) patchDraft({ cityCode: match.code });
        }
      } catch {
        // city list optional for validation
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draft.city, draft.cityCode, patchDraft]);

  const handleNext = () => {
    const nextErrors = validateBeneficiaryVerifGeneral(draft, knownCityCodes);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    navigation.navigate('BeneficiaryVerifDetails');
  };

  if (loading && !draft.firstName && !draft.lastName) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={T.accent} size="large" />
        <Text style={styles.centerText}>Загружаем данные…</Text>
      </View>
    );
  }

  return (
    <BeneficiaryVerifStepLayout
      title="Верификация"
      subtitle="Базовые данные"
      step={2}
      total={BENEFICIARY_VERIF_STEPS}
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      backLabel="Назад"
    >
      {loadError ? (
        <BeneficiaryVerifInfoBanner tone="warning" text={loadError} />
      ) : (
        <BeneficiaryVerifInfoBanner
          icon="shield"
          text="Документы видит только модератор. После одобрения они исчезают из приложения."
        />
      )}

      <BeneficiaryVerifSectionLabel>Личные данные</BeneficiaryVerifSectionLabel>
      <View style={styles.fieldsGroup}>
        <TextField
          label="Фамилия"
          value={draft.lastName}
          onChangeText={(lastName) => {
            patchDraft({ lastName });
            if (errors.lastName) setErrors((prev) => clearFieldError(prev, 'lastName'));
          }}
          error={errors.lastName}
        />
        <TextField
          label="Имя"
          value={draft.firstName}
          onChangeText={(firstName) => {
            patchDraft({ firstName });
            if (errors.firstName) setErrors((prev) => clearFieldError(prev, 'firstName'));
          }}
          error={errors.firstName}
        />
        <TextField
          label="Отчество"
          value={draft.middleName}
          onChangeText={(middleName) => patchDraft({ middleName })}
        />
        <TextField
          label="Дата рождения"
          value={draft.birthDate}
          onChangeText={(value) => {
            patchDraft({ birthDate: formatDateInput(value) });
            if (errors.birthDate) setErrors((prev) => clearFieldError(prev, 'birthDate'));
          }}
          placeholder="ДД.ММ.ГГГГ"
          keyboardType="numeric"
          maxLength={10}
          error={errors.birthDate}
        />
        <View>
          <Text style={styles.fieldLabel}>Город</Text>
          <Pressable
            onPress={() => navigation.navigate('BeneficiaryVerifCityPicker')}
            style={[styles.cityField, errors.city && styles.cityFieldError]}
          >
            <Icon name="pin" size={20} color={T.muted} />
            <Text style={[styles.cityValue, !draft.city && styles.cityPlaceholder]}>
              {draft.city || 'Выберите город'}
            </Text>
            <Icon name="chevR" size={18} color={T.muted} />
          </Pressable>
          {errors.city ? <Text style={styles.fieldError}>{errors.city}</Text> : null}
        </View>
        <TextField
          label="Серия и номер паспорта"
          value={draft.passportSeriesNumber}
          onChangeText={(value) => {
            patchDraft({ passportSeriesNumber: formatPassportDisplay(value) });
            if (errors.passportSeriesNumber) {
              setErrors((prev) => clearFieldError(prev, 'passportSeriesNumber'));
            }
          }}
          placeholder="1234 567890"
          keyboardType="numeric"
          error={errors.passportSeriesNumber}
        />
        <TextField
          label="Дата выдачи паспорта"
          value={draft.passportIssueDate}
          onChangeText={(value) => {
            patchDraft({ passportIssueDate: formatDateInput(value) });
            if (errors.passportIssueDate) {
              setErrors((prev) => clearFieldError(prev, 'passportIssueDate'));
            }
          }}
          placeholder="ДД.ММ.ГГГГ"
          keyboardType="numeric"
          maxLength={10}
          error={errors.passportIssueDate}
        />
        <TextField
          label="Кем выдан"
          value={draft.passportIssuedBy}
          onChangeText={(passportIssuedBy) => {
            patchDraft({ passportIssuedBy });
            if (errors.passportIssuedBy) {
              setErrors((prev) => clearFieldError(prev, 'passportIssuedBy'));
            }
          }}
          placeholder="ОТДЕЛОМ УФМС РОССИИ ПО ..."
          error={errors.passportIssuedBy}
        />
      </View>

      <BeneficiaryVerifSectionLabel>Фото паспорта</BeneficiaryVerifSectionLabel>
      <HelpRequestPhotoPicker
        value={draft.idDocumentPhotos}
        onChange={(idDocumentPhotos) => {
          patchDraft({ idDocumentPhotos });
          if (errors.idDocumentPhotos) {
            setErrors((prev) => clearFieldError(prev, 'idDocumentPhotos'));
          }
        }}
        maxFiles={5}
        imagesOnly
        purpose="VERIFICATION"
        error={errors.idDocumentPhotos}
      />

      <BeneficiaryVerifSectionLabel>Селфи с паспортом</BeneficiaryVerifSectionLabel>
      <HelpRequestPhotoPicker
        value={draft.selfiePhotos}
        onChange={(selfiePhotos) => {
          patchDraft({ selfiePhotos });
          if (errors.selfiePhotos) {
            setErrors((prev) => clearFieldError(prev, 'selfiePhotos'));
          }
        }}
        maxFiles={3}
        imagesOnly
        purpose="VERIFICATION"
        error={errors.selfiePhotos}
      />

      {loadError ? (
        <Text style={styles.retryHint} onPress={() => reload()}>
          Нажмите, чтобы повторить загрузку профиля
        </Text>
      ) : null}
    </BeneficiaryVerifStepLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.bg,
    gap: 12,
  },
  centerText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  fieldsGroup: {
    gap: 12,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    marginBottom: 8,
  },
  cityField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: CARD_BG,
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: RADIUS.sm,
  },
  cityFieldError: {
    borderColor: T.danger,
  },
  cityValue: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
  },
  cityPlaceholder: {
    color: T.mutedSoft,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    marginTop: 6,
  },
  retryHint: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.accent,
    textAlign: 'center',
  },
});
