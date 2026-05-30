import { useEffect, useMemo, useState } from 'react';
import { ensureLabelCatalogLoaded, getHelpRequestCategoryLabelMap } from '../services/labelCatalog';
import { resolveCategoryLabel } from '../utils/helpRequestCategoryLabels';

export function useHelpRequestCategoryLabels() {
  const [labelByCode, setLabelByCode] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    ensureLabelCatalogLoaded()
      .then(() => setLabelByCode(getHelpRequestCategoryLabelMap()))
      .catch(() => {});
  }, []);

  const resolve = useMemo(
    () => (code: string | null | undefined) =>
      code ? resolveCategoryLabel(code, labelByCode) : null,
    [labelByCode],
  );

  return { labelByCode, resolveCategoryLabel: resolve };
}
