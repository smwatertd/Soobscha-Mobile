import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../Icon';
import { RADIUS, T } from '../../theme/tokens';

type Props = {
  photoIndex?: number;
  photoTotal?: number;
  liked: boolean;
  onShare: () => void;
  onToggleLike: () => void;
  watchDisabled?: boolean;
};

export function HelpRequestHeroTopActions({
  photoIndex,
  photoTotal,
  liked,
  onShare,
  onToggleLike,
  watchDisabled = false,
}: Props) {
  const showCounter =
    photoTotal != null && photoTotal > 1 && photoIndex != null;

  return (
    <View style={styles.group}>
      {showCounter ? (
        <View style={styles.photoCounter}>
          <Icon name="image" size={13} color="#fff" strokeWidth={2.2} />
          <Text style={styles.photoCounterText}>
            {photoIndex + 1} / {photoTotal}
          </Text>
        </View>
      ) : null}
      <Pressable
        style={styles.heroBtn}
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Поделиться"
      >
        <Icon name="upload" size={18} color="#fff" strokeWidth={2} />
      </Pressable>
      <Pressable
        style={[styles.heroBtn, watchDisabled && styles.heroBtnDisabled]}
        onPress={onToggleLike}
        disabled={watchDisabled}
        accessibilityRole="button"
        accessibilityLabel={liked ? 'Убрать из избранного' : 'В избранное'}
      >
        <Icon
          name="heart"
          size={20}
          color={liked ? T.danger : '#fff'}
          fill={liked ? T.danger : 'none'}
          strokeWidth={liked ? 1.4 : 2}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnDisabled: {
    opacity: 0.55,
  },
  photoCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  photoCounterText: {
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
  },
});
