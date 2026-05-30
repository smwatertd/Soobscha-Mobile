import { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FieldError } from '../../components/beneficiary/create/FieldError';
import { CreateRequestStepLayout } from '../../components/beneficiary/create/CreateRequestStepLayout';
import { Chip } from '../../components/Chip';
import { Icon } from '../../components/Icon';
import { TextField } from '../../components/TextField';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  ADDITIONAL_NOTES_MAX_LENGTH,
  DEFAULT_BRING_ITEMS,
  MAX_BRING_ITEMS,
} from '../../navigation/createHelpRequestTypes';
import { useSocialHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { RADIUS, T, CARD_BG } from '../../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateHelpRequestConditions'>;
};

const DEFAULT_BRING_SET = new Set<string>(DEFAULT_BRING_ITEMS);

export function CreateHelpRequestConditionsScreen({ navigation }: Props) {
  const { draft, patchDraft, getDraft } = useSocialHelpRequestDraft();
  const [extraNotesError, setExtraNotesError] = useState<string | undefined>();
  const [safetyError, setSafetyError] = useState<string | undefined>();
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customError, setCustomError] = useState<string | undefined>();

  const customItems = useMemo(
    () => draft.bringItems.filter((item) => !DEFAULT_BRING_SET.has(item)),
    [draft.bringItems],
  );

  const canAddMore = draft.bringItems.length < MAX_BRING_ITEMS;

  const toggleItem = (item: string) => {
    if (draft.bringItems.includes(item)) {
      patchDraft({ bringItems: draft.bringItems.filter((i) => i !== item) });
      return;
    }
    if (draft.bringItems.length >= MAX_BRING_ITEMS) return;
    patchDraft({ bringItems: [...draft.bringItems, item] });
  };

  const openCustomInput = () => {
    if (!canAddMore) return;
    Keyboard.dismiss();
    setCustomError(undefined);
    setIsAddingCustom(true);
  };

  const cancelCustomInput = () => {
    setCustomText('');
    setCustomError(undefined);
    setIsAddingCustom(false);
  };

  const addCustomItem = () => {
    const trimmed = customText.trim();
    if (!trimmed) {
      setCustomError('Введите название');
      return;
    }
    if (trimmed.length > 40) {
      setCustomError('Не длиннее 40 символов');
      return;
    }
    if (!canAddMore) {
      setCustomError(`Не более ${MAX_BRING_ITEMS} пунктов`);
      return;
    }
    const duplicate = draft.bringItems.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setCustomError('Такой пункт уже есть');
      return;
    }

    patchDraft({ bringItems: [...draft.bringItems, trimmed] });
    setCustomText('');
    setCustomError(undefined);
    setIsAddingCustom(false);
  };

  const handleNext = () => {
    if (draft.extraNotes.trim().length > ADDITIONAL_NOTES_MAX_LENGTH) {
      setExtraNotesError(`Не более ${ADDITIONAL_NOTES_MAX_LENGTH} символов`);
      return;
    }
    if (!draft.safetyAccepted) {
      setSafetyError('Подтвердите ознакомление с правилами безопасности');
      return;
    }
    setExtraNotesError(undefined);
    setSafetyError(undefined);
    patchDraft({ extraNotes: draft.extraNotes.trim() });
    navigation.navigate('CreateHelpRequestReview', getDraft());
  };

  return (
    <CreateRequestStepLayout
      title="Условия и контакт"
      step={4}
      onBack={() => navigation.goBack()}
      onNext={handleNext}
      confirmDiscard={{
        hasChanges:
          draft.bringItems.length > 0 ||
          Boolean(draft.extraNotes.trim()) ||
          draft.safetyAccepted,
      }}
    >
      <View>
        <Text style={styles.sectionLabel}>ЧТО ВЗЯТЬ С СОБОЙ</Text>
        <View style={styles.chips}>
          {DEFAULT_BRING_ITEMS.map((item) => (
            <Chip
              key={item}
              label={item}
              active={draft.bringItems.includes(item)}
              onPress={() => toggleItem(item)}
            />
          ))}
          {customItems.map((item) => (
            <Chip
              key={item}
              label={item}
              active={draft.bringItems.includes(item)}
              onPress={() => toggleItem(item)}
            />
          ))}
          {!isAddingCustom && canAddMore ? (
            <Pressable style={styles.addChip} onPress={openCustomInput}>
              <Icon name="plus" size={14} color={T.primary} strokeWidth={2.2} />
              <Text style={styles.addChipText}>Своё</Text>
            </Pressable>
          ) : null}
        </View>
        {isAddingCustom ? (
          <View style={styles.customBox}>
            <TextField
              value={customText}
              onChangeText={(value) => {
                setCustomText(value);
                if (customError) {
                  setCustomError(undefined);
                }
              }}
              placeholder="Например: рабочие перчатки"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addCustomItem}
              error={customError}
            />
            <View style={styles.customActions}>
              <Pressable onPress={cancelCustomInput} style={styles.customCancel}>
                <Text style={styles.customCancelText}>Отмена</Text>
              </Pressable>
              <Pressable onPress={addCustomItem} style={styles.customAdd}>
                <Text style={styles.customAddText}>Добавить</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <TextField
        label="Дополнительно (необязательно)"
        value={draft.extraNotes}
        onChangeText={(value) => {
          patchDraft({ extraNotes: value });
          if (extraNotesError) {
            setExtraNotesError(undefined);
          }
        }}
        multiline
        numberOfLines={3}
        maxLength={ADDITIONAL_NOTES_MAX_LENGTH}
        error={extraNotesError}
        placeholder="Например: «У меня живёт кошка, не пугайтесь», «вход с торца дома»…"
        style={styles.textArea}
      />

      <View>
        <Pressable
          onPress={() => {
            patchDraft({ safetyAccepted: !draft.safetyAccepted });
            if (safetyError) {
              setSafetyError(undefined);
            }
          }}
          style={styles.safetyBox}
        >
          <View style={[styles.safetyCheck, draft.safetyAccepted && styles.safetyCheckOn]}>
            {draft.safetyAccepted && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
          </View>
          <Text style={styles.safetyText}>
            Я ознакомлен с{' '}
            <Text style={styles.safetyLink}>правилами безопасности</Text>
            {' '}приёма волонтёров и беру ответственность за корректность данных.
          </Text>
        </Pressable>
        <FieldError message={safetyError} />
      </View>
    </CreateRequestStepLayout>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink2,
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: T.border,
  },
  addChipText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  customBox: {
    marginTop: 10,
    gap: 8,
  },
  customActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  customCancel: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  customCancelText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  customAdd: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  customAddText: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: T.primarySoft,
    borderRadius: RADIUS.md,
  },
  safetyCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  safetyCheckOn: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  safetyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.primaryDark,
    lineHeight: 20,
  },
  safetyLink: {
    fontFamily: 'Manrope_700Bold',
    textDecorationLine: 'underline',
  },
});
