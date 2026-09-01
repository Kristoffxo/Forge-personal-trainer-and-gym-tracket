import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { S, R, useTheme } from '../theme';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

/* ---------------------------------------------------------------
   How much room the tab bar takes.

   It is 58 tall plus whatever the home indicator needs, so on most
   phones it covers the bottom 90 pixels of the screen. Every screen
   used to end with `paddingBottom: 70`, which is less than that —
   and the last thing on a workout screen is the button that starts
   it. That is why "Start this workout" was sometimes not there.

   One number, read from the device, used everywhere.
   --------------------------------------------------------------- */
export const TAB_BAR = 58;

export function useTabPad(extra = 20) {
  const insets = useSafeAreaInsets();
  return TAB_BAR + Math.max(insets.bottom, 8) + extra;
}

export function Label({ children, style, color }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return <Text style={[T.label, color && { color }, style]}>{children}</Text>;
}

/* Big, obvious, one per screen. */
export function Btn({ label, onPress, color, dark, disabled, busy, style, full = true }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  color = color || C.ember;
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue:v, useNativeDriver:true, speed:60, bounciness:4 }).start();
  return (
    <Pressable onPress={onPress} disabled={disabled || busy}
      onPressIn={() => to(0.97)} onPressOut={() => to(1)}>
      <Animated.View style={[
        styles.btn,
        { backgroundColor: dark ? 'transparent' : color,
          borderWidth: dark ? 1.5 : 0, borderColor: color,
          opacity: disabled ? 0.4 : 1, alignSelf: full ? 'stretch' : 'flex-start',
          transform:[{ scale:s }] },
        style,
      ]}>
        {busy ? <ActivityIndicator color={dark ? color : C.onAccent} />
              : <Text style={[styles.btnTxt, { color: dark ? color : C.onAccent }]}>{label}</Text>}
      </Animated.View>
    </Pressable>
  );
}

export function Press({ children, onPress, onLongPress, style, scaleTo = 0.98, disabled }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue:v, useNativeDriver:true, speed:40, bounciness:5 }).start();
  const flat = StyleSheet.flatten(style) || {};
  // a flex on the caller's style has to live on the Pressable, not the inner view,
  // or the row it sits in collapses
  const outer = flat.flex !== undefined ? { flex: flat.flex } : null;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} disabled={disabled}
      style={outer}
      onPressIn={() => to(scaleTo)} onPressOut={() => to(1)}>
      <Animated.View style={[style, { transform:[{ scale:s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Card({ children, style, color }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <View style={[styles.card, color && { borderLeftWidth:4, borderLeftColor:color }, style]}>
      {children}
    </View>
  );
}

/* Staggered entrances read as polish on four items and as a slow app
   on fifteen — a list with delay={i*40} was still arriving most of a
   second after it had loaded. The delay is capped so no screen ever
   takes longer than about a third of a second to finish appearing,
   however long the list is. */
const MAX_STAGGER = 200;

export function FadeIn({ children, delay = 0, from = 14, style }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const a = useRef(new Animated.Value(0)).current;
  const wait = Math.min(delay, MAX_STAGGER);
  useEffect(() => {
    Animated.timing(a, { toValue:1, duration:190, delay:wait, easing:EASE, useNativeDriver:true }).start();
  }, [a, wait]);
  return (
    <Animated.View style={[style, { opacity:a,
      transform:[{ translateY: a.interpolate({ inputRange:[0,1], outputRange:[from,0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export function Bar({ value, max, color, height = 6, style }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const a = useRef(new Animated.Value(0)).current;
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  useEffect(() => {
    Animated.timing(a, { toValue:pct, duration:420, easing:EASE, useNativeDriver:false }).start();
  }, [pct, a]);
  return (
    <View style={[{ height, backgroundColor:C.line, borderRadius:height/2, overflow:'hidden' }, style]}>
      <Animated.View style={{ height:'100%', backgroundColor:color,
        width: a.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }) }} />
    </View>
  );
}

export function Chip({ label, on, color, onPress }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  color = color || C.ember;
  return (
    <Press onPress={onPress} scaleTo={0.94}
      style={[styles.chip, { backgroundColor: on ? color : 'transparent',
                             borderColor: on ? color : C.line }]}>
      <Text style={[styles.chipTxt, { color: on ? C.onAccent : C.dim }]}>{label}</Text>
    </Press>
  );
}

export function useCountUp(target, duration = 360) {
  const a = useRef(new Animated.Value(0)).current;
  const [n, setN] = React.useState(0);
  useEffect(() => {
    const id = a.addListener(({ value }) => setN(Math.round(value)));
    Animated.timing(a, { toValue: target || 0, duration, easing:EASE, useNativeDriver:false }).start();
    return () => a.removeListener(id);
  }, [target, duration, a]);
  return n;
}

const makeStyles = (C, T) => StyleSheet.create({
  btn:{ paddingVertical:16, paddingHorizontal:26, borderRadius:R.md, alignItems:'center' },
  btnTxt:{ fontFamily:'WorkSans_500Medium', fontSize:14, letterSpacing:0.6 },
  card:{ backgroundColor:C.surface, borderRadius:R.md, padding:S.md },
  chip:{ paddingVertical:9, paddingHorizontal:16, borderRadius:R.pill, borderWidth:1.5, marginRight:8 },
  chipTxt:{ fontFamily:'WorkSans_500Medium', fontSize:12.5 },
});
