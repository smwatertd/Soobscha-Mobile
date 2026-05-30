import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BenRequestCardMediaCarousel } from '../beneficiary/BenRequestCardMediaCarousel';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { BeneficiaryCategoryChip } from '../BeneficiaryCategoryChip';
import { HelpRequestCategoryChip } from '../HelpRequestCategoryChip';
import { HelpRequestTypeChip } from '../HelpRequestTypeChip';
import { Icon } from '../Icon';
import { ProgressBar } from '../ProgressBar';
import { VolunteerFeedItem } from '../../screens/volunteer/volunteerFeedTypes';
import { formatMoneyRub } from '../../utils/formatMoney';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  request: VolunteerFeedItem;
  onPress?: () => void;
  onHelpPress?: () => void;
  onCarouselInteractionChange?: (active: boolean) => void;
  isWatched?: boolean;
  onToggleWatch?: () => void;
  watchDisabled?: boolean;
};

const VOLUNTEER_STACK_NAMES = ['Алексей', 'Дмитрий', 'Ольга', 'Мария', 'Иван'];

function VolunteerAvatarStack({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const shown = Math.min(current, 3);
  const extra = Math.max(0, max - current);

  return (
    <View style={styles.avatarStack}>
      {VOLUNTEER_STACK_NAMES.slice(0, shown).map((name, index) => (
        <View key={name} style={[styles.avatarStackItem, index > 0 && styles.avatarStackOverlap]}>
          <Avatar name={name} size={26} />
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.avatarStackMore, shown > 0 && styles.avatarStackOverlap]}>
          <Text style={styles.avatarStackMoreText}>+{extra}</Text>
        </View>
      ) : null}
      <Text style={styles.volunteersRatio}>
        <Text style={styles.volunteersRatioBold}>{current}</Text>/{max}
      </Text>
    </View>
  );
}

export function VolunteerRequestCard({
  request,
  onPress,
  onHelpPress,
  onCarouselInteractionChange,
  isWatched = false,
  onToggleWatch,
  watchDisabled = false,
}: Props) {
  const isMaterial = request.type === 'material';
  const isCompleted = request.status === 'COMPLETED' || request.status === 'completed';
  const accentDark = isMaterial ? T.accentDark : T.primaryDark;
  const typeLabel = isMaterial
    ? isCompleted
      ? 'Завершена'
      : 'Денежный сбор'
    : 'Помочь делом';
  const goalRub = request.goal ?? 0;
  const collectedRub = request.collected ?? 0;
  const showMaterialProgress = isMaterial && goalRub > 0;
  const mediaSlides =
    request.mediaSlides?.length
      ? request.mediaSlides
      : request.imageUri
        ? [{ mediaId: `${request.id}-cover`, uri: request.imageUri }]
        : [];

  return (
    <View style={[styles.card, shadowSm]}>
      <View style={styles.hero} pointerEvents="box-none">
        <BenRequestCardMediaCarousel
          slides={mediaSlides}
          placeholderIcon={isMaterial ? 'coin' : 'handshake'}
          accent={accentDark}
          onInteractionChange={onCarouselInteractionChange}
          onPress={onPress}
        />
        <View style={styles.heroBadgesCol} pointerEvents="box-none">
          <HelpRequestTypeChip
            type={request.type}
            completed={isCompleted}
            size="xs"
          />
          {request.reqCategory ? (
            <HelpRequestCategoryChip
              type={request.type}
              categoryCode={request.categoryCode}
              label={request.reqCategory}
              size="xs"
            />
          ) : null}
        </View>
        {onToggleWatch ? (
          <Pressable
            style={[styles.heartBtn, watchDisabled && styles.heartBtnDisabled]}
            hitSlop={8}
            disabled={watchDisabled}
            onPress={(e) => {
              e.stopPropagation();
              onToggleWatch();
            }}
            accessibilityRole="button"
            accessibilityLabel={isWatched ? 'Убрать из избранного' : 'В избранное'}
          >
            <Icon
              name="heart"
              size={18}
              color={isWatched ? T.danger : T.ink2}
              fill={isWatched ? T.danger : 'none'}
              strokeWidth={isWatched ? 1.4 : 2}
            />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.body, pressed && onPress && styles.cardPressed]}
      >
        <View style={styles.authorRow}>
          <Avatar name={request.author} size={28} />
          <View style={styles.authorText}>
            <Text style={styles.authorName} numberOfLines={1}>
              {request.author}
            </Text>
            {request.benCategory ? (
              <BeneficiaryCategoryChip
                label={request.benCategory}
                code={request.benCategoryCode}
                size="xs"
                style={styles.authorCategoryChip}
              />
            ) : null}
          </View>
        </View>

        <Text style={styles.title}>{request.title}</Text>

        {isMaterial ? (
          <>
            {showMaterialProgress ? (
              <>
                <ProgressBar
                  value={collectedRub}
                  max={goalRub}
                  color={T.accent}
                  bg={T.accentSoft}
                  height={6}
                />
                <View style={styles.materialMetrics}>
                  <View style={styles.materialAmounts}>
                    <Text style={styles.collectedAmount}>{formatMoneyRub(collectedRub)}</Text>
                    <Text style={styles.goalAmount}>из {formatMoneyRub(goalRub)}</Text>
                  </View>
                  {request.daysLeft != null ? (
                    <View style={styles.daysLeftRow}>
                      <Icon name="clock" size={12} color={T.muted} />
                      <Text style={styles.daysLeftText}>{request.daysLeft} дн.</Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}
            <View style={[styles.footerRow, !showMaterialProgress && styles.footerRowTight]}>
              <View style={styles.metaRow}>
                <Icon name="user" size={14} color={T.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {request.donors != null ? `${request.donors} человек уже помогли` : 'Материальная помощь'}
                </Text>
              </View>
              <Button kind="accent" size="sm" iconRight="arrowR" onPress={onHelpPress}>
                {isCompleted ? 'Подробнее' : 'Помочь'}
              </Button>
            </View>
          </>
        ) : (
          <>
            <View style={styles.socialSchedule}>
              {request.date ? (
                <>
                  <Icon name="calendar" size={16} color={T.muted} />
                  <Text style={styles.socialDate}>{request.date}</Text>
                </>
              ) : null}
              {request.date && request.distanceKm != null ? (
                <View style={styles.dotSep} />
              ) : null}
              {request.distanceKm != null ? (
                <>
                  <Icon name="pin" size={14} color={T.muted} />
                  <Text style={styles.distanceText}>{request.distanceKm} км</Text>
                </>
              ) : null}
            </View>
            <View style={styles.footerRow}>
              {request.volunteers ? (
                <VolunteerAvatarStack
                  current={request.volunteers.current}
                  max={request.volunteers.max}
                />
              ) : (
                <View style={styles.metaRow} />
              )}
              <Button kind="primary" size="sm" iconRight="arrowR" onPress={onHelpPress}>
                Помочь
              </Button>
            </View>
          </>
        )}
      </Pressable>
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
  hero: {
    position: 'relative',
    backgroundColor: T.surface2,
  },
  heroBadgesCol: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    maxWidth: '78%',
    zIndex: 2,
  },
  heartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnDisabled: {
    opacity: 0.55,
  },
  body: {
    padding: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 16,
  },
  authorCategoryChip: {
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 21,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  materialMetrics: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  footerRowTight: {
    marginTop: 4,
  },
  materialAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  collectedAmount: {
    fontSize: 17,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.3,
  },
  goalAmount: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  daysLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  daysLeftText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  metaRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  socialSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  socialDate: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: T.mutedSoft,
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  avatarStack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  avatarStackItem: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 15,
  },
  avatarStackOverlap: {
    marginLeft: -10,
  },
  avatarStackMore: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.surface2,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStackMoreText: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
  },
  volunteersRatio: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  volunteersRatioBold: {
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
});
