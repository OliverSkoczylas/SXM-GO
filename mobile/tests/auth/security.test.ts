// Security tests for Dev 1 auth module
// QA-011: Auth token handling and session security
// QA-012: Input validation and sanitization (XSS, injection vectors)
// QA-013: Privacy controls (consent, export, deletion)

// ── Mocks ──

const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignInWithIdToken = jest.fn();
const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockUpdateUser = jest.fn();
const mockResetPasswordForEmail = jest.fn();

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
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signInWithIdToken: mockSignInWithIdToken,
      signOut: mockSignOut,
      getSession: mockGetSession,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
    },
    from: jest.fn().mockReturnValue(chainMock),
    functions: { invoke: mockInvoke },
  }),
}));

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

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithEmail,
  restoreSession,
} from '../../src/auth/services/authService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { sanitizeText, sanitizeProfileUpdate } from '../../src/auth/utils/inputSanitizer';
import {
  emailSchema,
  passwordSchema,
  displayNameSchema,
  signUpSchema,
} from '../../src/auth/utils/validation';
import {
  logConsent,
  getConsentState,
  requestAccountDeletion,
  cancelAccountDeletion,
  exportUserData,
} from '../../src/auth/services/privacyService';

// ────────────────────────────────────────────────────────
// QA-011: Auth Token Handling & Session Security
// ────────────────────────────────────────────────────────

describe('QA-011: Auth Token & Session Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chainMock = createChainMock();
  });

  describe('session restoration', () => {
    it('returns null user/session when no stored session exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      const result = await restoreSession();
      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
    });

    it('returns error when session retrieval fails', async () => {
      const sessionError = { message: 'Refresh token expired' };
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: sessionError,
      });
      const result = await restoreSession();
      expect(result.error).toEqual(sessionError);
      expect(result.user).toBeNull();
    });
  });

  describe('Google OAuth error handling', () => {
    it('returns error when Google Play Services unavailable', async () => {
      (GoogleSignin.hasPlayServices as jest.Mock).mockRejectedValueOnce(
        new Error('Play Services not available'),
      );
      const result = await signInWithGoogle();
      expect(result.user).toBeNull();
      expect(result.error?.message).toContain('Play Services');
    });

    it('returns cancelled error when user cancels Google sign-in', async () => {
      (GoogleSignin.signIn as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('cancelled'), { code: 'SIGN_IN_CANCELLED' }),
      );
      const result = await signInWithGoogle();
      expect(result.error?.message).toBe('cancelled');
    });

    it('returns error when Google returns no ID token', async () => {
      (GoogleSignin.signIn as jest.Mock).mockResolvedValueOnce({
        data: { idToken: null },
      });
      const result = await signInWithGoogle();
      expect(result.user).toBeNull();
      expect(result.error?.message).toContain('No ID token');
    });

    it('returns error when Supabase rejects the Google ID token', async () => {
      (GoogleSignin.signIn as jest.Mock).mockResolvedValueOnce({
        data: { idToken: 'invalid-token' },
      });
      mockSignInWithIdToken.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid token' },
      });
      const result = await signInWithGoogle();
      expect(result.error?.message).toBe('Invalid token');
    });
  });

  describe('Facebook OAuth error handling', () => {
    it('returns cancelled when user cancels Facebook login', async () => {
      (LoginManager.logInWithPermissions as jest.Mock).mockResolvedValueOnce({
        isCancelled: true,
      });
      const result = await signInWithFacebook();
      expect(result.error?.message).toBe('cancelled');
    });

    it('returns error when Facebook returns no access token', async () => {
      (LoginManager.logInWithPermissions as jest.Mock).mockResolvedValueOnce({
        isCancelled: false,
      });
      (AccessToken.getCurrentAccessToken as jest.Mock).mockResolvedValueOnce(null);
      const result = await signInWithFacebook();
      expect(result.user).toBeNull();
      expect(result.error?.message).toContain('No access token');
    });

    it('returns error when Facebook SDK throws', async () => {
      (LoginManager.logInWithPermissions as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );
      const result = await signInWithFacebook();
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('email auth error handling', () => {
    it('returns error for invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });
      const result = await signInWithEmail('test@test.com', 'wrong');
      expect(result.error?.message).toContain('Invalid login');
    });
  });
});

// ────────────────────────────────────────────────────────
// QA-012: Input Validation & Sanitization
// ────────────────────────────────────────────────────────

describe('QA-012: Input Validation & Sanitization', () => {
  describe('XSS prevention via sanitizeText', () => {
    it('escapes script tags', () => {
      expect(sanitizeText('<script>alert(1)</script>')).not.toContain('<script>');
    });

    it('escapes event handler attributes', () => {
      expect(sanitizeText('<img onerror="alert(1)">')).not.toContain('<img');
    });

    it('escapes nested encoding attempts', () => {
      const input = '<scr<script>ipt>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<scr');
    });

    it('escapes JavaScript protocol URLs', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeText(input);
      // Forward slash is escaped
      expect(result).toContain('&#x2F;');
    });

    it('handles empty string', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('handles strings with only special characters', () => {
      const result = sanitizeText('&<>"\'/');
      expect(result).toBe('&amp;&lt;&gt;&quot;&#x27;&#x2F;');
    });
  });

  describe('sanitizeProfileUpdate prevents injection in profile fields', () => {
    it('sanitizes display_name with HTML', () => {
      const result = sanitizeProfileUpdate({
        display_name: '<marquee>Hacked</marquee>',
      });
      expect(result.display_name).not.toContain('<marquee>');
    });

    it('sanitizes bio with script injection', () => {
      const result = sanitizeProfileUpdate({
        bio: '"><img src=x onerror=alert(1)>',
      });
      expect(result.bio).not.toContain('<img');
      expect(result.bio).not.toContain('onerror');
    });

    it('does not modify boolean or numeric fields', () => {
      const result = sanitizeProfileUpdate({
        location_tracking_enabled: false,
        display_name: 'Normal Name',
      });
      expect(result.location_tracking_enabled).toBe(false);
      expect(result.display_name).toBe('Normal Name');
    });
  });

  describe('validation rejects malicious input', () => {
    it('rejects email with script tags', () => {
      expect(emailSchema.safeParse('<script>@evil.com').success).toBe(false);
    });

    it('rejects extremely long email (buffer overflow attempt)', () => {
      const longEmail = 'a'.repeat(1000) + '@test.com';
      expect(emailSchema.safeParse(longEmail).success).toBe(false);
    });

    it('rejects display name with HTML tags', () => {
      expect(displayNameSchema.safeParse('<b>Bold</b>').success).toBe(false);
    });

    it('rejects display name with angle brackets', () => {
      expect(displayNameSchema.safeParse('Test<>User').success).toBe(false);
    });

    it('rejects password under minimum length', () => {
      expect(passwordSchema.safeParse('Ab1!').success).toBe(false);
    });

    it('rejects password over maximum length', () => {
      const longPass = 'Aa1!' + 'x'.repeat(130);
      expect(passwordSchema.safeParse(longPass).success).toBe(false);
    });

    it('rejects signup without accepting terms', () => {
      const result = signUpSchema.safeParse({
        email: 'test@test.com',
        password: 'ValidPass1!',
        displayName: 'Test User',
        acceptTerms: false,
        acceptPrivacy: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects signup without accepting privacy policy', () => {
      const result = signUpSchema.safeParse({
        email: 'test@test.com',
        password: 'ValidPass1!',
        displayName: 'Test User',
        acceptTerms: true,
        acceptPrivacy: false,
      });
      expect(result.success).toBe(false);
    });

    it('rejects SQL-like injection in display name', () => {
      expect(
        displayNameSchema.safeParse("'; DROP TABLE users; --").success,
      ).toBe(false);
    });
  });
});

// ────────────────────────────────────────────────────────
// QA-013: Privacy Controls (GDPR/CCPA)
// ────────────────────────────────────────────────────────

describe('QA-013: Privacy Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chainMock = createChainMock();
  });

  describe('consent management', () => {
    it('logs consent with correct version', async () => {
      const result = await logConsent('user-123', 'location_tracking', true, '2.0');
      expect(result.error).toBeNull();
    });

    it('handles consent log failure gracefully', async () => {
      chainMock.insert.mockResolvedValueOnce({ error: { message: 'DB error' } });
      const result = await logConsent('user-123', 'analytics', true);
      expect(result.error).toBeDefined();
    });

    it('deduplicates consent state by taking most recent', async () => {
      chainMock.order.mockResolvedValueOnce({
        data: [
          { consent_type: 'marketing_emails', granted: false, created_at: '2026-02-01' },
          { consent_type: 'marketing_emails', granted: true, created_at: '2026-01-01' },
          { consent_type: 'analytics', granted: true, created_at: '2026-02-01' },
        ],
        error: null,
      });

      const result = await getConsentState('user-123');
      expect(result.data.marketing_emails).toBe(false); // Most recent
      expect(result.data.analytics).toBe(true);
    });

    it('returns empty state when no consent records exist', async () => {
      chainMock.order.mockResolvedValueOnce({ data: [], error: null });
      const result = await getConsentState('user-123');
      expect(result.data).toEqual({});
    });
  });

  describe('account deletion', () => {
    it('invokes delete-account with reason', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { scheduled: true }, error: null });
      const result = await requestAccountDeletion('Leaving the island');
      expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
        body: { reason: 'Leaving the island', immediate: false },
      });
      expect(result.error).toBeNull();
    });

    it('supports immediate deletion flag', async () => {
      mockInvoke.mockResolvedValueOnce({ data: {}, error: null });
      await requestAccountDeletion('CCPA request', true);
      expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
        body: { reason: 'CCPA request', immediate: true },
      });
    });

    it('handles deletion request failure', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Unauthorized' } });
      const result = await requestAccountDeletion();
      expect(result.error).toBeDefined();
    });

    it('cancels a pending deletion', async () => {
      chainMock.eq.mockReturnValueOnce({ error: null });
      const result = await cancelAccountDeletion('request-456');
      expect(result).toBeDefined();
    });
  });

  describe('data export (GDPR Article 15)', () => {
    it('invokes export-user-data edge function', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { profile: {}, check_ins: [], points: [] },
        error: null,
      });
      const result = await exportUserData();
      expect(mockInvoke).toHaveBeenCalledWith('export-user-data');
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('handles export failure', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Server error' } });
      const result = await exportUserData();
      expect(result.error).toBeDefined();
    });
  });
});
