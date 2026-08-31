/* ---------------------------------------------------------------
   Muscle-group icons.

   Flat, bold silhouettes rather than anatomy drawings — they are
   rendered at 96 px on a phone and every fine line is lost at that
   size. Each is drawn once here, rendered to a transparent PNG by
   brand/render-muscles.mjs, and tinted by the screen that shows it.

   To use your own artwork instead: drop six transparent PNGs into
   assets/muscles/ named chest.png, back.png, shoulders.png,
   arms.png, legs.png, core.png. Nothing in the app changes.
   --------------------------------------------------------------- */

const W = 200;

/* Everything is drawn in one flat colour and tinted later, so the
   shapes have to read on their own without shading. */
export const MUSCLES = {
  /* Upper torso seen head-on, the two pecs picked out. */
  chest: `
    <path d="M60 46 Q100 30 140 46 L152 62 Q156 86 150 108
             Q146 132 138 150 L62 150 Q54 132 50 108
             Q44 86 48 62 Z" opacity="0.30"/>
    <path d="M98 64 Q78 56 64 64 Q54 72 56 88 Q58 104 74 108
             Q92 112 98 96 Z"/>
    <path d="M102 64 Q122 56 136 64 Q146 72 144 88 Q142 104 126 108
             Q108 112 102 96 Z"/>
    <path d="M76 122 L124 122 L120 150 L80 150 Z" opacity="0.45"/>
    <circle cx="100" cy="30" r="15" opacity="0.30"/>`,

  /* Back, with the lats spreading out from the waist. */
  back: `
    <circle cx="100" cy="32" r="16" opacity="0.30"/>
    <path d="M66 56 Q100 44 134 56 L142 74 L58 74 Z" opacity="0.30"/>
    <path d="M94 70 Q88 118 90 168 L110 168 Q112 118 106 70 Z" opacity="0.55"/>
    <path d="M90 72 Q58 78 44 104 Q34 126 46 146 Q62 164 86 156
             Q92 116 90 72 Z"/>
    <path d="M110 72 Q142 78 156 104 Q166 126 154 146 Q138 164 114 156
             Q108 116 110 72 Z"/>
    <path d="M84 158 L116 158 L112 178 L88 178 Z" opacity="0.4"/>`,

  /* Deltoid caps on a torso — the shoulders are the whole point. */
  shoulders: `
    <path d="M74 58 Q100 46 126 58 L132 96 Q134 128 128 152 L72 152
             Q66 128 68 96 Z" opacity="0.28"/>
    <path d="M72 58 Q40 58 30 84 Q22 106 36 120 Q56 130 70 112
             Q78 88 72 58 Z"/>
    <path d="M128 58 Q160 58 170 84 Q178 106 164 120 Q144 130 130 112
             Q122 88 128 58 Z"/>
    <circle cx="100" cy="34" r="16" opacity="0.30"/>`,

  /* A flexed arm. The one icon everybody reads instantly. */
  arms: `
    <path d="M154 100 Q168 106 166 124 Q164 142 146 144 L86 148
             Q66 148 62 132 Q58 114 76 110 Z" opacity="0.30"/>
    <path d="M74 140 Q60 138 58 118 L62 60 Q64 42 82 40
             Q100 38 102 58 L100 122 Q98 140 74 140 Z" opacity="0.30"/>
    <path d="M78 112 Q76 78 98 70 Q126 62 142 84 Q154 102 140 118
             Q118 134 94 128 Q80 124 78 112 Z"/>
    <circle cx="80" cy="40" r="20" opacity="0.55"/>
    <path d="M96 122 Q118 130 138 120 Q142 136 126 142
             Q104 148 92 138 Z" opacity="0.5"/>`,

  /* Two quads, front on. */
  legs: `
    <path d="M62 40 L138 40 L142 62 L58 62 Z" opacity="0.28"/>
    <path d="M66 66 Q62 104 70 136 Q76 162 86 172 L96 172
             Q98 140 96 108 Q94 82 90 66 Z"/>
    <path d="M134 66 Q138 104 130 136 Q124 162 114 172 L104 172
             Q102 140 104 108 Q106 82 110 66 Z"/>
    <path d="M84 174 L96 174 L94 186 L84 186 Z" opacity="0.5"/>
    <path d="M104 174 L116 174 L116 186 L106 186 Z" opacity="0.5"/>`,

  /* The abdominal grid. */
  core: `
    <path d="M62 42 Q100 30 138 42 L146 70 Q150 112 140 148
             Q134 166 124 174 L76 174 Q66 166 60 148
             Q50 112 54 70 Z" opacity="0.28"/>
    ${[0, 1, 2].map((row) => `
      <rect x="72" y="${62 + row * 30}" width="24" height="22" rx="7"/>
      <rect x="104" y="${62 + row * 30}" width="24" height="22" rx="7"/>`).join('')}
    <path d="M76 152 Q100 164 124 152 Q118 172 100 176 Q82 172 76 152 Z" opacity="0.7"/>`,
};

export function muscleSvg(key, colour = '#FFFFFF', size = 256) {
  const body = MUSCLES[key];
  if (!body) throw new Error('no muscle icon called ' + key);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}"
       width="${size}" height="${size}">
  <g fill="${colour}">${body}</g>
</svg>`;
}

export const MUSCLE_KEYS = Object.keys(MUSCLES);
