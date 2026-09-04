/* ---------------------------------------------------------------
   The journey, as leagues.

   You are in a league. Every week you train, you go up one. That is
   the whole rule, and it is the reason this replaced the old system:
   sixteen medals with names like "15 day silver" told you nothing
   about whether you were doing well, whereas "Silver 2, one week
   from Silver 1" tells you exactly where you stand and exactly what
   the next thing is.

   A week here is seven days of training, not seven days on the
   calendar. The streak is gone and stays gone: rest days take
   nothing away, and a fortnight off costs you nothing but time.
   Seven training days is a promotion whether they take you a week
   or a month.

   Eight leagues, one week apart.

     Bronze     day 0
     Silver         7
     Gold          14
     Platinum      21
     Diamond       28
     Champion      35
     Master        42
     Titan         49

   There used to be three numbered tiers inside every league —
   Bronze 3, Bronze 2, Bronze 1 — which made twenty-two ranks and a
   name you had to parse before it meant anything. Eight names, one
   a week, is the same climb without the arithmetic.

   Bronze is day zero. Nobody is unranked: you are in a league from
   the moment you open the app, and the first week promotes you out
   of it rather than into one. An empty state that says "you have no
   rank yet" is a worse first screen than one that says "Bronze,
   seven days to Silver".
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

/* One week of training. Everything else counts in these. */
export const WEEK = 7;

/* The eight leagues, in order. Vivid rather than metallic — these
   sit on a dark photograph, where a muted bronze reads as brown mud
   and a muted silver disappears into fog. */
export const LEAGUES = [
  { key: 'bronze',   name: 'Bronze',   colour: '#FF8A2B', terrain: 'meadow' },
  { key: 'silver',   name: 'Silver',   colour: '#D5DDE8', terrain: 'meadow' },
  { key: 'gold',     name: 'Gold',     colour: '#FFC53D', terrain: 'forest' },
  { key: 'platinum', name: 'Platinum', colour: '#7DE2D1', terrain: 'forest' },
  { key: 'diamond',  name: 'Diamond',  colour: '#35DCF0', terrain: 'ember' },
  { key: 'champion', name: 'Champion', colour: '#B06CFF', terrain: 'ember' },
  { key: 'master',   name: 'Master',   colour: '#FF4D6D', terrain: 'frost' },
  { key: 'titan',    name: 'Titan',    colour: '#FFE066', terrain: 'frost' },
];

/* Every rank, built from the leagues rather than typed out, so the
   day counts cannot drift out of step with the names. */
export const RANKS = LEAGUES.map((lg, n) => ({
  n: n + 1,
  at: n * WEEK,
  league: lg.key,
  leagueName: lg.name,
  colour: lg.colour,
  terrain: lg.terrain,
  /* Kept so the map and the list do not have to know the tiers are
     gone. There is one rank per league now, so every one of them
     opens its own. */
  tier: null,
  name: lg.name,
  opensLeague: true,
}));

export const TOP = RANKS[RANKS.length - 1].at;

/* "Silver", or "Titan". */
export function label(rank) {
  return rank ? rank.name : '';
}

export function colourOf(rank) {
  return rank ? rank.colour : LEAGUES[0].colour;
}

/* Where somebody is, from the number of days they have trained.

   Returns:
     days      what went in
     reached   the ranks behind them, in order
     rank      the one they are in now, or null before the first week
     next      the one they are climbing towards, or null at the top
     toGo      training days until it
     league    the league they are in now
     progress  0-1 through the current week, for the trail
     atTop     Titan
*/
export function journeyFrom(days) {
  const d = Math.max(0, Math.floor(Number(days) || 0));

  const reached = RANKS.filter((r) => d >= r.at);
  const ahead = RANKS.filter((r) => d < r.at);
  const rank = reached.length ? reached[reached.length - 1] : null;
  const next = ahead[0] || null;
  const from = rank ? rank.at : 0;

  return {
    days: d,
    reached,
    ahead,
    rank,
    next,
    toGo: next ? next.at - d : 0,
    league: rank ? rank.league : null,
    leagueName: rank ? rank.leagueName : null,
    progress: next ? (d - from) / (next.at - from) : 1,
    atTop: !next,
  };
}

export function isReached(rank, days) {
  return Number(days) >= rank.at;
}

export function terrainOf(rank) {
  return rank ? TERRAIN[rank.terrain] : null;
}
