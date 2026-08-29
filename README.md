# Mesamorfit

The personal-training app for [Mesamorfit](https://mesamorfit.com), the online
coaching practice run by Siddhartha Gupta — Coach Sid. One Expo codebase that
runs as an Android app, an iOS app, and an installable web app you can add to an
iPhone home screen.

## The four tabs

| | |
|---|---|
| **Tools** | BMI with the WHO bands, a healthy-weight range, and a daily calorie target the Food tab then works from |
| **Food** | Calorie tracker with a ring and macro bars, over 44,000 foods bundled offline |
| **Train** | Pick a split — PPL 6 or 3 day, Upper/Lower, Full Body, One Muscle a Day, or build your own — and get a week you can tick off |
| **Trainer** | A real conversation with Coach Sid. No bot. |

Coaches sign in to a different app entirely: a client list, their threads, and
what each client has been eating. The role comes from `profiles.role`.

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

The web build is a real PWA: manifest, maskable icons, an apple-touch-icon, a
launch screen for every iPhone size, safe-area insets so the tab bar clears the
home indicator, and a service worker that keeps it working with no connection
after the first visit.

```bash
npm run build:web    # exports to web-build/ and stamps the service worker
npm run serve:web    # serve that folder locally at :8090
```

Deploy the `web-build` folder anywhere that serves it over HTTPS from the root of
a domain — `start_url` and `scope` are both `/`, so a subpath needs a base-path
build. `public/_headers` and `public/_redirects` are picked up by Cloudflare
Pages and Netlify.

To install it on an iPhone: open the URL in Safari, Share, **Add to Home
Screen**, leave *Open as Web App* on.

### How the web build works

Anything in `public/` is copied into the export as-is, and `public/index.html`
replaces Expo's default page template. After the export,
`scripts/build-web.mjs` rewrites `web-build/sw.js` with the real content-hashed
filenames to precache and a build id derived from them — so a new bundle always
produces a new service worker, and the browser picks the update up. It throws
rather than shipping a service worker whose placeholders were never filled in.

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
- `src/num.js` parses Devanagari digits. Hindi keyboards type १७८ and
  `parseFloat` returns `NaN`. Use it for any new numeric input.

## Backend

Supabase: `profiles`, `messages`, `diary`, `plans`, with row-level security on.
A client sees only their own rows and cannot forge a message from their coach;
a coach sees everyone. Schema in `supabase-setup.sql`.

The key in `src/supabase.js` is the publishable key. It is meant to be public —
RLS decides what each signed-in person may touch, not the key.

## Licence

See [LICENSE](LICENSE).
