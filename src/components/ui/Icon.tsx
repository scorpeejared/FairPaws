import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'plus'
  | 'minus'
  | 'x'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'trash'
  | 'copy'
  | 'share'
  | 'sliders'
  | 'more'
  | 'users'
  | 'edit'
  | 'alert'
  | 'paw';

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

/** Feather-style 24px stroke icons, drawn inline so they match on iOS and Android. */
export function Icon({ name, size = 22, color, strokeWidth = 2 }: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {render(name, stroke, color)}
    </Svg>
  );
}

type StrokeProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: string;
};

function render(name: IconName, s: StrokeProps, color: string) {
  switch (name) {
    case 'plus':
      return <Path d="M12 5v14M5 12h14" {...s} />;
    case 'minus':
      return <Path d="M5 12h14" {...s} />;
    case 'x':
      return <Path d="M18 6L6 18M6 6l12 12" {...s} />;
    case 'check':
      return <Path d="M20 6L9 17l-5-5" {...s} />;
    case 'chevron-left':
      return <Path d="M15 18l-6-6 6-6" {...s} />;
    case 'chevron-right':
      return <Path d="M9 18l6-6-6-6" {...s} />;
    case 'chevron-down':
      return <Path d="M6 9l6 6 6-6" {...s} />;
    case 'trash':
      return (
        <>
          <Path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" {...s} />
          <Path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" {...s} />
        </>
      );
    case 'copy':
      return (
        <>
          <Rect x={9} y={9} width={13} height={13} rx={2} {...s} />
          <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" {...s} />
        </>
      );
    case 'share':
      return <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" {...s} />;
    case 'sliders':
      return <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" {...s} />;
    case 'more':
      return (
        <>
          <Circle cx={5} cy={12} r={1.4} fill={color} stroke={color} strokeWidth={1} />
          <Circle cx={12} cy={12} r={1.4} fill={color} stroke={color} strokeWidth={1} />
          <Circle cx={19} cy={12} r={1.4} fill={color} stroke={color} strokeWidth={1} />
        </>
      );
    case 'users':
      return (
        <>
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...s} />
          <Circle cx={9} cy={7} r={4} {...s} />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" {...s} />
        </>
      );
    case 'edit':
      return <Path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" {...s} />;
    case 'paw':
      return (
        <>
          <Circle cx={5} cy={10.5} r={2.3} fill={color} />
          <Circle cx={9.3} cy={6} r={2.5} fill={color} />
          <Circle cx={14.7} cy={6} r={2.5} fill={color} />
          <Circle cx={19} cy={10.5} r={2.3} fill={color} />
          <Path
            d="M12 11.5c-3.4 0-6 3-6 5.7 0 2.1 1.8 3.3 3.7 3.3.9 0 1.6-.4 2.3-.4s1.4.4 2.3.4c1.9 0 3.7-1.2 3.7-3.3 0-2.7-2.6-5.7-6-5.7z"
            fill={color}
          />
        </>
      );
    case 'alert':
      return (
        <>
          <Circle cx={12} cy={12} r={10} {...s} />
          <Path d="M12 8v4M12 16h.01" {...s} />
        </>
      );
  }
}
