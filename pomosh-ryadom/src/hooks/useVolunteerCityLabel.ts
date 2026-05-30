import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentVolunteer } from '../api/volunteers';

export function useVolunteerCityLabel(): string | null {
  const [city, setCity] = useState<string | null>(null);

  const reload = useCallback(() => {
    getCurrentVolunteer()
      .then((volunteer) => setCity(volunteer.city?.trim() || null))
      .catch(() => setCity(null));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return city;
}
