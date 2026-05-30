import { describe, expect, it } from 'vitest';
import { hasMaterialDraftContent, hasSocialDraftContent } from './createHelpRequestDraftUtils';

describe('createHelpRequestDraftUtils', () => {
  it('detects empty social draft', () => {
    expect(hasSocialDraftContent({} as any)).toBe(false);
  });

  it('detects meaningful social changes', () => {
    expect(hasSocialDraftContent({ title: 'Помочь по дому' } as any)).toBe(true);
    expect(hasSocialDraftContent({ minVolunteers: 2 } as any)).toBe(true);
  });

  it('detects meaningful material changes', () => {
    expect(hasMaterialDraftContent({} as any)).toBe(false);
    expect(hasMaterialDraftContent({ amountRubles: 1000 } as any)).toBe(true);
    expect(hasMaterialDraftContent({ photos: [{ id: '1' }] } as any)).toBe(true);
  });
});
