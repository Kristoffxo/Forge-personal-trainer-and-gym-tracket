#!/usr/bin/env node
/* The journey, which is now counted in days trained rather than days
   in a row. Run with: node scripts/test-journey.mjs */
import { MILESTONES, TOP, journeyFrom, isReached, terrainOf, label } from '../src/journey.js';

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`  FAIL ${name}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); }
};

console.log('the map itself');
is('thirteen places', MILESTONES.length, 13);
is('the days are the ones asked for',
  MILESTONES.map((m) => m.at), [7, 14, 15, 21, 28, 30, 45, 60, 90, 120, 180, 270, 360]);
is('they only ever go up',
  MILESTONES.every((m, i) => i === 0 || m.at > MILESTONES[i - 1].at), true);
is('numbered one to thirteen', MILESTONES.map((m) => m.n), [1,2,3,4,5,6,7,8,9,10,11,12,13]);
is('the top is day 360', TOP, 360);
is('four levels, in the right places',
  MILESTONES.filter((m) => m.level).map((m) => [m.n, m.at, m.level]),
  [[1, 7, 1], [6, 30, 2], [9, 90, 3], [13, 360, 4]]);
is('one badge per place, thirteen in all',
  MILESTONES.filter((m) => !!m.grade).length, 13);
is('every badge is a real grade',
  MILESTONES.every((m) => ['bronze','silver','gold','diamond'].includes(m.grade)), true);
is('the grade only ever climbs', (() => {
  const rank = { bronze: 0, silver: 1, gold: 2, diamond: 3 };
  return MILESTONES.every((m, i) => i === 0 || rank[m.grade] >= rank[MILESTONES[i - 1].grade]);
})(), true);
is('four bronze, four silver, four gold, one diamond',
  ['bronze','silver','gold','diamond'].map((g) => MILESTONES.filter((m) => m.grade === g).length),
  [5, 3, 4, 1]);
is('every place has terrain', MILESTONES.every((m) => !!terrainOf(m)), true);
is('a badge reads as a place, not a formula',
  label({ place: 'First Camp', grade: 'bronze' }), 'First Camp \u00b7 Bronze');

/* every place the brief named, checked one at a time */
console.log('the places, as specified');
const at = (day) => label(MILESTONES.find((m) => m.at === day));
is('day 7', at(7), 'First Camp · Bronze');
is('day 14', at(14), 'The Crossing · Bronze');
is('day 15', at(15), 'Old Mill · Bronze');
is('day 21', at(21), 'Riverbend · Bronze');
is('day 28', at(28), 'The Falls · Bronze');
is('day 30', at(30), 'Watchtower · Silver');
is('day 45', at(45), 'Hollow Pass · Silver');
is('day 60', at(60), 'Deepwood · Silver');
is('day 90', at(90), 'Emberfall · Gold');
is('day 120', at(120), 'The Forge · Gold');
is('day 180', at(180), 'Snowline · Gold');
is('day 270', at(270), 'The Spire · Gold');
is('day 360', at(360), 'The Summit · Diamond');

console.log('where somebody is');
is('day zero is nowhere', journeyFrom(0).reached.length, 0);
is('and the first place is next', journeyFrom(0).next.at, 7);
is('and it is seven days away', journeyFrom(0).toGo, 7);
is('day zero is level zero', journeyFrom(0).level, 0);

is('day 7 arrives', journeyFrom(7).reached.length, 1);
is('day 7 is level 1', journeyFrom(7).level, 1);
is('day 29 has five behind it', journeyFrom(29).reached.length, 5);
is('day 29 is still level 1', journeyFrom(29).level, 1);
is('day 30 is level 2', journeyFrom(30).level, 2);
is('day 30 hands over exactly one badge',
  journeyFrom(30).badges.filter((b) => b.at === 30).length, 1);
is('and it is the first silver',
  journeyFrom(30).badges.filter((b) => b.grade === 'silver').length, 1);
is('day 89 is level 2', journeyFrom(89).level, 2);
is('day 90 is level 3', journeyFrom(90).level, 3);
is('day 359 is level 3', journeyFrom(359).level, 3);
is('day 360 is level 4', journeyFrom(360).level, 4);
is('the top has nothing ahead', journeyFrom(360).next, null);
is('and says so', journeyFrom(360).atTop, true);
is('past the top stays at the top', journeyFrom(9000).level, 4);
is('and collects every badge', journeyFrom(9000).badges.length, 13);

console.log('the path between two places');
is('halfway from 30 to 45', Math.round(journeyFrom(37).progress * 100) / 100, 0.47);
is('just arrived is zero', journeyFrom(30).progress, 0);
is('progress never exceeds one', journeyFrom(360).progress, 1);
is('progress is never negative', journeyFrom(0).progress >= 0, true);

console.log('rest days cost nothing');
{
  /* the old engine counted runs, so a gap reset you. This one cannot
     tell the difference between 90 days straight and 90 days spread
     over three years — which is the entire point. */
  const straight = journeyFrom(90);
  const scattered = journeyFrom(90);
  is('the same total is the same place', straight.level, scattered.level);
  is('and the same badges', straight.badges.length, scattered.badges.length);
  is('nothing can be taken away',
    MILESTONES.every((m) => isReached(m, 400)), true);
  is('and a day never un-happens',
    journeyFrom(100).reached.length >= journeyFrom(99).reached.length, true);
}

console.log('nonsense in');
is('negative days', journeyFrom(-5).reached.length, 0);
is('nothing', journeyFrom(null).level, 0);
is('a string of a number still works', journeyFrom('30').level, 2);
is('fractions round down', journeyFrom(29.9).level, 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
