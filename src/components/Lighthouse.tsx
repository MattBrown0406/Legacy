import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { palette } from '@/theme';

interface Props {
  size?: number;
  tower?: string;
  accent?: string;
  showBeam?: boolean;
}

/**
 * Simple Legacy lighthouse mark. Recreated as a clean geometric SVG so it
 * renders identically on iOS and web.
 */
export function Lighthouse({
  size = 64,
  tower = palette.ivory,
  accent = palette.gold,
  showBeam = true,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {showBeam && (
        <>
          <Polygon points="50,26 14,40 50,34" fill={accent} opacity={0.35} />
          <Polygon points="50,26 86,40 50,34" fill={accent} opacity={0.35} />
        </>
      )}
      {/* lantern room */}
      <Rect x="42" y="20" width="16" height="12" rx="2" fill={accent} />
      <Polygon points="40,20 60,20 50,10" fill={accent} />
      <Circle cx="50" cy="9" r="2.2" fill={tower} />
      {/* gallery */}
      <Rect x="39" y="32" width="22" height="4" rx="1.5" fill={tower} />
      {/* tapered tower */}
      <Path d="M41 36 L59 36 L65 86 L35 86 Z" fill={tower} />
      {/* stripes */}
      <Path d="M42.4 48 L57.6 48 L58.6 56 L41.4 56 Z" fill={accent} opacity={0.9} />
      <Path d="M39.6 70 L60.4 70 L61.4 78 L38.6 78 Z" fill={accent} opacity={0.9} />
      {/* door */}
      <Path d="M46 86 L46 78 Q50 74 54 78 L54 86 Z" fill={accent} />
      {/* base */}
      <Rect x="31" y="86" width="38" height="6" rx="2" fill={tower} />
      <Line x1="31" y1="92" x2="69" y2="92" stroke={accent} strokeWidth={2} opacity={0.5} />
    </Svg>
  );
}
