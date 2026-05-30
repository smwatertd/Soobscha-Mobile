import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Icon, IconName } from '../../components/Icon';
import { ProgressBar } from '../../components/ProgressBar';
import { ScreenHeader } from '../../components/ScreenHeader';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { HelpRequestType } from '../../navigation/createHelpRequestTypes';
import { useCreateHelpRequestDraft } from '../../providers/CreateHelpRequestDraftProvider';
import { RADIUS, T, CARD_BG, shadowSm } from '../../theme/tokens';
import {
  hasMaterialDraftContent,
  hasSocialDraftContent,
} from '../../utils/createHelpRequestDraftUtils';
import { useFeedback } from '../../providers/FeedbackProvider';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateHelpRequestType'>;
  route: RouteProp<RootStackParamList, 'CreateHelpRequestType'>;
};

type ChoiceProps = {
  icon: IconName;
  color: string;
  colorBg: string;
  title: string;
  desc: string;
  examples: string[];
  selected?: boolean;
  onPress: () => void;
};

function BigChoice({
  icon,
  color,
  colorBg,
  title,
  desc,
  examples,
  selected,
  onPress,
}: ChoiceProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        shadowSm,
        selected && { borderColor: color, borderWidth: 2 },
      ]}
    >
      <View style={styles.choiceTop}>
        <View style={[styles.choiceIcon, { backgroundColor: colorBg }]}>
          <Icon name={icon} size={26} color={color} strokeWidth={1.8} />
        </View>
        <Text style={styles.choiceTitle}>{title}</Text>
        <View
          style={[
            styles.radio,
            selected && { backgroundColor: color, borderColor: color },
          ]}
        >
          {selected && <View style={styles.radioDot} />}
        </View>
      </View>
      <Text style={styles.choiceDesc}>{desc}</Text>
      <View style={styles.examples}>
        {examples.map((e) => (
          <View
            key={e}
            style={[
              styles.exampleChip,
              { backgroundColor: selected ? colorBg : T.surface2 },
            ]}
          >
            <Text style={[styles.exampleText, selected && { color }]}>{e}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function inferTypeFromDrafts(
  socialDraft: Record<string, unknown>,
  materialDraft: Record<string, unknown>,
): HelpRequestType {
  const materialFilled = Boolean(materialDraft.title || materialDraft.category || materialDraft.amountRubles);
  const socialFilled = Boolean(socialDraft.title || socialDraft.category);
  if (materialFilled && !socialFilled) return 'material';
  return 'social';
}

export function CreateHelpRequestTypeScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { showConfirm } = useFeedback();
  const { socialDraft, materialDraft, resetAllDrafts, patchSocialDraft, patchMaterialDraft } =
    useCreateHelpRequestDraft();
  const [type, setType] = useState<HelpRequestType>(() =>
    inferTypeFromDrafts(socialDraft, materialDraft),
  );

  useFocusEffect(
    useCallback(() => {
      if (route.params?.resetDraft) {
        resetAllDrafts();
        setType('social');
        navigation.setParams({ resetDraft: undefined });
        return;
      }
      setType(inferTypeFromDrafts(socialDraft, materialDraft));
    }, [route.params?.resetDraft, resetAllDrafts, navigation, socialDraft, materialDraft]),
  );

  const handleBack = () => {
    const hasDraft =
      hasSocialDraftContent(socialDraft) || hasMaterialDraftContent(materialDraft);
    if (hasDraft) {
      showConfirm({
        title: 'Выйти из создания заявки?',
        message: 'Черновик не сохранится — придётся начать заново.',
        confirmLabel: 'Выйти',
        cancelLabel: 'Остаться',
        destructive: true,
        onConfirm: () => {
          resetAllDrafts();
          navigation.goBack();
        },
      });
      return;
    }
    navigation.goBack();
  };

  const handleNext = () => {
    if (type === 'material') {
      patchMaterialDraft({ type: 'material' });
      navigation.navigate('CreateMaterialHelpRequestDetails', { type: 'material' });
      return;
    }
    patchSocialDraft({ type: 'social' });
    navigation.navigate('CreateHelpRequestDetails', { type: 'social' });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Новая заявка" onBack={handleBack} />
      <Text style={styles.subHeader}>Шаг 1 из 5</Text>
      <View style={styles.progressWrap}>
        <ProgressBar value={1} max={5} height={4} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.leadTitle}>
          Какая помощь{'\n'}вам нужна?
        </Text>
        <Text style={styles.leadSub}>
          Выберите формат — детали и условия дальше можно настроить под ваш случай.
        </Text>

        <BigChoice
          icon="handshake"
          color={T.primary}
          colorBg={T.primarySoft}
          title="Помощь людьми"
          desc="Нужны руки — например, уборка, доставка покупок, ремонт, прогулка с собакой."
          examples={['Уборка', 'Покупки', 'Ремонт', 'Перевозка']}
          selected={type === 'social'}
          onPress={() => setType('social')}
        />

        <View style={{ height: 12 }} />

        <BigChoice
          icon="coin"
          color={T.accent}
          colorBg={T.accentSoft}
          title="Сбор средств"
          desc="Нужны деньги — на лечение, лекарства, оборудование, восстановление имущества."
          examples={['Лечение', 'Лекарства', 'Реабилитация', 'Имущество']}
          selected={type === 'material'}
          onPress={() => setType('material')}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button kind="ghost" size="lg" onPress={handleBack}>
          Отмена
        </Button>
        <Button kind="primary" size="lg" iconRight="arrowR" style={styles.footerPrimary} onPress={handleNext}>
          Далее
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.bg,
  },
  subHeader: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    marginTop: -4,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  scroll: {
    flex: 1,
  },
  leadTitle: {
    fontSize: 22,
    fontFamily: 'Manrope_800ExtraBold',
    color: T.ink,
    letterSpacing: -0.4,
    lineHeight: 27,
    marginBottom: 8,
    marginTop: 8,
  },
  leadSub: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 21,
    marginBottom: 22,
  },
  choice: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  choiceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  choiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: T.ink,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  choiceDesc: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.muted,
    lineHeight: 21,
    marginBottom: 12,
  },
  examples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exampleChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  exampleText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
    backgroundColor: T.bg,
  },
  footerPrimary: {
    flex: 1,
  },
});
