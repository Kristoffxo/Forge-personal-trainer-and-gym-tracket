#!/usr/bin/env node
/* ---------------------------------------------------------------
   Writes data/foods_extra.json.

     node scripts/build-extra-foods.mjs

   The USDA sets are American and the INDB set is home cooking, so
   between them they miss most of what people here actually eat out
   of the house: toast, sandwiches, Indo-Chinese, street food, the
   snack you had at four o'clock.

   Everything below is per 100 g, which is the same basis the other
   three files use. Values are the middle of the published range for
   a typical restaurant or street preparation — including the oil it
   is actually cooked in, which is the usual reason a home recipe
   underestimates a plate of chilli potato by half.

   Columns: name, category, kcal, protein, carbs, fat, servings, aliases
   --------------------------------------------------------------- */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ids start well clear of the INDB block at 9,000,000 */
const FIRST_ID = 9500000;

const F = [
  // ---------------- toast and sandwiches ----------------
  ['Toast, white bread', 'Bread', 293, 9, 55, 3.5, [['1 slice', 28], ['2 slices', 56]], 'bread toast'],
  ['Toast, brown bread', 'Bread', 280, 11, 49, 4, [['1 slice', 30], ['2 slices', 60]], 'wheat toast atta bread'],
  ['Buttered toast', 'Bread', 350, 8, 47, 14, [['1 slice', 33], ['2 slices', 66]], 'butter toast makhan'],
  ['Toast with jam', 'Bread', 320, 7, 60, 6, [['1 slice', 36]], 'jam toast'],
  ['Peanut butter toast', 'Bread', 380, 13, 38, 20, [['1 slice', 42]], 'pb toast'],
  ['Avocado toast', 'Sandwiches', 210, 4.5, 20, 13, [['1 slice', 110], ['2 slices', 220]], 'avacado toast'],
  ['Avocado sandwich', 'Sandwiches', 215, 5.5, 22, 12, [['1 sandwich', 180]], 'avacado sandwich'],
  ['Vegetable sandwich', 'Sandwiches', 210, 6, 30, 7, [['1 sandwich', 160]], 'veg sandwich'],
  ['Grilled cheese sandwich', 'Sandwiches', 330, 13, 30, 18, [['1 sandwich', 150]], 'cheese toast sandwich'],
  ['Club sandwich', 'Sandwiches', 270, 12, 28, 12, [['1 sandwich', 230]], ''],
  ['Bombay masala sandwich', 'Sandwiches', 245, 6, 31, 11, [['1 sandwich', 180]], 'masala toast sandwich'],
  ['Egg sandwich', 'Sandwiches', 250, 11, 25, 12, [['1 sandwich', 165]], 'anda sandwich'],
  ['Chicken sandwich', 'Sandwiches', 240, 15, 24, 9, [['1 sandwich', 200]], ''],
  ['Chicken shawarma', 'Sandwiches', 230, 15, 22, 9, [['1 roll', 250]], 'shawarma'],

  // ---------------- Indo-Chinese ----------------
  ['Chilli potato', 'Indo-Chinese', 250, 3, 33, 12, [['1 plate', 200], ['half plate', 110]], 'chilli aloo chilly potato'],
  ['Honey chilli potato', 'Indo-Chinese', 270, 3, 38, 12, [['1 plate', 200]], 'honey chilly potato'],
  ['Veg Manchurian, dry', 'Indo-Chinese', 230, 5, 27, 11, [['1 plate', 200]], 'manchurian'],
  ['Gobi Manchurian', 'Indo-Chinese', 220, 4.5, 26, 11, [['1 plate', 200]], 'cauliflower manchurian'],
  ['Chilli paneer', 'Indo-Chinese', 265, 13, 14, 18, [['1 plate', 200]], 'chilly paneer'],
  ['Chilli chicken', 'Indo-Chinese', 215, 18, 11, 11, [['1 plate', 220]], 'chilly chicken'],
  ['Veg fried rice', 'Indo-Chinese', 165, 3.5, 27, 4.5, [['1 plate', 300], ['1 bowl', 200]], 'fried rice'],
  ['Chicken fried rice', 'Indo-Chinese', 185, 9, 25, 5.5, [['1 plate', 300]], ''],
  ['Hakka noodles, veg', 'Indo-Chinese', 190, 5, 29, 6, [['1 plate', 250]], 'chowmein chow mein noodles'],
  ['Chicken hakka noodles', 'Indo-Chinese', 205, 10, 26, 7, [['1 plate', 250]], 'chicken chowmein'],
  ['Veg spring roll', 'Indo-Chinese', 240, 5, 30, 11, [['1 roll', 60], ['2 rolls', 120]], 'spring roll'],
  ['Veg momos, steamed', 'Indo-Chinese', 180, 5, 30, 4, [['1 piece', 30], ['6 pieces', 180], ['1 plate', 240]], 'momo dumpling'],
  ['Chicken momos, steamed', 'Indo-Chinese', 200, 11, 26, 6, [['1 piece', 32], ['6 pieces', 192]], 'chicken momo'],
  ['Fried momos', 'Indo-Chinese', 260, 6, 32, 12, [['1 piece', 33], ['6 pieces', 198]], 'kurkure momo'],

  // ---------------- street food ----------------
  ['Samosa', 'Street food', 300, 5, 33, 16, [['1 samosa', 65], ['2 samosas', 130]], ''],
  ['Kachori', 'Street food', 350, 7, 38, 19, [['1 kachori', 60]], ''],
  ['Vada pav', 'Street food', 290, 6.5, 40, 11, [['1 vada pav', 140]], 'wada pav'],
  ['Pav bhaji', 'Street food', 165, 4, 20, 8, [['1 plate', 350]], ''],
  ['Misal pav', 'Street food', 150, 6, 19, 6, [['1 plate', 330]], ''],
  ['Bread pakora', 'Street food', 290, 6, 32, 15, [['1 piece', 80]], 'bread pakoda'],
  ['Aloo tikki', 'Street food', 200, 3.5, 27, 9, [['1 tikki', 70], ['2 tikkis', 140]], 'tikki'],
  ['Pani puri', 'Street food', 180, 3, 27, 6, [['6 pieces', 120], ['1 plate', 120]], 'golgappa puchka batasha'],
  ['Bhel puri', 'Street food', 230, 6, 34, 8, [['1 plate', 120]], 'bhelpuri'],
  ['Sev puri', 'Street food', 280, 6, 33, 13, [['1 plate', 120]], 'sevpuri'],
  ['Dahi puri', 'Street food', 210, 5, 28, 8, [['1 plate', 140]], 'dahipuri'],
  ['Chole bhature', 'Street food', 280, 8, 32, 13, [['1 plate', 350]], 'chana bhatura'],
  ['Corn chaat', 'Street food', 130, 4, 24, 3, [['1 cup', 150]], 'sweet corn chaat'],
  ['Sprouts chaat', 'Street food', 120, 8, 20, 1, [['1 bowl', 150]], 'moong chaat'],
  ['Egg roll', 'Street food', 240, 9, 27, 11, [['1 roll', 180]], 'anda roll kathi roll'],
  ['Chicken kathi roll', 'Street food', 250, 13, 26, 11, [['1 roll', 200]], 'chicken roll'],

  // ---------------- fast food ----------------
  ['French fries', 'Fast food', 312, 3.4, 41, 15, [['small', 80], ['medium', 115], ['large', 150]], 'fries finger chips'],
  ['Potato wedges', 'Fast food', 260, 3.5, 36, 11, [['1 portion', 130]], 'wedges'],
  ['Veg burger', 'Fast food', 240, 7, 32, 9, [['1 burger', 160]], 'aloo tikki burger'],
  ['Chicken burger', 'Fast food', 255, 14, 26, 11, [['1 burger', 175]], ''],
  ['Cheese pizza', 'Fast food', 266, 11, 33, 10, [['1 slice', 105], ['2 slices', 210]], 'pizza'],
  ['Pasta in white sauce', 'Fast food', 180, 5, 22, 8, [['1 plate', 250]], 'alfredo pasta'],
  ['Pasta in red sauce', 'Fast food', 140, 5, 24, 3, [['1 plate', 250]], 'arrabiata pasta'],
  ['Nachos with cheese', 'Fast food', 340, 8, 38, 17, [['1 plate', 150]], 'nachos'],
  ['Maggi noodles, prepared', 'Fast food', 145, 3.4, 19, 6, [['1 packet', 190], ['2 packets', 380]], 'maggie instant noodles'],

  // ---------------- packet snacks ----------------
  ['Potato chips', 'Snacks', 536, 7, 53, 34, [['small packet', 30], ['1 packet', 52]], 'lays wafers crisps'],
  ['Namkeen mixture', 'Snacks', 500, 12, 50, 28, [['1 small bowl', 30]], 'mixture bhujia namkeen'],
  ['Popcorn, salted', 'Snacks', 430, 9, 55, 20, [['1 bowl', 30], ['1 tub', 80]], ''],
  ['Glucose biscuits', 'Snacks', 450, 7, 76, 13, [['1 biscuit', 5], ['1 packet', 60]], 'parle g marie biscuit'],
  ['Cream biscuits', 'Snacks', 480, 5, 71, 20, [['1 biscuit', 11], ['1 packet', 60]], 'oreo bourbon'],
  ['Rusk', 'Snacks', 400, 9, 72, 8, [['1 rusk', 12], ['2 rusks', 24]], 'toast biscuit'],

  // ---------------- eggs and quick meals ----------------
  ['Omelette, two eggs', 'Eggs', 155, 11, 1, 12, [['1 omelette', 120]], 'anda omlet'],
  ['Bread omelette', 'Eggs', 220, 10, 20, 11, [['1 plate', 170]], 'anda bread'],
  ['Egg bhurji', 'Eggs', 175, 12, 3, 13, [['1 bowl', 150]], 'bhurji scrambled egg'],
  ['Curd rice', 'Meals', 130, 4, 20, 3.5, [['1 bowl', 250]], 'dahi chawal'],
  ['Rajma chawal', 'Meals', 145, 5, 25, 3, [['1 plate', 350]], 'rajma rice'],
  ['Butter chicken', 'Meals', 240, 15, 7, 17, [['1 bowl', 200]], 'murgh makhani'],
  ['Dal makhani', 'Meals', 190, 7, 17, 10, [['1 bowl', 200]], ''],
  ['Paneer butter masala', 'Meals', 280, 11, 10, 22, [['1 bowl', 200]], 'paneer makhani'],
  ['Paneer tikka', 'Meals', 270, 15, 8, 20, [['1 plate', 180]], ''],
  ['Chicken tikka', 'Meals', 190, 25, 3, 8, [['1 plate', 180]], ''],
  ['Hummus', 'Meals', 170, 8, 14, 10, [['2 tablespoons', 60]], ''],
  ['Falafel', 'Meals', 330, 13, 32, 18, [['1 piece', 30], ['4 pieces', 120]], ''],

  // ---------------- drinks ----------------
  ['Cold coffee', 'Drinks', 90, 3, 13, 3, [['1 glass', 250]], 'iced coffee'],
  ['Banana shake', 'Drinks', 95, 3, 16, 2.5, [['1 glass', 300]], 'banana milkshake'],
  ['Whey protein powder', 'Drinks', 400, 78, 8, 6, [['1 scoop', 30], ['2 scoops', 60]], 'protein powder whey shake'],
  ['Fruit salad', 'Drinks', 60, 0.8, 14, 0.3, [['1 bowl', 200]], ''],
];

const rows = F.map(([n, c, k, p, ch, f, servings, al], i) => ({
  i: FIRST_ID + i,
  n,
  c,
  src: 'nem',
  k, p, ch, f,
  s: servings.map(([l, g]) => ({ l, a: 1, g })).concat([{ l: '100 g', a: 1, g: 100 }]),
  al: al || '',
}));

const out = path.join(ROOT, 'data', 'foods_extra.json');
fs.writeFileSync(out, JSON.stringify(rows));
console.log(`wrote ${rows.length} foods to data/foods_extra.json`);
