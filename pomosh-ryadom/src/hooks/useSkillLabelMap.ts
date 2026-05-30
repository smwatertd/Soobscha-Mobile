import { useEffect, useMemo, useState } from 'react';
import { VolunteerSkillCatalogItem } from '../api/volunteers';
import { ensureSkillCatalogLoaded, getVolunteerSkillCatalogItems } from '../services/skillCatalog';
import { buildSkillLabelMap } from '../utils/volunteerSkillLabels';

export function useSkillLabelMap() {
  const [catalog, setCatalog] = useState<VolunteerSkillCatalogItem[]>(() =>
    getVolunteerSkillCatalogItems(),
  );

  useEffect(() => {
    let cancelled = false;

    ensureSkillCatalogLoaded()
      .then((items) => {
        if (!cancelled) setCatalog(items);
      })
      .catch(() => {
        if (!cancelled) setCatalog(getVolunteerSkillCatalogItems());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const labelByCode = useMemo(() => buildSkillLabelMap(catalog), [catalog]);

  return { labelByCode, catalog };
}
