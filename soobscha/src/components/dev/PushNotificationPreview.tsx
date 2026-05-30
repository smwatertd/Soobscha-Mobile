import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, IconName } from '../Icon';
import { RADIUS, T } from '../../theme/tokens';

export type PushPreviewAction = {
  label: string;
  primary?: boolean;
};

export type PushPreviewCardProps = {
  when?: string;
  icon: IconName;
  iconColor: string;
  accent?: string;
  title: string;
  body: string;
  count?: string;
  image?: boolean;
  actions?: PushPreviewAction[];
};

export function PushPreviewCard({
  when = 'сейчас',
  icon,
  iconColor,
  accent = T.primary,
  title,
  body,
  count,
  image,
  actions,
}: PushPreviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.appRow}>
        <View style={[styles.appIcon, { backgroundColor: T.primary }]}>
          <Icon name="heart" size={10} color="#fff" strokeWidth={2.4} />
        </View>
        <Text style={styles.appName}>Сообща</Text>
        {count ? (
          <View style={[styles.countBadge, { backgroundColor: accent }]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
        <Text style={styles.when}>{when}</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1f` }]}>
          <Icon name={icon} size={16} color={iconColor} strokeWidth={2.2} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
        {image ? (
          <View style={[styles.thumb, { borderColor: `${accent}33`, backgroundColor: `${accent}22` }]}>
            <Icon name="image" size={18} color={accent} strokeWidth={1.6} />
          </View>
        ) : null}
      </View>

      {actions?.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              style={[styles.actionBtn, action.primary && { backgroundColor: accent }]}
            >
              <Text style={[styles.actionText, action.primary && styles.actionTextPrimary]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

type PushPreviewFrameProps = {
  time?: string;
  date?: string;
  variant?: 'sunset' | 'morning' | 'night';
  children: React.ReactNode;
};

const WALLPAPERS = {
  sunset: ['#F4D4A8', '#E89B5A', '#C57B3F'],
  morning: ['#C6DFD7', '#E6F0EC', '#FBF7F1'],
  night: ['#1A2540', '#2D3859', '#1F6F5C'],
} as const;

export function PushPreviewFrame({
  time = '9:30',
  date = 'четверг, 22 мая',
  variant = 'sunset',
  children,
}: PushPreviewFrameProps) {
  const dark = variant === 'sunset' || variant === 'night';
  const colors = WALLPAPERS[variant];

  return (
    <View style={[styles.frame, { backgroundColor: colors[colors.length - 1] }]}>
      <View style={styles.frameTime}>
        <Text style={[styles.frameClock, dark && styles.frameClockDark]}>{time}</Text>
        <Text style={[styles.frameDate, dark && styles.frameDateDark]}>{date}</Text>
      </View>
      <View style={styles.frameCards}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(252, 251, 246, 0.92)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    gap: 8,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  countText: {
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
  },
  when: {
    fontSize: 11,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    lineHeight: 18,
  },
  body: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.ink2,
    lineHeight: 18,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,31,27,0.08)',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(30,31,27,0.1)',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.primary,
  },
  actionTextPrimary: {
    color: '#fff',
  },
  frame: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: 16,
    gap: 16,
    minHeight: 320,
  },
  frameTime: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  frameClock: {
    fontSize: 48,
    fontFamily: 'Manrope_300Light',
    color: T.ink,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  frameClockDark: {
    color: '#fff',
  },
  frameDate: {
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
  },
  frameDateDark: {
    color: 'rgba(255,255,255,0.85)',
  },
  frameCards: {
    gap: 8,
  },
});
