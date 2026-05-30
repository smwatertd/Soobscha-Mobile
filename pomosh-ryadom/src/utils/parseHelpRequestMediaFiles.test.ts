import { describe, expect, it } from 'vitest';
import {
  buildHelpRequestImageSlides,
  extractHelpRequestImageMediaIds,
  parseHelpRequestMediaFiles,
  splitHelpRequestMedia,
} from './parseHelpRequestMediaFiles';
import { vi } from 'vitest';

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

describe('parseHelpRequestMediaFiles', () => {
  it('parses file names and infers content types', () => {
    const items = parseHelpRequestMediaFiles([
      {
        media_id: 'img-1',
        url: 'https://cdn.test/storage/photo_1.webp?token=abc',
        preview_url: 'https://cdn.test/storage/photo_1_preview.webp',
      },
      {
        media_id: 'doc-1',
        url: 'https://cdn.test/storage/report-final.pdf',
        preview_url: null,
      },
      {
        media_id: 'unknown-1',
        url: 'not-a-url',
        preview_url: null,
      },
    ]);

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      mediaId: 'img-1',
      fileName: 'photo_1.webp',
      contentType: 'image/webp',
    });
    expect(items[1]).toMatchObject({
      mediaId: 'doc-1',
      fileName: 'report-final.pdf',
      contentType: 'application/pdf',
    });
    expect(items[2]).toMatchObject({
      mediaId: 'unknown-1',
      fileName: 'not-a-url',
      contentType: 'application/octet-stream',
    });
  });

  it('splits images and documents correctly', () => {
    const parsed = parseHelpRequestMediaFiles([
      { media_id: 'a', url: 'https://cdn/img.jpg', preview_url: 'https://cdn/img_preview.jpg' },
      { media_id: 'b', url: 'https://cdn/file.docx', preview_url: null },
    ]);

    const { images, documents } = splitHelpRequestMedia(parsed);
    expect(images.map((x) => x.mediaId)).toEqual(['a']);
    expect(documents.map((x) => x.mediaId)).toEqual(['b']);
  });

  it('extracts only image media ids', () => {
    expect(
      extractHelpRequestImageMediaIds([
        { media_id: 'a', url: 'https://cdn/img.jpg', preview_url: 'https://cdn/p.jpg' },
        { media_id: 'b', url: 'https://cdn/file.pdf', preview_url: null },
        { media_id: 'c', url: 'https://cdn/photo.png', preview_url: null },
      ]),
    ).toEqual(['a', 'c']);
  });

  it('builds slides with preview uri when available', () => {
    expect(
      buildHelpRequestImageSlides([
        { media_id: 'a', url: 'https://cdn/full.jpg', preview_url: 'https://cdn/preview.jpg' },
      ]),
    ).toEqual([{ mediaId: 'a', uri: 'https://cdn/preview.jpg' }]);
  });
});
