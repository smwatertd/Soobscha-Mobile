import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../Button';
import { Chip } from '../../Chip';
import { Icon, IconName } from '../../Icon';
import { ProgressBar } from '../../ProgressBar';
import { ScreenHeader } from '../../ScreenHeader';
import {
  VolunteerVerifContact,
  VolunteerVerifReviewPhoto,
  VolunteerVerifSkillDoc,
  VolunteerVerifUpload,
} from '../../../screens/volunteer/verification/volunteerVerificationConfig';
import { DraftPhoto } from '../../../navigation/createHelpRequestTypes';
import { AttemptPhotoItem } from '../../../utils/verificationAttemptView';
import { RADIUS, T, CARD_BG, shadowSm } from '../../../theme/tokens';

export function VolunteerVerifStepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }, (_, index) => {
        const done = index < step - 1;
        const current = index === step - 1;
        return (
          <View
            key={index}
            style={[
              styles.stepSegment,
              done && styles.stepSegmentDone,
              current && styles.stepSegmentActive,
            ]}
          />
        );
      })}
      <Text style={styles.stepCounter}>
        {step}/{total}
      </Text>
    </View>
  );
}

export function VolunteerVerifStepLayout({
  title,
  subtitle,
  step,
  total,
  onBack,
  onNext,
  nextLabel = 'Далее',
  nextIcon = 'arrowR',
  nextDisabled = false,
  nextLoading = false,
  backLabel = 'Назад',
  children,
  contentStyle,
}: {
  title: string;
  subtitle?: string;
  step: number;
  total: number;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextIcon?: IconName;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  backLabel?: string;
  children: ReactNode;
  contentStyle?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const footerSpace = insets.bottom + 120;

  return (
    <View style={[styles.layoutRoot, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title={title} onBack={onBack} />
      {subtitle ? <Text style={styles.layoutSubtitle}>{subtitle}</Text> : null}
      <VolunteerVerifStepDots step={step} total={total} />
      <View style={styles.layoutProgressWrap}>
        <ProgressBar value={step} max={total} height={4} color={T.primary} />
      </View>

      <ScrollView
        style={styles.layoutScroll}
        contentContainerStyle={[styles.layoutScrollContent, contentStyle, { paddingBottom: footerSpace }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View style={[styles.layoutFooter, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="ghost" size="lg" icon="chevL" onPress={onBack} style={styles.layoutFooterBack}>
          {backLabel}
        </Button>
        {onNext ? (
          <Button
            kind="primary"
            size="lg"
            iconRight={nextLoading ? undefined : nextIcon}
            style={styles.layoutFooterPrimary}
            onPress={onNext}
            disabled={nextDisabled || nextLoading}
          >
            {nextLoading ? 'Отправка…' : nextLabel}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

export function VolunteerVerifInfoBanner({
  text,
  icon = 'info',
  tone = 'primary',
}: {
  text: string;
  icon?: IconName;
  tone?: 'primary' | 'accent' | 'warning';
}) {
  const palette =
    tone === 'accent'
      ? { bg: T.accentSoft, color: T.accentDark, text: '#7A4F1A' }
      : tone === 'warning'
        ? { bg: T.warningSoft, color: '#8B5E10', text: '#7A5210' }
        : { bg: T.primarySoft, color: T.primary, text: T.ink2 };

  return (
    <View style={[styles.infoBanner, { backgroundColor: palette.bg }]}>
      <Icon name={icon} size={20} color={palette.color} strokeWidth={2} />
      <Text style={[styles.infoBannerText, { color: palette.text }]}>{text}</Text>
    </View>
  );
}

export function VolunteerVerifSectionLabel({ children, inCard }: { children: string; inCard?: boolean }) {
  return <Text style={[styles.sectionLabel, inCard && styles.sectionLabelInCard]}>{children}</Text>;
}

export function VolunteerVerifBlockTitle({
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

export function VolunteerVerifCardContent({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return <View style={[styles.cardContent, compact && styles.cardContentCompact]}>{children}</View>;
}

export function VolunteerVerifUploadCard({ item }: { item: VolunteerVerifUpload }) {
  return (
    <View style={[styles.uploadCard, shadowSm]}>
      <View style={[styles.uploadIcon, { backgroundColor: `${item.color}1a` }]}>
        <Icon name={item.done ? 'check' : 'upload'} size={18} color={item.color} strokeWidth={2} />
      </View>
      <View style={styles.uploadBody}>
        <Text style={styles.uploadTitle}>{item.title}</Text>
        <Text style={styles.uploadSub}>{item.sub}</Text>
        {item.progress != null ? (
          <View style={styles.uploadProgressWrap}>
            <ProgressBar value={item.progress} color={item.color} bg={T.surface2} height={4} />
          </View>
        ) : null}
      </View>
      {!item.done && item.progress == null ? <Icon name="plus" size={18} color={T.muted} /> : null}
    </View>
  );
}

export function VolunteerVerifContactRow({
  emoji,
  name,
  value,
  isMain,
  onPress,
}: {
  emoji: string;
  name: string;
  value: string;
  isMain?: boolean;
  onPress: () => void;
}) {
  const filled = value.trim().length > 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.contactRow, isMain && styles.contactRowMain]}
    >
      <View style={styles.contactEmojiWrap}>
        <Text style={styles.contactEmoji}>{emoji}</Text>
      </View>
      <View style={styles.contactBody}>
        <View style={styles.contactTitleRow}>
          <Text style={styles.contactName}>{name}</Text>
          {isMain ? <Text style={styles.contactMainBadge}>Основной</Text> : null}
        </View>
        <Text style={[styles.contactValue, !filled && styles.contactValueEmpty]}>
          {filled ? value : 'не указан'}
        </Text>
      </View>
      <Icon name={filled ? 'edit' : 'plus'} size={18} color={T.muted} />
    </Pressable>
  );
}

export function VolunteerVerifSkillCard({ skill }: { skill: VolunteerVerifSkillDoc }) {
  const active = Boolean(skill.active);

  return (
    <View style={[styles.skillCard, active && { borderColor: skill.color }]}>
      <View style={styles.skillTop}>
        <View style={[styles.skillCheck, active && { backgroundColor: skill.color, borderColor: skill.color }]}>
          {active ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : null}
        </View>
        <View style={styles.skillBody}>
          <Text style={styles.skillLabel}>{skill.label}</Text>
          <Text style={styles.skillSub}>{skill.sub}</Text>
        </View>
      </View>
      {active && skill.docName ? (
        <View style={styles.skillDocRow}>
          <View style={[styles.skillDocPreview, { backgroundColor: `${skill.color}1f`, borderColor: `${skill.color}33` }]}>
            <Icon name="document" size={18} color={skill.color} strokeWidth={1.8} />
          </View>
          <View style={styles.skillDocText}>
            <Text style={styles.skillDocName} numberOfLines={1}>
              {skill.docName}
            </Text>
            <Text style={styles.skillDocHint}>Загружено · нажмите для просмотра</Text>
          </View>
          <Icon name="close" size={14} color={T.muted} strokeWidth={2.2} />
        </View>
      ) : null}
      {active && !skill.docName ? (
        <View style={styles.skillUploadWrap}>
          <Button kind="secondary" size="sm" icon="upload">
            Загрузить документ
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export function VolunteerVerifSkillChips({
  items,
}: {
  items: { key?: string; label: string; active?: boolean; onPress?: () => void }[];
}) {
  return (
    <View style={styles.skillChipsRow}>
      {items.map((item) => (
        <Chip
          key={item.key ?? item.label}
          label={item.label}
          active={item.active}
          onPress={item.onPress}
          wrapLabel
          size="sm"
          style={styles.skillChip}
        />
      ))}
    </View>
  );
}

export function VolunteerVerifDataRow({
  label,
  value,
  last,
  compact,
}: {
  label: string;
  value: string;
  last?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.dataRow, compact && styles.dataRowCompact, !last && styles.dataRowBorder]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

export function VolunteerVerifContactDataRow({
  emoji,
  label,
  value,
  isPrimary,
  last,
}: {
  emoji: string;
  label: string;
  value: string;
  isPrimary?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.contactDataRow, !last && styles.dataRowBorder]}>
      <View style={styles.contactDataIcon}>
        <Text style={styles.contactDataEmoji}>{emoji}</Text>
      </View>
      <View style={styles.contactDataBody}>
        <View style={styles.contactDataLabelRow}>
          <Text style={styles.dataLabel}>{label}</Text>
          {isPrimary ? <Text style={styles.contactPrimaryBadge}>Основной</Text> : null}
        </View>
        <Text style={styles.dataValue}>{value}</Text>
      </View>
    </View>
  );
}

export function VolunteerVerifPhotoGrid({ photos }: { photos: VolunteerVerifReviewPhoto[] }) {
  return (
    <View style={styles.photoGrid}>
      {photos.map((photo) => (
        <VolunteerVerifPhotoThumb key={photo.caption} photo={photo} />
      ))}
    </View>
  );
}

export function VolunteerVerifDraftPhotoGrid({
  photos,
  emptyLabel = 'Нет файлов',
}: {
  photos: DraftPhoto[];
  emptyLabel?: string;
}) {
  const items = photos.filter((photo) => photo.uri);
  if (!items.length) {
    return <Text style={styles.draftPhotoEmptyText}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.photoGrid}>
      {items.map((photo) => (
        <View key={photo.id} style={styles.draftPhotoThumbWrap}>
          <View style={styles.draftPhotoThumb}>
            <Image source={{ uri: photo.uri }} style={styles.draftPhotoImage} contentFit="cover" />
          </View>
          <Text style={styles.draftPhotoCaption} numberOfLines={2}>
            {photo.fileName}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function VolunteerVerifAttemptPhotoGrid({
  photos,
  onPhotoPress,
  emptyLabel,
}: {
  photos: AttemptPhotoItem[];
  onPhotoPress: (index: number) => void;
  emptyLabel?: string;
}) {
  const items = photos.filter((photo) => photo.uri);
  if (!items.length) {
    return emptyLabel ? <Text style={styles.draftPhotoEmptyText}>{emptyLabel}</Text> : null;
  }

  return (
    <View style={styles.photoGrid}>
      {items.map((photo, index) => (
        <Pressable
          key={photo.id}
          style={styles.draftPhotoThumbWrap}
          onPress={() => onPhotoPress(index)}
        >
          <View style={styles.draftPhotoThumb}>
            <Image source={{ uri: photo.uri }} style={styles.draftPhotoImage} contentFit="cover" />
            <View style={styles.photoThumbEye}>
              <Icon name="eye" size={12} color={T.muted} />
            </View>
          </View>
          <Text style={styles.draftPhotoCaption} numberOfLines={2}>
            {photo.caption}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function VolunteerVerifPhotoThumb({ photo }: { photo: VolunteerVerifReviewPhoto }) {
  return (
    <View style={styles.photoThumbWrap}>
      <View style={[styles.photoThumb, { backgroundColor: `${photo.color}1f`, borderColor: `${photo.color}33` }]}>
        <Icon name="document" size={26} color={photo.color} strokeWidth={1.6} />
        <View style={styles.photoThumbEye}>
          <Icon name="eye" size={12} color={T.muted} />
        </View>
      </View>
      <Text style={styles.photoThumbCaption}>{photo.caption}</Text>
    </View>
  );
}

export function VolunteerVerifReviewBlock({
  title,
  icon,
  color,
  onEdit,
  children,
}: {
  title: string;
  icon: IconName;
  color: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={[styles.reviewBlock, shadowSm]}>
      <View style={[styles.reviewBlockHead, { backgroundColor: `${color}0d`, borderBottomColor: `${color}1f` }]}>
        <View style={[styles.reviewBlockIcon, { backgroundColor: color }]}>
          <Icon name={icon} size={16} color="#fff" strokeWidth={2.2} />
        </View>
        <Text style={styles.reviewBlockTitle}>{title}</Text>
        {onEdit ? (
          <Pressable onPress={onEdit} hitSlop={8}>
            <Text style={[styles.reviewBlockEdit, { color }]}>Изменить</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.reviewBlockBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  layoutRoot: { flex: 1, backgroundColor: T.bg },
  layoutSubtitle: {
    paddingHorizontal: 20,
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 2,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: T.surface2,
  },
  stepSegmentDone: {
    backgroundColor: T.primaryTint,
  },
  stepSegmentActive: {
    backgroundColor: T.primary,
  },
  stepCounter: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    marginLeft: 4,
    minWidth: 28,
    textAlign: 'right',
  },
  layoutProgressWrap: { paddingHorizontal: 20, marginBottom: 8 },
  layoutScroll: { flex: 1 },
  layoutScrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  layoutFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: T.bg,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  layoutFooterPrimary: { flex: 1 },
  layoutFooterBack: { flexShrink: 0, minWidth: 120, paddingHorizontal: 16 },
  infoBanner: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: RADIUS.md, marginBottom: 16 },
  infoBannerText: { flex: 1, fontSize: 12, fontFamily: 'Manrope_400Regular', lineHeight: 17 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionLabelInCard: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 4,
  },
  blockTitle: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    letterSpacing: 0.1,
    paddingHorizontal: 16,
    paddingTop: 2,
    marginBottom: 4,
  },
  cardContent: {
    paddingBottom: 14,
  },
  cardContentCompact: {
    paddingBottom: 6,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 10,
  },
  uploadIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  uploadBody: { flex: 1, minWidth: 0 },
  uploadTitle: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink },
  uploadSub: { fontSize: 12, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  uploadProgressWrap: { marginTop: 8 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
    marginBottom: 10,
  },
  contactRowMain: { borderColor: T.primary },
  contactEmojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactEmoji: { fontSize: 18 },
  contactBody: { flex: 1, minWidth: 0 },
  contactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactName: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: T.ink },
  contactMainBadge: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
    backgroundColor: T.primarySoft,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: RADIUS.pill,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  contactValue: { fontSize: 12, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  contactValueEmpty: { color: T.mutedSoft },
  skillCard: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
  },
  skillTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillBody: { flex: 1, minWidth: 0 },
  skillLabel: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: T.ink },
  skillSub: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  skillDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  skillDocPreview: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillDocText: { flex: 1, minWidth: 0 },
  skillDocName: { fontSize: 12, fontFamily: 'Manrope_600SemiBold', color: T.ink2 },
  skillDocHint: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 2 },
  skillUploadWrap: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: T.borderSoft },
  skillChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  skillChip: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '48%',
  },
  dataRow: { paddingVertical: 14, paddingHorizontal: 16 },
  dataRowCompact: { paddingVertical: 10 },
  dataRowBorder: { borderBottomWidth: 1, borderBottomColor: T.borderSoft },
  dataLabel: { fontSize: 11, fontFamily: 'Manrope_600SemiBold', color: T.muted },
  dataValue: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: T.ink, marginTop: 4, lineHeight: 20 },
  contactDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  contactDataIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDataEmoji: { fontSize: 18 },
  contactDataBody: { flex: 1, minWidth: 0 },
  contactDataLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  contactPrimaryBadge: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
    backgroundColor: T.primarySoft,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: RADIUS.pill,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
  },
  photoThumbWrap: { flex: 1, minWidth: 0, gap: 4 },
  photoThumb: {
    aspectRatio: 4 / 5,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbEye: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSm,
  },
  photoThumbCaption: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    textAlign: 'center',
    lineHeight: 13,
  },
  draftPhotoThumbWrap: {
    width: '31%',
  },
  draftPhotoThumb: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.borderSoft,
    overflow: 'hidden',
    backgroundColor: T.surface2,
    position: 'relative',
  },
  draftPhotoImage: { width: '100%', height: '100%' },
  draftPhotoCaption: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 13,
  },
  draftPhotoEmptyText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  reviewBlock: { backgroundColor: CARD_BG, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: 12 },
  reviewBlockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  reviewBlockIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reviewBlockTitle: { flex: 1, fontSize: 13, fontFamily: 'Manrope_700Bold', color: T.ink },
  reviewBlockEdit: { fontSize: 12, fontFamily: 'Manrope_700Bold' },
  reviewBlockBody: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 12 },
  fieldsGroup: { gap: 12, marginBottom: 18 },
  statusPickerWrap: {
    marginBottom: 16,
  },
  statusPickerWrapCompact: {
    marginBottom: 10,
  },
  statusPickerLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusPickerRow: {
    gap: 8,
    paddingRight: 4,
  },
  statusPickerChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  statusPickerChipActive: {
    backgroundColor: T.primarySoft,
    borderColor: T.primary,
  },
  statusPickerChipText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
  },
  statusPickerChipTextActive: {
    color: T.primaryDark,
  },
});
