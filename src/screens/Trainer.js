/* ---------------------------------------------------------------
   Ask a trainer.

   A real person answers. That is stated at the top of the screen
   and it is not decoration — the whole thing being sold here is
   that a human read your question, so an app that quietly answered
   with a model would be lying about the only thing it charges for.

   Credits are lines. Ten credits buys a ten-line question.
   --------------------------------------------------------------- */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TextInput, StyleSheet, ActivityIndicator,
  Platform, KeyboardAvoidingView,
} from 'react-native';

import { S, R, useTheme } from '../theme';
import { Btn, Press, FadeIn, Label } from '../ui/kit';
import { useSheet } from '../ui/sheet';
import { useLang } from '../lang';
import { PHOTO } from '../photos';
import { PACK, MAX_LINES, costOf, myCredits, loadThread, ask, payConfig, buy } from '../trainer';

export default function Trainer({ user, profile }) {
  const { C, T } = useTheme();
  const { t } = useLang();
  const styles = makeStyles(C, T);
  const sheet = useSheet();

  const [credits, setCredits] = useState(null);
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState({ enabled: false });
  const [buying, setBuying] = useState(false);
  const scroller = useRef(null);

  const load = useCallback(async () => {
    setCredits(await myCredits(user.id));
    setThread(await loadThread(user.id));
    setPay(await payConfig());
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const cost = costOf(draft);
  const canAfford = credits !== null && cost > 0 && credits >= cost;

  async function send() {
    setBusy(true);
    const r = await ask(user.id, draft);
    setBusy(false);

    if (r.error === 'notEnough') {
      await sheet.tell({
        title: t('Not enough credits'),
        message: `${t('That question costs')} ${r.cost} ${r.cost === 1 ? t('credit') : t('credits')}. ${t('You have')} ${credits}.`,
      });
      return;
    }
    if (r.error) { await sheet.tell({ title: t('Could not send'), message: r.error }); return; }

    setDraft('');
    setCredits(r.left);
    setThread(thread.concat(r.message));
    setTimeout(() => scroller.current && scroller.current.scrollToEnd({ animated: true }), 80);
  }

  async function topUp() {
    if (!pay.enabled) {
      await sheet.tell({
        title: t('Payments are not switched on yet'),
        message: t('Nothing was charged.'),
      });
      return;
    }

    setBuying(true);
    const r = await buy({
      userId: user.id,
      name: (profile && profile.full_name) || '',
      email: user.email,
    });
    setBuying(false);

    if (r.cancelled) return;                 // they closed it; say nothing
    if (r.error === 'off') return;
    if (r.error) { await sheet.tell({ title: t('Payment problem'), message: r.error }); return; }

    if (r.pending) {
      await sheet.tell({
        title: t('Payment received'),
        message: t('Credits arrive in a minute.'),
      });
      load();
      return;
    }

    setCredits(r.credits);
    await sheet.tell({
      title: t('Credits added'),
      message: `${t('You now have')} ${r.credits} ${t('credits')}.`,
    });
  }

  if (credits === null) {
    return <View style={styles.boot}><ActivityIndicator color={C.teal} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <ScrollView ref={scroller} contentContainerStyle={{ padding: S.lg, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled">

        {/* Who is on the other end, in as few words as it can be said
            in. This screen was three paragraphs of explaining. */}
        <FadeIn>
          <Image source={PHOTO.bench} style={styles.hero} resizeMode="cover" />
          <View style={styles.human}>
            <Text style={styles.humanTitle}>{t('Ask a real person')}</Text>
            <Text style={[T.small, { marginTop: 2 }]}>{t('Not a bot. Answers in a few hours.')}</Text>
          </View>
        </FadeIn>

        {/* credits */}
        <FadeIn delay={50}>
          <View style={styles.wallet}>
            <View style={{ flex: 1 }}>
              <Label>{t('Credits')}</Label>
              <Text style={styles.balance}>{credits}</Text>
              <Text style={T.tiny}>{t('1 credit = 1 line')}</Text>
            </View>
            <Press onPress={topUp} disabled={buying} scaleTo={0.95}
              style={[styles.buy, buying && { opacity: 0.5 }]}>
              <Text style={styles.buyTop}>{PACK.credits} {t('for')} ₹{PACK.rupees}</Text>
              <Text style={styles.buyBottom}>{buying ? t('Opening…') : t('Top up')}</Text>
            </Press>
          </View>
          <Text style={[T.tiny, { marginTop: 6 }]}>
            {pay.enabled ? t('Paid by Razorpay.') : t('Payments are off. Nothing here can charge you.')}
          </Text>
        </FadeIn>

        {/* the conversation */}
        <Label style={{ marginTop: S.xl, marginBottom: S.sm }}>{t('Your questions')}</Label>

        {thread.length === 0 ? (
          <Text style={T.small}>{t('Ask anything. Form, a plan, an injury, food.')}</Text>
        ) : (
          thread.map((m) => {
            const mine = m.sender === 'client';
            return (
              <View key={m.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.who, { color: mine ? C.teal : C.amber }]}>
                  {mine ? t('You') : t('Trainer')}
                </Text>
                <Text style={[T.bodyOn, { marginTop: 2 }]}>{m.body}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* asking */}
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('Type your question')}
          placeholderTextColor={C.faint}
          multiline
          maxLength={900}
          style={styles.input}
        />
        <View style={styles.composerFoot}>
          <Text style={T.tiny}>
            {cost === 0
              ? `${t('Max')} ${MAX_LINES} ${t('lines')}`
              : `${cost} ${cost === 1 ? t('credit') : t('credits')}`}
          </Text>
          <View style={{ flex: 1 }} />
          <Btn
            label={t('Send')}
            color={C.teal}
            full={false}
            busy={busy}
            disabled={!canAfford}
            onPress={send}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },

  hero: { width: '100%', height: 128, borderRadius: R.md, backgroundColor: C.raised },
  human: {
    backgroundColor: C.surface, borderRadius: R.md, padding: S.md, marginTop: S.sm,
    borderLeftWidth: 4, borderLeftColor: C.teal,
  },
  humanTitle: { fontFamily: 'WorkSans_600SemiBold', fontSize: 19, color: C.text },

  wallet: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderRadius: R.md, padding: S.md, marginTop: S.md,
  },
  balance: { fontFamily: 'WorkSans_600SemiBold', fontSize: 38, color: C.text, lineHeight: 42 },
  buy: {
    borderRadius: R.md, borderWidth: 1.5, borderColor: C.teal,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
  },
  buyTop: { fontFamily: 'WorkSans_600SemiBold', fontSize: 14, color: C.teal },
  buyBottom: { fontFamily: 'WorkSans_400Regular', fontSize: 11, color: C.dim, marginTop: 1 },

  bubble: { borderRadius: R.md, padding: S.md, marginBottom: 9, maxWidth: '92%' },
  mine: { backgroundColor: C.surface, alignSelf: 'flex-end' },
  theirs: { backgroundColor: C.raised, alignSelf: 'flex-start' },
  who: {
    fontFamily: 'WorkSans_500Medium', fontSize: 10.5,
    letterSpacing: 1, textTransform: 'uppercase',
  },

  composer: {
    padding: S.md, backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.line,
  },
  input: {
    backgroundColor: C.raised, borderRadius: R.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'WorkSans_400Regular', fontSize: 15, color: C.text,
    minHeight: 74, textAlignVertical: 'top',
  },
  composerFoot: { flexDirection: 'row', alignItems: 'center', marginTop: S.sm },
});
