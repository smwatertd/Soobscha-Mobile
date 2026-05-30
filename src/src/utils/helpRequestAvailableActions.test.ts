import { describe, expect, it } from 'vitest';
import { hasHeaderEditAction, mapAvailableActions } from './helpRequestAvailableActions';

describe('mapAvailableActions', () => {
  it('deduplicates aliases and maps destructive actions', () => {
    const actions = mapAvailableActions(
      ['update_material_help_request', 'edit', 'INTERRUPT', 'cancel_help_request'],
      true,
    );

    expect(actions.map((item) => item.id)).toEqual(['update', 'interrupt', 'cancel']);
    expect(actions[1]).toMatchObject({
      label: 'Прервать сбор',
      kind: 'ghost',
      destructive: true,
    });
    expect(actions[2]).toMatchObject({
      label: 'Отменить заявку',
      labelColor: '#C75653',
      destructive: true,
    });
  });

  it('keeps unknown actions in humanized form', () => {
    const actions = mapAvailableActions(['something_custom-action'], false);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      id: 'unknown',
      label: 'Something Custom Action',
    });
  });
});

describe('hasHeaderEditAction', () => {
  it('returns true when update action is present', () => {
    expect(hasHeaderEditAction(['UPDATE_SOCIAL_HELP_REQUEST'])).toBe(true);
    expect(hasHeaderEditAction(['cancel'])).toBe(false);
  });
});
