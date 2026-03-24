import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function RestaurantIcon({ size = 24, color = '#4B5563' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <Path d="M6 1v3" />
      <Path d="M10 1v3" />
      <Path d="M14 1v3" />
    </Svg>
  );
}

export function BeachIcon({ size = 24, color = '#4B5563' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
      <Path d="M12 6a6 6 0 0 1 6 6" />
      <Path d="M12 18V6" />
    </Svg>
  );
}

export function CasinoIcon({ size = 24, color = '#4B5563' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" />
      <Circle cx="15.5" cy="15.5" r="1.5" />
    </Svg>
  );
}

export function ActivityIcon({ size = 24, color = '#4B5563' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}

export function ChallengeIcon({ name, size = 24, color = '#4B5563' }: { name: string; size?: number; color?: string }) {
  switch (name) {
    case 'restaurant-outline': return <RestaurantIcon size={size} color={color} />;
    case 'sunny-outline': return <BeachIcon size={size} color={color} />;
    case 'dice-outline': return <CasinoIcon size={size} color={color} />;
    case 'walk-outline': return <ActivityIcon size={size} color={color} />;
    default: return <ActivityIcon size={size} color={color} />;
  }
}
