import {
  CreateHelpRequestReviewParams,
  CreateMaterialHelpRequestReviewParams,
} from '../navigation/createHelpRequestTypes';
import { SOCIAL_DRAFT_DEFAULTS, MATERIAL_DRAFT_DEFAULTS } from '../providers/CreateHelpRequestDraftProvider';

export function hasSocialDraftContent(
  draft: Partial<CreateHelpRequestReviewParams>,
): boolean {
  return Boolean(
    draft.category?.trim() ||
      draft.title?.trim() ||
      draft.description?.trim() ||
      draft.address?.trim() ||
      typeof draft.latitude === 'number' ||
      typeof draft.longitude === 'number' ||
      (draft.requiredSkills?.length ?? 0) > 0 ||
      (draft.preferredSkills?.length ?? 0) > 0 ||
      (draft.photos?.length ?? 0) > 0 ||
      (draft.bringItems?.length ?? 0) > 0 ||
      draft.extraNotes?.trim() ||
      (draft.minVolunteers ?? SOCIAL_DRAFT_DEFAULTS.minVolunteers) !== 1 ||
      (draft.maxVolunteers ?? SOCIAL_DRAFT_DEFAULTS.maxVolunteers) !== 1,
  );
}

export function hasMaterialDraftContent(
  draft: Partial<CreateMaterialHelpRequestReviewParams>,
): boolean {
  return Boolean(
    draft.category?.trim() ||
      draft.title?.trim() ||
      draft.description?.trim() ||
      (draft.amountRubles ?? 0) > 0 ||
      (draft.photos?.length ?? 0) > 0,
  );
}
