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

  /* The philosophers. These are the ones the six o'clock
     notification draws from — a different one every day, picked by
     the date so everybody gets the same line on the same evening. */
  ['It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable.', 'Socrates'],
  ['The first wealth is health.', 'Ralph Waldo Emerson'],
  ['Difficulties strengthen the mind, as labour does the body.', 'Seneca'],
  ['The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius'],
  ['You have power over your mind — not outside events. Realise this, and you will find strength.', 'Marcus Aurelius'],
  ['Waste no more time arguing what a good man should be. Be one.', 'Marcus Aurelius'],
  ['First say to yourself what you would be; and then do what you have to do.', 'Epictetus'],
  ['No man is free who is not master of himself.', 'Epictetus'],
  ['Well-being is realised by small steps, but is truly no small thing.', 'Zeno of Citium'],
  ['Walking is man’s best medicine.', 'Hippocrates'],
  ['A sound mind in a sound body.', 'Juvenal'],
  ['The greatest wealth is health.', 'Virgil'],
  ['A feeble body weakens the mind.', 'Jean-Jacques Rousseau'],
  ['He who has a why to live can bear almost any how.', 'Friedrich Nietzsche'],
  ['That which does not kill us makes us stronger.', 'Friedrich Nietzsche'],
  ['We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant'],
  ['The body is the servant of the mind.', 'James Allen'],
  ['Begin at once to live, and count each separate day as a separate life.', 'Seneca'],
  ['It is not that we have a short time to live, but that we waste much of it.', 'Seneca'],
  ['The wish for healing has always been half of health.', 'Seneca'],
  ['Man is what he eats.', 'Ludwig Feuerbach'],
  ['Nothing is impossible to a willing heart.', 'John Heywood'],
  ['Know thyself.', 'Inscription at Delphi'],
  ['The unexamined life is not worth living.', 'Socrates'],
  ['Happiness is the highest good, and it is an activity of the soul.', 'Aristotle'],
  ['Patience is bitter, but its fruit is sweet.', 'Aristotle'],
  ['Whatever is worth doing at all is worth doing well.', 'Lord Chesterfield'],
  ['Energy and persistence conquer all things.', 'Benjamin Franklin'],
  ['To keep the body in good health is a duty, for otherwise we shall not be able to keep our mind strong and clear.', 'The Buddha'],
  ['Health is the greatest gift, contentment the greatest wealth.', 'The Buddha'],
];

/* The quote for a given day. Same for everyone on the same date, so
   the six o'clock notification and the app agree with each other. */
export function quoteForDate(d) {
  const t = d || new Date();
  const dayNo = Math.floor(
    Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 86400000,
  );
  return QUOTES[((dayNo % QUOTES.length) + QUOTES.length) % QUOTES.length];
}

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
