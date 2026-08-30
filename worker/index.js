/* ---------------------------------------------------------------
   The Cloudflare Worker in front of the web app.

   It exists for one reason: the food camera needs to call Claude,
   and an API key cannot ship inside a web app. Anything under
   /api/ is handled here, where the key lives as a secret; every
   other request is served straight from the static build.

     npx wrangler secret put ANTHROPIC_API_KEY

   Without that secret the app still works — /api/vision answers
   503 with { error: 'not_configured' } and the camera screen falls
   back to picking the food by hand.
   --------------------------------------------------------------- */
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5';

/* Roughly 1.4 MB of base64, which is about a 1 MB photo. src/photo.js
   already shrinks everything to ~250 kB before it gets here, so this is
   a backstop against someone posting straight at the endpoint. */
const MAX_IMAGE_CHARS = 1_400_000;

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/vision') {
      return handleVision(request, env).catch((err) => {
        console.error('vision failed', err && err.stack);
        return json({ error: 'failed', message: 'Could not read that photo. Try again.' }, 500);
      });
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);

    // everything else is the app itself
    return env.ASSETS.fetch(request);
  },
};

/* ---------------------------------------------------------------
   POST /api/vision
     { image: <base64>, mediaType: 'image/jpeg', note?: string }
   ->  { items: [...], confidence, note }

   Requires the caller's Supabase access token in the Authorization
   header. Without that check this is an open endpoint that spends
   someone else's money.
   --------------------------------------------------------------- */
async function handleVision(request, env) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  if (!env.ANTHROPIC_API_KEY) {
    return json({
      error: 'not_configured',
      message: 'The food camera is not switched on yet.',
    }, 503);
  }

  const who = await whoIsAsking(request, env);
  if (!who) return json({ error: 'unauthorised', message: 'Sign in first.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'bad_request', message: 'Expected JSON.' }, 400);
  }

  const image = typeof body.image === 'string' ? body.image : '';
  const mediaType = MEDIA_TYPES.has(body.mediaType) ? body.mediaType : 'image/jpeg';
  const note = String(body.note || '').slice(0, 300);

  if (!image) return json({ error: 'bad_request', message: 'No photo.' }, 400);
  if (image.length > MAX_IMAGE_CHARS) {
    return json({ error: 'too_large', message: 'That photo is too big.' }, 413);
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    // A plate of food is a perception problem, not a reasoning one.
    // Medium keeps it accurate without making someone wait to log lunch.
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: NUTRITION_SCHEMA },
    },
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
        {
          type: 'text',
          text: note
            ? `Log this meal. The person adds: "${note}"`
            : 'Log this meal.',
        },
      ],
    }],
  });

  if (response.stop_reason === 'refusal') {
    return json({ error: 'refused', message: 'Could not read that photo. Try another.' }, 422);
  }

  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return json({ error: 'failed', message: 'Could not read that photo. Try again.' }, 502);
  }

  return json(tidy(parsed));
}

const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const SYSTEM = `You read a photograph of food and estimate what is in it, for a calorie tracker.

Rules:
- List each distinct food as its own item. A thali or a mixed plate gets one item per component, not one lump.
- Estimate the portion from what is visibly on the plate, using the plate, bowl, cutlery or hand for scale. Say the portion the way a person would ("1 medium bowl", "2 rotis", "1 chicken breast, palm-sized"), and give the grams you assumed.
- Indian food is common here. Recognise dal, sabzi, roti, paratha, idli, dosa, poha, upma, biryani, paneer dishes, chaat and sweets, and account for the ghee or oil they are actually cooked in.
- kcal, protein, carbs and fat are for the portion you estimated, not per 100 g.
- Set confidence honestly. "low" if the food is hidden, ambiguous, or you are guessing at a sauce or an oil.
- If the picture has no food in it, return an empty items array and say so in the note.

The note is one short sentence shown under the result. Say what you assumed, or what you could not tell. Do not pad it, do not add advice, do not mention that you are an AI.`;

const NUTRITION_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'What the food is, in plain words' },
          portion: { type: 'string', description: 'The portion, as a person would say it' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
        },
        required: ['name', 'portion', 'grams', 'kcal', 'protein', 'carbs', 'fat'],
        additionalProperties: false,
      },
    },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    note: { type: 'string' },
  },
  required: ['items', 'confidence', 'note'],
  additionalProperties: false,
};

/* Numbers arrive as numbers, but round them and clamp the obviously
   silly ones — a single item claiming 9,000 kcal is a misread, and it
   would land straight in someone's diary. */
function tidy(parsed) {
  const n = (v, max) => {
    const x = Number(v);
    if (!isFinite(x) || x < 0) return 0;
    return Math.round(Math.min(x, max) * 10) / 10;
  };
  const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 12) : [];
  return {
    items: items.map((it) => ({
      name: String(it.name || 'Food').slice(0, 80),
      portion: String(it.portion || '').slice(0, 60),
      grams: n(it.grams, 3000),
      kcal: n(it.kcal, 3000),
      protein: n(it.protein, 300),
      carbs: n(it.carbs, 500),
      fat: n(it.fat, 300),
    })),
    confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
    note: String(parsed.note || '').slice(0, 220),
  };
}

/* ---------------------------------------------------------------
   Who is calling. The app sends its Supabase access token; Supabase
   is the only thing that can say whether it is real, so ask it.

   SUPABASE_URL is a plain var, not a secret — it is in the client
   bundle already. It is read from the environment rather than
   hard-coded so a staging project needs no code change.
   --------------------------------------------------------------- */
async function whoIsAsking(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;

  const base = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;
  if (!base || !key) {
    console.error('SUPABASE_URL / SUPABASE_ANON_KEY are not set on the Worker');
    return null;
  }

  const res = await fetch(base.replace(/\/$/, '') + '/auth/v1/user', {
    headers: { authorization: 'Bearer ' + token, apikey: key },
  });
  if (!res.ok) return null;

  const user = await res.json();
  return user && user.id ? user : null;
}
