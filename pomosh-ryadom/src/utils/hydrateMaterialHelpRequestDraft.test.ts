import { describe, expect, it } from 'vitest';
import { hydrateMaterialHelpRequestDraft } from './hydrateMaterialHelpRequestDraft';
import { HelpRequestDetail } from '../api/integrationTypes';
import { vi } from 'vitest';

vi.mock('./parseHelpRequestMediaFiles', () => ({
  parseHelpRequestMediaFiles: () => [
    {
      mediaId: 'm1',
      url: 'https://cdn.test/file/photo.jpg',
      previewUrl: 'https://cdn.test/file/photo_preview.jpg',
      contentType: 'image/jpeg',
      fileName: 'photo.jpg',
    },
    {
      mediaId: 'm2',
      url: 'https://cdn.test/file/report.pdf',
      previewUrl: null,
      contentType: 'application/pdf',
      fileName: 'report.pdf',
    },
  ],
  splitHelpRequestMedia: (items: Array<{ contentType: string }>) => ({
    images: items.filter((item) => item.contentType.startsWith('image/')),
    documents: items.filter((item) => !item.contentType.startsWith('image/')),
  }),
}));

describe('hydrateMaterialHelpRequestDraft', () => {
  it('hydrates draft fields and converts money/media', () => {
    const request = {
      category: 'REHABILITATION',
      title: 'Сбор на лечение',
      description: 'Подробности сбора',
      amount_requested_kopeks: 125500,
      media_files: [
        {
          media_id: 'm1',
          url: 'https://cdn.test/file/photo.jpg',
          preview_url: 'https://cdn.test/file/photo_preview.jpg',
        },
        {
          media_id: 'm2',
          url: 'https://cdn.test/file/report.pdf',
          preview_url: null,
        },
      ],
    } as unknown as HelpRequestDetail;

    const draft = hydrateMaterialHelpRequestDraft(request, 'Реабилитация');

    expect(draft).toMatchObject({
      type: 'material',
      category: 'REHABILITATION',
      categoryLabel: 'Реабилитация',
      title: 'Сбор на лечение',
      description: 'Подробности сбора',
      amountRubles: 1255,
    });
    expect(draft.photos).toHaveLength(2);
    expect(draft.photos[0]).toMatchObject({ mediaId: 'm1', kind: 'image' });
    expect(draft.photos[1]).toMatchObject({ mediaId: 'm2', kind: 'document' });
  });

  it('falls back to category code as label', () => {
    const request = {
      category: 'OTHER',
      title: 'Title',
      description: 'Desc',
      financials: { requested_kopeks: 100000 },
      media_files: [],
    } as unknown as HelpRequestDetail;

    const draft = hydrateMaterialHelpRequestDraft(request);
    expect(draft.categoryLabel).toBe('OTHER');
    expect(draft.amountRubles).toBe(1000);
  });
});
