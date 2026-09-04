/* The leagues. Run: node scripts/test-journey.mjs */
import {
  RANKS, LEAGUES, STEP, TOP, label, journeyFrom, isReached, terrainOf,
} from '../src/journey.js';

let pass = 0; let fail = 0;
const is = (what, got, want) => {
  const a = JSON.stringify(got); const b = JSON.stringify(want);
  if (a === b) { pass += 1; return; }
  fail += 1;
  console.log(`  FAIL ${what}\n    got  ${a}\n    want ${b}`);
};

console.log('the ladder');
is('eight leagues', LEAGUES.map((l) => l.name),
  ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Master', 'Titan']);
is('one rank per league, no tiers', RANKS.length, 8);
is('a league is fifty Reppo Score', STEP, 50);
is('every rank is one league above the last',
  RANKS.every((r, i) => r.at === i * STEP), true);
is('you are Bronze from the moment you start', RANKS[0].at, 0);
is('nothing carries a tier any more', RANKS.every((r) => r.tier === null), true);
is('one rank per league', RANKS.map((r) => r.league).length,
  new Set(RANKS.map((r) => r.league)).size);
is('every rank has terrain', RANKS.every((r) => !!terrainOf(r)), true);
is('the top is 350 points', TOP, 350);

console.log('\nthe names and days, as specified');
const at = (points) => label(RANKS.find((r) => r.at === points));
is('0 points', at(0), 'Bronze');
is('50', at(50), 'Silver');
is('100', at(100), 'Gold');
is('150', at(150), 'Platinum');
is('200', at(200), 'Diamond');
is('250', at(250), 'Champion');
is('300', at(300), 'Master');
is('350', at(350), 'Titan');

console.log('\nwhere somebody is');
is('nobody is ever unranked', journeyFrom(0).rank.name, 'Bronze');
is('and the first fifty promote you out of it', journeyFrom(0).next.name, 'Silver');
is('a whole league to go at nought', journeyFrom(0).toGo, 50);
is('49 is still Bronze', journeyFrom(49).rank.name, 'Bronze');
is('50 is a promotion', journeyFrom(50).rank.name, 'Silver');
is('99 is still Silver', journeyFrom(99).rank.name, 'Silver');
is('100 changes league', journeyFrom(100).leagueName, 'Gold');
is('210 is Diamond', journeyFrom(210).rank.name, 'Diamond');
is('the top is Titan', journeyFrom(350).rank.name, 'Titan');
is('the top has nothing ahead', journeyFrom(350).next, null);
is('and says so', journeyFrom(350).atTop, true);
is('past the top stays Titan', journeyFrom(9000).rank.name, 'Titan');
is('every rank is behind you at the top', journeyFrom(350).reached.length, 8);

console.log('\nthe league you are in the middle of');
is('just promoted is zero', journeyFrom(150).progress, 0);
is('partway through a league', journeyFrom(160).progress, 10 / 50);
is('one point to go', journeyFrom(149).toGo, 1);
is('progress never exceeds one', journeyFrom(350).progress, 1);
is('progress is never negative', journeyFrom(0).progress >= 0, true);

console.log('\nthe ladder only cares about the number');
{
  /* Where the points came from is score.js's business. Fifty is
     fifty whether it was ten workouts or five and some photos. */
  is('the same total is the same rank',
    journeyFrom(120).rank.name, journeyFrom(120).rank.name);
  is('everything is behind you at the top',
    RANKS.every((r) => isReached(r, 350)), true);
  is('and a point never un-happens',
    journeyFrom(120).reached.length >= journeyFrom(119).reached.length, true);

  /* Unlike days trained, a score can fall — that is the point of the
     idle penalty — so going down a league has to work too. */
  is('losing points can cost you a league', journeyFrom(49).rank.name, 'Bronze');
}

console.log('\nnonsense in');
is('no points is still a league', journeyFrom(0).rank.name, 'Bronze');
is('negative', journeyFrom(-5).score, 0);
is('rubbish', journeyFrom('abc').score, 0);
is('nothing at all', journeyFrom(undefined).score, 0);
is('a fraction rounds down', journeyFrom(49.9).rank.name, 'Bronze');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
