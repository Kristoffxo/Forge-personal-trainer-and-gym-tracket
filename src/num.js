/* ---------------------------------------------------------------
   Number parsing that copes with a non-Latin keyboard.

   On an Indian-locale phone the number pad often produces Devanagari
   digits (०१२३४५६७८९). parseFloat cannot read those, so heights,
   weights and quantities silently became NaN. Same for Arabic-Indic,
   which shows up on some setups. Map them all back to 0-9 first.
   --------------------------------------------------------------- */
const MAPS = [
  ['०', '९'],   // Devanagari ०–९
  ['٠', '٩'],   // Arabic-Indic ٠–٩
  ['۰', '۹'],   // Extended Arabic-Indic ۰–۹
  ['૦', '૯'],   // Gujarati
  ['௦', '௯'],   // Tamil
  ['౦', '౯'],   // Telugu
  ['০', '৯'],   // Bengali
];

export function toLatinDigits(input) {
  let s = String(input == null ? '' : input);
  MAPS.forEach(([from]) => {
    const base = from.charCodeAt(0);
    s = s.replace(new RegExp('[' + from + '-' + String.fromCharCode(base + 9) + ']', 'g'),
                  (d) => String(d.charCodeAt(0) - base));
  });
  return s.replace(/[٫٬․]/g, '.').replace(',', '.');
}

/** parseFloat that understands those keyboards. NaN-safe. */
export function num(input) {
  const v = parseFloat(toLatinDigits(input));
  return isFinite(v) ? v : NaN;
}

/** parseInt equivalent. */
export function int(input, fallback) {
  const v = parseInt(toLatinDigits(input), 10);
  return isFinite(v) ? v : (fallback === undefined ? NaN : fallback);
}
