import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Image,
         KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Press, FadeIn, Label } from '../ui/kit';
import { IMG } from '../images';
import { loadThread, sendAsClient, listen, subscribe } from '../chat';

export default function Trainer({ user }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const refresh = useCallback(() => { loadThread(user.id).then(setMsgs); }, [user.id]);

  useEffect(() => {
    refresh();
    const un = subscribe(setMsgs);
    const stop = listen(refresh);
    return () => { un(); stop(); };
  }, [refresh]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (listRef.current && msgs && msgs.length) listRef.current.scrollToEnd({ animated:true });
    }, 90);
    return () => clearTimeout(id);
  }, [msgs]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setText(''); setSending(true);
    await sendAsClient(user.id, body);
    setSending(false);
  }

  return (
    <KeyboardAvoidingView style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>

      <FlatList
        ref={listRef}
        data={msgs || []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingBottom:S.lg }}
        ListHeaderComponent={<Intro />}
        ListEmptyComponent={
          msgs === null
            ? <ActivityIndicator color={C.violet} style={{ marginTop:S.xl }} />
            : null
        }
        renderItem={({ item }) => <Bubble m={item} />}
      />

      <View style={styles.composer}>
        <TextInput value={text} onChangeText={setText}
          placeholder="Ask Sid anything about your training…"
          placeholderTextColor={C.faint} style={styles.input} multiline />
        <Press onPress={send} disabled={!text.trim() || sending} scaleTo={0.9}
          style={[styles.send, { opacity: text.trim() ? 1 : 0.35 }]}>
          <Text style={styles.sendTxt}>{sending ? '…' : 'Send'}</Text>
        </Press>
      </View>
    </KeyboardAvoidingView>
  );
}

/* Sid introducing himself — the first thing anyone sees on this tab. */
function Intro() {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <FadeIn>
      <View style={styles.intro}>
        <Image source={IMG.coach} style={styles.avatar} />
        <View style={{ flex:1, marginLeft:S.md }}>
          <Label color={C.violet}>Your personal trainer</Label>
          <Text style={styles.name}>Siddhartha Gupta</Text>
          <View style={styles.liveRow}>
            <View style={styles.dot} />
            <Text style={T.tiny}>Replies himself — never a bot</Text>
          </View>
        </View>
      </View>

      <View style={styles.hello}>
        <Text style={styles.helloTxt}>
          Hi, I’m Siddhartha Gupta, your personal trainer.
        </Text>
        <Text style={[T.body, { marginTop:S.sm }]}>
          Ask me about any exercise, your form, your plan, or what to eat.
          I read every message myself and I’ll get back to you.
        </Text>
      </View>

      <View style={styles.prompts}>
        <Label style={{ marginBottom:S.sm }}>Not sure what to ask?</Label>
        {[
          'Is my squat depth right?',
          'How much protein should I eat?',
          'I have a shoulder niggle — what do I swap?',
          'Can you check this week’s plan?',
        ].map((q) => (
          <View key={q} style={styles.prompt}>
            <Text style={[T.small, { color:C.dim }]}>“{q}”</Text>
          </View>
        ))}
      </View>
    </FadeIn>
  );
}

function Bubble({ m }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const mine = m.mine;
  const time = new Date(m.at).toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
  return (
    <FadeIn from={10}>
      <View style={[styles.row, mine && { alignItems:'flex-end' }]}>
        {!mine ? (
          <View style={styles.fromRow}>
            <Image source={IMG.coach} style={styles.mini} />
            <Text style={[T.tiny, { marginLeft:6 }]}>Sid</Text>
          </View>
        ) : null}
        <View style={[styles.bubble, mine ? styles.mineB : styles.theirsB]}>
          <Text style={[T.bodyOn, mine && { color:C.onAccent }]}>{m.text}</Text>
        </View>
        <Text style={[T.tiny, { marginTop:4 }]}>{time}</Text>
      </View>
    </FadeIn>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap:{ flex:1, backgroundColor:C.bg },
  intro:{ flexDirection:'row', alignItems:'center', padding:S.lg, paddingBottom:S.md },
  avatar:{ width:64, height:64, borderRadius:32, borderWidth:2, borderColor:C.violet },
  mini:{ width:18, height:18, borderRadius:9 },
  name:{ fontFamily:'Forum_400Regular', fontSize:26, color:C.text, marginTop:2 },
  liveRow:{ flexDirection:'row', alignItems:'center', marginTop:3 },
  dot:{ width:6, height:6, borderRadius:3, backgroundColor:C.lime, marginRight:6 },
  hello:{ marginHorizontal:S.lg, backgroundColor:C.surface, borderRadius:R.md,
          padding:S.md, borderLeftWidth:4, borderLeftColor:C.violet },
  helloTxt:{ fontFamily:'Forum_400Regular', fontSize:21, lineHeight:27, color:C.text },
  prompts:{ padding:S.lg, paddingBottom:S.sm },
  prompt:{ backgroundColor:C.surface, borderRadius:R.sm, padding:12, marginBottom:8 },
  row:{ paddingHorizontal:S.lg, marginBottom:S.md },
  fromRow:{ flexDirection:'row', alignItems:'center', marginBottom:5 },
  bubble:{ maxWidth:'86%', paddingVertical:12, paddingHorizontal:15, borderRadius:R.md },
  mineB:{ backgroundColor:C.violet, borderBottomRightRadius:4 },
  theirsB:{ backgroundColor:C.surface, borderBottomLeftRadius:4, borderWidth:1, borderColor:C.line },
  composer:{ flexDirection:'row', alignItems:'flex-end', padding:S.md,
             borderTopWidth:1, borderTopColor:C.line, backgroundColor:C.bg },
  input:{ flex:1, backgroundColor:C.surface, borderRadius:R.md, paddingHorizontal:14,
          paddingVertical:12, marginRight:10, maxHeight:120,
          fontFamily:'WorkSans_400Regular', fontSize:15, color:C.text },
  send:{ backgroundColor:C.violet, borderRadius:R.md, paddingHorizontal:18, paddingVertical:13 },
  sendTxt:{ fontFamily:'WorkSans_500Medium', fontSize:13.5, color:C.onAccent },
});
