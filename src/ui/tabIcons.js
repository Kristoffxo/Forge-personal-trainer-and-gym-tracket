/* ---------------------------------------------------------------
   The five icons along the bottom.

   Drawn from Views rather than pulled from an icon font. The app has
   no icon dependency and adding one for five glyphs would put a
   megabyte of vector font into a bundle that is already large. At
   22px these read as well as anything from a set, and they take the
   accent colour like everything else.

   Each is built inside a 24x24 box so they line up with each other
   whatever their real shape.
   --------------------------------------------------------------- */
import React from 'react';
import { View } from 'react-native';

const BOX = { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' };

/* Train — a dumbbell, seen side on. */
function Dumbbell({ c }) {
  return (
    <View style={BOX}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 4, height: 14, borderRadius: 1.5, backgroundColor: c }} />
        <View style={{ width: 2.5, height: 9, backgroundColor: c, marginLeft: 1 }} />
        <View style={{ width: 6, height: 2.5, backgroundColor: c }} />
        <View style={{ width: 2.5, height: 9, backgroundColor: c, marginRight: 1 }} />
        <View style={{ width: 4, height: 14, borderRadius: 1.5, backgroundColor: c }} />
      </View>
    </View>
  );
}

/* Food — a leaf on its stem. */
function Leaf({ c }) {
  return (
    <View style={BOX}>
      <View style={{
        width: 15, height: 15, backgroundColor: c,
        borderTopLeftRadius: 15, borderBottomRightRadius: 15,
        transform: [{ rotate: '-8deg' }],
      }} />
      <View style={{
        position: 'absolute', bottom: 2, width: 2, height: 8,
        borderRadius: 1, backgroundColor: c, transform: [{ rotate: '18deg' }],
      }} />
    </View>
  );
}

/* Discover — a compass, needle pointing north-east. */
function Compass({ c }) {
  return (
    <View style={BOX}>
      <View style={{
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c,
      }} />
      <View style={{
        position: 'absolute', width: 9, height: 9, backgroundColor: c,
        transform: [{ rotate: '45deg' }, { scaleX: 0.42 }],
      }} />
    </View>
  );
}

/* Challenges — a trophy. */
function Trophy({ c }) {
  return (
    <View style={BOX}>
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 13, height: 11, backgroundColor: c,
          borderBottomLeftRadius: 7, borderBottomRightRadius: 7,
        }} />
        <View style={{ width: 3, height: 4, backgroundColor: c }} />
        <View style={{ width: 12, height: 2.5, borderRadius: 1.5, backgroundColor: c }} />
      </View>
      {/* the handles */}
      <View style={{
        position: 'absolute', left: 2, top: 6, width: 5, height: 8,
        borderWidth: 2, borderColor: c, borderRightWidth: 0,
        borderTopLeftRadius: 5, borderBottomLeftRadius: 5,
      }} />
      <View style={{
        position: 'absolute', right: 2, top: 6, width: 5, height: 8,
        borderWidth: 2, borderColor: c, borderLeftWidth: 0,
        borderTopRightRadius: 5, borderBottomRightRadius: 5,
      }} />
    </View>
  );
}

/* Journey — a peak with a smaller one behind it. Two rotated squares
   clipped by the box, which is cheaper than a path and reads as a
   mountain at 20px, which is the only size it is ever drawn at. */
function Peak({ c }) {
  return (
    <View style={[BOX, { overflow: 'hidden', justifyContent: 'flex-end' }]}>
      <View style={{ height: 15, width: 22, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{
          position: 'absolute', left: 0, bottom: 0,
          width: 12, height: 12, backgroundColor: c, opacity: 0.55,
          transform: [{ rotate: '45deg' }, { translateY: 3 }],
        }} />
        <View style={{
          position: 'absolute', right: 1, bottom: 0,
          width: 15, height: 15, backgroundColor: c,
          transform: [{ rotate: '45deg' }, { translateY: 4 }],
        }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4,
                       backgroundColor: 'transparent' }} />
      </View>
    </View>
  );
}

export const TAB_ICON = {
  train: Dumbbell,
  food: Leaf,
  feed: Compass,
  you: Trophy,
  journey: Peak,
};

export function TabIcon({ name, colour }) {
  const Glyph = TAB_ICON[name] || Dumbbell;
  return <Glyph c={colour} />;
}
