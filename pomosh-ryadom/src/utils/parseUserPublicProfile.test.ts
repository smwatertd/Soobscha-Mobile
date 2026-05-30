import { describe, expect, it } from 'vitest';
import { parseUserPublicProfile } from './parseUserPublicProfile';

describe('parseUserPublicProfile', () => {
  it('parses beneficiary profile with contacts', () => {
    const profile = parseUserPublicProfile({
      user_id: 'uuid-1',
      role: 'BENEFICIARY',
      first_name: 'Нина',
      last_name: 'Кузнецова',
      age: 72,
      is_verified: true,
      base_category: 'ELDERLY',
      city: 'Подольск',
      contact_channels: [{ id: '1', type: 'telegram', value: '@nina' }],
      preferred_contact_channel_type: 'telegram',
    });

    expect(profile.fullName).toBe('Кузнецова Нина');
    expect(profile.baseCategory).toBe('ELDERLY');
    expect(profile.contactChannels).toHaveLength(1);
  });
});
