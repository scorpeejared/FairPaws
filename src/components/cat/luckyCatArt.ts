import { CAT } from './palette';

/**
 * The lucky cat, as SVG markup. This is the single source of truth: the app draws
 * it (LuckyCat.tsx) and `npm run brand` renders the icons and splash from the same
 * strings. Plain data with no React imports so Node can load it.
 *
 * The paw is its own layer so the app can swing it from the shoulder.
 */
export const LUCKY_CAT_VIEWBOX = { x: -15, y: 0, width: 270, height: 290 } as const;

/** Shoulder, in viewBox coordinates: the paw rotates around this point. */
export const LUCKY_CAT_PIVOT = { x: 190, y: 205 } as const;

const STROKE = `stroke="${CAT.ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;

const PAW = `
<g ${STROKE}>
  <g transform="rotate(18 214 150)">
    <ellipse cx="214" cy="150" rx="20" ry="58" fill="${CAT.fur}"/>
    <circle cx="214" cy="127" r="9.5" fill="${CAT.pink}" stroke="none"/>
    <circle cx="204.5" cy="108" r="3.6" fill="${CAT.pink}" stroke="none"/>
    <circle cx="214" cy="103.5" r="3.6" fill="${CAT.pink}" stroke="none"/>
    <circle cx="223.5" cy="108" r="3.6" fill="${CAT.pink}" stroke="none"/>
  </g>
</g>`;

const BODY = `
<ellipse cx="120" cy="282" rx="74" ry="7" fill="#000" opacity="0.1"/>
<g ${STROKE}>
  <path d="M58 281 C38 281 36 216 58 188 C78 164 162 164 182 188 C204 216 202 281 182 281 Z" fill="${CAT.fur}"/>
  <ellipse cx="120" cy="240" rx="30" ry="28" fill="${CAT.belly}" stroke="none"/>

  <ellipse cx="70" cy="216" rx="19" ry="28" fill="${CAT.fur}" transform="rotate(-8 70 216)"/>
  <ellipse cx="66" cy="238" rx="20" ry="25" fill="${CAT.gold}"/>
  <ellipse cx="66" cy="238" rx="12" ry="16.5" fill="none" stroke="${CAT.goldDark}" stroke-width="3"/>
  <rect x="62" y="232" width="8" height="12" rx="1.5" fill="none" stroke="${CAT.goldDark}" stroke-width="3"/>

  <path d="M50 94 C44 62 46 38 52 26 C74 34 94 48 104 62 Z" fill="${CAT.fur}"/>
  <path d="M190 94 C196 62 194 38 188 26 C166 34 146 48 136 62 Z" fill="${CAT.fur}"/>
  <path d="M60 82 C57 64 58 50 61 41 C73 47 84 55 91 64 Z" fill="${CAT.pink}" stroke="none"/>
  <path d="M180 82 C183 64 182 50 179 41 C167 47 156 55 149 64 Z" fill="${CAT.pink}" stroke="none"/>

  <ellipse cx="120" cy="112" rx="80" ry="64" fill="${CAT.fur}"/>
  <ellipse cx="80" cy="84" rx="24" ry="17" fill="${CAT.orange}" stroke="none" transform="rotate(-22 80 84)"/>
  <ellipse cx="168" cy="86" rx="12" ry="8.5" fill="${CAT.brown}" stroke="none" transform="rotate(25 168 86)"/>

  <path d="M86 114 Q96 101 106 114" fill="none" stroke-width="5"/>
  <path d="M134 114 Q144 101 154 114" fill="none" stroke-width="5"/>
  <ellipse cx="72" cy="131" rx="13" ry="8.5" fill="${CAT.blush}" opacity="0.75" stroke="none"/>
  <ellipse cx="168" cy="131" rx="13" ry="8.5" fill="${CAT.blush}" opacity="0.75" stroke="none"/>
  <ellipse cx="120" cy="125" rx="5.5" ry="4" fill="${CAT.nose}" stroke="none"/>
  <path d="M120 129 Q120 139 111 139 M120 129 Q120 139 129 139" fill="none" stroke-width="3.5"/>
  <path d="M42 118 L20 112 M42 128 L18 131 M198 118 L214 114 M198 128 L214 130" fill="none" stroke-width="3"/>

  <path d="M72 178 Q120 202 168 178" fill="none" stroke="${CAT.collar}" stroke-width="14"/>
  <circle cx="120" cy="197" r="10.5" fill="${CAT.gold}"/>
  <path d="M111 198 H129" fill="none" stroke-width="2.5"/>
  <circle cx="120" cy="204" r="1.8" fill="${CAT.ink}" stroke="none"/>
</g>`;

const { x, y, width, height } = LUCKY_CAT_VIEWBOX;

const document = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}">${inner}</svg>`;

/** Full SVG documents for the two layers, for SvgXml. */
export const LUCKY_CAT_PAW_SVG = document(PAW);
export const LUCKY_CAT_BODY_SVG = document(BODY);

/** The whole cat as one drawing (paw tucked behind the body). */
export const LUCKY_CAT_SVG = document(PAW + BODY);

/** Layers as bare markup, for composing onto other canvases (icons). */
export const LUCKY_CAT_MARKUP = PAW + BODY;
