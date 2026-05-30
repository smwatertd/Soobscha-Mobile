import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gender } from '../api/types';
import { Icon, IconName } from './Icon';
import { RADIUS, T } from '../theme/tokens';

type Props = {
  label: string;
  icon: IconName;
  active?: boolean;
  onPress?: () => void;
};

export function GenderChoice({ label, icon, active, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.wrap, active && styles.wrapActive]}>
      <View style={[styles.iconBox, active && styles.iconBoxActive]}>
        <Icon name={icon} size={16} color={active ? '#fff' : T.muted} strokeWidth={2} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

export function genderFromChoice(choice: 'female' | 'male' | 'unspecified'): Gender {
  switch (choice) {
    case 'female':
      return 'FEMALE';
    case 'male':
      return 'male';
    default:
      return 'PREFER_NOT_TO_SAY';
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.borderSoft,
    alignItems: 'center',
    gap: 6,
  },
  wrapActive: {
    borderColor: T.primary,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: T.primary,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    textAlign: 'center',
  },
  labelActive: {
    color: T.primary,
  },
});
