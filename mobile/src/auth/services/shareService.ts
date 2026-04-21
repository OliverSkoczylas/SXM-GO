import { Share, Alert, Platform } from 'react-native';

/**
 * Service to handle basic social sharing across the app.
 * FR-101, FR-102: Social sharing of check-ins and badges.
 */
export const shareService = {
  /**
   * Share a successful check-in.
   */
  async shareCheckIn(locationName: string, points: number) {
    const message = `I just checked in at ${locationName} on SXM GO and earned ${points} points! 🏝️✨ #SXMGO #StMaarten`;
    return this._openShareSheet(message);
  },

  /**
   * Share an achievement/badge.
   */
  async shareBadge(badgeName: string) {
    const message = `I just unlocked the "${badgeName}" badge on SXM GO! 🏆 Exploring St. Maarten one gem at a time. #SXMGO #Achievement`;
    return this._openShareSheet(message);
  },

  /**
   * Share user profile/stats.
   */
  async shareProfile(displayName: string, points: number) {
    const message = `Check out my progress on SXM GO! I've earned ${points} points exploring St. Maarten. Join me! 🗺️📍`;
    return this._openShareSheet(message);
  },

  /**
   * Private helper to open the native share sheet.
   */
  async _openShareSheet(message: string) {
    try {
      const result = await Share.share({
        message,
        // On iOS, we can provide a URL for better formatting
        url: Platform.OS === 'ios' ? 'https://sxmgo.com' : undefined,
      });
      return result;
    } catch (error: any) {
      Alert.alert('Sharing Error', error.message);
    }
  },
};
