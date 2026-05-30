import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '../../Icon';
import { ModerationFeedback } from '../../../utils/extractModerationFeedback';
import { RADIUS, T, CARD_BG } from '../../../theme/tokens';

type Props = {
  status: string;
  createdAt: string;
  feedback: ModerationFeedback;
  onAction?: () => void;
  variant?: 'social' | 'material';
};

function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

function formatSubmittedDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

type DecisionConfig = {
  bg: string;
  color: string;
  icon: IconName;
  title: string;
  body: string;
  sub?: string;
  cta?: string;
  ctaIcon?: IconName;
};

function getDecisionConfig(
  status: string,
  createdAt: string,
  feedback: ModerationFeedback,
  variant: 'social' | 'material',
): DecisionConfig | null {
  if (status === 'PENDING_MODERATION') {
    if (variant === 'material') {
      return {
        bg: T.warningSoft,
        color: '#7A5210',
        icon: 'clock',
        title: 'На модерации',
        body: `Отправлено ${formatSubmittedDay(createdAt)}. Партнёр обычно проверяет до 24 часов — придёт уведомление.`,
      };
    }

    return {
      bg: T.warningSoft,
      color: '#7A5210',
      icon: 'clock',
      title: 'На модерации',
      sub: `Отправлено ${formatSubmittedAt(createdAt)}`,
      body: 'Партнёр обычно проверяет до 24 часов. Изменить заявку до ответа нельзя.',
    };
  }

  if (status === 'RETURNED_TO_REWORK') {
    return {
      bg: T.warningSoft,
      color: '#7A5210',
      icon: 'edit',
      title: 'Партнёр попросил исправить',
      body:
        feedback.returnReason ??
        'Партнёр попросил уточнить детали — отредактируйте заявку и отправьте снова.',
      cta: 'Исправить и отправить',
      ctaIcon: 'edit',
    };
  }

  if (status === 'REJECTED') {
    return {
      bg: T.dangerSoft,
      color: T.danger,
      icon: 'warn',
      title: 'Заявка отклонена',
      body: feedback.rejectionReason ?? 'Партнёр отклонил заявку без комментария.',
      cta: 'Связаться с поддержкой',
      ctaIcon: 'chat',
    };
  }

  return null;
}

export function HelpRequestModerationBanner({
  status,
  createdAt,
  feedback,
  onAction,
  variant = 'social',
}: Props) {
  const config = getDecisionConfig(status, createdAt, feedback, variant);
  if (!config) return null;

  if (variant === 'material' && status === 'PENDING_MODERATION') {
    return (
      <View style={[styles.materialBanner, { borderColor: `${T.warning}22` }]}>
        <Icon name={config.icon} size={20} color="#8B5E10" strokeWidth={2} />
        <View style={styles.materialBody}>
          <Text style={styles.materialTitle}>{config.title}</Text>
          <Text style={styles.materialDesc}>{config.body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: `${config.color}33` }]}>
      <View style={[styles.header, { backgroundColor: config.bg }]}>
        <View style={[styles.headerIcon, { backgroundColor: '#fff' }]}>
          <Icon name={config.icon} size={16} color={config.color} strokeWidth={2.2} />
        </View>
        <View style={styles.headerBody}>
          <Text style={[styles.headerTitle, { color: config.color }]}>{config.title}</Text>
          {config.sub ? (
            <Text style={[styles.headerSub, { color: config.color }]}>{config.sub}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.bodyText}>{config.body}</Text>
      </View>

      {config.cta ? (
        <Pressable
          style={[styles.action, { borderTopColor: `${config.color}33` }]}
          onPress={onAction}
          disabled={!onAction}
        >
          <View style={styles.actionLeft}>
            {config.ctaIcon ? (
              <Icon name={config.ctaIcon} size={16} color={config.color} strokeWidth={2.2} />
            ) : null}
            <Text style={[styles.actionText, { color: config.color }]}>{config.cta}</Text>
          </View>
          <Icon name="chevR" size={18} color={config.color} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: CARD_BG,
  },
  materialBanner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: T.warningSoft,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  materialBody: {
    flex: 1,
    minWidth: 0,
  },
  materialTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#7A5210',
  },
  materialDesc: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#7A5210',
    marginTop: 3,
    lineHeight: 17,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    opacity: 0.85,
    marginTop: 2,
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 20,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
  },
});
