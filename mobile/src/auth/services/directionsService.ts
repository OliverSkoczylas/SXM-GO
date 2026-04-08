// Directions service
// FR-023: Provide directions to selected locations
// Opens the device's native maps app with turn-by-turn navigation.

import { Platform, Linking, Alert } from 'react-native';

export async function openDirections(
  destinationLat: number,
  destinationLng: number,
  destinationName?: string,
): Promise<void> {
  const label = encodeURIComponent(destinationName || 'Destination');

  // Try platform-native maps first, fall back to Google Maps web
  const urls = Platform.select({
    ios: [
      `maps:0,0?q=${label}&ll=${destinationLat},${destinationLng}&dirflg=d`,
      `https://maps.apple.com/?q=${label}&ll=${destinationLat},${destinationLng}&dirflg=d`,
    ],
    android: [
      `google.navigation:q=${destinationLat},${destinationLng}`,
      `geo:${destinationLat},${destinationLng}?q=${destinationLat},${destinationLng}(${label})`,
    ],
    default: [] as string[],
  }) as string[];

  // Add universal fallback
  urls.push(
    `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`,
  );

  for (const url of urls) {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }
  }

  Alert.alert('No Maps App', 'Unable to open a maps application for directions.');
}
