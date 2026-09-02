/* ---------------------------------------------------------------
   The journey.

   Thirteen places on a map, reached by training. Not by training
   *in a row* — the streak is gone, and with it the idea that a rest
   day costs you something. What counts is the number of days you
   have trained in this app, ever. Three hundred and sixty of them
   gets you to the top whether that takes a year or three.

   That change is the whole point of this file. The old engine walked
   the calendar looking for unbroken runs and handed out medals for
   them, which meant a fortnight of flu could delete a month of work.
   This one counts days and never takes anything back.

   Each place is one day-count and one badge. Four of them are also
   levels, and the badge grade simply follows the level — bronze at
   the bottom, diamond only at the summit.
   --------------------------------------------------------------- */

/* Terrain, low to high. The map gets colder and cleaner as it goes
   up, and each band knows its own colours so the map screen does not
   have to hold a table of them. */
export const TERRAIN = {
  meadow: { name: 'The Meadow', sky: ['#1B2A16', '#243318'], ground: ['#2E4420', '#1A2712'], accent: '#7FB56B' },
  forest: { name: 'Deepwood', sky: ['#132A24', '#0E2620'], ground: ['#17382C', '#0D2119'], accent: '#4FB894' },
  ember:  { name: 'The Ashlands', sky: ['#2E1710', '#3A1A0E'], ground: ['#43200F', '#26120A'], accent: '#FF7A3C' },
  frost:  { name: 'The Frostpeak', sky: ['#101E33', '#0C1930'], ground: ['#152742', '#0B1526'], accent: '#6FD8E8' },
};

export const MEDAL_COLOUR = {
  bronze: '#C77B3C',
  silver: '#B9BCC4',
  gold: '#E3B23C',
  diamond: '#6FD8E8',
};

/* ---------------------------------------------------------------
   One badge per place, and the grade is simply how far up you are.

   It used to be four tiers crossed with four grades, which produced
   sixteen medals with names like "15 day silver" — a formula rather
   than a thing, and nobody could tell you whether that was better or
   worse than "30 day bronze". Now the grade is the stretch of the
   journey you are in: bronze at the bottom, then silver, then gold,
   and diamond only at the summit. One idea instead of two.

     Level 1   places 1-5     bronze
     Level 2   places 6-8     silver
     Level 3   places 9-12    gold
     Level 4   place 13       diamond
   --------------------------------------------------------------- */
export const MILESTONES = [
  { n: 1,  at: 7,   terrain: 'meadow', place: 'First Camp',   grade: 'bronze',  level: 1 },
  { n: 2,  at: 14,  terrain: 'meadow', place: 'The Crossing', grade: 'bronze' },
  { n: 3,  at: 15,  terrain: 'meadow', place: 'Old Mill',     grade: 'bronze' },
  { n: 4,  at: 21,  terrain: 'meadow', place: 'Riverbend',    grade: 'bronze' },
  { n: 5,  at: 28,  terrain: 'forest', place: 'The Falls',    grade: 'bronze' },
  { n: 6,  at: 30,  terrain: 'forest', place: 'Watchtower',   grade: 'silver',  level: 2 },
  { n: 7,  at: 45,  terrain: 'forest', place: 'Hollow Pass',  grade: 'silver' },
  { n: 8,  at: 60,  terrain: 'forest', place: 'Deepwood',     grade: 'silver' },
  { n: 9,  at: 90,  terrain: 'ember',  place: 'Emberfall',    grade: 'gold',    level: 3 },
  { n: 10, at: 120, terrain: 'ember',  place: 'The Forge',    grade: 'gold' },
  { n: 11, at: 180, terrain: 'frost',  place: 'Snowline',     grade: 'gold' },
  { n: 12, at: 270, terrain: 'frost',  place: 'The Spire',    grade: 'gold' },
  { n: 13, at: 360, terrain: 'frost',  place: 'The Summit',   grade: 'diamond', level: 4 },
];

export const TOP = MILESTONES[MILESTONES.length - 1].at;

/* "First Camp · Bronze" — a place and a grade, not a formula. */
export function label(m) {
  return `${m.place} · ${m.grade.charAt(0).toUpperCase()}${m.grade.slice(1)}`;
}

/* Where somebody is, from the number of days they have trained.

   Returns:
     days        what went in
     reached     the milestones behind them, in order
     ahead       the ones in front
     next        the very next one, or null at the top
     toGo        days until it
     level       1-4
     progress    0-1 between the last one and the next, for the path
     badges      one per place reached
*/
export function journeyFrom(days) {
  const d = Math.max(0, Math.floor(Number(days) || 0));

  const reached = MILESTONES.filter((m) => d >= m.at);
  const ahead = MILESTONES.filter((m) => d < m.at);
  const next = ahead[0] || null;
  const from = reached.length ? reached[reached.length - 1].at : 0;

  const level = reached.reduce((lv, m) => (m.level ? m.level : lv), 0);

  return {
    days: d,
    reached,
    ahead,
    next,
    toGo: next ? next.at - d : 0,
    level,
    progress: next ? (d - from) / (next.at - from) : 1,
    badges: reached.map((m) => ({ n: m.n, at: m.at, place: m.place, grade: m.grade })),
    atTop: !next,
  };
}

/* Has this milestone been reached? Used by the map to decide whether
   a place is lit or still dark. */
export function isReached(milestone, days) {
  return Number(days) >= milestone.at;
}

/* The band a milestone belongs to, with its colours. */
export function terrainOf(milestone) {
  return TERRAIN[milestone.terrain];
}
