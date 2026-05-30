import { useEffect, useMemo, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { updateCurrentBeneficiaryCity } from '../../api/beneficiaries';
import { getErrorMessage } from '../../api/errors';
import { getAvailableCities, CityOption } from '../../api/locations';
import { updateCurrentVolunteerCity } from '../../api/volunteers';
import { CityPickerScreen } from '../../components/CityPickerScreen';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useFeedback } from '../../providers/FeedbackProvider';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileCityPicker'>;
  route: RouteProp<RootStackParamList, 'ProfileCityPicker'>;
};

function resolveCityLabel(cityCode: string | null | undefined, cities: CityOption[]): string | null {
  if (!cityCode) return null;
  const match = cities.find((city) => city.code === cityCode);
  return match?.label ?? cityCode;
}

export function ProfileCityPickerScreen({ navigation, route }: Props) {
  const { role, initialCityCode, initialCityLabel } = route.params;
  const { showSnack } = useFeedback();
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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

  const selectedCode = useMemo(() => {
    if (initialCityCode) return initialCityCode;
    if (!initialCityLabel) return null;
    const match = cities.find((city) => city.label === initialCityLabel);
    return match?.code ?? null;
  }, [cities, initialCityCode, initialCityLabel]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cities;
    return cities.filter((city) => city.label.toLowerCase().includes(normalized));
  }, [cities, query]);

  const handleSelect = async (city: CityOption) => {
    if (saving || city.code === selectedCode) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      const updated =
        role === 'volunteer'
          ? await updateCurrentVolunteerCity(city.code)
          : await updateCurrentBeneficiaryCity(city.code);
      const label = updated.city?.trim() || resolveCityLabel(city.code, cities) || city.label;
      showSnack(`Город изменён на «${label}»`);
      navigation.goBack();
    } catch (err) {
      showSnack(getErrorMessage(err, 'Не удалось сохранить город'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CityPickerScreen
      title="Изменить город"
      onBack={() => navigation.goBack()}
      cities={filtered}
      loading={loading || saving}
      error={error}
      query={query}
      onQueryChange={setQuery}
      selectedCode={selectedCode}
      onSelect={(city) => void handleSelect(city)}
      onSuggestCity={() => showSnack('Спасибо! Мы учтём ваше предложение.')}
    />
  );
}
