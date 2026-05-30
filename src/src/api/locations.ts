import { apiRequest } from './client';

export type CityOption = {
  code: string;
  label: string;
  /** Регион / область для подписи в списке */
  region?: string;
  /** Краткая подпись численности, напр. «13.0 млн» (моки / legacy) */
  population_label?: string;
  /** Численность из API (CityResponse.population) */
  population?: number | null;
  /** Текстовое описание города из API, если есть */
  description?: string | null;
};

function normalizeCityOption(raw: CityOption | Record<string, unknown>): CityOption {
  const item = raw as Record<string, unknown>;
  const population =
    typeof item.population === 'number'
      ? item.population
      : item.population === null
        ? null
        : undefined;

  return {
    code: String(item.code ?? ''),
    label: String(item.label ?? ''),
    region: typeof item.region === 'string' ? item.region : undefined,
    population_label:
      typeof item.population_label === 'string' ? item.population_label : undefined,
    population,
    description: typeof item.description === 'string' ? item.description : undefined,
  };
}

export async function getAvailableCities(): Promise<CityOption[]> {
  const items = await apiRequest<Array<CityOption | Record<string, unknown>>>(
    '/api/locations/cities',
    { auth: true },
  );
  return items.map(normalizeCityOption);
}
