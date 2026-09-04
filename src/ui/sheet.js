/* ---------------------------------------------------------------
   Confirmations and little menus.

   React Native's Alert.alert takes a list of buttons, but
   react-native-web ignores them — it forwards the title to
   window.alert and drops every callback on the floor. The app ships
   as a web app first, so anything built on Alert silently does
   nothing: "hold to remove" in the food diary has never worked in a
   browser.

   This is the replacement. One provider near the root, then

     const sheet = useSheet();
     const yes = await sheet.confirm({ title:'Remove this?', destructive:true });
     const pick = await sheet.choose({ title:'Post', options:[...] });

   Both resolve — null or false when it is dismissed — so callers
   read as straight-line code instead of nested callbacks.
   --------------------------------------------------------------- */
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { S, R, useTheme } from '../theme';
import { useLang } from '../lang';

const Ctx = createContext(null);
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

export function SheetProvider({ children }) {
  const [req, setReq] = useState(null);
  const resolver = useRef(null);

  const ask = useCallback((next) => new Promise((resolve) => {
    resolver.current = resolve;
    setReq(next);
  }), []);

  const settle = useCallback((value) => {
    setReq(null);
    const r = resolver.current;
    resolver.current = null;
    if (r) r(value);
  }, []);

  const api = useRef({
    /* options: [{ label, value, destructive, quiet }] */
    choose: (o) => ask({ kind: 'choose', ...o }),
    confirm: (o) => ask({ kind: 'confirm', ...o }).then((v) => v === true),
    /* a message with a single way out */
    tell: (o) => ask({ kind: 'tell', ...o }).then(() => undefined),
    /* the same, but small and quiet — for saying what a thing is
       rather than for asking anything */
    note: (o) => ask({ kind: 'tell', note: true, ...o }).then(() => undefined),
  }).current;

  return (
    <Ctx.Provider value={api}>
      {children}
      <SheetHost req={req} settle={settle} />
    </Ctx.Provider>
  );
}

export function useSheet() {
  const v = useContext(Ctx);
  if (v) return v;
  // Outside the provider nothing should silently succeed — that is the
  // exact bug this file exists to fix.
  return {
    choose: () => Promise.resolve(null),
    confirm: () => Promise.resolve(false),
    tell: () => Promise.resolve(),
    note: () => Promise.resolve(),
  };
}

function SheetHost({ req, settle }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: req ? 1 : 0,
      duration: req ? 170 : 110,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [req, slide]);

  if (!req) return null;

  const options = req.kind === 'choose'
    ? (req.options || [])
    : req.kind === 'confirm'
      ? [{
        label: req.confirmLabel || t('Yes'),
        value: true,
        destructive: !!req.destructive,
      }]
      : [{ label: req.confirmLabel || t('OK'), value: true }];

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => settle(null)}>
      <Pressable style={styles.scrim} onPress={() => settle(null)} />
      {/* Centred, not stuck to the bottom edge. A message about which
          mode you are now in is the thing on the screen — it should be
          in the middle of it, where the eye already is. */}
      <View style={styles.centre} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            req.note && styles.noteSheet,
            {
              marginBottom: Math.max(insets.bottom, 0),
              transform: [{
                scale: slide.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
              }],
              opacity: slide,
            },
          ]}
        >

          {req.title ? (
            <Text style={[styles.title, req.note && styles.noteTitle]}>{req.title}</Text>
          ) : null}
          {req.message ? (
            <Text style={[T.small, styles.msg, req.note && styles.noteMsg]}>{req.message}</Text>
          ) : null}

          {/* A list long enough to need it scrolls rather than running
              off the screen — the reminder times are nineteen rows. */}
          <ScrollView style={{ marginTop: S.md, maxHeight: 320 }}
            contentContainerStyle={{ paddingBottom: 2 }}
            showsVerticalScrollIndicator={false}>
            {options.map((o, i) => (
              <Pressable
                key={i}
                onPress={() => settle(o.value === undefined ? i : o.value)}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.raised }]}
              >
                <Text style={[
                  styles.rowTxt,
                  o.destructive && { color: C.danger },
                  o.quiet && { color: C.dim },
                ]}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {req.kind === 'tell' ? null : (
            <Pressable
              onPress={() => settle(null)}
              style={({ pressed }) => [styles.cancel, pressed && { backgroundColor: C.raised }]}
            >
              <Text style={[styles.rowTxt, { color: C.dim }]}>{req.cancelLabel || t('Cancel')}</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' },
  centre: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', padding: S.lg,
  },
  sheet: {
    width: '100%', maxWidth: 420,
    backgroundColor: C.surface, borderRadius: R.lg,
    paddingHorizontal: S.md, paddingTop: S.lg, paddingBottom: S.sm,
    borderWidth: 1, borderColor: C.line,
  },
  title: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 21, color: C.text,
    textAlign: 'center', paddingHorizontal: S.sm,
  },
  msg: { textAlign: 'center', marginTop: 6, paddingHorizontal: S.sm },
  /* A note is not a question, so it does not need the width or the
     weight of one. Narrower, shorter, and the name set in the hand
     the map is written in — which is the app's own voice rather than
     the voice it uses to ask whether you are sure. */
  noteSheet: { maxWidth: 332, paddingTop: S.md, paddingHorizontal: S.md },
  noteTitle: { fontFamily: 'Caveat_700Bold', fontSize: 30, lineHeight: 34 },
  noteMsg: { marginTop: 2, fontSize: 14.5, lineHeight: 21 },

  row: { paddingVertical: 15, borderRadius: R.sm, alignItems: 'center' },
  rowTxt: { fontFamily: 'WorkSans_500Medium', fontSize: 15.5, color: C.text },
  cancel: {
    paddingVertical: 15, borderRadius: R.sm, alignItems: 'center',
    marginTop: S.xs, borderTopWidth: 1, borderTopColor: C.line,
  },
});
