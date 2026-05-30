import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button';
import { Icon, IconName } from '../Icon';
import {
  VolunteerVerifAttemptPhotoGrid,
  VolunteerVerifPhotoGrid,
} from '../volunteer/verification/VolunteerVerifParts';
import { VolunteerVerifReviewPhoto } from '../../screens/volunteer/verification/volunteerVerificationConfig';
import { ProfileVerificationStatus } from '../../types/profileVerification';
import { AttemptPhotoItem } from '../../utils/verificationAttemptView';
import { RADIUS, T } from '../../theme/tokens';

export type VerificationActiveDisplayConfig = {
  title: string;
  sub: string;
  bannerBg: string;
  bannerColor: string;
  bannerIcon: IconName;
  bannerText: string;
  reasonTitle?: string;
  reasonLabel?: string;
  reasonText?: string;
  reasonAuthor?: string;
  btnLabel: string;
  btnDisabled?: boolean;
  hint?: string;
};

export function VerificationActiveSectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function VerificationActiveCard({
  children,
  last,
}: {
  children: ReactNode;
  last?: boolean;
}) {
  return <View style={[styles.card, last && styles.cardLast]}>{children}</View>;
}

export function VerificationActiveBlockTitle({
  children,
  suffix,
}: {
  children: string;
  suffix?: string | number;
}) {
  return (
    <Text style={styles.blockTitle}>
      {children}
      {suffix != null ? ` · ${suffix}` : ''}
    </Text>
  );
}

export function VerificationActiveRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export function VerificationActiveBanner({ config }: { config: VerificationActiveDisplayConfig }) {
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: config.bannerBg, borderColor: `${config.bannerColor}22` },
      ]}
    >
      <View style={styles.bannerIcon}>
        <Icon name={config.bannerIcon} size={20} color={config.bannerColor} strokeWidth={2} />
      </View>
      <View style={styles.bannerBody}>
        <Text style={[styles.bannerTitle, { color: config.bannerColor }]}>{config.title}</Text>
        <Text style={[styles.bannerSub, { color: config.bannerColor }]}>{config.sub}</Text>
        <Text style={[styles.bannerText, { color: config.bannerColor }]}>{config.bannerText}</Text>
      </View>
    </View>
  );
}

export function VerificationActiveReasonCard({
  status,
  config,
}: {
  status: ProfileVerificationStatus;
  config: VerificationActiveDisplayConfig;
}) {
  if (!config.reasonText) return null;

  const rejected = status === 'rejected';

  return (
    <View style={[styles.reasonCard, rejected && { borderColor: T.danger }]}>
      <View style={[styles.reasonHead, { backgroundColor: rejected ? T.dangerSoft : T.surface2 }]}>
        <View style={styles.reasonHeadIcon}>
          <Icon name="chat" size={16} color={rejected ? T.danger : T.ink2} strokeWidth={2.2} />
        </View>
        <Text style={[styles.reasonHeadTitle, { color: rejected ? T.danger : T.ink2 }]}>
          {config.reasonTitle}
        </Text>
      </View>
      <View style={styles.reasonBody}>
        {config.reasonLabel ? <Text style={styles.reasonLabel}>{config.reasonLabel}</Text> : null}
        <Text style={styles.reasonText}>{config.reasonText}</Text>
        {config.reasonAuthor ? <Text style={styles.reasonAuthor}>{config.reasonAuthor}</Text> : null}
      </View>
    </View>
  );
}

export function VerificationActivePhotoGrid({
  attemptPhotos,
  previewPhotos,
  onPhotoPress,
  allowPreview = false,
}: {
  attemptPhotos: AttemptPhotoItem[];
  previewPhotos: VolunteerVerifReviewPhoto[];
  onPhotoPress?: (index: number) => void;
  /** Показать цветные плейсхолдеры, если нет uri у загруженных фото. */
  allowPreview?: boolean;
}) {
  const photosWithUri = attemptPhotos.filter((photo) => photo.uri);

  if (photosWithUri.length && onPhotoPress) {
    return (
      <View style={styles.photoBody}>
        <VolunteerVerifAttemptPhotoGrid photos={photosWithUri} onPhotoPress={onPhotoPress} />
      </View>
    );
  }

  if (allowPreview && previewPhotos.length) {
    return (
      <View style={styles.photoBody}>
        <VolunteerVerifPhotoGrid photos={previewPhotos} />
      </View>
    );
  }

  return null;
}

export function VerificationActiveSkillsContent({
  simpleLabels,
  documentedLabels,
}: {
  simpleLabels: string[];
  documentedLabels: string[];
}) {
  return (
    <View style={styles.skillsTextWrap}>
      {simpleLabels.length ? (
        <Text style={styles.skillsText}>
          <Text style={styles.skillsTextBold}>Без подтверждения: </Text>
          {simpleLabels.join(', ')}
        </Text>
      ) : null}
      {documentedLabels.length ? (
        <Text style={styles.skillsText}>
          <Text style={styles.skillsTextBold}>С документами: </Text>
          {documentedLabels.join(', ')}
        </Text>
      ) : null}
    </View>
  );
}

export function VerificationActiveContactRow({
  label,
  value,
  isPrimary,
  last,
}: {
  label: string;
  value: string;
  isPrimary?: boolean;
  last?: boolean;
}) {
  return (
    <VerificationActiveRow
      label={label}
      value={isPrimary ? `${value} (основной)` : value}
      last={last}
    />
  );
}

export function VerificationActiveEmptyState({ items }: { items: string[] }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>Что понадобится</Text>
      {items.map((item) => (
        <Text key={item} style={styles.emptyItem}>
          {item}
        </Text>
      ))}
    </View>
  );
}

export function VerificationActiveFooter({
  bottomInset,
  btnLabel,
  btnIcon,
  btnDisabled,
  hint,
  loading,
  onPress,
}: {
  bottomInset: number;
  btnLabel: string;
  btnIcon: IconName;
  btnDisabled?: boolean;
  hint?: string;
  loading?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={[styles.footer, { paddingBottom: bottomInset + 12 }]}>
      <Button
        kind="primary"
        size="lg"
        full
        icon={btnIcon}
        disabled={btnDisabled || loading}
        onPress={btnDisabled || loading ? undefined : onPress}
      >
        {loading ? 'Загрузка…' : btnLabel}
      </Button>
      {hint ? <Text style={verificationActiveStyles.footerHint}>{hint}</Text> : null}
    </View>
  );
}

export const verificationActiveStyles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footerHint: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    textAlign: 'center',
    marginTop: 8,
  },
});

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: T.bg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardLast: {
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
  },
  rowValue: {
    flexShrink: 1,
    maxWidth: '58%',
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink,
    textAlign: 'right',
  },
  banner: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBody: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_800ExtraBold',
    lineHeight: 20,
  },
  bannerSub: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    opacity: 0.85,
    marginTop: 3,
    lineHeight: 16,
  },
  bannerText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 20,
    marginTop: 10,
  },
  reasonCard: {
    backgroundColor: T.bg,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: T.border,
    marginBottom: 18,
  },
  reasonHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  reasonHeadIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonHeadTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_800ExtraBold',
  },
  reasonBody: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  reasonLabel: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 19,
    marginBottom: 10,
  },
  reasonAuthor: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  photoBody: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 14,
  },
  skillsTextWrap: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 4,
  },
  skillsText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 18,
  },
  skillsTextBold: {
    fontFamily: 'Manrope_700Bold',
    color: T.ink2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  emptyCard: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    marginBottom: 10,
  },
  emptyItem: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 22,
  },
});
