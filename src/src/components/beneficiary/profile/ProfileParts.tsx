import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../Avatar';
import { Button } from '../../Button';
import { Icon, IconName } from '../../Icon';
import { ProfileVerificationStatus } from '../../../types/profileVerification';
import { RADIUS, T, CARD_BG, shadowSm } from '../../../theme/tokens';

export function ProfileSectionHeader({
  title,
  action,
  onActionPress,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ProfileStatSeparator() {
  return <View style={styles.statSep} />;
}

export function ProfileIdentityCard({
  avatarName,
  displayName,
  roleLabel,
  categoryLabel,
  subtitle,
  roleIcon = 'heart',
  avatarRing = T.accent,
  cameraBadgeColor = T.accent,
  roleChipVariant = 'accent',
  showCameraBadge = true,
  stats,
}: {
  avatarName: string;
  displayName: string;
  roleLabel: string;
  categoryLabel?: string;
  subtitle?: string;
  roleIcon?: IconName;
  avatarRing?: string;
  cameraBadgeColor?: string;
  roleChipVariant?: 'accent' | 'primary';
  showCameraBadge?: boolean;
  stats: { value: string; label: string }[];
}) {
  const roleChipColors =
    roleChipVariant === 'primary'
      ? {
          chip: styles.roleChipPrimary,
          icon: T.primaryDark,
          text: styles.roleChipPrimaryText,
        }
      : {
          chip: styles.roleChipAccent,
          icon: T.accentDark,
          text: styles.roleChipAccentText,
        };

  return (
    <View style={[styles.identityCard, shadowSm]}>
      <View style={styles.identityTop}>
        <View style={styles.avatarWrap}>
          <Avatar name={avatarName} size={72} ring={avatarRing} />
          {showCameraBadge ? (
            <Pressable style={[styles.cameraBtn, { backgroundColor: cameraBadgeColor }]} hitSlop={6}>
              <Icon name="camera" size={13} color="#fff" strokeWidth={2.2} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.identityBody}>
          <Text style={styles.identityName}>{displayName}</Text>
          <View style={styles.identityChips}>
            <View style={[styles.roleChip, roleChipColors.chip]}>
              <Icon name={roleIcon} size={12} color={roleChipColors.icon} strokeWidth={2} />
              <Text style={roleChipColors.text}>{roleLabel}</Text>
            </View>
            {categoryLabel ? (
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{categoryLabel}</Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text style={styles.identitySubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {stats.length > 0 ? (
        <View style={styles.statsRow}>
          {stats.slice(0, 3).map((stat, index) => (
            <Fragment key={`${stat.label}-${index}`}>
              {index > 0 ? <ProfileStatSeparator /> : null}
              <ProfileStat value={stat.value} label={stat.label} />
            </Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const VERIFICATION_COPY: Record<
  ProfileVerificationStatus,
  {
    bg: string;
    color: string;
    icon: IconName;
    title: string;
    body: string;
    action?: string;
  }
> = {
  none: {
    bg: T.infoSoft,
    color: T.info,
    icon: 'shield',
    title: 'Верификация не пройдена',
    body: 'Чтобы откликаться на заявки и помогать, пройдите проверку личности.',
    action: 'Пройти верификацию',
  },
  pending: {
    bg: T.warningSoft,
    color: '#8B5E10',
    icon: 'clock',
    title: 'На рассмотрении',
    body: 'Модератор обычно проверяет до 24 часов. Мы пришлём уведомление.',
  },
  approved: {
    bg: T.successSoft,
    color: T.success,
    icon: 'shield',
    title: 'Верификация активна',
    body: 'Одобрена. Партнёр «Добро».',
  },
  rejected: {
    bg: T.dangerSoft,
    color: T.danger,
    icon: 'warn',
    title: 'Отклонена',
    body: 'Нечёткое фото селфи. Попробуйте ещё раз.',
    action: 'Повторить',
  },
  revoked: {
    bg: T.surface2,
    color: T.muted,
    icon: 'eye',
    title: 'Отозвана',
    body: 'Партнёр отозвал верификацию. Свяжитесь с поддержкой.',
    action: 'Поддержка',
  },
};

export function ProfileVerificationCard({
  status,
  date,
  reason,
  onPress,
  onActionPress,
}: {
  status: ProfileVerificationStatus;
  date?: string;
  reason?: string;
  onPress?: () => void;
  onActionPress?: () => void;
}) {
  const copy = VERIFICATION_COPY[status];
  const body =
    status === 'approved' && date
      ? `Одобрена ${date}. Партнёр «Добро».`
      : reason ?? copy.body;

  const content = (
    <View style={[styles.verifCard, { backgroundColor: copy.bg, borderColor: `${copy.color}22` }]}>
      <View style={styles.verifIconWrap}>
        <Icon name={copy.icon} size={20} color={copy.color} strokeWidth={2} />
      </View>
      <View style={styles.verifBody}>
        <View style={styles.verifTitleRow}>
          <Text style={[styles.verifTitle, { color: copy.color }]}>{copy.title}</Text>
          {status === 'approved' ? (
            <Icon name="check" size={16} color={copy.color} strokeWidth={2.6} />
          ) : null}
        </View>
        <Text style={[styles.verifDesc, { color: copy.color }]}>{body}</Text>
        {copy.action ? (
          <Button
            kind="primary"
            size="sm"
            style={{ ...styles.verifAction, backgroundColor: copy.color }}
            labelColor="#fff"
            onPress={onActionPress}
          >
            {copy.action}
          </Button>
        ) : null}
      </View>
      {onPress ? <Icon name="chevR" size={16} color={copy.color} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.verifCardPressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export function ProfileEditableRow({
  label,
  value,
  locked,
  hint,
  last,
  onPress,
}: {
  label: string;
  value: string;
  locked?: boolean;
  hint?: string;
  last?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.editableBody}>
        <Text style={styles.editableLabel}>{label}</Text>
        <Text style={styles.editableValue}>{value}</Text>
        {hint && !locked ? <Text style={styles.editableHint}>{hint}</Text> : null}
      </View>
      {locked ? (
        <Icon name="lock" size={16} color={T.muted} strokeWidth={1.6} />
      ) : (
        <Icon name="edit" size={16} color={T.primary} strokeWidth={2} />
      )}
    </>
  );

  if (onPress && !locked) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.editableRow,
          !last && styles.editableRowBorder,
          pressed && styles.editableRowPressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.editableRow, !last && styles.editableRowBorder]}>{content}</View>;
}

export function ProfileMenuRow({
  icon,
  label,
  sub,
  color = T.primary,
  last,
  onPress,
}: {
  icon: IconName;
  label: string;
  sub?: string;
  color?: string;
  last?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={[styles.menuIcon, { backgroundColor: `${color}1a` }]}>
        <Icon name={icon} size={18} color={color} strokeWidth={2} />
      </View>
      <View style={styles.menuBody}>
        <Text style={styles.menuLabel}>{label}</Text>
        {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
      </View>
      <Icon name="chevR" size={16} color={T.mutedSoft} />
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.menuRow, !last && styles.menuRowBorder]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.menuRow, !last && styles.menuRowBorder]}>{content}</View>;
}

export function ProfileContactRow({
  emoji,
  name,
  value,
  main,
  last,
}: {
  emoji: string;
  name: string;
  value: string;
  main?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.contactRow, !last && styles.contactRowBorder]}>
      <View style={styles.contactIcon}>
        <Text style={styles.contactEmoji}>{emoji}</Text>
      </View>
      <View style={styles.contactBody}>
        <View style={styles.contactTitleRow}>
          <Text style={styles.contactName}>{name}</Text>
          {main ? <Text style={styles.contactMainBadge}>ОСНОВНОЙ</Text> : null}
        </View>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
    </View>
  );
}

export function ProfileCard({ children }: { children: React.ReactNode }) {
  return <View style={[styles.card, shadowSm]}>{children}</View>;
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
  identityCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 14,
  },
  identityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  cameraBtn: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.accent,
    borderWidth: 2,
    borderColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityBody: {
    flex: 1,
    minWidth: 0,
  },
  identityName: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.3,
  },
  identityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  roleChipAccent: {
    backgroundColor: T.accentSoft,
    borderColor: `${T.accent}33`,
  },
  roleChipPrimary: {
    backgroundColor: T.primarySoft,
    borderColor: `${T.primary}33`,
  },
  roleChipText: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  roleChipAccentText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.accentDark,
  },
  roleChipPrimaryText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.primaryDark,
  },
  identitySubtitle: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    paddingTop: 10,
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: T.borderSoft,
  },
  stat: {
    alignItems: 'center',
    minWidth: 0,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.3,
    lineHeight: 20,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  verifCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  verifCardPressed: {
    opacity: 0.92,
  },
  verifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifBody: {
    flex: 1,
    minWidth: 0,
  },
  verifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  verifTitle: {
    fontSize: 14,
    fontFamily: 'Manrope_800ExtraBold',
  },
  verifDesc: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 17,
    opacity: 0.85,
  },
  verifAction: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 14,
  },
  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  editableRowPressed: {
    opacity: 0.92,
  },
  editableBody: {
    flex: 1,
    minWidth: 0,
  },
  editableLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  editableValue: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
    marginTop: 2,
  },
  editableHint: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.primary,
    marginTop: 3,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
  },
  menuSub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactEmoji: {
    fontSize: 16,
  },
  contactBody: {
    flex: 1,
    minWidth: 0,
  },
  contactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  contactName: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  contactMainBadge: {
    fontSize: 9,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
    backgroundColor: T.primarySoft,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: RADIUS.pill,
    letterSpacing: 0.3,
    overflow: 'hidden',
  },
  contactValue: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    marginTop: 1,
  },
});
