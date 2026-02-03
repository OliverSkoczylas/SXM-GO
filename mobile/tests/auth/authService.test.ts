// Mock Supabase client
const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignInWithIdToken = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock('../../src/auth/services/supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signInWithIdToken: mockSignInWithIdToken,
      signOut: mockSignOut,
      getSession: mockGetSession,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
    },
  }),
}));

// Mock native OAuth modules
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
  },
}));
jest.mock('@invertase/react-native-apple-authentication', () => ({
  appleAuth: {
    performRequest: jest.fn(),
    Operation: { LOGIN: 0 },
    Scope: { EMAIL: 0, FULL_NAME: 1 },
  },
}));
jest.mock('react-native-fbsdk-next', () => ({
  LoginManager: { logInWithPermissions: jest.fn() },
  AccessToken: { getCurrentAccessToken: jest.fn() },
}));

import {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  restoreSession,
  resetPassword,
  updatePassword,
} from '../../src/auth/services/authService';

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUpWithEmail', () => {
    it('calls supabase signUp with correct params', async () => {
      const mockUser = { id: '123', email: 'test@test.com' };
      const mockSession = { access_token: 'token' };
      mockSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await signUpWithEmail('test@test.com', 'Pass123!', 'Test User');

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'Pass123!',
        options: { data: { full_name: 'Test User' } },
      });
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const mockError = { message: 'Email already registered' };
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await signUpWithEmail('test@test.com', 'Pass123!', 'Test');
      expect(result.error).toEqual(mockError);
      expect(result.user).toBeNull();
    });
  });

  describe('signInWithEmail', () => {
    it('calls supabase signInWithPassword', async () => {
      const mockUser = { id: '123' };
      const mockSession = { access_token: 'token' };
      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await signInWithEmail('test@test.com', 'Pass123!');

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'Pass123!',
      });
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('signOut', () => {
    it('calls supabase signOut', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      const result = await signOut();
      expect(mockSignOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('returns existing session', async () => {
      const mockUser = { id: '123' };
      const mockSession = { user: mockUser, access_token: 'token' };
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await restoreSession();
      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockUser);
    });

    it('returns null when no session exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await restoreSession();
      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('calls resetPasswordForEmail', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const result = await resetPassword('test@test.com');
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@test.com');
      expect(result.error).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('calls updateUser with new password', async () => {
      mockUpdateUser.mockResolvedValue({ error: null });
      const result = await updatePassword('NewPass1!');
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPass1!' });
      expect(result.error).toBeNull();
    });
  });
});
