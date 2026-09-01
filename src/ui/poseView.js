/* ---------------------------------------------------------------
   What the camera is looking at.

   The video, the skeleton drawn over it, and the count. Drawing the
   skeleton is not decoration: it is the only way somebody can tell
   whether the app can actually see them before they have wasted
   twenty seconds of a sixty-second round on reps it did not count.

   Web only — Compete checks before it renders this.
   --------------------------------------------------------------- */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { S, R, useTheme } from '../theme';
import { useLang } from '../lang';
import { startPose, BONES } from './poseCam';

export function PoseView({ move, score, seeing, onFrame, onError }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(null);

  useEffect(() => {
    let stop = null;
    let live = true;

    (async () => {
      try {
        const draw = (pts) => {
          const c = canvasRef.current;
          const v = videoRef.current;
          if (!c || !v) return;
          const w = v.videoWidth || 640;
          const h = v.videoHeight || 480;
          if (c.width !== w) { c.width = w; c.height = h; }
          const g = c.getContext('2d');
          g.clearRect(0, 0, w, h);
          if (!pts) return;

          g.strokeStyle = '#FE4E02';
          g.lineWidth = Math.max(2, w / 180);
          g.lineCap = 'round';
          BONES.forEach(([a, b]) => {
            const pa = pts[a], pb = pts[b];
            if (!pa || !pb) return;
            if ((pa.visibility ?? 1) < 0.5 || (pb.visibility ?? 1) < 0.5) return;
            g.beginPath();
            g.moveTo(pa.x * w, pa.y * h);
            g.lineTo(pb.x * w, pb.y * h);
            g.stroke();
          });

          g.fillStyle = '#FFFFFF';
          pts.forEach((p) => {
            if ((p.visibility ?? 1) < 0.5) return;
            g.beginPath();
            g.arc(p.x * w, p.y * h, Math.max(2, w / 220), 0, Math.PI * 2);
            g.fill();
          });
        };

        stop = await startPose(videoRef.current, (pts, tMs) => {
          if (!live) return;
          draw(pts);
          onFrame(pts, tMs);
        }, onError);

        if (live) setReady(true);
      } catch (e) {
        if (live) { setFailed(e.message); if (onError) onError(e); }
      }
    })();

    return () => { live = false; if (stop) stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        {/* react-native-web passes unknown tags straight through */}
        {React.createElement('video', {
          ref: videoRef,
          style: { position: 'absolute', inset: 0, width: '100%', height: '100%',
                   objectFit: 'cover', transform: 'scaleX(-1)' },
          playsInline: true, muted: true,
        })}
        {React.createElement('canvas', {
          ref: canvasRef,
          style: { position: 'absolute', inset: 0, width: '100%', height: '100%',
                   objectFit: 'cover', transform: 'scaleX(-1)' },
        })}

        <View style={styles.countWrap} pointerEvents="none">
          <Text style={styles.count}>{score}</Text>
        </View>

        {!ready && !failed ? (
          <View style={styles.veil}>
            <ActivityIndicator color={C.ember} />
            <Text style={[T.small, { marginTop: S.sm }]}>{t('Starting the camera')}</Text>
          </View>
        ) : null}

        {failed ? (
          <View style={styles.veil}>
            <Text style={[T.bodyOn, { textAlign: 'center' }]}>{failed}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.status, { color: seeing ? C.lime : C.amber }]}>
        {seeing ? t('I can see you') : t('Step back until you are all in frame')}
      </Text>
      <Text style={T.tiny}>{t(move.name)}</Text>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', padding: S.md },
  stage: {
    width: '100%', flex: 1, borderRadius: R.lg, overflow: 'hidden',
    backgroundColor: '#000', borderWidth: 2, borderColor: C.line,
  },
  countWrap: { position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center' },
  count: {
    fontFamily: 'WorkSans_600SemiBold', fontSize: 74, lineHeight: 80, color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 12,
  },
  veil: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', padding: S.lg,
  },
  status: { fontFamily: 'WorkSans_500Medium', fontSize: 15, marginTop: S.md },
});
