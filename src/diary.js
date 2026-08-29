/* Food diary rows, stored per signed-in person in Supabase. */
import { supabase } from './supabase';

export function todayKey(d) {
  const dt = d || new Date();
  return dt.getFullYear() + '-' +
    String(dt.getMonth() + 1).padStart(2, '0') + '-' +
    String(dt.getDate()).padStart(2, '0');
}

export async function loadDay(userId, day) {
  const { data, error } = await supabase.from('diary')
    .select('*').eq('user_id', userId).eq('day', day).order('created_at');
  return error ? [] : data;
}

export async function addEntry(userId, day, e) {
  const { error } = await supabase.from('diary').insert({
    user_id:userId, day, meal:e.meal, name:e.name, portion:e.portion,
    grams:e.grams, kcal:e.kcal, protein:e.protein, carbs:e.carbs, fat:e.fat,
  });
  return !error;
}

export async function removeEntry(id) {
  const { error } = await supabase.from('diary').delete().eq('id', id);
  return !error;
}

export async function loadRange(userId, days) {
  const from = new Date(); from.setDate(from.getDate() - (days - 1));
  const { data, error } = await supabase.from('diary')
    .select('*').eq('user_id', userId).gte('day', todayKey(from));
  return error ? [] : data;
}

export function totals(rows) {
  const t = { kcal:0, protein:0, carbs:0, fat:0 };
  (rows || []).forEach((e) => {
    t.kcal += Number(e.kcal) || 0; t.protein += Number(e.protein) || 0;
    t.carbs += Number(e.carbs) || 0; t.fat += Number(e.fat) || 0;
  });
  return { kcal:Math.round(t.kcal), protein:Math.round(t.protein),
           carbs:Math.round(t.carbs), fat:Math.round(t.fat) };
}
