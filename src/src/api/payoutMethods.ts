import { apiRequest } from './client';

export type PayoutMethod = {
  id: string;
  type: 'bank_card';
  display_name: string;
  is_default: boolean;
  created_at: string;
};

export async function listPayoutMethods(): Promise<PayoutMethod[]> {
  return apiRequest<PayoutMethod[]>('/api/payout-methods', { auth: true });
}
