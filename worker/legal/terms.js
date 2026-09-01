import { page, CONTACT } from './shared.js';

export const terms = () => page('Terms of Use', `
<p>By using Reppo you agree to these terms. They are deliberately short.</p>

<h2>Reppo is not medical advice</h2>
<p>It is a training and nutrition app, not a doctor, a physiotherapist or a
dietitian. The workouts, the calorie targets and the period-pain sessions are
general information. They are not a diagnosis and not a treatment.</p>
<p>Speak to a doctor before starting if you are pregnant, recovering from
surgery or an injury, have a heart condition, or have been told to be careful
with a joint. Stop and get help if you feel chest pain, dizziness or sudden
shortness of breath. You exercise at your own risk.</p>

<h2>Your account</h2>
<p>One account per person. Keep your password to yourself. Tell us if someone
else gets into your account.</p>

<h2>What you post</h2>
<p>You keep ownership of your photographs. By posting one to Discover you allow
Reppo to show it to other signed-in users for the seven days before it deletes
itself.</p>
<p>Do not post: anyone else's photograph without their agreement, nudity or
sexual content, anything hateful or harassing, anything illegal, or anything
that is not yours to post. Posts can be removed and accounts can be closed for
breaking this, without notice.</p>
<p>Every post can be reported and every person can be blocked, from the dots on
the post itself. Reports are read.</p>

<h2>Ending it</h2>
<p>Delete your account whenever you like, from the app or from
<a href="/delete-account">reppo.app/delete-account</a>. We can close an account
that breaks these terms.</p>

<h2>No promises about uptime</h2>
<p>Reppo is provided as it is. It may be unavailable, it may lose data, and it
is free. To the extent the law allows, there is no liability for loss arising
from using it.</p>

<h2>Law</h2>
<p>These terms are governed by the laws of India.</p>

<h2>Contact</h2>
<p><a href="mailto:${CONTACT}">${CONTACT}</a></p>
`);
