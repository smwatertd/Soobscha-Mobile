import { StyleSheet, View } from 'react-native';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';

export function VolunteerRequestCardSkeleton() {
  return (
    <View style={[styles.card, shadowSm]}>
      <View style={styles.hero} />
      <View style={styles.body}>
        <View style={styles.authorRow}>
          <View style={styles.avatar} />
          <View style={styles.authorLines}>
            <View style={[styles.line, styles.lineMd]} />
            <View style={[styles.line, styles.lineSm]} />
          </View>
        </View>
        <View style={[styles.line, styles.lineLg]} />
        <View style={[styles.line, styles.lineMd]} />
        <View style={styles.footerRow}>
          <View style={[styles.line, styles.lineFlex]} />
          <View style={styles.button} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  hero: {
    aspectRatio: 4 / 3,
    backgroundColor: T.surface2,
  },
  body: {
    padding: 14,
    gap: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.surface2,
  },
  authorLines: {
    flex: 1,
    gap: 6,
  },
  line: {
    borderRadius: 6,
    backgroundColor: T.surface2,
  },
  lineSm: {
    width: '45%',
    height: 11,
  },
  lineMd: {
    width: '70%',
    height: 13,
  },
  lineLg: {
    width: '92%',
    height: 18,
  },
  lineFlex: {
    flex: 1,
    height: 14,
    marginRight: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  button: {
    width: 96,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: T.surface2,
  },
});
