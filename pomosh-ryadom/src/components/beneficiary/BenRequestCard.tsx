import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BenRequestCardMediaCarousel } from './BenRequestCardMediaCarousel';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { ProgressBar } from '../ProgressBar';
import { StatusBadge } from '../StatusBadge';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

export type BenRequestType = 'social' | 'material';

export type BenRequestCardReason = {
  kind: 'rework' | 'reject';
  label: string;
  text: string;
  author?: string;
};

export type BenRequestCardData = {
  id: string;
  type: BenRequestType;
  status: string;
  title: string;
  sub: string;
  footer: string;
  needsAction?: boolean;
  reason?: BenRequestCardReason;
  progress?: {
    value: number;
    max: number;
    color: string;
    format?: 'count' | 'money';
  };
  imageMediaIds?: string[];
  categoryCode?: string;
  /** Для клиентских фильтров */
  apiStatus?: string;
  createdAtIso?: string;
  amountRequestedKopeks?: number;
  amountCollectedKopeks?: number;
};

type Props = BenRequestCardData & {
  onPress?: () => void;
  onReasonPress?: () => void;
  onCarouselInteractionChange?: (active: boolean) => void;
};

function progressTrackColor(color: string): string {
  if (color === T.accent) return T.accentSoft;
  if (color === T.success) return T.successSoft;
  if (color === T.primary) return T.primarySoft;
  return T.surface2;
}

function reasonColors(kind: BenRequestCardReason['kind']) {
  if (kind === 'reject') {
    return {
      accent: T.danger,
      bg: T.dangerSoft,
      text: T.danger,
    };
  }
  return {
    accent: T.warning,
    bg: T.warningSoft,
    text: '#7A5210',
  };
}

export function BenRequestCard({
  type,
  status,
  title,
  sub,
  footer,
  progress,
  needsAction,
  reason,
  imageMediaIds = [],
  onPress,
  onReasonPress,
  onCarouselInteractionChange,
}: Props) {
  const isMaterial = type === 'material';
  const accent = isMaterial ? T.accent : T.primary;
  const reasonStyle = reason ? reasonColors(reason.kind) : null;
  const borderColor = reasonStyle ? `${reasonStyle.accent}66` : `${T.danger}66`;

  return (
    <View
      style={[
        styles.card,
        shadowSm,
        needsAction && { borderWidth: 1.5, borderColor },
      ]}
    >
      <View style={styles.imageWrap} pointerEvents="box-none">
        <BenRequestCardMediaCarousel
          slides={imageMediaIds.map((mediaId) => ({ mediaId }))}
          placeholderIcon={isMaterial ? 'coin' : 'handshake'}
          accent={accent}
          onInteractionChange={onCarouselInteractionChange}
          onPress={onPress}
        />
        <View style={styles.statusTopLeft} pointerEvents="none">
          <StatusBadge status={status} />
        </View>
        <View style={styles.typeChip} pointerEvents="none">
          <Icon name={isMaterial ? 'coin' : 'handshake'} size={14} color={isMaterial ? T.accentDark : T.primaryDark} />
          <Text style={[styles.typeChipText, { color: isMaterial ? T.accentDark : T.primaryDark }]}>
            {isMaterial ? 'Сбор' : 'Делом'}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.body, pressed && onPress && styles.cardPressed]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.sub, !(progress || footer) && styles.subTight]}>{sub}</Text>

        {progress ? (
          <View style={styles.progressBlock}>
            <ProgressBar
              value={progress.value}
              max={progress.max}
              color={progress.color}
              bg={progressTrackColor(progress.color)}
              height={6}
            />
          </View>
        ) : null}

        {footer ? (
          <View style={[styles.footerRow, progress ? styles.footerRowWithProgress : null]}>
            <Text style={styles.footer} numberOfLines={2}>
              {footer}
            </Text>
            {onPress ? (
              <Button kind="ghost" size="sm" iconRight="chevR" onPress={onPress}>
                Открыть
              </Button>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      {reason && reasonStyle ? (
        <View style={[styles.reasonWrap, { borderTopColor: `${reasonStyle.accent}33` }]}>
          <View style={[styles.reasonHead, { backgroundColor: reasonStyle.bg }]}>
            <Icon
              name={reason.kind === 'reject' ? 'warn' : 'chat'}
              size={16}
              color={reasonStyle.text}
              strokeWidth={2.2}
            />
            <Text style={[styles.reasonHeadText, { color: reasonStyle.text }]}>{reason.label}</Text>
          </View>
          <View style={[styles.reasonBody, { backgroundColor: reasonStyle.bg }]}>
            <Text style={styles.reasonText}>{reason.text}</Text>
            {reason.author ? <Text style={styles.reasonAuthor}>{reason.author}</Text> : null}
            <Button
              kind={reason.kind === 'reject' ? 'ghost' : 'primary'}
              size="sm"
              icon={reason.kind === 'reject' ? 'chat' : 'edit'}
              iconRight="arrowR"
              onPress={onReasonPress ?? onPress}
            >
              {reason.kind === 'reject' ? 'Связаться с поддержкой' : 'Исправить и отправить'}
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.96,
  },
  imageWrap: {
    position: 'relative',
  },
  statusTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  typeChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
  },
  body: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 21,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 19,
    marginBottom: 12,
  },
  subTight: {
    marginBottom: 0,
  },
  progressBlock: {
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  footerRowWithProgress: {
    marginTop: 0,
  },
  footer: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    lineHeight: 17,
  },
  reasonWrap: {
    borderTopWidth: 1,
  },
  reasonHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  reasonHeadText: {
    fontSize: 12,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  reasonBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  reasonText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 20,
    marginBottom: 8,
  },
  reasonAuthor: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    marginBottom: 12,
  },
});
