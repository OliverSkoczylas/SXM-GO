module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./src/assets/fonts/'],
  dependencies: {
    // Disable Facebook SDK autolinking on Android until a real Facebook App ID
    // is configured.  The placeholder value causes a native crash on startup.
    // Re-enable this once FACEBOOK_APP_ID is set in .env with a valid ID.
    'react-native-fbsdk-next': {
      platforms: {
        android: null, // disabled – no Facebook App ID configured yet
      },
    },
  },
};
