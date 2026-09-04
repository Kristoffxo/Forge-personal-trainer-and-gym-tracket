/* ---------------------------------------------------------------
   The journey, as leagues.

   You are in a league. Every fifty Reppo Score is a promotion. That
   is the whole rule, and it is the reason this replaced the old
   system: sixteen medals with names like "15 day silver" told you
   nothing about whether you were doing well, whereas "Bronze, twenty
   points from Silver" tells you exactly where you stand and exactly
   what the next thing is.

   It used to be counted in days trained. It is counted in Reppo
   Score now, which is the same climb with the rest of the app in it
   — a photo and a round of Compete move you up it too, and going
   quiet moves you back down. See src/score.js for what earns what.

   Eight leagues, fifty apart.

     Bronze     0
     Silver     50
     Gold       100
     Platinum   150
     Diamond    200
     Champion   250
     Master     300
     Titan      350

   Bronze is nought. Nobody is unranked: you are in a league from the
   moment you open the app, and the first fifty promote you out of it
   rather than into one. An empty state that says "you have no rank
   yet" is a worse first screen than one that says "Bronze, fifty
   points to Silver".
   --------------------------------------------------------------- */
import { LEAGUE_STEP } from './score.js';

/* One country, not four.

   The map used to climb through a meadow, a wood, red badlands and a
   snowfield, with the photograph changing under you twice on the way
   up. Four photographs is four moods and three seams, and the seams
   were the part people saw. One valley, top to bottom, is a place
   rather than a slideshow — and the leagues already say where you
   are without the ground having to say it too. */
export const TERRAIN = {
  valley: {
    name: 'The Valley',
    sky: ['#101A22', '#0B131A'],
    ground: ['#16241C', '#0A1210'],
    accent: '#7FB56B',
  },
};

/* What a promotion costs, re-exported so nothing has to know that
   the leagues and the score live in different files. */
export const STEP = LEAGUE_STEP;

/* The eight leagues, in order. Vivid rather than metallic — these
   sit on a dark photograph, where a muted bronze reads as brown mud
   and a muted silver disappears into fog. */
export const LEAGUES = [
  { key: 'bronze',   name: 'Bronze',   colour: '#FF8A2B', terrain: 'valley' },
  { key: 'silver',   name: 'Silver',   colour: '#D5DDE8', terrain: 'valley' },
  { key: 'gold',     name: 'Gold',     colour: '#FFC53D', terrain: 'valley' },
  { key: 'platinum', name: 'Platinum', colour: '#7DE2D1', terrain: 'valley' },
  { key: 'diamond',  name: 'Diamond',  colour: '#35DCF0', terrain: 'valley' },
  { key: 'champion', name: 'Champion', colour: '#B06CFF', terrain: 'valley' },
  { key: 'master',   name: 'Master',   colour: '#FF4D6D', terrain: 'valley' },
  { key: 'titan',    name: 'Titan',    colour: '#FFE066', terrain: 'valley' },
];

/* Every rank, built from the leagues rather than typed out, so the
   day counts cannot drift out of step with the names. */
export const RANKS = LEAGUES.map((lg, n) => ({
  n: n + 1,
  at: n * STEP,
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

/* Where somebody is, from their Reppo Score.

   Returns:
     score     what went in
     reached   the ranks behind them, in order
     rank      the one they are in now — always at least Bronze
     next      the one they are climbing towards, or null at the top
     toGo      points until it
     league    the league they are in now
     progress  0-1 through the current league, for the trail
     atTop     Titan

   `days` is still on the object under its old name. Half a dozen
   screens read it and the number means the same thing to them — how
   far up you are — so renaming it everywhere would be churn for a
   word.
*/
export function journeyFrom(score) {
  const d = Math.max(0, Math.floor(Number(score) || 0));

  const reached = RANKS.filter((r) => d >= r.at);
  const ahead = RANKS.filter((r) => d < r.at);
  const rank = reached.length ? reached[reached.length - 1] : null;
  const next = ahead[0] || null;
  const from = rank ? rank.at : 0;

  return {
    score: d,
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

export function isReached(rank, score) {
  return Number(score) >= rank.at;
}

export function terrainOf(rank) {
  return rank ? TERRAIN[rank.terrain] : null;
}
