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
| **Train** | Today's session on the front page with one button. Tap any move for an animated demonstration, the form points that matter, what you lifted last time, and a Done button |
| **Food** | Photograph a plate and it counts the calories, or search 44,000 foods offline |
| **Feed** | Photos, first names, comments. No usernames, no locations, no likes |
| **You** | Your streak, your weight, your calorie history, BMI and your daily target |

There is no coach and no human on the other end of anything. The app is the
product.

---

## What is new

### The feed

A shared photo feed. The only thing identifying a post is a **first name** —
there is no username column and no location column in the schema, and EXIF
(which carries GPS) is stripped from every photo before it leaves the phone.

Anyone signed in sees everyone's posts. You can comment, delete your own posts
and comments, **report** anything, and **block** anyone. Blocking is enforced by
row-level security rather than by the app, so a blocked person's rows never
reach the client at all.

Report and block are not optional politeness — neither store will list an app
carrying user photographs without them.

### The food camera

Point the camera at a plate. The photo goes to the app's own Cloudflare Worker,
which calls Claude's vision API and returns each food it can see with a portion
and a calorie count. Everything is editable before it lands in the diary,
because an estimate from a photograph is an estimate and the screen says so.

The prompt is tuned for Indian food — dal, sabzi, roti, idli, biryani, paneer,
chaat — including the ghee and oil those are actually cooked in.

**It needs a key before it will answer:**

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

Until you set it, `/api/vision` returns 503 and the camera screen falls back to
the food search rather than dead-ending. Nothing else is affected.

The key never reaches the client. The Worker also refuses anyone without a valid
Supabase access token, so the endpoint is not an open invitation to spend your
API budget. Cost lives in `worker/index.js` — it runs `claude-opus-5` at
`effort: 'medium'`; drop the effort or the model if the bill matters more than
the accuracy.

### Animated exercises

Every one of the seventy exercises has a looping animation showing the movement,
plus the two or three form cues that actually matter.

The figure is built out of plain `<View>`s and rotations — no SVG dependency, so
the native build is untouched and it renders identically in a browser and in the
APK. `src/anim/figure.js` is the rig; `src/anim/patterns.js` holds about twenty
movement shapes and maps every exercise onto one, since a bench press and a
machine chest press are the same picture.

Angles are relative to the joint above and positive always means flexion, so the
data reads the way a physiotherapist would say it. Two things to know before
editing them:

- **The arm hangs off the torso, the thigh hangs off the hip.** So on anything
  where you bend over, an arm angle of 0 swings out horizontally rather than
  hanging down. A bar hangs vertically when `arm == torso`.
- A CSS rotation is clockwise, which means the opposite thing for the torso
  (which grows upward) and for every limb that grows down. `figure.js` negates
  the downward ones so the data does not have to think about it.

### Set logging

Tick a set and it is written down. The next time that exercise comes up, the
screen shows what you did last time and your best ever, which is the single most
useful thing a training app can put in front of you. Writing the numbers in is
optional — you can just tick.

A rest timer starts itself when you tick a set.

### Four tabs instead of five

Tools and Progress were two of the four tabs, which spent half the navigation on
screens you visit weekly. They are one **You** tab now, and Feed took the slot.

---

## Things that were broken

- **`Alert.alert` does nothing on the web.** react-native-web forwards the title
  to `window.alert` and drops every button and callback. "Hold an item to remove
  it" in the food diary had therefore never worked in a browser. Everything now
  goes through `src/ui/sheet.js`, which is a real bottom sheet that resolves a
  promise. Do not reintroduce `Alert`.
- **`←` inside JSX text is not an escape.** The workout screen literally
  rendered `← Back to my week`. JSX text is not a string literal — write the
  character, or `{'←'}`.

---

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

Always use `npm run build:web`, not `expo export` directly — the export alone
leaves `sw.js` full of unfilled placeholders and service worker registration
then fails.

`wrangler.jsonc` runs the build itself, so Cloudflare's builder needs no build
command configured — the deploy command alone is enough.

There is no `_redirects`: Workers rejects a `/* -> /index.html 200` rule as a
loop, so the single-page fallback lives in `wrangler.jsonc` as
`not_found_handling`. `run_worker_first: ["/api/*"]` is what stops the asset
router answering `/api/vision` with `index.html`. Launch images avoid `@` in
their filenames because Workers normalises it to `%40` behind a 307.

To install on an iPhone: open the URL in Safari, Share, **Add to Home Screen**.

## Artwork

The logo lives at `brand/nemea-logo-source.png` — the full lockup on its cream
field. Every icon, favicon and launch screen is cut from that one file:

```bash
npm run brand
```

`brand/render.mjs` measures nothing at runtime; the crop rectangles are in `BOX`
at the top of the file and were measured once. Replace the source artwork and
those need re-measuring.

It composites with headless Chrome, because Chrome and `sips` are the only
image-capable things on this machine — there is no ImageMagick. Sizes below
48 px use a tighter crop, since the ring and the dumbbell turn to mush when the
whole lockup is squeezed into a browser tab. The cream field is chroma-keyed out
for `assets/brand/mark.png` so the mark can sit on either palette.

`assets/img/` still holds three **designed placeholders** — `hero.jpg`,
`banner.jpg`, `quote.jpg`. Gradient panels, not photographs. Replace the file,
keep the name; each sits behind a dark veil so composition is forgiving.

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
  `parseFloat` returns `NaN`. Use it for any new numeric input.
- Photos are web-only for now: `src/photo.js` uses a file input with `capture`,
  which opens the camera on iOS Safari and Android Chrome and needs no native
  module. A native build would add `expo-image-picker` inside that one file and
  nothing above it would change.

## Backend

Supabase. The original schema is in `supabase-setup.sql`; **that file drops
tables**, so do not run it against a project with real data in it.

Everything added since is in `supabase-upgrade.sql`, which is additive and safe
to run twice:

```
posts, comments, blocks, reports    the feed
sets                                what you lifted
profiles.sex / birth_year /         room for a calculated calorie target
  activity / goal / onboarded
storage bucket 'posts'              feed photographs
```

Run it in the Supabase SQL editor. Until you do, the Feed tab says so in plain
words instead of showing a Postgres error.

Row-level security is on for every table. Each person reads and writes only their
own rows; the feed is the one shared read, minus anyone you have blocked.
`reports` is insert-only — nothing can read it back through the API.

The key in `src/supabase.js` is the publishable key. It is meant to be public;
RLS decides what each signed-in person may touch, not the key.

The weight log in Progress is deliberately **not** in Supabase. It lives in
`AsyncStorage` under `nemea:weights`, so it works offline and needed no
migration.

## Before the Play Store

1. **Privacy policy.** Mandatory — you collect an email, body metrics, food logs
   and now photographs. Needs a public URL before the Data safety form.
2. **Account deletion.** Required for any app that lets you create an account.
3. **Ads.** No ad SDK is integrated.
4. `com.nemea.app` is the package name and is permanent from the first upload.
5. The feed is user-generated content. Report and block exist; someone still has
   to read the `reports` table.

## Licence

See [LICENSE](LICENSE).
