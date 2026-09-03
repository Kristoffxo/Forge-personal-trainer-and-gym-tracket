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
is('seven leagues of three, then Titan alone', RANKS.length, 22);
is('a week is seven training days', WEEK, 7);
is('every rank is one week above the last',
  RANKS.every((r, i) => r.at === i * WEEK), true);
is('you are Bronze 3 from the moment you start', RANKS[0].at, 0);
is('tiers count down inside a league',
  RANKS.filter((r) => r.league === 'silver').map((r) => r.tier), [3, 2, 1]);
is('Titan has no tier', RANKS[21].tier, null);
is('every rank has terrain', RANKS.every((r) => !!terrainOf(r)), true);
is('the top is day 147', TOP, 147);

console.log('\nthe names and days, as specified');
const at = (day) => label(RANKS.find((r) => r.at === day));
is('day 0', at(0), 'Bronze 3');
is('day 7', at(7), 'Bronze 2');
is('day 14', at(14), 'Bronze 1');
is('day 21', at(21), 'Silver 3');
is('day 28', at(28), 'Silver 2');
is('day 35', at(35), 'Silver 1');
is('day 42', at(42), 'Gold 3');
is('day 56', at(56), 'Gold 1');
is('day 63', at(63), 'Platinum 3');
is('day 77', at(77), 'Platinum 1');
is('day 84', at(84), 'Diamond 3');
is('day 98', at(98), 'Diamond 1');
is('day 105', at(105), 'Champion 3');
is('day 119', at(119), 'Champion 1');
is('day 126', at(126), 'Master 3');
is('day 140', at(140), 'Master 1');
is('day 147', at(147), 'Titan');

console.log('\nwhere somebody is');
is('nobody is ever unranked', journeyFrom(0).rank.name, 'Bronze 3');
is('and the first week promotes you out of it', journeyFrom(0).next.name, 'Bronze 2');
is('a whole week to go on day nought', journeyFrom(0).toGo, 7);
is('day 6 is still Bronze 3', journeyFrom(6).rank.name, 'Bronze 3');
is('day 7 is a promotion', journeyFrom(7).rank.name, 'Bronze 2');
is('day 20 is still Bronze 1', journeyFrom(20).rank.name, 'Bronze 1');
is('day 21 changes league', journeyFrom(21).leagueName, 'Silver');
is('day 90 is Diamond 3', journeyFrom(90).rank.name, 'Diamond 3');
is('the top is Titan', journeyFrom(147).rank.name, 'Titan');
is('the top has nothing ahead', journeyFrom(147).next, null);
is('and says so', journeyFrom(147).atTop, true);
is('past the top stays Titan', journeyFrom(9000).rank.name, 'Titan');
is('every rank is behind you at the top', journeyFrom(147).reached.length, 22);

console.log('\nthe week you are in the middle of');
is('just promoted is zero', journeyFrom(21).progress, 0);
is('partway through a week', journeyFrom(24).progress, 3 / 7);
is('six days in, one to go', journeyFrom(27).toGo, 1);
is('progress never exceeds one', journeyFrom(147).progress, 1);
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
    journeyFrom(100).reached.length >= journeyFrom(99).reached.length, true);
}

console.log('\nnonsense in');
is('no days is still a league', journeyFrom(0).rank.name, 'Bronze 3');
is('negative', journeyFrom(-5).days, 0);
is('rubbish', journeyFrom('abc').days, 0);
is('nothing at all', journeyFrom(undefined).days, 0);
is('a fraction rounds down', journeyFrom(6.9).rank.name, 'Bronze 3');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
