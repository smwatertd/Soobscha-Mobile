import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  CreateHelpRequestReviewParams,
  CreateMaterialHelpRequestReviewParams,
  DEFAULT_DURATION_MINUTES,
} from '../navigation/createHelpRequestTypes';
import { MapPoint } from '../api/integrationTypes';
import { ModerationFeedback } from '../utils/extractModerationFeedback';
import { toIso } from '../utils/dateIso';

function defaultDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

export const SOCIAL_DRAFT_DEFAULTS: Partial<CreateHelpRequestReviewParams> = {
  type: 'social',
  category: '',
  categoryLabel: '',
  title: '',
  description: '',
  dateIso: defaultDateIso(),
  time: '10:00',
  address: '',
  minVolunteers: 1,
  maxVolunteers: 1,
  requiredSkills: [],
  preferredSkills: [],
  photos: [],
  bringItems: [],
  extraNotes: '',
  safetyAccepted: false,
};

export const MATERIAL_DRAFT_DEFAULTS: Partial<CreateMaterialHelpRequestReviewParams> = {
  type: 'material',
  category: '',
  categoryLabel: '',
  title: '',
  description: '',
  amountRubles: 0,
  photos: [],
};

type SocialDraft = Partial<CreateHelpRequestReviewParams>;
type MaterialDraft = Partial<CreateMaterialHelpRequestReviewParams>;
export type HelpRequestEditKind = 'social' | 'material';

function mergeSocialDraft(partial: SocialDraft): CreateHelpRequestReviewParams {
  return {
    type: 'social',
    category: partial.category ?? '',
    categoryLabel: partial.categoryLabel ?? '',
    title: partial.title ?? '',
    description: partial.description ?? '',
    dateIso: partial.dateIso ?? SOCIAL_DRAFT_DEFAULTS.dateIso ?? '',
    time: partial.time ?? SOCIAL_DRAFT_DEFAULTS.time ?? '10:00',
    address: partial.address ?? '',
    latitude: partial.latitude ?? 0,
    longitude: partial.longitude ?? 0,
    minVolunteers: partial.minVolunteers ?? 1,
    maxVolunteers: partial.maxVolunteers ?? 1,
    requiredSkills: partial.requiredSkills ?? [],
    preferredSkills: partial.preferredSkills ?? [],
    photos: partial.photos ?? [],
    bringItems: partial.bringItems ?? [],
    extraNotes: partial.extraNotes ?? '',
    safetyAccepted: partial.safetyAccepted ?? false,
    durationMinutes: partial.durationMinutes ?? DEFAULT_DURATION_MINUTES,
  };
}

function mergeMaterialDraft(partial: MaterialDraft): CreateMaterialHelpRequestReviewParams {
  return {
    type: 'material',
    category: partial.category ?? '',
    categoryLabel: partial.categoryLabel ?? '',
    title: partial.title ?? '',
    description: partial.description ?? '',
    amountRubles: partial.amountRubles ?? 0,
    photos: partial.photos ?? [],
  };
}

type CreateHelpRequestDraftContextValue = {
  socialDraft: SocialDraft;
  materialDraft: MaterialDraft;
  editingHelpRequestId: string | null;
  editingRequestKind: HelpRequestEditKind | null;
  editModerationFeedback: ModerationFeedback | null;
  patchSocialDraft: (patch: SocialDraft) => void;
  patchMaterialDraft: (patch: MaterialDraft) => void;
  beginSocialEdit: (
    helpRequestId: string,
    draft: CreateHelpRequestReviewParams,
    feedback: ModerationFeedback,
  ) => void;
  beginMaterialEdit: (
    helpRequestId: string,
    draft: CreateMaterialHelpRequestReviewParams,
    feedback: ModerationFeedback,
  ) => void;
  clearSocialEdit: () => void;
  clearMaterialEdit: () => void;
  resetSocialDraft: () => void;
  resetMaterialDraft: () => void;
  resetAllDrafts: () => void;
  getSocialDraft: () => CreateHelpRequestReviewParams;
  getMaterialDraft: () => CreateMaterialHelpRequestReviewParams;
};

const CreateHelpRequestDraftContext = createContext<CreateHelpRequestDraftContextValue | null>(null);

export function CreateHelpRequestDraftProvider({ children }: { children: React.ReactNode }) {
  const [socialDraft, setSocialDraft] = useState<SocialDraft>({});
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft>({});
  const [editingHelpRequestId, setEditingHelpRequestId] = useState<string | null>(null);
  const [editingRequestKind, setEditingRequestKind] = useState<HelpRequestEditKind | null>(null);
  const [editModerationFeedback, setEditModerationFeedback] = useState<ModerationFeedback | null>(
    null,
  );

  const patchSocialDraft = useCallback((patch: SocialDraft) => {
    setSocialDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchMaterialDraft = useCallback((patch: MaterialDraft) => {
    setMaterialDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearEditState = useCallback(() => {
    setEditingHelpRequestId(null);
    setEditingRequestKind(null);
    setEditModerationFeedback(null);
  }, []);

  const clearSocialEdit = useCallback(() => {
    setEditingRequestKind((kind) => {
      if (kind === 'social') {
        setEditingHelpRequestId(null);
        setEditModerationFeedback(null);
        return null;
      }
      return kind;
    });
  }, []);

  const clearMaterialEdit = useCallback(() => {
    setEditingRequestKind((kind) => {
      if (kind === 'material') {
        setEditingHelpRequestId(null);
        setEditModerationFeedback(null);
        return null;
      }
      return kind;
    });
  }, []);

  const beginSocialEdit = useCallback(
    (helpRequestId: string, draft: CreateHelpRequestReviewParams, feedback: ModerationFeedback) => {
      setEditingHelpRequestId(helpRequestId);
      setEditingRequestKind('social');
      setEditModerationFeedback(feedback);
      setSocialDraft(draft);
    },
    [],
  );

  const beginMaterialEdit = useCallback(
    (
      helpRequestId: string,
      draft: CreateMaterialHelpRequestReviewParams,
      feedback: ModerationFeedback,
    ) => {
      setEditingHelpRequestId(helpRequestId);
      setEditingRequestKind('material');
      setEditModerationFeedback(feedback);
      setMaterialDraft(draft);
    },
    [],
  );

  const resetSocialDraft = useCallback(() => {
    setSocialDraft({});
    setEditingRequestKind((kind) => {
      if (kind === 'social') {
        setEditingHelpRequestId(null);
        setEditModerationFeedback(null);
        return null;
      }
      return kind;
    });
  }, []);

  const resetMaterialDraft = useCallback(() => {
    setMaterialDraft({});
    setEditingRequestKind((kind) => {
      if (kind === 'material') {
        setEditingHelpRequestId(null);
        setEditModerationFeedback(null);
        return null;
      }
      return kind;
    });
  }, []);

  const resetAllDrafts = useCallback(() => {
    setSocialDraft({});
    setMaterialDraft({});
    clearEditState();
  }, [clearEditState]);

  const getSocialDraft = useCallback((): CreateHelpRequestReviewParams => {
    return mergeSocialDraft(socialDraft);
  }, [socialDraft]);

  const getMaterialDraft = useCallback((): CreateMaterialHelpRequestReviewParams => {
    return mergeMaterialDraft(materialDraft);
  }, [materialDraft]);

  const value = useMemo(
    () => ({
      socialDraft,
      materialDraft,
      editingHelpRequestId,
      editingRequestKind,
      editModerationFeedback,
      patchSocialDraft,
      patchMaterialDraft,
      beginSocialEdit,
      beginMaterialEdit,
      clearSocialEdit,
      clearMaterialEdit,
      resetSocialDraft,
      resetMaterialDraft,
      resetAllDrafts,
      getSocialDraft,
      getMaterialDraft,
    }),
    [
      socialDraft,
      materialDraft,
      editingHelpRequestId,
      editingRequestKind,
      editModerationFeedback,
      patchSocialDraft,
      patchMaterialDraft,
      beginSocialEdit,
      beginMaterialEdit,
      clearSocialEdit,
      clearMaterialEdit,
      resetSocialDraft,
      resetMaterialDraft,
      resetAllDrafts,
      getSocialDraft,
      getMaterialDraft,
    ],
  );

  return (
    <CreateHelpRequestDraftContext.Provider value={value}>
      {children}
    </CreateHelpRequestDraftContext.Provider>
  );
}

export function useCreateHelpRequestDraft() {
  const ctx = useContext(CreateHelpRequestDraftContext);
  if (!ctx) {
    throw new Error('useCreateHelpRequestDraft must be used within CreateHelpRequestDraftProvider');
  }
  return ctx;
}

export function useSocialHelpRequestDraft() {
  const {
    socialDraft,
    editingHelpRequestId,
    editingRequestKind,
    editModerationFeedback,
    patchSocialDraft,
    getSocialDraft,
    resetSocialDraft,
    beginSocialEdit,
    clearSocialEdit,
  } = useCreateHelpRequestDraft();
  const draft = useMemo(() => mergeSocialDraft(socialDraft), [socialDraft]);
  const location: MapPoint | null =
    typeof socialDraft.latitude === 'number' && typeof socialDraft.longitude === 'number'
      ? { latitude: socialDraft.latitude, longitude: socialDraft.longitude }
      : null;
  const isEditMode = editingRequestKind === 'social' && Boolean(editingHelpRequestId);
  return {
    draft,
    location,
    isEditMode,
    editingHelpRequestId,
    editModerationFeedback,
    patchDraft: patchSocialDraft,
    getDraft: getSocialDraft,
    resetDraft: resetSocialDraft,
    beginEdit: beginSocialEdit,
    clearEdit: clearSocialEdit,
  };
}

export function useMaterialHelpRequestDraft() {
  const {
    materialDraft,
    editingHelpRequestId,
    editingRequestKind,
    editModerationFeedback,
    patchMaterialDraft,
    getMaterialDraft,
    resetMaterialDraft,
    beginMaterialEdit,
    clearMaterialEdit,
  } = useCreateHelpRequestDraft();
  const draft = useMemo(() => mergeMaterialDraft(materialDraft), [materialDraft]);
  const isEditMode = editingRequestKind === 'material' && Boolean(editingHelpRequestId);
  return {
    draft,
    isEditMode,
    editingHelpRequestId: isEditMode ? editingHelpRequestId : null,
    editModerationFeedback: isEditMode ? editModerationFeedback : null,
    patchDraft: patchMaterialDraft,
    getDraft: getMaterialDraft,
    resetDraft: resetMaterialDraft,
    beginEdit: beginMaterialEdit,
    clearEdit: clearMaterialEdit,
  };
}
