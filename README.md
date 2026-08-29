# Nemea

A training and nutrition app. One Expo codebase that runs as an Android app, an
iOS app, and an installable web app you can add to a phone home screen.

Named for Nemea, which hosted one of the four Panhellenic games alongside
Olympia, and for the lion Herakles fought there — the one whose hide no blade
could cut, and which he wore afterwards as armour.

Live at **https://nemea.thearyanbasantani.workers.dev**

## The four tabs

| | |
|---|---|
| **Tools** | BMI with the WHO bands, a healthy-weight range, and a daily calorie target the Food tab works from |
| **Food** | Calorie tracker with a ring and macro bars, over 44,000 foods bundled offline |
| **Train** | Pick a split — PPL 6 or 3 day, Upper/Lower, Full Body, One Muscle a Day, or build your own — and get a week you can tick off |
| **Progress** | Logging streak, a fortnight of calories against your target, and a weight log |

There is no coach and no human on the other end of anything. The app is the
product.

## Food data

Everything is bundled, so search works with no connection at all.

| File | Rows | Source |
|---|---|---|
| `data/foods.json` | 13,169 | USDA FoodData Central — generic and prepared |
| `data/foods_branded.json` | 30,000 | USDA — branded supermarket products |
| `data/foods_indian.json` | 1,414 | INDB and IFCT 2017, with Hindi aliases and bowl / plate / roti portions |

`src/popular.js` pins 38 gym staples to the top of the results. `portionsFor()`
in `src/foods.js` ranks servings by realistic calories, so a boiled egg offers
"1 large, 78 kcal" first and olive oil offers "1 tablespoon".

## Running it

```bash
npm install
npx expo start
```

## The web app

A real PWA: manifest, maskable icons, an apple-touch-icon, a launch screen for
every iPhone size, safe-area insets so the tab bar clears the home indicator,
and a service worker that keeps it working offline after the first visit.

```bash
npm run build:web    # exports to web-build/ and stamps the service worker
npm run serve:web    # serve that folder locally at :8090
npx wrangler deploy  # builds first, then uploads — see wrangler.jsonc
```

`wrangler.jsonc` runs the build itself, so Cloudflare's builder needs no build
command configured — the deploy command alone is enough.

Host it anywhere that serves the folder over HTTPS from the root of a domain.
`start_url` and `scope` are both `/`, so a subpath needs a base-path build.
There is no `_redirects`: Workers rejects a `/* -> /index.html 200` rule as a
loop, so the single-page fallback lives in `wrangler.jsonc` as
`not_found_handling`. Launch images avoid `@` in their filenames because
Workers normalises it to `%40` behind a 307.

To install on an iPhone: open the URL in Safari, Share, **Add to Home Screen**.

### How the web build works

Anything in `public/` is copied into the export as-is, and `public/index.html`
replaces Expo's default page template. After the export,
`scripts/build-web.mjs` rewrites `web-build/sw.js` with the real content-hashed
filenames to precache and a build id derived from them, so a new bundle always
produces a new service worker. It throws rather than shipping a service worker
whose placeholders were never filled in.

## Artwork

`assets/img/` holds three files — `hero.jpg`, `banner.jpg`, `quote.jpg`. They
are **designed placeholders**, gradient panels in the brand palette, not
photographs.

To use real photography, replace the file and keep the name. Each one sits
behind a dark veil, so composition is forgiving; landscape at roughly 1200x800
is right. No code changes.

The icon and every launch screen are rendered from HTML rather than drawn by
hand. The templates live outside the repo, but the recipe is simple: a Forum
"N" in an ember-to-amber gradient on `#12110F`, screenshotted headless at
1024x1024 and resized with `sips`.

## Things worth knowing before you edit

- `StyleSheet.create` snapshots colours at import time. Every screen uses
  `const makeStyles = (C, T) => StyleSheet.create({...})` with
  `const { C, T } = useTheme()` inside the component. Move colours back to
  module scope and the light/dark toggle silently stops working.
- An `<ImageBackground>` needs `width`, a fixed height, and `overflow: 'hidden'`.
  react-native-web reads `width` off the flattened style and falls back to the
  image's own intrinsic width, which is how a 1200px photo ends up spilling out
  of a 375px box.
- `react-native-safe-area-context`'s web `SafeAreaView` treats any edge missing
  from an `edges` array as `'additive'`, while the native one treats it as
  `'off'`. Pass a full record — see `EDGES_TOP` in `App.js`.
- `src/num.js` parses Devanagari digits. Hindi keyboards type ७८ and
  `parseFloat` returns `NaN`. Use it for any new numeric input, including the
  weight box in Progress.

## Backend

Supabase: `profiles`, `diary`, `plans`, with row-level security on — each
person reads and writes only their own rows. Schema in `supabase-setup.sql`.

The key in `src/supabase.js` is the publishable key. It is meant to be public;
RLS decides what each signed-in person may touch, not the key.

The weight log in Progress is deliberately **not** in Supabase. It lives in
`AsyncStorage` under `nemea:weights`, so it works offline and needed no
migration. Moving it to a `weights` table later is a small job: add the table
with the same RLS policy the `diary` table uses, then swap the two helpers at
the top of `src/screens/Progress.js`.

## Before the Play Store

Not done yet, in rough order of importance:

1. **Privacy policy.** Mandatory — you collect an email, body metrics and food
   logs, and you intend to serve ads. Needs a public URL before you can fill in
   the Data safety form.
2. **Ads.** No ad SDK is integrated. `react-native-google-mobile-ads` plus an
   AdMob account, and a config plugin, since this is a custom dev client rather
   than Expo Go.
3. **Account deletion.** Google requires an in-app route to delete an account
   for any app that lets you create one.
4. `com.nemea.app` is the package name and is permanent from the first upload.

## Licence

See [LICENSE](LICENSE).
