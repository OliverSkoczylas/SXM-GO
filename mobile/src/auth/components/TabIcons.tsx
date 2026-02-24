import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface TabIconProps {
  color: string;
  size?: number;
}

export function MapTabIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"
        fill={color}
      />
      <Circle cx="12" cy="9" r="2.5" fill={color} />
    </Svg>
  );
}

export function LeaderboardTabIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 11V3H8v18h11V11h-3zm-6-6h4v14h-4V5zm11 16H3v-2h18v2z"
        fill={color}
      />
      <Path d="M4 19h3v-6H4v6z" fill={color} />
    </Svg>
  );
}

export function ChallengesTabIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"
        fill={color}
      />
    </Svg>
  );
}

export function ProfileTabIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
        fill={color}
      />
    </Svg>
  );
}
