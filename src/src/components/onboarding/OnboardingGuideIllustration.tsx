import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { OnboardingGuideIllustrationVariant } from '../../constants/beneficiaryOnboardingSlides';
import { T } from '../../theme/tokens';

type Props = {
  variant: OnboardingGuideIllustrationVariant;
  color: string;
  bg: string;
};

const W = 260;
const H = 220;

export function OnboardingGuideIllustration({ variant, color, bg }: Props) {
  if (variant === 'welcome') {
    return (
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <Circle cx="130" cy="110" r="100" fill={bg} />
        <Circle cx="190" cy="60" r="30" fill={color} opacity={0.12} />
        <Path
          d="M130 170c-32-20-58-44-58-78 0-16 12-28 28-28 12 0 22 6 30 18 8-12 18-18 30-18 16 0 28 12 28 28 0 34-26 58-58 78z"
          fill={color}
        />
        <Path
          d="M64 152c-8 4-14 12-14 22 0 6 4 10 10 10h140c6 0 10-4 10-10 0-10-6-18-14-22"
          stroke={T.ink}
          strokeWidth={2.5}
          fill="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (variant === 'request') {
    return (
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <Circle cx="130" cy="110" r="100" fill={bg} />
        <Rect x="70" y="40" width="120" height="150" rx="12" fill="#fff" stroke={T.ink} strokeWidth={2.5} />
        <Rect x="84" y="62" width="60" height="8" rx="4" fill={color} />
        <Rect x="84" y="80" width="92" height="6" rx="3" fill={T.border} />
        <Rect x="84" y="92" width="78" height="6" rx="3" fill={T.border} />
        <Rect x="84" y="108" width="92" height="50" rx="8" fill={color} opacity={0.2} />
        <Circle cx="100" cy="128" r="6" fill={color} />
        <Path d="M86 158l16-14 12 8 18-18 28 26" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
        <Circle cx="180" cy="50" r="20" fill={T.success} />
        <Path d="M171 50l6 6 12-12" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (variant === 'money') {
    return (
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <Circle cx="130" cy="110" r="100" fill={bg} />
        <Path
          d="M130 30l50 18v40c0 32-22 58-50 64-28-6-50-32-50-64V48l50-18z"
          fill="#fff"
          stroke={T.ink}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <Circle cx="130" cy="108" r="32" fill={color} />
        <SvgText x="130" y="118" textAnchor="middle" fontSize="32" fontWeight="800" fill="#fff">
          ₽
        </SvgText>
        <Path d="M118 54l8 8 18-18" stroke={T.success} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <Circle cx="130" cy="110" r="100" fill={bg} />
      <Rect x="50" y="60" width="120" height="100" rx="10" fill="#fff" stroke={T.ink} strokeWidth={2.5} />
      <Rect x="50" y="60" width="120" height="22" rx="10" fill={color} />
      <Rect x="50" y="76" width="120" height="6" fill={color} />
      <Circle cx="68" cy="55" r="3" fill={T.ink} />
      <Circle cx="152" cy="55" r="3" fill={T.ink} />
      <Line x1="68" y1="50" x2="68" y2="64" stroke={T.ink} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1="152" y1="50" x2="152" y2="64" stroke={T.ink} strokeWidth={2.5} strokeLinecap="round" />
      <SvgText x="110" y="130" textAnchor="middle" fontSize="36" fontWeight="800" fill={T.ink}>
        24
      </SvgText>
      <Circle cx="190" cy="118" r="22" fill={T.primary} stroke="#fff" strokeWidth={3} />
      <Circle cx="212" cy="138" r="22" fill={T.accent} stroke="#fff" strokeWidth={3} />
      <Circle cx="194" cy="158" r="22" fill={color} stroke="#fff" strokeWidth={3} />
    </Svg>
  );
}
