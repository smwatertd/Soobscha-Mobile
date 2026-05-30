import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHelpRequestById } from '../api/helpRequests';
import { HelpRequestDetail } from '../api/integrationTypes';
import { MaterialHelpRequestDetailScreen } from './volunteer/MaterialHelpRequestDetailScreen';
import { SocialHelpRequestDetailScreen } from './volunteer/SocialHelpRequestDetailScreen';
import { T } from '../theme/tokens';

type Props = {
  helpRequestId: string;
  onBack: () => void;
  onDonate: (params: { helpRequestId: string; title: string; recipient: string }) => void;
  onJoined: (params: { title: string; recipient: string }) => void;
  onOpenVolunteers?: (params: { helpRequestId: string; scheduleLabel?: string }) => void;
  onOpenVisitorProfile?: (params: {
    userId: string;
    displayName?: string;
    role?: 'volunteer' | 'beneficiary';
  }) => void;
  onOpenReport?: (params: {
    helpRequestId: string;
    title: string;
    isMaterial?: boolean;
  }) => void;
};

export function HelpRequestDetailScreen({
  helpRequestId,
  onBack,
  onDonate,
  onJoined,
  onOpenVolunteers,
  onOpenVisitorProfile,
  onOpenReport,
}: Props) {
  const insets = useSafeAreaInsets();
  const [requestType, setRequestType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadType = useCallback(async () => {
    setError(null);
    try {
      const data: HelpRequestDetail = await getHelpRequestById(helpRequestId);
      setRequestType(data.type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить заявку');
      setRequestType(null);
    }
  }, [helpRequestId]);

  useEffect(() => {
    void loadType();
  }, [loadType]);

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={loadType}>
          <Text style={styles.retry}>Повторить</Text>
        </Pressable>
        <Pressable onPress={onBack} style={{ marginTop: 12 }}>
          <Text style={styles.retry}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  if (!requestType) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  if (requestType === 'MATERIAL') {
    return (
      <MaterialHelpRequestDetailScreen
        helpRequestId={helpRequestId}
        onBack={onBack}
        onDonate={onDonate}
        onOpenVisitorProfile={onOpenVisitorProfile}
        onOpenReport={onOpenReport}
      />
    );
  }

  return (
    <SocialHelpRequestDetailScreen
      helpRequestId={helpRequestId}
      onBack={onBack}
      onJoined={onJoined}
      onOpenVolunteers={onOpenVolunteers}
      onOpenVisitorProfile={onOpenVisitorProfile}
      onOpenReport={onOpenReport}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    backgroundColor: T.bg,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
    textAlign: 'center',
  },
  retry: {
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primary,
  },
});
