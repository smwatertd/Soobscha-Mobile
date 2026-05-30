import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { deleteMedia } from '../../../api/media';
import { MediaPurpose } from '../../../api/integrationTypes';
import {
  DraftPhoto,
  nextDraftPhotoSortIndex,
  sortDraftPhotos,
} from '../../../navigation/createHelpRequestTypes';
import { uploadMedia } from '../../../services/mediaUpload';
import {
  getMediaKind,
  getMediaStatusLabel,
  isImageContentType,
  MAX_HELP_REQUEST_PHOTOS,
  validateHelpRequestDocumentAsset,
  validateHelpRequestPhotoAsset,
} from '../../../utils/helpRequestPhotos';
import { MediaFullscreenViewer } from '../../media/MediaFullscreenViewer';
import { Icon } from '../../Icon';
import { useFeedback } from '../../../providers/FeedbackProvider';
import { T, CARD_BG } from '../../../theme/tokens';

const PICKABLE_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/** Последовательная загрузка — сохраняет порядок media_ids и избегает гонок state. */
const UPLOAD_CONCURRENCY = 1;

type UploadState = {
  status: 'uploading' | 'uploaded' | 'error';
  progress: number;
  error?: string;
};

type Props = {
  value: DraftPhoto[];
  onChange: (photos: DraftPhoto[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  error?: string;
  maxFiles?: number;
  imagesOnly?: boolean;
  documentsOnly?: boolean;
  purpose?: MediaPurpose;
};

function createPhotoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function runUploadPool(photos: DraftPhoto[], worker: (photo: DraftPhoto) => Promise<void>) {
  const queue = [...photos];
  const runners = Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) return;
      await worker(next);
    }
  });
  await Promise.all(runners);
}

export function HelpRequestPhotoPicker({
  value,
  onChange,
  onUploadingChange,
  error,
  maxFiles = MAX_HELP_REQUEST_PHOTOS,
  imagesOnly = false,
  documentsOnly = false,
  purpose = 'WORKFLOW',
}: Props) {
  const { showConfirm } = useFeedback();
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const orderedValue = sortDraftPhotos(value);

  const setPhotos = useCallback(
    (next: DraftPhoto[] | ((prev: DraftPhoto[]) => DraftPhoto[])) => {
      const resolved = typeof next === 'function' ? next(valueRef.current) : next;
      valueRef.current = resolved;
      onChange(resolved);
    },
    [onChange],
  );

  const updateUpload = useCallback((id: string, patch: Partial<UploadState>) => {
    setUploads((prev) => {
      const current = prev[id] ?? { status: 'uploading' as const, progress: 0 };
      return {
        ...prev,
        [id]: { ...current, ...patch },
      };
    });
  }, []);

  const uploadPhoto = useCallback(
    async (photo: DraftPhoto) => {
      updateUpload(photo.id, { status: 'uploading', progress: 0, error: undefined });

      try {
        const result = await uploadMedia({
          purpose,
          uri: photo.uri,
          fileName: photo.fileName,
          contentType: photo.contentType,
          onProgress: (progress) => updateUpload(photo.id, { progress }),
        });

        setPhotos((prev) =>
          prev.map((item) =>
            item.id === photo.id ? { ...item, mediaId: result.mediaId } : item,
          ),
        );
        updateUpload(photo.id, { status: 'uploaded', progress: 1, error: undefined });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось загрузить файл';
        updateUpload(photo.id, { status: 'error', progress: 0, error: message });
      }
    },
    [setPhotos, updateUpload, purpose],
  );

  const startUploads = useCallback(
    (photos: DraftPhoto[]) => {
      if (!photos.length) return;
      void runUploadPool(photos, uploadPhoto);
    },
    [uploadPhoto],
  );

  const uploadingCount = Object.values(uploads).filter((item) => item.status === 'uploading').length;

  useEffect(() => {
    onUploadingChange?.(uploadingCount > 0);
  }, [onUploadingChange, uploadingCount]);

  const addValidatedFiles = useCallback(
    (validatedItems: Array<{ uri: string; fileName: string; contentType: string }>) => {
      const remaining = maxFiles - valueRef.current.length;
      if (remaining <= 0) return;

      const sortStart = nextDraftPhotoSortIndex(valueRef.current);
      const toUpload: DraftPhoto[] = validatedItems.slice(0, remaining).map((validated, index) => ({
        id: createPhotoId(),
        uri: validated.uri,
        fileName: validated.fileName,
        contentType: validated.contentType,
        kind: getMediaKind(validated.contentType),
        sortIndex: sortStart + index,
      }));

      if (!toUpload.length) return;

      setPickError(null);
      setPhotos((prev) => [...prev, ...toUpload]);
      startUploads(toUpload);
    },
    [maxFiles, setPhotos, startUploads],
  );

  const handlePickImages = async () => {
    if (valueRef.current.length >= maxFiles) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickError('Разрешите доступ к галерее в настройках устройства');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxFiles - valueRef.current.length,
      quality: 0.92,
    });

    if (result.canceled || !result.assets?.length) return;

    const validatedItems: Array<{ uri: string; fileName: string; contentType: string }> = [];
    const rejections: string[] = [];

    for (const asset of result.assets) {
      const validated = await validateHelpRequestPhotoAsset(asset);
      if (typeof validated === 'string') {
        rejections.push(validated);
        continue;
      }
      validatedItems.push(validated);
    }

    if (!validatedItems.length) {
      setPickError(rejections[0] ?? 'Не удалось добавить выбранные фото');
      return;
    }

    if (rejections.length) {
      setPickError(`Добавлено ${validatedItems.length} из ${result.assets.length}. ${rejections[0]}`);
    }

    addValidatedFiles(validatedItems);
  };

  const handlePickDocuments = async () => {
    if (valueRef.current.length >= maxFiles) return;

    setPickError(null);

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const validatedItems: Array<{ uri: string; fileName: string; contentType: string }> = [];
    const rejections: string[] = [];

    for (const asset of result.assets) {
      if (validatedItems.length + valueRef.current.length >= maxFiles) break;

      const validated = await validateHelpRequestDocumentAsset(asset);
      if (typeof validated === 'string') {
        rejections.push(validated);
        continue;
      }
      validatedItems.push(validated);
    }

    if (!validatedItems.length) {
      setPickError(rejections[0] ?? 'Не удалось добавить выбранные файлы');
      return;
    }

    if (rejections.length) {
      setPickError(`Добавлено ${validatedItems.length} из ${result.assets.length}. ${rejections[0]}`);
    }

    addValidatedFiles(validatedItems);
  };

  const handlePick = async () => {
    if (imagesOnly) {
      await handlePickImages();
      return;
    }
    if (documentsOnly) {
      await handlePickDocuments();
      return;
    }

    setPickError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: [...PICKABLE_TYPES],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const validatedItems: Array<{ uri: string; fileName: string; contentType: string }> = [];
    const rejections: string[] = [];

    for (const asset of result.assets) {
      if (validatedItems.length + valueRef.current.length >= maxFiles) break;

      const validated = isImageContentType(asset.mimeType ?? '')
        ? await validateHelpRequestPhotoAsset({
            uri: asset.uri,
            mimeType: asset.mimeType ?? undefined,
            fileName: asset.name ?? undefined,
            width: 0,
            height: 0,
          })
        : await validateHelpRequestDocumentAsset(asset);

      if (typeof validated === 'string') {
        rejections.push(validated);
        continue;
      }
      validatedItems.push(validated);
    }

    if (!validatedItems.length) {
      setPickError(rejections[0] ?? 'Не удалось добавить выбранные файлы');
      return;
    }

    if (rejections.length) {
      setPickError(`Добавлено ${validatedItems.length} из ${result.assets.length}. ${rejections[0]}`);
    }

    addValidatedFiles(validatedItems);
  };

  const handleRemove = (photo: DraftPhoto) => {
    showConfirm({
      title: 'Удалить файл?',
      message: photo.fileName
        ? `${photo.fileName} будет удалён из заявки.`
        : 'Файл будет удалён из заявки.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Оставить',
      destructive: true,
      onConfirm: () => removePhoto(photo),
    });
  };

  const removePhoto = (photo: DraftPhoto) => {
    setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
    setUploads((prev) => {
      const next = { ...prev };
      delete next[photo.id];
      return next;
    });

    if (photo.mediaId) {
      deleteMedia(photo.mediaId).catch(() => undefined);
    }
  };

  const handleRetry = (photo: DraftPhoto) => {
    setPickError(null);
    uploadPhoto(photo);
  };

  const openViewer = (photo: DraftPhoto) => {
    const index = orderedValue.findIndex((item) => item.id === photo.id);
    if (index >= 0) {
      setViewerIndex(index);
    }
  };

  const canAdd = orderedValue.length < maxFiles;

  return (
    <View style={styles.root}>
      <View style={styles.photosRow}>
        {orderedValue.map((photo) => {
          const upload = uploads[photo.id];
          const hasMediaId = Boolean(photo.mediaId);
          const isUploading = !hasMediaId && upload?.status === 'uploading';
          const isError = !hasMediaId && upload?.status === 'error';
          const isImage = isImageContentType(photo.contentType);
          const statusLabel = getMediaStatusLabel(upload?.status, {
            hasMediaId,
            progress: upload?.progress,
          });
          const showProgressPercent = isUploading && (upload?.progress ?? 0) < 0.9;

          return (
            <View key={photo.id} style={styles.slotWrap}>
              <View style={styles.photoSlot}>
                <Pressable
                  style={styles.photoTap}
                  onPress={() => openViewer(photo)}
                  disabled={isUploading}
                >
                  {isImage ? (
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} contentFit="cover" />
                  ) : (
                    <View style={styles.docThumb}>
                      <Icon name="document" size={28} color={T.primary} strokeWidth={1.6} />
                      <Text style={styles.docThumbName} numberOfLines={2}>
                        {photo.fileName}
                      </Text>
                    </View>
                  )}

                  {(isUploading || isError) && (
                    <Pressable
                      style={styles.overlay}
                      onPress={isError ? () => handleRetry(photo) : undefined}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.overlayText}>
                            {showProgressPercent
                              ? `${Math.round((upload?.progress ?? 0) * 100)}%`
                              : 'Сохранение…'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.overlayTextRetry}>Повторить</Text>
                          {upload?.error ? (
                            <Text style={styles.overlayError} numberOfLines={2}>
                              {upload.error}
                            </Text>
                          ) : null}
                        </>
                      )}
                    </Pressable>
                  )}

                  {hasMediaId && (
                    <View style={styles.uploadedBadge}>
                      <Icon name="check" size={12} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>

                <Pressable
                  style={styles.removeBtn}
                  onPress={() => handleRemove(photo)}
                  hitSlop={6}
                >
                  <Icon name="close" size={12} color="#fff" strokeWidth={2.5} />
                </Pressable>
              </View>
              {statusLabel ? (
                <Text
                  style={[styles.statusText, isError && styles.statusTextError]}
                  numberOfLines={2}
                >
                  {statusLabel}
                </Text>
              ) : null}
            </View>
          );
        })}

        {canAdd && (
          <View style={styles.slotWrap}>
            <Pressable style={styles.photoAdd} onPress={() => { void handlePick(); }}>
              <Icon name="plus" size={22} color={T.muted} />
              <Text style={styles.photoAddText}>Добавить</Text>
            </Pressable>
          </View>
        )}
      </View>

      {pickError ? <Text style={styles.fieldError}>{pickError}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      <MediaFullscreenViewer
        visible={viewerIndex !== null}
        items={orderedValue}
        initialIndex={viewerIndex ?? 0}
        subtitle="Файлы заявки"
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}

const SLOT_SIZE = 92;

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotWrap: {
    width: SLOT_SIZE,
    gap: 4,
  },
  photoSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: T.surface2,
  },
  photoTap: {
    flex: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  docThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  docThumbName: {
    fontSize: 9,
    fontFamily: 'Manrope_600SemiBold',
    color: T.ink2,
    textAlign: 'center',
    lineHeight: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  overlayText: {
    fontSize: 10,
    fontFamily: 'Manrope_600SemiBold',
    color: '#fff',
  },
  overlayTextRetry: {
    fontSize: 11,
    fontFamily: 'Manrope_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  overlayError: {
    fontSize: 9,
    fontFamily: 'Manrope_500Medium',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 12,
  },
  uploadedBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Manrope_500Medium',
    color: T.muted,
    lineHeight: 13,
  },
  statusTextError: {
    color: T.danger,
  },
  photoAdd: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: T.border,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddText: {
    fontSize: 11,
    fontFamily: 'Manrope_600SemiBold',
    color: T.muted,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
    color: T.danger,
  },
});
