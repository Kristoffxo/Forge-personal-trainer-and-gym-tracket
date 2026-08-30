/* ---------------------------------------------------------------
   Circular progress, built from two clipped halves so it needs no
   SVG dependency — the native side of the build stays untouched.

   Each half clips a full ring whose border is coloured on two
   adjacent edges; rotating that ring sweeps the arc through 180°.
   --------------------------------------------------------------- */
import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

function HalfArc({ size, stroke, color, rotate, side }) {
  const half = size / 2;
  return (
    <View
      style={{
        position: 'absolute', width: half, height: size, overflow: 'hidden',
        left: side === 'right' ? half : 0,
      }}
    >
      <Animated.View
        style={{
          width: size, height: size, borderRadius: half,
          borderWidth: stroke,
          borderTopColor: color, borderRightColor: color,
          borderBottomColor: 'transparent', borderLeftColor: 'transparent',
          position: 'absolute', left: side === 'right' ? -half : 0,
          transform: [{ rotate }],
        }}
      />
    </View>
  );
}

export function Ring({
  size = 190, stroke = 9, progress = 0,
  color = '#E85C24', track = '#332F2D', over = '#E4453A', children,
}) {
  const a = useRef(new Animated.Value(0)).current;
  const p = Math.max(0, progress);
  const clamped = Math.min(1, p);

  useEffect(() => {
    Animated.timing(a, {
      toValue: clamped, duration: 520, easing: EASE, useNativeDriver: true,
    }).start();
  }, [clamped, a]);

  const stripe = p > 1 ? over : color;

  // right half sweeps 0 → 50%, left half picks up 50 → 100%
  const rightRotate = a.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-135deg', '45deg', '45deg'],
  });
  // The left half must stay parked over the RIGHT side (hidden by its own
  // clip) until the sweep passes 50%, otherwise it shows a full arc at zero.
  const leftRotate = a.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['45deg', '45deg', '225deg'],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* track */}
      <View
        style={{
          position: 'absolute', width: size, height: size, borderRadius: size / 2,
          borderWidth: stroke, borderColor: track,
        }}
      />
      <HalfArc size={size} stroke={stroke} color={stripe} rotate={rightRotate} side="right" />
      <HalfArc size={size} stroke={stroke} color={stripe} rotate={leftRotate} side="left" />
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}
