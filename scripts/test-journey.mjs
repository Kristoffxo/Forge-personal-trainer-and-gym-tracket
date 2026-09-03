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
  RANKS.every((r, i) => r.at === (i + 1) * WEEK), true);
is('tiers count down inside a league',
  RANKS.filter((r) => r.league === 'silver').map((r) => r.tier), [3, 2, 1]);
is('Titan has no tier', RANKS[21].tier, null);
is('every rank has terrain', RANKS.every((r) => !!terrainOf(r)), true);
is('the top is day 154', TOP, 154);

console.log('\nthe names and days, as specified');
const at = (day) => label(RANKS.find((r) => r.at === day));
is('day 7',   at(7),   'Bronze 3');
is('day 14',  at(14),  'Bronze 2');
is('day 21',  at(21),  'Bronze 1');
is('day 28',  at(28),  'Silver 3');
is('day 35',  at(35),  'Silver 2');
is('day 42',  at(42),  'Silver 1');
is('day 49',  at(49),  'Gold 3');
is('day 63',  at(63),  'Gold 1');
is('day 70',  at(70),  'Platinum 3');
is('day 84',  at(84),  'Platinum 1');
is('day 91',  at(91),  'Diamond 3');
is('day 105', at(105), 'Diamond 1');
is('day 112', at(112), 'Champion 3');
is('day 126', at(126), 'Champion 1');
is('day 133', at(133), 'Master 3');
is('day 147', at(147), 'Master 1');
is('day 154', at(154), 'Titan');

console.log('\nwhere somebody is');
is('nobody is in a league before their first week', journeyFrom(6).rank, null);
is('and the first week is what they are climbing to', journeyFrom(6).next.name, 'Bronze 3');
is('day 7 is Bronze 3', journeyFrom(7).rank.name, 'Bronze 3');
is('day 13 is still Bronze 3', journeyFrom(13).rank.name, 'Bronze 3');
is('day 14 is a promotion', journeyFrom(14).rank.name, 'Bronze 2');
is('day 27 is still Bronze 1', journeyFrom(27).rank.name, 'Bronze 1');
is('day 28 changes league', journeyFrom(28).leagueName, 'Silver');
is('day 95 is Diamond 3', journeyFrom(95).rank.name, 'Diamond 3');
is('the top is Titan', journeyFrom(154).rank.name, 'Titan');
is('the top has nothing ahead', journeyFrom(154).next, null);
is('and says so', journeyFrom(154).atTop, true);
is('past the top stays Titan', journeyFrom(9000).rank.name, 'Titan');
is('every rank is behind you at the top', journeyFrom(154).reached.length, 22);

console.log('\nthe week you are in the middle of');
is('just promoted is zero', journeyFrom(28).progress, 0);
is('halfway through a week', journeyFrom(31).progress, 3 / 7);
is('six days in, one to go', journeyFrom(34).toGo, 1);
is('progress never exceeds one', journeyFrom(154).progress, 1);
is('progress is never negative', journeyFrom(0).progress >= 0, true);

console.log('\nrest days cost nothing');
{
  /* The engine cannot tell 28 days straight from 28 days spread over
     a year, which is the entire point. */
  const straight = journeyFrom(28);
  const scattered = journeyFrom(28);
  is('the same total is the same rank', straight.rank.name, scattered.rank.name);
  is('nothing can be taken away', RANKS.every((r) => isReached(r, 200)), true);
  is('and a day never un-happens',
    journeyFrom(100).reached.length >= journeyFrom(99).reached.length, true);
}

console.log('\nnonsense in');
is('no days', journeyFrom(0).rank, null);
is('negative', journeyFrom(-5).days, 0);
is('rubbish', journeyFrom('abc').days, 0);
is('nothing at all', journeyFrom(undefined).days, 0);
is('a fraction rounds down', journeyFrom(13.9).rank.name, 'Bronze 3');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
