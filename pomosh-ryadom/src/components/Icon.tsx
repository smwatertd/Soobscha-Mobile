import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'heart'
  | 'handshake'
  | 'arrowR'
  | 'bell'
  | 'home'
  | 'list'
  | 'map'
  | 'user'
  | 'chevR'
  | 'clock'
  | 'info'
  | 'check'
  | 'document'
  | 'shield'
  | 'eye'
  | 'eyeOff'
  | 'flask'
  | 'arrowL'
  | 'search'
  | 'filter'
  | 'target'
  | 'close'
  | 'qr'
  | 'plus'
  | 'coin'
  | 'leaf'
  | 'wallet'
  | 'chevL'
  | 'pin'
  | 'edit'
  | 'calendar'
  | 'minus'
  | 'upload'
  | 'warn'
  | 'star'
  | 'camera'
  | 'settings'
  | 'logout'
  | 'lock'
  | 'flag'
  | 'chat'
  | 'image';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
};

export function Icon({
  name,
  size = 22,
  color = 'currentColor',
  strokeWidth = 1.7,
  fill = 'none',
}: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'heart':
      return (
        <Svg {...common}>
          <Path d="M12 20s-7-4.5-9-9.5C1.5 6.5 5 3 8 4.5c1.6.8 2.8 2 4 4 1.2-2 2.4-3.2 4-4 3-1.5 6.5 2 5 6-2 5-9 9.5-9 9.5z" />
        </Svg>
      );
    case 'handshake':
      return (
        <Svg {...common}>
          <Path d="M3 13l3-3 3 1 3-1 3 1 3-1 3 3-3 4-2.5-1L12 18l-3.5-2L6 17l-3-4z" />
          <Path d="M9 11l3 1 3-1" />
        </Svg>
      );
    case 'arrowR':
      return (
        <Svg {...common}>
          <Path d="M5 12h14M13 5l7 7-7 7" />
        </Svg>
      );
    case 'arrowL':
      return (
        <Svg {...common}>
          <Path d="M19 12H5M11 5l-7 7 7 7" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg {...common}>
          <Path d="M6 16V10a6 6 0 0112 0v6l1.5 2h-15L6 16zM10 21h4" />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...common}>
          <Path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z" />
        </Svg>
      );
    case 'list':
      return (
        <Svg {...common}>
          <Circle cx="5" cy="6" r="0.5" fill={color} stroke="none" />
          <Circle cx="5" cy="12" r="0.5" fill={color} stroke="none" />
          <Circle cx="5" cy="18" r="0.5" fill={color} stroke="none" />
          <Path d="M9 6h12M9 12h12M9 18h12" />
        </Svg>
      );
    case 'map':
      return (
        <Svg {...common}>
          <Path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
        </Svg>
      );
    case 'user':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </Svg>
      );
    case 'chevR':
      return (
        <Svg {...common}>
          <Path d="M9 5l7 7-7 7" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 11v6M12 8v.5" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path d="M5 12l5 5 9-11" />
        </Svg>
      );
    case 'document':
      return (
        <Svg {...common}>
          <Path d="M6 3h8l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
          <Path d="M14 3v4h4M8 13h8M8 17h6M8 9h3" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg {...common}>
          <Path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" />
          <Path d="M9 12l2 2 4-4" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg {...common}>
          <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
          <Circle cx="12" cy="12" r="3" />
        </Svg>
      );
    case 'eyeOff':
      return (
        <Svg {...common}>
          <Path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M6.4 6.4C4 8.1 2.5 10 2 12s4 7 10 7c1.8 0 3.5-.5 5-1.3M9.9 5.1A10.8 10.8 0 0112 5c6 0 10 7 10 7a18.2 18.2 0 01-4.1 5.2" />
        </Svg>
      );
    case 'flask':
      return (
        <Svg {...common}>
          <Path d="M9 3h6v6l5 9a4 4 0 01-3.5 6H7.5A4 4 0 014 18l5-9V3z" />
          <Path d="M9 3h6M9 9h6" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...common}>
          <Circle cx="11" cy="11" r="6.5" />
          <Path d="M16 16l4 4" />
        </Svg>
      );
    case 'filter':
      return (
        <Svg {...common}>
          <Path d="M4 5h16M7 12h10M10 19h4" />
        </Svg>
      );
    case 'target':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Circle cx="12" cy="12" r="5" />
          <Circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...common}>
          <Path d="M6 6l12 12M18 6L6 18" />
        </Svg>
      );
    case 'qr':
      return (
        <Svg {...common}>
          <Rect x="3" y="3" width="7" height="7" rx="1" />
          <Rect x="14" y="3" width="7" height="7" rx="1" />
          <Rect x="3" y="14" width="7" height="7" rx="1" />
          <Path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...common}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'coin':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v10M9 9.5h4.5a2 2 0 010 4H9" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg {...common}>
          <Path d="M11 20C6 16 4 10 5 4c6 1 11 5 14 11-5 1-9 3-8 5z" />
          <Path d="M5 4c3 3 6 7 7 11" />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg {...common}>
          <Path d="M3 7h18v10H3z" />
          <Path d="M3 7V6a2 2 0 012-2h14a2 2 0 012 2v1" />
          <Path d="M17 12h3" />
        </Svg>
      );
    case 'chevL':
      return (
        <Svg {...common}>
          <Path d="M15 6l-6 6 6 6" />
        </Svg>
      );
    case 'pin':
      return (
        <Svg {...common}>
          <Path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
          <Circle cx="12" cy="10" r="2.5" />
        </Svg>
      );
    case 'edit':
      return (
        <Svg {...common}>
          <Path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z" />
          <Path d="M13.5 6.5l3 3" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...common}>
          <Rect x="3" y="5" width="18" height="16" rx="2" />
          <Path d="M8 3v4M16 3v4M3 10h18" />
        </Svg>
      );
    case 'minus':
      return (
        <Svg {...common}>
          <Path d="M5 12h14" />
        </Svg>
      );
    case 'upload':
      return (
        <Svg {...common}>
          <Path d="M12 16V6M8 10l4-4 4 4" />
          <Path d="M4 18h16" />
        </Svg>
      );
    case 'warn':
      return (
        <Svg {...common}>
          <Path d="M12 3L2 21h20L12 3z" />
          <Path d="M12 10v5M12 18v.5" />
        </Svg>
      );
    case 'star':
      return (
        <Svg {...common}>
          <Path d="M12 2.5l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3l-6.2 3.5 1.6-6.8-5.2-4.6 6.9-.6L12 2.5z" />
        </Svg>
      );
    case 'camera':
      return (
        <Svg {...common}>
          <Path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
          <Circle cx="12" cy="13" r="4" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19 12c0 .5-.1 1-.2 1.5l2.1 1.6-2 3.5-2.4-1c-.8-.6-1.7-1-2.6-1.3l-.4-2.6h-4l-.4-2.6c-.9-.3-1.8-.7-2.6-1.3l-2.4 1-2-3.5 2.1-1.6c-.1-.5-.2-1-.2-1.5s.1-1 .2-1.5L1.1 8.9l2-3.5 2.4 1c.8-.6 1.7-1 2.6-1.3L8.5 2.5h4l.4 2.6c.9.3 1.8.7 2.6 1.3l2.4-1 2 3.5-2.1 1.6c.1.5.2 1 .2 1.5z" />
        </Svg>
      );
    case 'logout':
      return (
        <Svg {...common}>
          <Path d="M16 17l5-5-5-5M21 12H9M12 4H5a1 1 0 00-1 1v14a1 1 0 001 1h7" />
        </Svg>
      );
    case 'lock':
      return (
        <Svg {...common}>
          <Rect x="3" y="7" width="10" height="7" rx="1.5" />
          <Path d="M5 7V4.5a3 3 0 016 0V7" />
        </Svg>
      );
    case 'flag':
      return (
        <Svg {...common}>
          <Path d="M5 21V4h11l-2 4 2 4H5" />
        </Svg>
      );
    case 'chat':
      return (
        <Svg {...common}>
          <Path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 4v-4a1 1 0 01-1-1V6z" />
        </Svg>
      );
    case 'image':
      return (
        <Svg {...common}>
          <Rect x="3" y="5" width="18" height="14" rx="2" />
          <Circle cx="9" cy="11" r="2" />
          <Path d="M21 17l-5-5-3 3-2-2-4 4" />
        </Svg>
      );
    default:
      return null;
  }
}
