import { page, CONTACT } from './shared.js';

/* Google Play requires a way to ask for deletion from a browser,
   without installing the app. This is that page. */
export const deleteAccount = () => page('Delete your account', `
<p>Deleting your Reppo account removes the account itself and everything
attached to it: your workouts, your food diary, your weight history, your
photographs on Discover, and anything you told the app about your body. It
cannot be undone and there is no grace period.</p>

<h2>The fastest way — in the app</h2>
<ol>
  <li>Open Reppo and sign in.</li>
  <li>Tap the three dots at the top left.</li>
  <li>Scroll to <strong>Delete your account</strong>.</li>
  <li>Confirm twice. It happens immediately.</li>
</ol>

<h2>Without the app</h2>
<p>Email <a href="mailto:${CONTACT}?subject=Delete%20my%20Reppo%20account">${CONTACT}</a>
from the address you signed up with, with the subject
<em>Delete my Reppo account</em>. It will be done within 30 days, usually the
same week, and you will get a note when it is finished.</p>
<p>The email has to come from the address on the account. It is the only way to
be sure the request is really yours.</p>

<h2>What is deleted</h2>
<ul>
  <li>Your account and sign-in details</li>
  <li>Your name, height, weight, age, sex, goals and calorie target</li>
  <li>Every workout, food entry and weight you logged</li>
  <li>Your Discover photographs and captions, and your likes and comments</li>
  <li>Your notification token, if you had reminders on</li>
</ul>

<h2>What is kept, and for how long</h2>
<p>Nothing is kept about you after deletion. Ordinary server logs kept by our
hosting providers may hold an IP address for up to 30 days before they rotate
out; those are not linked to your account once it is gone.</p>
`);
