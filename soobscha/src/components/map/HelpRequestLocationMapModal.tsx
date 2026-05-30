import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPoint } from '../../api/integrationTypes';
import { HelpRequestRouteMapView } from '../../integrations/yandex/HelpRequestRouteMapView';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { T } from '../../theme/tokens';

type Props = {
  visible: boolean;
  requestPoint: MapPoint;
  title?: string;
  addressLabel?: string | null;
  onClose: () => void;
  onRoutePress?: () => void;
};

export function HelpRequestLocationMapModal({
  visible,
  requestPoint,
  title = 'Место встречи',
  addressLabel,
  onClose,
  onRoutePress,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.headerBtn}>
            <Icon name="arrowL" size={22} color={T.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerBtn} />
        </View>

        <HelpRequestRouteMapView requestPoint={requestPoint} style={styles.map} />

        <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
          {addressLabel ? (
            <View style={styles.addressRow}>
              <Icon name="pin" size={16} color={T.primary} strokeWidth={2.2} />
              <Text style={styles.addressText} numberOfLines={3}>
                {addressLabel}
              </Text>
            </View>
          ) : null}
          {onRoutePress ? (
            <Button kind="primary" size="lg" full onPress={onRoutePress}>
              Маршрут в навигаторе
            </Button>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  map: {
    flex: 1,
  },
  panel: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Manrope_500Medium',
    color: T.ink,
    lineHeight: 21,
  },
});
