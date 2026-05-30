import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  cancelHelpRequest,
  CodeLabel,
  getHelpRequestReasonCodes,
  interruptHelpRequest,
} from '../../../api/helpRequests';
import { Button } from '../../Button';
import { Icon } from '../../Icon';
import { TextField } from '../../TextField';
import { isSessionExpiredError } from '../../../services/authSession';
import { RADIUS, T } from '../../../theme/tokens';

export type HelpRequestReasonActionKind = 'cancel' | 'interrupt';

type Props = {
  visible: boolean;
  kind: HelpRequestReasonActionKind;
  helpRequestId: string;
  isMaterial: boolean;
  joinedVolunteers?: number;
  onClose: () => void;
  onSuccess: () => void;
  onSessionExpired?: () => void;
  onError: (message: string) => void;
  onSuccessMessage: (message: string) => void;
};

function requiresCustomReasonText(code: string, label: string): boolean {
  const normalizedCode = code.toUpperCase();
  if (normalizedCode === 'OTHER' || normalizedCode.endsWith('_OTHER')) {
    return true;
  }

  const normalizedLabel = label.trim().toLowerCase();
  return (
    normalizedLabel.includes('другая причина') ||
    normalizedLabel.includes('другое') ||
    normalizedLabel.includes('иная причина')
  );
}

function volunteersLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? 'волонтёр'
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)
        ? 'волонтёра'
        : 'волонтёров';
  return `${count} ${word}`;
}

function copyForKind(
  kind: HelpRequestReasonActionKind,
  isMaterial: boolean,
  joinedVolunteers: number,
): { title: string; description: string; confirmLabel: string; dismissLabel: string; success: string } {
  if (kind === 'interrupt') {
    return {
      title: isMaterial ? 'Прервать сбор?' : 'Прервать заявку?',
      description: isMaterial
        ? 'Сбор будет остановлен. Если уже есть пожертвования, дальнейшие шаги зависят от правил платформы.'
        : 'Волонтёры получат уведомление. Восстановить заявку будет нельзя — придётся создать новую.',
      confirmLabel: isMaterial ? 'Прервать сбор' : 'Прервать заявку',
      dismissLabel: 'Не прерывать',
      success: isMaterial ? 'Сбор прерван' : 'Заявка прервана',
    };
  }

  if (!isMaterial && joinedVolunteers > 0) {
    return {
      title: 'Отменить заявку?',
      description: `Записавшиеся ${volunteersLabel(joinedVolunteers)} получат уведомление об отмене. Восстановить заявку будет нельзя — придётся создать новую.`,
      confirmLabel: 'Отменить заявку',
      dismissLabel: 'Не отменять',
      success: 'Заявка отменена',
    };
  }

  return {
    title: isMaterial ? 'Отменить сбор?' : 'Отменить заявку?',
    description: isMaterial
      ? 'Сбор будет отменён. Восстановить его будет нельзя — придётся создать новый.'
      : 'Заявка будет отменена. Восстановить её будет нельзя — придётся создать новую.',
    confirmLabel: isMaterial ? 'Отменить сбор' : 'Отменить заявку',
    dismissLabel: 'Не отменять',
    success: 'Заявка отменена',
  };
}

export function HelpRequestReasonSheet({
  visible,
  kind,
  helpRequestId,
  isMaterial,
  joinedVolunteers = 0,
  onClose,
  onSuccess,
  onSessionExpired,
  onError,
  onSuccessMessage,
}: Props) {
  const insets = useSafeAreaInsets();
  const [reasons, setReasons] = useState<CodeLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customReasonText, setCustomReasonText] = useState('');
  const [customReasonError, setCustomReasonError] = useState<string | undefined>();

  const copy = useMemo(
    () => copyForKind(kind, isMaterial, joinedVolunteers),
    [kind, isMaterial, joinedVolunteers],
  );

  const selectedReason = reasons.find((item) => item.code === selectedCode) ?? null;
  const needsCustomReason = selectedReason
    ? requiresCustomReasonText(selectedReason.code, selectedReason.label)
    : false;
  const trimmedCustomReason = customReasonText.trim();
  const canConfirm =
    !!selectedReason && (!needsCustomReason || trimmedCustomReason.length > 0);

  useEffect(() => {
    if (!visible) {
      setReasons([]);
      setSelectedCode(null);
      setLoadError(null);
      setLoading(false);
      setSubmitting(false);
      setCustomReasonText('');
      setCustomReasonError(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    getHelpRequestReasonCodes()
      .then((response) => {
        if (cancelled) return;
        const bucket = isMaterial ? response.material : response.social;
        const list = kind === 'cancel' ? bucket.cancellation : bucket.interruption;
        setReasons(list);
        setSelectedCode(list[0]?.code ?? null);
        if (!list.length) {
          setLoadError('Список причин пуст');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (isSessionExpiredError(err)) {
          onSessionExpired?.();
          onClose();
          return;
        }
        setLoadError(err instanceof Error ? err.message : 'Не удалось загрузить причины');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, kind, isMaterial, onClose, onSessionExpired]);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    if (needsCustomReason && !trimmedCustomReason) {
      setCustomReasonError('Опишите причину');
      return;
    }

    setCustomReasonError(undefined);
    setSubmitting(true);
    try {
      const body = {
        code: selectedReason.code,
        reason: needsCustomReason ? trimmedCustomReason : selectedReason.label,
      };
      if (kind === 'cancel') {
        await cancelHelpRequest(helpRequestId, body);
      } else {
        await interruptHelpRequest(helpRequestId, body);
      }
      onSuccessMessage(copy.success);
      onSuccess();
    } catch (err) {
      if (isSessionExpiredError(err)) {
        onSessionExpired?.();
        onClose();
        return;
      }
      onError(err instanceof Error ? err.message : 'Не удалось выполнить действие');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
            onPress={(event) => event.stopPropagation()}
          >
          <View style={styles.handle} />

          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Icon name="warn" size={32} color={T.danger} strokeWidth={2} />
            </View>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.description}>{copy.description}</Text>
          </View>

          <Text style={styles.reasonsLabel}>Причина {kind === 'cancel' ? 'отмены' : 'прерывания'}</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={T.primary} />
            </View>
          ) : loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : (
            <ScrollView
              style={[styles.reasonsList, !needsCustomReason && styles.reasonsListSpaced]}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {reasons.map((item, index) => {
                const active = item.code === selectedCode;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => {
                      setSelectedCode(item.code);
                      if (!requiresCustomReasonText(item.code, item.label)) {
                        setCustomReasonError(undefined);
                      }
                    }}
                    style={[styles.reasonRow, index < reasons.length - 1 && styles.reasonRowBorder]}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={styles.reasonLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {needsCustomReason ? (
            <TextField
              label="Опишите причину"
              value={customReasonText}
              onChangeText={(text) => {
                setCustomReasonText(text);
                if (customReasonError && text.trim()) {
                  setCustomReasonError(undefined);
                }
              }}
              placeholder="Расскажите, почему отменяете заявку"
              multiline
              error={customReasonError}
              containerStyle={styles.customReasonField}
            />
          ) : null}

          <View style={styles.footer}>
            <Button kind="ghost" size="lg" style={styles.footerBtn} disabled={submitting} onPress={onClose}>
              {copy.dismissLabel}
            </Button>
            <Button
              kind="primary"
              size="lg"
              style={styles.confirmBtn}
              labelColor="#fff"
              disabled={submitting || loading || !canConfirm}
              onPress={handleConfirm}
            >
              {submitting ? 'Отправка…' : copy.confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
    backgroundColor: 'rgba(20,18,12,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.border,
    marginBottom: 18,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
  },
  reasonsLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    marginBottom: 12,
  },
  reasonsList: {
    maxHeight: 220,
  },
  reasonsListSpaced: {
    marginBottom: 18,
  },
  customReasonField: {
    marginTop: 4,
    marginBottom: 18,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  reasonRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: T.danger,
    backgroundColor: T.danger,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  reasonLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: T.danger,
  },
});
