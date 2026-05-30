import { CityOption } from '../api/locations';

export function formatCityPopulationCount(population: number): string | null {
  if (!Number.isFinite(population) || population <= 0) return null;

  if (population >= 1_000_000) {
    const millions = population / 1_000_000;
    const label =
      millions >= 10
        ? `${Math.round(millions)}`
        : millions.toFixed(1).replace(/\.0$/, '');
    return `${label} млн жителей`;
  }

  if (population >= 1_000) {
    const thousands = Math.round(population / 1_000);
    return `${thousands} тыс. жителей`;
  }

  return `${population} жителей`;
}

export function formatCityMetaLine(city: CityOption): string | null {
  const description = city.description?.trim();
  if (description) return description;

  const populationText =
    city.population_label?.trim()
      ? `${city.population_label.trim()} жителей`
      : formatCityPopulationCount(city.population ?? NaN);

  if (city.region?.trim() && populationText) {
    return `${city.region.trim()} · ${populationText}`;
  }
  if (populationText) return populationText;
  if (city.region?.trim()) return city.region.trim();
  return null;
}
