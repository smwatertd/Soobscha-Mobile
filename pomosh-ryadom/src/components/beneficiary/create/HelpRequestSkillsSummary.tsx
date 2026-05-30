import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '../../Chip';
import { useSkillLabelMap } from '../../../hooks/useSkillLabelMap';
import { normalizeSkillCodeList } from '../../../utils/helpRequestSkills';
import { resolveSkillLabel } from '../../../utils/volunteerSkillLabels';
import { RADIUS, T, CARD_BG, shadowSm } from '../../../theme/tokens';

type Props = {
  requiredSkills: string[];
  preferredSkills: string[];
  hideTitle?: boolean;
};

export function HelpRequestSkillsSummary({
  requiredSkills,
  preferredSkills,
  hideTitle = false,
}: Props) {
  const { labelByCode } = useSkillLabelMap();
  const requiredCodes = normalizeSkillCodeList(requiredSkills);
  const preferredCodes = normalizeSkillCodeList(preferredSkills);

  if (!requiredCodes.length && !preferredCodes.length) {
    return null;
  }

  const hasBoth = requiredCodes.length > 0 && preferredCodes.length > 0;

  return (
    <View style={[styles.card, shadowSm]}>
      {!hideTitle ? <Text style={styles.title}>Навыки</Text> : null}
      {requiredCodes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Обязательные</Text>
          <View style={styles.chips}>
            {requiredCodes.map((code) => (
              <Chip
                key={code}
                label={resolveSkillLabel(code, labelByCode)}
                icon="check"
                kind="danger"
                size="md"
              />
            ))}
          </View>
        </View>
      )}
      {preferredCodes.length > 0 && (
        <View style={[styles.section, hasBoth && styles.sectionDivided]}>
          <Text style={[styles.sectionLabel, styles.sectionLabelPreferred]}>Желательные</Text>
          <View style={styles.chips}>
            {preferredCodes.map((code) => (
              <Chip
                key={code}
                label={resolveSkillLabel(code, labelByCode)}
                kind="success"
                size="md"
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.borderSoft,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  section: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  sectionDivided: {
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    paddingTop: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: T.danger,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionLabelPreferred: {
    color: T.success,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
