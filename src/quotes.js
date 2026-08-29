/* ---------------------------------------------------------------
   The same lines the website greets visitors with. A different one
   each time, never the same twice running.
   --------------------------------------------------------------- */
export const QUOTES = [
  ['Exercise is king. Nutrition is queen. Put them together and you’ve got a kingdom.', 'Jack LaLanne'],
  ['Stimulate, don’t annihilate.', 'Lee Haney'],
  ['The last three or four reps is what makes the muscle grow.', 'Arnold Schwarzenegger'],
  ['Don’t count the days. Make the days count.', 'Muhammad Ali'],
  ['Take care of your body. It’s the only place you have to live.', 'Jim Rohn'],
  ['No man has the right to be an amateur in the matter of physical training.', 'Socrates'],
  ['Everybody wants to be a bodybuilder, but nobody wants to lift heavy weight.', 'Ronnie Coleman'],
  ['If you think lifting weights is dangerous, try being weak.', 'Bret Contreras'],
  ['Fatigue makes cowards of us all.', 'Vince Lombardi'],
  ['As you think, so shall you become.', 'Bruce Lee'],
];

let last = -1;
export function nextQuote() {
  if (QUOTES.length < 2) return QUOTES[0];
  let i = Math.floor(Math.random() * QUOTES.length);
  if (i === last) i = (i + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length;
  last = i;
  return QUOTES[i];
}

/* Stable for a given day — the home screen shouldn't reshuffle on every render. */
export function quoteOfDay() {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
  return QUOTES[seed % QUOTES.length];
}
