// Onboarding illustration icons
// Converted from sxmgo_onboarding_icons.html
// UX-001/UX-002: Visual illustrations for each onboarding screen

import React from 'react';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  ClipPath,
  Circle,
  Ellipse,
  Path,
  Rect,
  G,
  Line,
  Text as SvgText,
} from 'react-native-svg';

// Unique gradient/clip IDs per icon to avoid conflicts when rendered simultaneously.

export function WelcomeIcon({ size = 200 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <RadialGradient id="w_bg" cx="50%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#00C9B1" />
          <Stop offset="100%" stopColor="#005F8A" />
        </RadialGradient>
        <RadialGradient id="w_glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#00FFD9" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#00FFD9" stopOpacity="0" />
        </RadialGradient>
        <ClipPath id="w_clip">
          <Circle cx="80" cy="80" r="76" />
        </ClipPath>
      </Defs>

      <Circle cx="80" cy="80" r="76" fill="url(#w_bg)" />
      <Circle cx="80" cy="80" r="76" fill="url(#w_glow)" />

      {/* Ocean waves */}
      <Ellipse cx="80" cy="140" rx="76" ry="38" fill="#003D5C" opacity="0.6" clipPath="url(#w_clip)" />
      <Path d="M4 118 Q20 108 36 118 Q52 128 68 118 Q84 108 100 118 Q116 128 132 118 Q148 108 156 114 L156 160 L4 160 Z" fill="#004F73" opacity="0.7" clipPath="url(#w_clip)" />
      <Path d="M4 126 Q22 116 40 126 Q58 136 76 126 Q94 116 112 126 Q130 136 156 122 L156 160 L4 160 Z" fill="#006088" opacity="0.5" clipPath="url(#w_clip)" />

      {/* Island */}
      <Ellipse cx="80" cy="128" rx="28" ry="8" fill="#2DB87A" clipPath="url(#w_clip)" />

      {/* Palm tree trunk */}
      <Path d="M80 128 Q77 115 74 105 Q72 98 76 94" stroke="#1A7A4A" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Palm leaves */}
      <Path d="M76 94 Q60 85 54 74" stroke="#3DCE8A" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M76 94 Q68 80 68 68" stroke="#3DCE8A" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M76 94 Q78 78 84 70" stroke="#3DCE8A" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="M76 94 Q88 84 96 78" stroke="#3DCE8A" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Coconuts */}
      <Circle cx="74" cy="95" r="3" fill="#8B5E3C" />
      <Circle cx="78" cy="93" r="3" fill="#8B5E3C" />

      {/* Sun */}
      <Circle cx="112" cy="50" r="14" fill="#FFD84D" opacity="0.95" />
      <Circle cx="112" cy="50" r="18" fill="#FFD84D" opacity="0.15" />
      <G stroke="#FFD84D" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        <Line x1="112" y1="28" x2="112" y2="23" />
        <Line x1="112" y1="72" x2="112" y2="77" />
        <Line x1="90" y1="50" x2="85" y2="50" />
        <Line x1="134" y1="50" x2="139" y2="50" />
        <Line x1="96" y1="34" x2="93" y2="31" />
        <Line x1="128" y1="34" x2="131" y2="31" />
        <Line x1="96" y1="66" x2="93" y2="69" />
        <Line x1="128" y1="66" x2="131" y2="69" />
      </G>

      {/* GO badge */}
      <Rect x="30" y="50" width="36" height="18" rx="9" fill="#FF6B35" opacity="0.95" />
      <SvgText x="48" y="63" fontFamily="sans-serif" fontWeight="800" fontSize="10" fill="white" textAnchor="middle" letterSpacing="1">GO</SvgText>

      {/* Border rings */}
      <Circle cx="80" cy="80" r="74" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
      <Circle cx="80" cy="80" r="76" stroke="rgba(0,201,177,0.3)" strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

export function PointsIcon({ size = 200 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <RadialGradient id="p_bg" cx="40%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#FF8C42" />
          <Stop offset="100%" stopColor="#C0213E" />
        </RadialGradient>
        <RadialGradient id="p_glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFE566" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#FFE566" stopOpacity="0" />
        </RadialGradient>
        <ClipPath id="p_clip">
          <Circle cx="80" cy="80" r="76" />
        </ClipPath>
      </Defs>

      <Circle cx="80" cy="80" r="76" fill="url(#p_bg)" />
      <Circle cx="80" cy="80" r="76" fill="url(#p_glow)" />

      {/* Decorative dots */}
      <G opacity="0.12" fill="white">
        <Circle cx="20" cy="20" r="2" /><Circle cx="40" cy="15" r="1.5" />
        <Circle cx="130" cy="25" r="2" /><Circle cx="145" cy="45" r="1.5" />
        <Circle cx="15" cy="100" r="1.5" /><Circle cx="148" cy="110" r="2" />
        <Circle cx="25" cy="140" r="1.5" /><Circle cx="140" cy="145" r="1.5" />
      </G>

      {/* Badge shape */}
      <Path d="M80 22 L102 34 L102 58 L116 66 L116 94 L102 102 L102 126 L80 138 L58 126 L58 102 L44 94 L44 66 L58 58 L58 34 Z" fill="rgba(255,255,255,0.08)" clipPath="url(#p_clip)" />

      {/* Medal ribbon */}
      <Path d="M70 42 L80 30 L90 42 L90 60 L80 56 L70 60 Z" fill="#FF4D6A" />
      <Path d="M70 42 L64 36 L80 30 L96 36 L90 42 Z" fill="#D63050" />

      {/* Medal circle */}
      <Circle cx="80" cy="82" r="32" fill="#FFD84D" opacity="0.95" />
      <Circle cx="80" cy="82" r="28" fill="#FFC820" />
      <Circle cx="80" cy="82" r="24" fill="#FFD84D" />

      {/* Star */}
      <Path d="M80 62 L83.5 73 L95 73 L85.8 79.5 L89.2 90.5 L80 84 L70.8 90.5 L74.2 79.5 L65 73 L76.5 73 Z" fill="#B87800" />
      <Path d="M80 64 L83 74 L93 74 L85 79.5 L88 89 L80 83.5 L72 89 L75 79.5 L67 74 L77 74 Z" fill="#FFF0A0" />

      {/* Sparkles */}
      <G fill="#FFE566" opacity="0.9">
        <Path d="M32 55 L33.5 60 L38 60 L34.5 62.5 L36 67.5 L32 65 L28 67.5 L29.5 62.5 L26 60 L30.5 60 Z" transform="scale(0.8) translate(8, 10)" />
        <Path d="M120 38 L121.5 43 L126 43 L122.5 45.5 L124 50.5 L120 48 L116 50.5 L117.5 45.5 L114 43 L118.5 43 Z" transform="scale(0.7) translate(50, 12)" />
        <Circle cx="38" cy="100" r="2.5" />
        <Circle cx="124" cy="96" r="2" />
        <Circle cx="42" cy="62" r="1.5" />
        <Circle cx="120" cy="55" r="1.5" />
      </G>

      {/* +50 PTS label */}
      <Rect x="55" y="120" width="50" height="16" rx="8" fill="rgba(0,0,0,0.3)" />
      <SvgText x="80" y="131.5" fontFamily="sans-serif" fontWeight="800" fontSize="8.5" fill="#FFE566" textAnchor="middle" letterSpacing="0.5">+50 PTS</SvgText>

      <Circle cx="80" cy="80" r="74" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
      <Circle cx="80" cy="80" r="76" stroke="rgba(255,140,66,0.4)" strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

export function LocationIcon({ size = 200 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Defs>
        <RadialGradient id="l_bg" cx="50%" cy="40%" r="65%">
          <Stop offset="0%" stopColor="#6C63FF" />
          <Stop offset="100%" stopColor="#2A1F6B" />
        </RadialGradient>
        <RadialGradient id="l_glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#A89BFF" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#A89BFF" stopOpacity="0" />
        </RadialGradient>
        <ClipPath id="l_clip">
          <Circle cx="80" cy="80" r="76" />
        </ClipPath>
      </Defs>

      <Circle cx="80" cy="80" r="76" fill="url(#l_bg)" />

      {/* Grid lines */}
      <G stroke="rgba(255,255,255,0.07)" strokeWidth="1" clipPath="url(#l_clip)">
        <Line x1="4" y1="50" x2="156" y2="50" />
        <Line x1="4" y1="80" x2="156" y2="80" />
        <Line x1="4" y1="110" x2="156" y2="110" />
        <Line x1="50" y1="4" x2="50" y2="156" />
        <Line x1="80" y1="4" x2="80" y2="156" />
        <Line x1="110" y1="4" x2="110" y2="156" />
      </G>

      {/* Map terrain */}
      <Path d="M30 85 Q45 70 65 78 Q80 84 90 72 Q105 58 118 65 Q130 72 128 88 Q126 100 110 108 Q90 118 72 112 Q50 106 35 98 Z" fill="rgba(72,200,120,0.2)" clipPath="url(#l_clip)" />

      {/* Pulse rings */}
      <Circle cx="80" cy="78" r="44" stroke="#A89BFF" strokeWidth="1.5" fill="none" opacity="0.25" />
      <Circle cx="80" cy="78" r="32" stroke="#A89BFF" strokeWidth="1.5" fill="none" opacity="0.4" />
      <Circle cx="80" cy="78" r="20" stroke="#A89BFF" strokeWidth="2" fill="none" opacity="0.6" />

      {/* Center glow */}
      <Circle cx="80" cy="78" r="20" fill="url(#l_glow)" />

      {/* Location pin */}
      <Path d="M80 48 C68 48 58 58 58 70 C58 84 80 106 80 106 C80 106 102 84 102 70 C102 58 92 48 80 48 Z" fill="#48C878" />
      <Path d="M80 50 C69 50 60 59 60 70 C60 83.5 80 103 80 103 C80 103 100 83.5 100 70 C100 59 91 50 80 50 Z" fill="#5EE48E" />
      <Circle cx="80" cy="70" r="10" fill="white" opacity="0.95" />
      <Circle cx="80" cy="70" r="5" fill="#2A8B50" />

      {/* Crosshair */}
      <G stroke="rgba(168,155,255,0.5)" strokeWidth="1" strokeDasharray="3 4">
        <Line x1="80" y1="4" x2="80" y2="44" />
        <Line x1="80" y1="106" x2="80" y2="156" />
        <Line x1="4" y1="78" x2="54" y2="78" />
        <Line x1="106" y1="78" x2="156" y2="78" />
      </G>

      {/* GPS label */}
      <Rect x="52" y="118" width="56" height="16" rx="8" fill="rgba(72,200,120,0.25)" stroke="rgba(72,200,120,0.5)" strokeWidth="1" />
      <SvgText x="80" y="129.5" fontFamily="sans-serif" fontWeight="800" fontSize="8" fill="#48C878" textAnchor="middle" letterSpacing="1">GPS ACTIVE</SvgText>

      <Circle cx="80" cy="80" r="74" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
      <Circle cx="80" cy="80" r="76" stroke="rgba(108,99,255,0.4)" strokeWidth="1.5" fill="none" />
    </Svg>
  );
}
