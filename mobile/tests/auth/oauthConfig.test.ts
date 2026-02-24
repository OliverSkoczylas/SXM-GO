// Tests for OAuth provider initialization (FR-001)

jest.mock('react-native-config', () => ({
  GOOGLE_WEB_CLIENT_ID: 'test-web-client-id.apps.googleusercontent.com',
}));

const mockConfigure = jest.fn();
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: mockConfigure,
  },
}));

import { initializeOAuthProviders } from '../../src/auth/services/oauthConfig';

describe('oauthConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures Google Sign-In with web client ID', () => {
    // Reset the module to clear the initialized flag
    jest.resetModules();
    const { initializeOAuthProviders: init } = require('../../src/auth/services/oauthConfig');
    init();

    expect(mockConfigure).toHaveBeenCalledWith({
      webClientId: 'test-web-client-id.apps.googleusercontent.com',
      offlineAccess: false,
    });
  });

  it('only initializes once (idempotent)', () => {
    jest.resetModules();
    const { initializeOAuthProviders: init } = require('../../src/auth/services/oauthConfig');
    init();
    init();
    init();

    expect(mockConfigure).toHaveBeenCalledTimes(1);
  });
});
