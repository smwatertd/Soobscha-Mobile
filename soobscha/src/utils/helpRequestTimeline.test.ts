import { describe, expect, it } from 'vitest';
import { buildHelpRequestTimeline } from './helpRequestTimeline';

describe('buildHelpRequestTimeline', () => {
  it('builds rework timeline with terminal warning step', () => {
    const request = {
      type: 'SOCIAL',
      status: 'RETURNED_TO_REWORK',
      created_at: '2026-05-20T10:00:00.000Z',
    } as any;
    const history = [{ returned_at: '2026-05-22T12:00:00.000Z' }] as any[];

    const timeline = buildHelpRequestTimeline(request, history);
    expect(timeline).toHaveLength(2);
    expect(timeline[1]).toMatchObject({
      id: 'rework',
      current: true,
      tone: 'warning',
      terminal: true,
    });
  });

  it('builds social timeline with current start step for WAITING_START', () => {
    const request = {
      type: 'SOCIAL',
      status: 'WAITING_START',
      created_at: '2026-05-20T10:00:00.000Z',
      start_at: '2026-06-01T10:00:00.000Z',
      participants: { joined: 2 },
    } as any;

    const timeline = buildHelpRequestTimeline(request, []);
    const current = timeline.find((item) => item.current);
    expect(current?.id).toBe('start');
  });

  it('builds material timeline and marks last step current for COMPLETED', () => {
    const request = {
      type: 'MATERIAL',
      status: 'COMPLETED',
      created_at: '2026-05-20T10:00:00.000Z',
    } as any;
    const timeline = buildHelpRequestTimeline(request, []);
    expect(timeline.at(-1)?.terminal).toBe(true);
    expect(timeline.at(-1)?.done).toBe(true);
  });
});
