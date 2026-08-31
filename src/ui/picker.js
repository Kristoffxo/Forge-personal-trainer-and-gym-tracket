/* ---------------------------------------------------------------
   A scrolling number picker.

   Typing a weight into a keyboard mid-set is the wrong interaction —
   your hands are chalked, the phone is on the floor, and you have
   forty seconds. Flicking through a row of numbers and letting one
   land in the middle takes one thumb.

   Snapping is done with `snapToInterval`, and the value is read off
   the offset rather than tracked separately, so the number under the
   marker is always the number you get.
   --------------------------------------------------------------- */
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { S, R, useTheme } from '../theme';

const ITEM = 62;      // width of one number
const SIDE = 3;       // how many are visible either side

export function NumberPicker({ values, value, onChange, colour, suffix, width }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const ref = useRef(null);
  const settled = useRef(value);
  const [box, setBox] = useState(width || 0);

  const pad = Math.max(0, (box - ITEM) / 2);
  const index = Math.max(0, values.indexOf(value));

  /* Keep the view in step when the value is changed from outside —
     carrying last session's weight forward, say. */
  useEffect(() => {
    if (!box || !ref.current) return;
    const animated = settled.current !== value;
    settled.current = value;
    /* The first scroll has to wait a frame: onLayout fires before the
       row of numbers has been measured, and scrolling to an offset the
       content does not have yet silently does nothing — which left the
       chosen value sitting outside the marker. */
    const go = () => ref.current && ref.current.scrollTo({ x: index * ITEM, animated });
    if (animated) go();
    else requestAnimationFrame(() => requestAnimationFrame(go));
  }, [value, index, box]);

  function land(e) {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / ITEM);
    const v = values[Math.max(0, Math.min(values.length - 1, i))];
    if (v !== undefined && v !== value) {
      settled.current = v;
      onChange(v);
    }
  }

  return (
    <View
      style={[styles.wrap, width ? { width } : null]}
      onLayout={(e) => setBox(e.nativeEvent.layout.width)}
    >
      {/* the marker the chosen number sits inside */}
      {box ? (
        <View pointerEvents="none"
          style={[styles.marker, { left: pad, width: ITEM, borderColor: colour || C.ember }]} />
      ) : null}

      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: pad }}
        onMomentumScrollEnd={land}
        onScrollEndDrag={land}
      >
        {values.map((v, i) => {
          const on = v === value;
          return (
            <Pressable
              key={String(v)}
              onPress={() => {
                settled.current = v;
                onChange(v);
                if (ref.current) ref.current.scrollTo({ x: i * ITEM, animated: true });
              }}
              style={styles.item}
            >
              <Text style={[styles.num, on && { color: colour || C.ember }]}>
                {v === 0 ? '—' : v}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

    </View>
  );
}

/* 0, then 2.5 kg upwards — the smallest jump most gyms can actually
   make, and the numbers everybody's plates add up to. */
export const WEIGHTS = [0].concat(
  Array.from({ length: 80 }, (_, i) => Math.round((i + 1) * 2.5 * 10) / 10),
);

/* 5 to 25. Below five is a max attempt, above it is cardio. */
export const REPS = Array.from({ length: 21 }, (_, i) => i + 5);

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { height: 52, justifyContent: 'center' },
  marker: {
    position: 'absolute', top: 0, bottom: 0,
    borderRadius: R.sm, borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  item: { width: ITEM, height: 52, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: 'WorkSans_500Medium', fontSize: 19, color: C.dim },
});
