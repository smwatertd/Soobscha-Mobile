import { describe, expect, it, vi } from 'vitest';

vi.mock('./helpRequestPhotos', () => ({
  isImageContentType: (contentType: string) => contentType.startsWith('image/'),
  normalizeDocumentContentType: (_mimeType?: string | null, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'docx')
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return null;
  },
  normalizePhotoContentType: (_mimeType?: string | null, uri?: string) => {
    const ext = uri?.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    return null;
  },
}));

import {
  collectMapPins,
  getMapRequestCoverImage,
  helpRequestToMapPin,
  normalizeHelpRequestMediaFiles,
} from './mapHelpRequest';

describe('mapHelpRequest', () => {
  it('collects pins with coordinates only', () => {
    const pins = collectMapPins([
      { id: 'a', type: 'SOCIAL', title: 'A', latitude: 55.75, longitude: 37.62 },
      { id: 'b', type: 'MATERIAL', title: 'B' },
      { id: 'c', type: 'MATERIAL', title: 'C', latitude: 55.1, longitude: 37.1 },
    ]);

    expect(pins).toHaveLength(2);
    expect(pins.map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('maps material request pin', () => {
    const pin = helpRequestToMapPin({
      id: 'm1',
      type: 'MATERIAL',
      title: 'Сбор',
      latitude: 55.75,
      longitude: 37.62,
      category: 'REHABILITATION',
    });

    expect(pin?.type).toBe('MATERIAL');
    expect(pin?.latitude).toBe(55.75);
  });

  it('parses string coordinates and nested location', () => {
    expect(
      helpRequestToMapPin({
        id: 's1',
        type: 'SOCIAL',
        title: 'A',
        latitude: '55.75',
        longitude: '37.62',
      }),
    ).toMatchObject({ latitude: 55.75, longitude: 37.62 });

    expect(
      helpRequestToMapPin({
        id: 's2',
        type: 'SOCIAL',
        title: 'B',
        location: { lat: 55.1, lon: 37.1 },
      }),
    ).toMatchObject({ latitude: 55.1, longitude: 37.1 });
  });

  it('normalizes media_files and picks first image cover', () => {
    const files = normalizeHelpRequestMediaFiles([
      {
        mediaId: 'doc-1',
        url: 'https://cdn.test/report.pdf',
        previewUrl: null,
        expiresAt: '2099-01-01T00:00:00.000Z',
      },
      {
        media_id: 'img-1',
        url: 'https://cdn.test/photo.jpg',
        preview_url: 'https://cdn.test/photo_preview.jpg',
        expires_at: '2099-01-01T00:00:00.000Z',
      },
    ]);

    expect(files).toHaveLength(2);
    expect(getMapRequestCoverImage({ media_files: files })).toEqual({
      mediaId: 'img-1',
      uri: 'https://cdn.test/photo_preview.jpg',
    });
  });
});
