import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { alertMock, canOpenURLMock, openURLMock } = vi.hoisted(() => ({
  alertMock: vi.fn(),
  canOpenURLMock: vi.fn(),
  openURLMock: vi.fn(),
}));

vi.mock('react-native', () => ({
  Alert: { alert: alertMock },
  Linking: {
    canOpenURL: canOpenURLMock,
    openURL: openURLMock,
  },
  Platform: { OS: 'android' },
}));

import { openMapRoute } from './mapNavigation';

describe('openMapRoute', () => {
  beforeEach(() => {
    canOpenURLMock.mockReset();
    openURLMock.mockReset();
    alertMock.mockReset();
    canOpenURLMock.mockResolvedValue(false);
    openURLMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens Yandex Maps web URL when native schemes are unavailable', async () => {
    const ok = await openMapRoute({ latitude: 55.75, longitude: 37.62 });

    expect(ok).toBe(true);
    expect(openURLMock).toHaveBeenCalledWith(
      'https://yandex.ru/maps/?rtext=~55.75,37.62&rtt=auto',
    );
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('prefers Yandex Maps app when canOpenURL succeeds', async () => {
    canOpenURLMock.mockImplementation(async (url: string) => url.startsWith('yandexmaps://'));

    const ok = await openMapRoute({ latitude: 55.75, longitude: 37.62 });

    expect(ok).toBe(true);
    expect(openURLMock).toHaveBeenCalledWith(
      'yandexmaps://maps.yandex.ru/?rtext=~55.75,37.62&rtt=auto',
    );
  });
});
