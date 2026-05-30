import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../Icon';
import { RADIUS, T, CARD_BG } from '../../../theme/tokens';
import { WorkflowBannerConfig } from '../../../utils/helpRequestWorkflowConfig';

type Props = {
  config: WorkflowBannerConfig;
  onPress?: () => void;
};

export function HelpRequestWorkflowBanner({ config, onPress }: Props) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Icon name={config.icon} size={20} color={config.color} strokeWidth={2} />
          {config.live ? <View style={[styles.liveDot, { borderColor: config.backgroundColor }]} /> : null}
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.sectionLabel, { color: config.color }]}>{config.sectionLabel}</Text>
          <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
          <Text style={[styles.subtitle, { color: config.color }]}>{config.subtitle}</Text>
        </View>
      </View>
      {onPress ? (
        <Pressable style={[styles.cta, { borderTopColor: `${config.color}33` }]} onPress={onPress}>
          <Text style={[styles.ctaText, { color: config.color }]}>{config.cta}</Text>
          <Icon name="arrowR" size={18} color={config.color} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  body: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  liveDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: T.success,
    borderWidth: 2,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    marginTop: 3,
    lineHeight: 17,
    opacity: 0.85,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  ctaText: {
    fontSize: 13,
    fontFamily: 'Manrope_700Bold',
  },
});
