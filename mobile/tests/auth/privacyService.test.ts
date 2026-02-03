const createChainMock = () => {
  const chain: any = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.insert = jest.fn().mockResolvedValue({ error: null });
  chain.update = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockResolvedValue({ data: [], error: null });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  return chain;
};

let chainMock = createChainMock();
const mockInvoke = jest.fn();

jest.mock('../../src/auth/services/supabaseClient', () => ({
  getSupabaseClient: () => ({
    from: jest.fn().mockReturnValue(chainMock),
    functions: { invoke: mockInvoke },
  }),
}));

import {
  logConsent,
  getConsentState,
  requestAccountDeletion,
  cancelAccountDeletion,
  exportUserData,
} from '../../src/auth/services/privacyService';

describe('privacyService', () => {
  beforeEach(() => {
    chainMock = createChainMock();
    jest.clearAllMocks();
  });

  describe('logConsent', () => {
    it('inserts a consent record', async () => {
      const result = await logConsent('user-123', 'terms_of_service', true);
      expect(result.error).toBeNull();
    });
  });

  describe('getConsentState', () => {
    it('returns deduplicated consent state', async () => {
      chainMock.order.mockResolvedValue({
        data: [
          { consent_type: 'terms_of_service', granted: true, created_at: '2026-01-02' },
          { consent_type: 'terms_of_service', granted: false, created_at: '2026-01-01' },
          { consent_type: 'location_tracking', granted: false, created_at: '2026-01-02' },
        ],
        error: null,
      });

      const result = await getConsentState('user-123');
      // Should take the most recent (first) record per type
      expect(result.data.terms_of_service).toBe(true);
      expect(result.data.location_tracking).toBe(false);
    });
  });

  describe('requestAccountDeletion', () => {
    it('invokes delete-account edge function', async () => {
      mockInvoke.mockResolvedValue({ data: { message: 'Scheduled' }, error: null });

      const result = await requestAccountDeletion('No longer visiting');
      expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
        body: { reason: 'No longer visiting', immediate: false },
      });
      expect(result.error).toBeNull();
    });
  });

  describe('cancelAccountDeletion', () => {
    it('updates request status to cancelled', async () => {
      chainMock.eq.mockReturnValue({ error: null });

      const result = await cancelAccountDeletion('request-123');
      expect(result).toBeDefined();
    });
  });

  describe('exportUserData', () => {
    it('invokes export-user-data edge function', async () => {
      mockInvoke.mockResolvedValue({ data: { user_id: '123' }, error: null });

      const result = await exportUserData();
      expect(mockInvoke).toHaveBeenCalledWith('export-user-data');
      expect(result.data).toBeDefined();
    });
  });
});
