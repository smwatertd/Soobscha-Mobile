import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../components/Icon';
import { HelpRequestTimelineItem } from '../../../utils/helpRequestTimeline';
import { T, CARD_BG } from '../../../theme/tokens';

type Props = {
  items: HelpRequestTimelineItem[];
};

function dotStyles(item: HelpRequestTimelineItem) {
  if (item.tone === 'danger') {
    return {
      backgroundColor: T.danger,
      borderColor: T.danger,
      iconColor: '#fff',
    };
  }
  if (item.tone === 'warning' && item.current) {
    return {
      backgroundColor: CARD_BG,
      borderColor: T.warning,
      iconColor: '#8B5E10',
    };
  }
  if (item.tone === 'success' || item.done) {
    return {
      backgroundColor: T.primary,
      borderColor: T.primary,
      iconColor: '#fff',
    };
  }
  if (item.current) {
    return {
      backgroundColor: CARD_BG,
      borderColor: T.primary,
      iconColor: T.primary,
    };
  }
  return {
    backgroundColor: T.surface2,
    borderColor: 'transparent',
    iconColor: T.mutedSoft,
  };
}

function connectorColor(item: HelpRequestTimelineItem): string {
  if (item.tone === 'danger') return T.danger;
  if (item.tone === 'warning') return T.warning;
  if (item.done || item.tone === 'success') return T.primary;
  return T.border;
}

export function BeneficiaryRequestTimelineSection({ items }: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((item, index) => {
        const dot = dotStyles(item);
        const showConnector = index < items.length - 1;

        return (
          <View key={item.id} style={styles.row}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: dot.backgroundColor,
                    borderColor: dot.borderColor,
                  },
                  item.current && styles.dotCurrent,
                ]}
              >
                <Icon name={item.icon} size={18} color={dot.iconColor} strokeWidth={2} />
              </View>
              {showConnector ? (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: connectorColor(item) },
                  ]}
                />
              ) : null}
            </View>
            <View style={styles.body}>
              {item.date ? <Text style={styles.date}>{item.date}</Text> : null}
              <Text
                style={[
                  styles.title,
                  (item.done || item.current || item.tone === 'danger' || item.tone === 'warning') &&
                    styles.titleActive,
                  item.tone === 'danger' && styles.titleDanger,
                  item.tone === 'warning' && item.current && styles.titleWarning,
                ]}
              >
                {item.title}
              </Text>
              {item.desc ? <Text style={styles.desc}>{item.desc}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  rail: {
    width: 40,
    alignItems: 'center',
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dotCurrent: {
    borderWidth: 2.5,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 18,
    borderRadius: 1,
    marginVertical: 2,
  },
  body: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 18,
  },
  date: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    color: T.muted,
  },
  titleActive: {
    color: T.ink,
  },
  titleDanger: {
    color: T.danger,
  },
  titleWarning: {
    color: '#8B5E10',
  },
  desc: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: 3,
    lineHeight: 17,
  },
});
