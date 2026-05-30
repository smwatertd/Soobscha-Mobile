import { useEffect, useMemo, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAvailableCities, CityOption } from '../../../api/locations';
import { getErrorMessage } from '../../../api/errors';
import { CityPickerScreen } from '../../../components/CityPickerScreen';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useFeedback } from '../../../providers/FeedbackProvider';
import { useVolunteerVerifDraft } from '../../../providers/VolunteerVerifDraftProvider';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VolunteerVerifCityPicker'>;
};

export function VolunteerVerifCityPickerScreen({ navigation }: Props) {
  const { showSnack } = useFeedback();
  const { draft, patchDraft } = useVolunteerVerifDraft();
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getAvailableCities();
        if (!cancelled) setCities(items);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Не удалось загрузить список городов'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cities;
    return cities.filter((city) => city.label.toLowerCase().includes(normalized));
  }, [cities, query]);

  const handleSelect = (city: CityOption) => {
    patchDraft({ city: city.label, cityCode: city.code });
    navigation.goBack();
  };

  return (
    <CityPickerScreen
      onBack={() => navigation.goBack()}
      cities={filtered}
      loading={loading}
      error={error}
      query={query}
      onQueryChange={setQuery}
      selectedCode={draft.cityCode}
      onSelect={handleSelect}
      onSuggestCity={() => showSnack('Спасибо! Мы учтём ваше предложение.')}
    />
  );
}
