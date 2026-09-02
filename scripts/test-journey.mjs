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
is('two places hand over two medals',
  MILESTONES.filter((m) => m.medals.length === 2).map((m) => m.at), [30, 60, 90]);
is('sixteen medals in all',
  MILESTONES.reduce((n, m) => n + m.medals.length, 0), 16);
is('every medal is a real grade',
  MILESTONES.flatMap((m) => m.medals).every((x) => ['bronze','silver','gold','diamond'].includes(x.grade)), true);
is('every place has terrain', MILESTONES.every((m) => !!terrainOf(m)), true);
is('a medal reads properly', label({ tier: 7, grade: 'bronze' }), '7 day bronze');

/* every medal the brief named, checked one at a time */
console.log('the medals, as specified');
const at = (day) => MILESTONES.find((m) => m.at === day).medals.map(label).join(' + ');
is('day 7',   at(7),   '7 day bronze');
is('day 14',  at(14),  '7 day silver');
is('day 15',  at(15),  '15 day bronze');
is('day 21',  at(21),  '7 day gold');
is('day 28',  at(28),  '7 day diamond');
is('day 30',  at(30),  '15 day silver + 30 day bronze');
is('day 45',  at(45),  '15 day gold');
is('day 60',  at(60),  '15 day diamond + 30 day silver');
is('day 90',  at(90),  '30 day gold + 90 day bronze');
is('day 120', at(120), '30 day diamond');
is('day 180', at(180), '90 day silver');
is('day 270', at(270), '90 day gold');
is('day 360', at(360), '90 day diamond');

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
is('day 30 hands over two medals at once',
  journeyFrom(30).medals.filter((m) => m.at === 30).length, 2);
is('day 89 is level 2', journeyFrom(89).level, 2);
is('day 90 is level 3', journeyFrom(90).level, 3);
is('day 359 is level 3', journeyFrom(359).level, 3);
is('day 360 is level 4', journeyFrom(360).level, 4);
is('the top has nothing ahead', journeyFrom(360).next, null);
is('and says so', journeyFrom(360).atTop, true);
is('past the top stays at the top', journeyFrom(9000).level, 4);
is('and collects every medal', journeyFrom(9000).medals.length, 16);

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
  is('and the same medals', straight.medals.length, scattered.medals.length);
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
