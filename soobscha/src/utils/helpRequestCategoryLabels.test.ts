import { describe, expect, it } from 'vitest';
import { mergeHelpRequestCategoryOptions } from './helpRequestCategoryLabels';

describe('mergeHelpRequestCategoryOptions', () => {
  it('deduplicates category codes shared between social and material lists', () => {
    const merged = mergeHelpRequestCategoryOptions(
      [
        { code: 'CLEANING', label: 'Уборка' },
        { code: 'OTHER', label: 'Другое (соц)' },
      ],
      [
        { code: 'TREATMENT', label: 'Лечение' },
        { code: 'OTHER', label: 'Другое (мат)' },
      ],
    );

    expect(merged).toHaveLength(3);
    expect(merged.filter((item) => item.code === 'OTHER')).toHaveLength(1);
    expect(merged.find((item) => item.code === 'OTHER')?.label).toBe('Другое (соц)');
  });
});
