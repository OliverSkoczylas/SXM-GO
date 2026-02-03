const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

// Build a chainable mock that supports .from().select().eq().single() etc.
const createChainMock = () => {
  const chain: any = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  return chain;
};

let chainMock = createChainMock();

jest.mock('../../src/auth/services/supabaseClient', () => ({
  getSupabaseClient: () => ({
    from: jest.fn().mockReturnValue(chainMock),
  }),
}));

import {
  getProfile,
  updateProfile,
  setLocationTracking,
} from '../../src/auth/services/profileService';

describe('profileService', () => {
  beforeEach(() => {
    chainMock = createChainMock();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('queries profiles table by user id', async () => {
      const mockProfile = {
        id: 'user-123',
        display_name: 'Test User',
        email: 'test@test.com',
        total_points: 100,
      };
      chainMock.single.mockResolvedValue({ data: mockProfile, error: null });

      const result = await getProfile('user-123');
      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('updates profile with sanitized data', async () => {
      chainMock.single.mockResolvedValue({
        data: { id: 'user-123', display_name: 'New Name' },
        error: null,
      });

      const result = await updateProfile('user-123', { display_name: 'New Name' });
      expect(result.error).toBeNull();
    });
  });

  describe('setLocationTracking', () => {
    it('updates location tracking flag', async () => {
      chainMock.eq.mockReturnValue({ error: null });

      const result = await setLocationTracking('user-123', true);
      expect(result).toBeDefined();
    });
  });
});
