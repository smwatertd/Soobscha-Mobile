import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { BeneficiaryBottomNav, BeneficiaryTabId } from '../../components/beneficiary/BeneficiaryBottomNav';
import { HowItWorksStep } from '../../components/beneficiary/HowItWorksStep';
import { Button } from '../../components/Button';
import { Icon, IconName } from '../../components/Icon';
import { ProgressBar } from '../../components/ProgressBar';
import { StatusBadge } from '../../components/StatusBadge';
import { BeneficiaryHomeData } from '../../hooks/useBeneficiaryHome';
import { formatRublesPlain } from '../../utils/money';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

type Props = {
  activeTab?: BeneficiaryTabId;
  onTabPress?: (tab: BeneficiaryTabId) => void;
  unreadCount?: number;
  onCreatePress?: () => void;
  onRequestPress?: (requestId: string) => void;
  onNotificationsPress?: () => void;
  data?: BeneficiaryHomeData | null;
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  onRefresh?: () => void;
};

function requestIcon(type: string): IconName {
  return type === 'MATERIAL' ? 'heart' : 'leaf';
}

export function BeneficiaryHomeScreen({
  activeTab = 'home',
  onTabPress,
  unreadCount = 0,
  onCreatePress,
  onRequestPress,
  onNotificationsPress,
  data,
  loading = false,
  refreshing = false,
  error,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const displayName = data?.fullName ?? '…';
  const greetingName = data?.greetingName ?? '…';
  const activeRequest = data?.activeRequest ?? null;
  const lifetimeStats = data?.lifetimeStats ?? null;
  const closedRequests = data?.closedRequests ?? [];
  const totalRequestsCount = data?.totalRequestsCount ?? 0;

  const HELP_SUGGESTIONS: { icon: IconName; color: string; bg: string; title: string; sub: string }[] = [
    { icon: 'heart', color: T.danger, bg: T.dangerSoft, title: 'Лекарства', sub: 'Сбор средств' },
    { icon: 'leaf', color: T.success, bg: T.successSoft, title: 'Уборка', sub: 'Помощь делом' },
    { icon: 'document', color: T.info, bg: T.infoSoft, title: 'Поход в МФЦ', sub: 'Помощь делом' },
    { icon: 'map', color: T.accent, bg: T.accentSoft, title: 'Перевозка', sub: 'Помощь делом' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <View style={styles.avatarRing}>
          <Avatar name={displayName} size={42} ring={T.accent} />
        </View>
        <View style={styles.greeting}>
          <Text style={styles.greetingSub}>Здравствуйте,</Text>
          <Text style={styles.greetingName}>{greetingName}</Text>
        </View>
        <Pressable style={[styles.bellBtn, shadowSm]} onPress={onNotificationsPress}>
          <Icon name="bell" size={20} color={T.ink} />
          {unreadCount > 0 ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />
          ) : undefined
        }
      >
        <View style={styles.ctaWrap}>
          <LinearGradient
            colors={[T.accent, T.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaCard}
          >
            <View style={styles.ctaDecor} />
            <View style={styles.ctaBody}>
              <View style={styles.ctaLabelRow}>
                <View style={styles.ctaIcon}>
                  <Icon name="plus" size={20} color="#fff" strokeWidth={2.4} />
                </View>
                <Text style={styles.ctaLabel}>СОЗДАТЬ ЗАЯВКУ</Text>
              </View>
              <Text style={styles.ctaTitle}>
                {activeRequest
                  ? `Расскажите, какая помощь\nвам нужна`
                  : `Нужна помощь?\nРасскажите, какая`}
              </Text>
              <Text style={styles.ctaSub}>
                Деньги на лечение или волонтёры — заявка пройдёт модерацию за 24 ч.
              </Text>
              <Button
                kind="secondary"
                size="md"
                labelColor={T.accentDark}
                iconRight="arrowR"
                onPress={onCreatePress}
                style={{ backgroundColor: '#fff' }}
              >
                Создать
              </Button>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Сейчас в процессе</Text>
        </View>

        {loading && !data ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={T.primary} />
          </View>
        ) : error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{error}</Text>
            {onRefresh ? (
              <Button kind="secondary" size="sm" onPress={onRefresh}>
                Повторить
              </Button>
            ) : null}
          </View>
        ) : activeRequest ? (
          <Pressable
            style={[styles.activeCard, shadowSm]}
            onPress={() => onRequestPress?.(activeRequest.id)}
          >
            <View style={styles.activeTop}>
              <View
                style={[
                  styles.activeThumb,
                  { backgroundColor: activeRequest.type === 'MATERIAL' ? T.accentSoft : T.primarySoft },
                ]}
              >
                <Icon
                  name={requestIcon(activeRequest.type)}
                  size={24}
                  color={activeRequest.type === 'MATERIAL' ? T.accentDark : T.primary}
                />
              </View>
              <View style={styles.activeInfo}>
                <StatusBadge status={activeRequest.statusBadge} />
                <Text style={styles.activeTitle}>{activeRequest.title}</Text>
                {activeRequest.meta ? <Text style={styles.activeMeta}>{activeRequest.meta}</Text> : null}
              </View>
            </View>

            {activeRequest.volunteerJoined !== undefined &&
            activeRequest.volunteerMax !== undefined ? (
              <View style={styles.volunteerBlock}>
                <Text style={styles.volunteerLabel}>Набралось волонтёров</Text>
                <ProgressBar
                  value={activeRequest.volunteerJoined}
                  max={activeRequest.volunteerMax}
                  color={T.primary}
                  height={6}
                />
                <View style={styles.volunteerCounts}>
                  <Text style={styles.volunteerCountText}>
                    {activeRequest.volunteerJoined} из {activeRequest.volunteerMax}
                  </Text>
                  {activeRequest.volunteerMin !== undefined ? (
                    <Text style={styles.volunteerCountText}>
                      ≥ {activeRequest.volunteerMin} для запуска
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            <Button
              kind="secondary"
              size="sm"
              full
              iconRight="chevR"
              onPress={() => onRequestPress?.(activeRequest.id)}
            >
              Открыть заявку
            </Button>
          </Pressable>
        ) : lifetimeStats ? (
          <View style={styles.lifetimeCard}>
            <LinearGradient
              colors={[T.primary, T.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.lifetimeHead}
            >
              <Text style={styles.lifetimeLabel}>Получено за всё время</Text>
              <Text style={styles.lifetimeAmount}>
                {formatRublesPlain(lifetimeStats.collectedRubles)} ₽
              </Text>
            </LinearGradient>
            <View style={styles.lifetimeStatsRow}>
              <View style={styles.lifetimeStat}>
                <Text style={styles.lifetimeStatValue}>{lifetimeStats.totalRequests}</Text>
                <Text style={styles.lifetimeStatLabel}>заявок</Text>
              </View>
              <View style={styles.lifetimeSep} />
              <View style={styles.lifetimeStat}>
                <Text style={styles.lifetimeStatValue}>{lifetimeStats.completedRequests}</Text>
                <Text style={styles.lifetimeStatLabel}>успешных</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>У вас нет заявок в процессе</Text>
            <Text style={styles.emptySub}>
              Когда начнётся набор волонтёров, сбор средств или выполнение помощи — заявка появится здесь.
            </Text>
          </View>
        )}

        {!activeRequest && lifetimeStats ? (
          <>
            {closedRequests.length ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Из ваших заявок</Text>
                  {totalRequestsCount > 0 ? (
                    <Pressable onPress={() => onTabPress?.('requests')} hitSlop={8}>
                      <Text style={styles.sectionLink}>Все {totalRequestsCount}</Text>
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.closedList}>
                  {closedRequests.map((item) => (
                    <Pressable
                      key={item.id}
                      style={[styles.closedCard, shadowSm]}
                      onPress={() => onRequestPress?.(item.id)}
                    >
                      <View
                        style={[
                          styles.closedThumb,
                          {
                            backgroundColor:
                              item.type === 'MATERIAL' ? T.accentSoft : T.successSoft,
                          },
                        ]}
                      >
                        <Icon
                          name={requestIcon(item.type)}
                          size={22}
                          color={item.type === 'MATERIAL' ? T.accentDark : T.success}
                        />
                      </View>
                      <View style={styles.closedBody}>
                        <StatusBadge status="completed" />
                        <Text style={styles.closedTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {item.meta ? <Text style={styles.closedMeta}>{item.meta}</Text> : null}
                      </View>
                      <Icon name="chevR" size={18} color={T.mutedSoft} />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>С чем чаще всего помогают</Text>
            </View>
            <View style={styles.suggestGrid}>
              {HELP_SUGGESTIONS.map((item) => (
                <Pressable key={item.title} style={[styles.suggestCard, shadowSm]} onPress={onCreatePress}>
                  <View style={[styles.suggestIcon, { backgroundColor: item.bg }]}>
                    <Icon name={item.icon} size={20} color={item.color} strokeWidth={1.9} />
                  </View>
                  <Text style={styles.suggestTitle}>{item.title}</Text>
                  <Text style={styles.suggestSub}>{item.sub}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.helpCardWrap}>
              <View style={[styles.helpCard, shadowSm]}>
                <View style={styles.helpIcon}>
                  <Icon name="info" size={22} color={T.primary} strokeWidth={2} />
                </View>
                <View style={styles.helpBody}>
                  <Text style={styles.helpTitle}>Не знаете, с чего начать?</Text>
                  <Text style={styles.helpSub}>Свяжитесь с координатором</Text>
                </View>
                <Icon name="chevR" size={18} color={T.primary} />
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Как это работает</Text>
        </View>

        <View style={styles.steps}>
          <HowItWorksStep
            n={1}
            icon="document"
            color={T.primary}
            title="Опишите ситуацию"
            sub="Что и когда нужно сделать или сколько собрать."
          />
          <HowItWorksStep
            n={2}
            icon="shield"
            color={T.accent}
            title="Дождитесь модерации"
            sub="Партнёр проверит заявку — обычно до 24 часов."
          />
          <HowItWorksStep
            n={3}
            icon="handshake"
            color={T.info}
            title="Получите помощь"
            sub="Волонтёры присоединятся или сделают пожертвование."
          />
        </View>
      </ScrollView>

      <BeneficiaryBottomNav
        active={activeTab}
        onTabPress={onTabPress}
        notificationsUnread={unreadCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  avatarRing: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: T.accent,
    padding: 1,
  },
  greeting: {
    flex: 1,
  },
  greetingSub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 14,
  },
  greetingName: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 19,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: T.accent,
    borderWidth: 2,
    borderColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
    lineHeight: 12,
  },
  scroll: {
    flex: 1,
  },
  ctaWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  ctaCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  ctaDecor: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    opacity: 0.12,
  },
  ctaBody: {
    position: 'relative',
    zIndex: 1,
  },
  ctaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ctaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
    opacity: 0.85,
    letterSpacing: 1,
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 24,
    marginBottom: 6,
  },
  ctaSub: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: '#fff',
    opacity: 0.92,
    lineHeight: 19,
    marginBottom: 14,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionLink: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  closedList: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 18,
  },
  closedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
  },
  closedThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  closedTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  closedMeta: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  suggestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  suggestCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    padding: 14,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    gap: 6,
  },
  suggestIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  suggestTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  suggestSub: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  helpCardWrap: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: T.primarySoft,
    borderRadius: RADIUS.lg,
  },
  helpIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBody: {
    flex: 1,
    gap: 2,
  },
  helpTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.primaryDark,
  },
  helpSub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.primaryDark,
    opacity: 0.8,
  },
  activeCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 12,
  },
  activeTop: {
    flexDirection: 'row',
    gap: 12,
  },
  activeThumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeInfo: {
    flex: 1,
    gap: 6,
  },
  activeTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 20,
  },
  activeMeta: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  volunteerBlock: {
    padding: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: T.primarySoft,
    gap: 6,
  },
  volunteerLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primaryDark,
  },
  volunteerCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volunteerCountText: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.primaryDark,
  },
  steps: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  lifetimeCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...shadowSm,
  },
  lifetimeHead: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lifetimeLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  lifetimeAmount: {
    marginTop: 2,
    fontSize: 28,
    fontFamily: 'Manrope_800ExtraBold',
    color: '#fff',
    letterSpacing: -0.6,
  },
  lifetimeStatsRow: {
    flexDirection: 'row',
    paddingVertical: 14,
  },
  lifetimeStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  lifetimeStatValue: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
  },
  lifetimeStatLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  lifetimeSep: {
    width: 1,
    backgroundColor: T.borderSoft,
    marginVertical: 4,
  },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 19,
  },
});
