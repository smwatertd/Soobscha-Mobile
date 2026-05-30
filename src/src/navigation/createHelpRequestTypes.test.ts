import { describe, expect, it } from 'vitest';
import { DraftPhoto, getDraftMediaIds } from './createHelpRequestTypes';

function photo(id: string, sortIndex: number, mediaId?: string): DraftPhoto {
  return {
    id,
    uri: `file://${id}`,
    fileName: `${id}.jpg`,
    contentType: 'image/jpeg',
    sortIndex,
    mediaId,
  };
}

describe('getDraftMediaIds', () => {
  it('returns media ids in sortIndex order regardless of array order', () => {
    const ids = getDraftMediaIds([
      photo('b', 1, 'uuid-b'),
      photo('a', 0, 'uuid-a'),
      photo('c', 2, 'uuid-c'),
    ]);

    expect(ids).toEqual(['uuid-a', 'uuid-b', 'uuid-c']);
  });

  it('skips photos without mediaId', () => {
    const ids = getDraftMediaIds([photo('a', 0, 'uuid-a'), photo('b', 1)]);
    expect(ids).toEqual(['uuid-a']);
  });
});
