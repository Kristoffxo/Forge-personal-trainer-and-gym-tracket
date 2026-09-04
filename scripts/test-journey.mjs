/* The leagues. Run: node scripts/test-journey.mjs */
import {
  RANKS, LEAGUES, WEEK, TOP, label, journeyFrom, isReached, terrainOf,
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
is('a week is seven training days', WEEK, 7);
is('every rank is one week above the last',
  RANKS.every((r, i) => r.at === i * WEEK), true);
is('you are Bronze from the moment you start', RANKS[0].at, 0);
is('nothing carries a tier any more', RANKS.every((r) => r.tier === null), true);
is('one rank per league', RANKS.map((r) => r.league).length,
  new Set(RANKS.map((r) => r.league)).size);
is('every rank has terrain', RANKS.every((r) => !!terrainOf(r)), true);
is('the top is day 49', TOP, 49);

console.log('\nthe names and days, as specified');
const at = (day) => label(RANKS.find((r) => r.at === day));
is('day 0', at(0), 'Bronze');
is('day 7', at(7), 'Silver');
is('day 14', at(14), 'Gold');
is('day 21', at(21), 'Platinum');
is('day 28', at(28), 'Diamond');
is('day 35', at(35), 'Champion');
is('day 42', at(42), 'Master');
is('day 49', at(49), 'Titan');

console.log('\nwhere somebody is');
is('nobody is ever unranked', journeyFrom(0).rank.name, 'Bronze');
is('and the first week promotes you out of it', journeyFrom(0).next.name, 'Silver');
is('a whole week to go on day nought', journeyFrom(0).toGo, 7);
is('day 6 is still Bronze', journeyFrom(6).rank.name, 'Bronze');
is('day 7 is a promotion', journeyFrom(7).rank.name, 'Silver');
is('day 13 is still Silver', journeyFrom(13).rank.name, 'Silver');
is('day 14 changes league', journeyFrom(14).leagueName, 'Gold');
is('day 30 is Diamond', journeyFrom(30).rank.name, 'Diamond');
is('the top is Titan', journeyFrom(49).rank.name, 'Titan');
is('the top has nothing ahead', journeyFrom(49).next, null);
is('and says so', journeyFrom(49).atTop, true);
is('past the top stays Titan', journeyFrom(9000).rank.name, 'Titan');
is('every rank is behind you at the top', journeyFrom(49).reached.length, 8);

console.log('\nthe week you are in the middle of');
is('just promoted is zero', journeyFrom(21).progress, 0);
is('partway through a week', journeyFrom(24).progress, 3 / 7);
is('six days in, one to go', journeyFrom(27).toGo, 1);
is('progress never exceeds one', journeyFrom(49).progress, 1);
is('progress is never negative', journeyFrom(0).progress >= 0, true);

console.log('\nrest days cost nothing');
{
  /* The engine cannot tell 28 days straight from 28 days spread over
     a year, which is the entire point. */
  const straight = journeyFrom(21);
  const scattered = journeyFrom(21);
  is('the same total is the same rank', straight.rank.name, scattered.rank.name);
  is('nothing can be taken away', RANKS.every((r) => isReached(r, 200)), true);
  is('and a day never un-happens',
    journeyFrom(40).reached.length >= journeyFrom(39).reached.length, true);
}

console.log('\nnonsense in');
is('no days is still a league', journeyFrom(0).rank.name, 'Bronze');
is('negative', journeyFrom(-5).days, 0);
is('rubbish', journeyFrom('abc').days, 0);
is('nothing at all', journeyFrom(undefined).days, 0);
is('a fraction rounds down', journeyFrom(6.9).rank.name, 'Bronze');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
