import { CodeLabel, getHelpRequestCategories } from '../api/helpRequests';
import { getBeneficiaryCategories } from '../api/beneficiaries';
import { logger } from './logger';
import {
  LABEL_CATALOG_FALLBACKS,
  resetLabelCatalogStateForTests,
  setBeneficiaryCategoryLabels,
  setHelpRequestCategoryLabels,
} from './labelCatalogState';

export {
  BOTTOM_NAV_BAR_HEIGHT,
  getBeneficiaryCategoryLabelMap,
  getHelpRequestCategoryLabelMap,
  humanizeEnumCode,
  resolveBeneficiaryCategoryLabel,
  resolveCategoryBadgeLabel,
  resolveHelpRequestCategoryLabel,
} from './labelCatalogState';

export type LabelCatalogSnapshot = {
  social: CodeLabel[];
  material: CodeLabel[];
  beneficiary: CodeLabel[];
};

let cachedSnapshot: LabelCatalogSnapshot | null = null;
let loadPromise: Promise<LabelCatalogSnapshot> | null = null;

async function fetchLabelCatalogFromApi(): Promise<LabelCatalogSnapshot> {
  const categories = await getHelpRequestCategories().catch(() => ({
    social: LABEL_CATALOG_FALLBACKS.social,
    material: LABEL_CATALOG_FALLBACKS.material,
  }));
  const beneficiaryCategories = await getBeneficiaryCategories().catch(
    () => LABEL_CATALOG_FALLBACKS.beneficiary,
  );

  return {
    social: categories.social,
    material: categories.material,
    beneficiary: beneficiaryCategories,
  };
}

function applySnapshot(snapshot: LabelCatalogSnapshot): LabelCatalogSnapshot {
  setHelpRequestCategoryLabels(snapshot.social, snapshot.material);
  setBeneficiaryCategoryLabels(snapshot.beneficiary);
  cachedSnapshot = snapshot;
  return snapshot;
}

/** Один раз за сессию: help-request + beneficiary categories. Повторные вызовы — из памяти. */
export async function ensureLabelCatalogLoaded(): Promise<LabelCatalogSnapshot> {
  if (cachedSnapshot) return cachedSnapshot;
  if (loadPromise) return loadPromise;

  loadPromise = fetchLabelCatalogFromApi().then((snapshot) => {
    applySnapshot(snapshot);
    logger.api.debug('label catalog loaded', {
      helpRequest: snapshot.social.length + snapshot.material.length,
      beneficiary: snapshot.beneficiary.length,
    });
    return snapshot;
  });

  return loadPromise;
}

export function getLabelCatalogSnapshot(): LabelCatalogSnapshot | null {
  return cachedSnapshot;
}

export function resetLabelCatalogForTests(): void {
  cachedSnapshot = null;
  loadPromise = null;
  resetLabelCatalogStateForTests();
}
