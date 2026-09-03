import { page, CONTACT } from './shared.js';

/* Written to be true of the app as it actually is. Every claim here
   is checkable against the code: what is collected, where it goes,
   and what is not done with it. */
export const privacy = () => page('Privacy Policy', `
<p>Reppo is a training and nutrition app. This policy says what it collects, why,
and what you can do about it. It is short because the app does little.</p>

<h2>Who runs it</h2>
<p>Reppo is run by an individual developer, Aryan Basantani, in India.
Contact: <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>

<h2>What is collected</h2>
<ul>
  <li><strong>Your email address and password.</strong> Handled by Supabase Auth.
      The password is hashed by them; this app never sees or stores it.</li>
  <li><strong>Your name.</strong> Only the first word of it is ever shown to
      other people.</li>
  <li><strong>What you told the app about your body</strong> — height, weight,
      age, sex, experience and calorie goal. Used to work out a daily calorie
      target and to size your sessions.</li>
  <li><strong>What you log</strong> — the days you trained, the food you added,
      and your weight over time.</li>
  <li><strong>Photographs you choose to post</strong> to Discover, and any
      caption you write with them.</li>
  <li><strong>A profile picture</strong>, if you set one. It is shown next to
      your first name on Discover and when you race somebody.</li>
  <li><strong>Which mode you use</strong> — men or women — and, on the women's
      side, that you opened the menstrual-pain sessions. This is health
      information and is treated as such: it is stored against your account and
      shown to nobody else.</li>
  <li><strong>A notification token</strong>, only if you turn reminders on.</li>
</ul>

<h2>What is not collected</h2>
<ul>
  <li>No location, ever. Photographs are re-encoded before upload, which strips
      the GPS coordinates a phone camera writes into them.</li>
  <li>No contacts, no call logs, no microphone.</li>
  <li>No advertising identifier. There are no ads and no ad networks in this
      version. If that ever changes, this policy will be updated before the
      version that changes it is released.</li>
  <li>No analytics or tracking SDK of any kind.</li>
  <li>Nothing is sold or shared with anyone, for advertising or otherwise.</li>
</ul>

<h2>The camera</h2>
<p>The camera is used in two places. Posting a photograph to Discover uses it
once, when you press the button, and the photograph is uploaded only after you
press Post. On the website, the rep counter watches the camera to count
push-ups and squats — that video is processed on your own device, frame by
frame, and never leaves it. No video is recorded, stored or uploaded by either.</p>

<h2>Where it goes</h2>
<p>Everything is stored with <a href="https://supabase.com/privacy">Supabase</a>,
which hosts the database and the photograph storage. The app is served through
<a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a>. Push
notifications, on the website, go through the browser maker's push service —
Google, Apple or Mozilla depending on your browser — and carry no content: the
message is chosen on your own device after the notification arrives.</p>

<h2>Who can see what</h2>
<ul>
  <li>Your food diary, your weight, your workouts, your numbers and your health
      information: only you. This is enforced by the database itself, not only
      by the app.</li>
  <li>Photographs you post to Discover, your profile picture and your first
      name: anyone signed in. Posts delete themselves after seven days.</li>
  <li>Your league and how many days you have trained: anyone signed in, on the
      leaderboard.</li>
  <li>Nobody can see who liked a post, including the person who posted it.</li>
  <li>The developer, as the administrator, can see the list of accounts —
      email, first name, join date, and counts of how much each has trained and
      posted — in order to answer reports and remove accounts that break the
      rules. The administrator cannot read anybody's food diary, weights or
      journey notes; the database returns counts and dates only.</li>
</ul>

<h2>How long it is kept</h2>
<p>Discover photographs are deleted automatically seven days after they are
posted. Everything else is kept until you delete your account, at which point it
goes with it.</p>

<h2>Deleting everything</h2>
<p>In the app: the three dots at the top right, then Delete my account. It removes
the account and everything attached to it, and cannot be undone.
Or ask from a browser at <a href="/delete-account">reppo.app/delete-account</a>.</p>

<h2>Children</h2>
<p>Reppo is not directed at children and is not intended for anyone under 13.
If you believe a child has an account, write to
<a href="mailto:${CONTACT}">${CONTACT}</a> and it will be removed.</p>

<h2>Your rights</h2>
<p>You can see, correct, export or delete your data. Ask at
<a href="mailto:${CONTACT}">${CONTACT}</a> and it will be dealt with within
30 days.</p>

<h2>Changes</h2>
<p>If this policy changes in a way that matters, the app will say so the next
time you open it. The date at the top always reflects the current version.</p>
`);
