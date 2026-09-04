/* ---------------------------------------------------------------
   Drag in from the left edge to go back.

   Every screen that can be backed out of already takes an `onBack`;
   this gives that function a gesture as well as a button. Wrap the
   screen's outermost view and the arrow in the corner keeps working
   exactly as it did.

   Two things keep it from firing when nobody meant it to:

   The drag has to start within EDGE points of the left side. Anywhere
   else and a sideways flick while reading — or a thumb resting on a
   list — would throw you out of the screen.

   And it has to be more sideways than not. A ScrollView claims the
   responder the moment a drag looks vertical, so in practice the
   parent is only ever asked about horizontal ones; the ratio check
   is there for the screens with nothing scrollable in them, where
   nobody else is competing for the gesture.
   --------------------------------------------------------------- */
import React, { useMemo } from 'react';
import { View, PanResponder } from 'react-native';

const EDGE = 28;     // how far in from the left a drag may start
const TRIP = 68;     // how far it has to travel to count

export function SwipeBack({ onBack, children, style, enabled = true }) {
  const pan = useMemo(() => {
    if (!enabled || typeof onBack !== 'function') return null;
    return PanResponder.create({
      /* Never on touch-down: taps belong to whatever is underneath. */
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (e, g) => {
        /* Where the finger went down, not where it is now. */
        const startX = e.nativeEvent.pageX - g.dx;
        return startX <= EDGE && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6;
      },
      onPanResponderRelease: (e, g) => {
        /* A long drag, or a short quick flick. */
        if (g.dx > TRIP || (g.dx > 24 && g.vx > 0.5)) onBack();
      },
      onPanResponderTerminationRequest: () => true,
    });
  }, [onBack, enabled]);

  return (
    <View style={[{ flex: 1 }, style]} {...(pan ? pan.panHandlers : null)}>
      {children}
    </View>
  );
}
