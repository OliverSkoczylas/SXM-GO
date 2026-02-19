declare module 'react-native-config' {
  export interface NativeConfig {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    FACEBOOK_APP_ID?: string;
    APP_ENV?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
