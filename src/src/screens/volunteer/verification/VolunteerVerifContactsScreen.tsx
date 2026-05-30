import { useEffect, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { PhoneField, TextField } from '../../../components/TextField';
import {
  VolunteerVerifContactRow,
  VolunteerVerifInfoBanner,
  VolunteerVerifSectionLabel,
  VolunteerVerifStepLayout,
} from '../../../components/volunteer/verification/VolunteerVerifParts';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
  ContactChannelType,
  validateVolunteerVerifContacts,
  VOLUNTEER_VERIF_STEPS,
} from '../../../navigation/volunteerVerificationTypes';
import { useVolunteerVerifDraft } from '../../../providers/VolunteerVerifDraftProvider';
import { RADIUS, T, CARD_BG } from '../../../theme/tokens';
import {
  contactEditorPhoneDigits,
  formatContactForDisplay,
  normalizeContactValue,
  validateContactValue,
} from '../../../utils/contactValidation';
import { clearFieldError } from '../../../utils/formErrors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerVerifContacts'>;
};

const CONTACT_EMOJI: Record<ContactChannelType, string> = {
  telegram: '💬',
  whatsapp: '💚',
  email: '📧',
  max: '🔵',
};

const PREFERRED_LABELS: Record<ContactChannelType, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
  max: 'Max',
};

const PLACEHOLDERS: Record<ContactChannelType, string> = {
  telegram: '@username',
  whatsapp: '912 458 70 33',
  email: 'email@example.com',
  max: '912 458 70 33',
};

function isPhoneContactType(type: ContactChannelType | null): type is 'whatsapp' | 'max' {
  return type === 'whatsapp' || type === 'max';
}

export function VolunteerVerifContactsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { draft, patchDraft } = useVolunteerVerifDraft();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingType, setEditingType] = useState<ContactChannelType | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [editorError, setEditorError] = useState<string | undefined>();
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (editingType == null) {
      setKeyboardInset(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [editingType]);

  const updateContactValue = (type: ContactChannelType, value: string) => {
    patchDraft({
      contacts: draft.contacts.map((contact) =>
        contact.type === type ? { ...contact, value } : contact,
      ),
    });
  };

  const openEditor = (type: ContactChannelType) => {
    const contact = draft.contacts.find((item) => item.type === type);
    setEditingType(type);
    setEditorError(undefined);
    if (isPhoneContactType(type)) {
      setPhoneDigits(contactEditorPhoneDigits(type, contact?.value ?? ''));
      setDraftValue('');
    } else {
      setDraftValue(contact?.value ?? '');
      setPhoneDigits('');
    }
  };

  const closeEditor = () => {
    Keyboard.dismiss();
    setEditingType(null);
    setDraftValue('');
    setPhoneDigits('');
    setEditorError(undefined);
  };

  const saveEditor = () => {
    if (!editingType) return;

    const rawValue = isPhoneContactType(editingType) ? phoneDigits : draftValue;
    const validationError = validateContactValue(editingType, rawValue);
    if (validationError) {
      setEditorError(validationError);
      return;
    }

    updateContactValue(editingType, normalizeContactValue(editingType, rawValue));
    setErrors((prev) => {
      const next = clearFieldError(prev, 'contacts');
      return clearFieldError(next, `contact_${editingType}`);
    });
    closeEditor();
  };

  const handleNext = () => {
    const nextErrors = validateVolunteerVerifContacts(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    navigation.navigate('VolunteerVerifSkills');
  };

  const activeTypes = draft.contacts
    .filter((contact) => contact.value.trim())
    .map((contact) => contact.type);

  const editingContact = editingType
    ? draft.contacts.find((contact) => contact.type === editingType)
    : null;

  return (
    <>
      <VolunteerVerifStepLayout
        title="Контакты"
        subtitle="Через них вас найдут благополучатели"
        step={2}
        total={VOLUNTEER_VERIF_STEPS}
        onBack={() => navigation.navigate('VolunteerVerifGeneral')}
        onNext={handleNext}
      >
        <VolunteerVerifInfoBanner
          tone="accent"
          text="Чата в приложении нет — общение идёт через ваши мессенджеры. Укажите хотя бы один способ связи."
        />

        {errors.contacts ? <Text style={styles.error}>{errors.contacts}</Text> : null}

        <VolunteerVerifSectionLabel>Способы связи</VolunteerVerifSectionLabel>
        {draft.contacts.map((contact) => (
          <View key={contact.type}>
            <VolunteerVerifContactRow
              emoji={CONTACT_EMOJI[contact.type]}
              name={contact.label}
              value={formatContactForDisplay(contact.type, contact.value)}
              isMain={draft.preferredContactType === contact.type}
              onPress={() => openEditor(contact.type)}
            />
            {errors[`contact_${contact.type}`] ? (
              <Text style={styles.rowError}>{errors[`contact_${contact.type}`]}</Text>
            ) : null}
          </View>
        ))}

        <VolunteerVerifSectionLabel>Как с вами лучше связаться</VolunteerVerifSectionLabel>
        <View style={styles.preferredRow}>
          {(Object.keys(PREFERRED_LABELS) as ContactChannelType[]).map((type) => {
            const active = draft.preferredContactType === type;
            const disabled = !activeTypes.includes(type);
            return (
              <Pressable
                key={type}
                disabled={disabled}
                onPress={() => {
                  patchDraft({ preferredContactType: type });
                  if (errors.preferredContactType) {
                    setErrors((prev) => clearFieldError(prev, 'preferredContactType'));
                  }
                }}
                style={[
                  styles.preferredChip,
                  active && styles.preferredChipActive,
                  disabled && styles.preferredChipDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.preferredChipText,
                    active && styles.preferredChipTextActive,
                    disabled && styles.preferredChipTextDisabled,
                  ]}
                >
                  {PREFERRED_LABELS[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.preferredContactType ? (
          <Text style={styles.error}>{errors.preferredContactType}</Text>
        ) : null}
      </VolunteerVerifStepLayout>

      <Modal visible={editingType != null} transparent animationType="slide" onRequestClose={closeEditor}>
        <Pressable style={styles.modalBackdropPressable} onPress={closeEditor}>
          <Pressable
            style={[
              styles.modalSheet,
              {
                marginBottom: keyboardInset,
                paddingBottom: keyboardInset > 0 ? 16 : insets.bottom + 16,
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>{editingContact?.label ?? 'Контакт'}</Text>
            {isPhoneContactType(editingType) ? (
              <PhoneField
                value={phoneDigits}
                onChangeDigits={(digits) => {
                  setPhoneDigits(digits);
                  if (editorError) setEditorError(undefined);
                }}
                error={editorError}
                importantForAutofill="no"
              />
            ) : (
              <TextField
                label="Контакт"
                value={draftValue}
                onChangeText={(value) => {
                  setDraftValue(value);
                  if (editorError) setEditorError(undefined);
                }}
                placeholder={editingType ? PLACEHOLDERS[editingType] : ''}
                autoFocus
                autoCapitalize={editingType === 'email' ? 'none' : 'none'}
                keyboardType={editingType === 'email' ? 'email-address' : 'default'}
                error={editorError}
                returnKeyType="done"
                onSubmitEditing={saveEditor}
              />
            )}
            <View style={styles.modalActions}>
              <Button kind="ghost" size="md" onPress={closeEditor} style={styles.modalAction}>
                Отмена
              </Button>
              <Button kind="primary" size="md" onPress={saveEditor} style={styles.modalAction}>
                Сохранить
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  preferredRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  preferredChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  preferredChipActive: {
    backgroundColor: T.primarySoft,
    borderColor: T.primary,
  },
  preferredChipDisabled: {
    opacity: 0.45,
  },
  preferredChipText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  preferredChipTextActive: {
    color: T.primaryDark,
  },
  preferredChipTextDisabled: {
    color: T.muted,
  },
  error: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    marginBottom: 10,
  },
  rowError: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  modalBackdropPressable: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalAction: {
    flex: 1,
  },
});
