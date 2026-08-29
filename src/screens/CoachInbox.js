import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Image,
         KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { S, R, useTheme } from '../theme';
import { Press, FadeIn, Label, Card } from '../ui/kit';
import { IMG } from '../images';
import { listThreads, loadThread, sendAsCoach, listen } from '../chat';
import { loadRange, totals } from '../diary';
import { signOut } from '../auth';

export default function CoachInbox() {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const [threads, setThreads] = useState(null);
  const [open, setOpen] = useState(null);

  const refresh = useCallback(() => { listThreads().then(setThreads); }, []);
  useEffect(() => { refresh(); const stop = listen(refresh); return stop; }, [refresh]);

  if (open) return <Thread t={open} onBack={() => { setOpen(null); refresh(); }} />;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Label color={C.ember}>Coach portal</Label>
        <Text style={styles.title}>Your clients</Text>
        <Text style={[T.small, { marginTop:2 }]}>
          {threads ? threads.length + ' active conversation' + (threads.length === 1 ? '' : 's') : ' '}
        </Text>
      </View>

      {threads === null ? <ActivityIndicator color={C.ember} style={{ marginTop:S.xl }} /> : (
        <FlatList
          data={threads} keyExtractor={(t) => t.userId}
          contentContainerStyle={{ padding:S.lg }}
          ListEmptyComponent={
            <Card><Text style={T.body}>
              No client has written in yet. Once someone messages you from their
              Trainer tab, the thread appears here.
            </Text></Card>}
          renderItem={({ item, index }) => (
            <FadeIn delay={index * 50}>
              <Press onPress={() => setOpen(item)} scaleTo={0.985} style={styles.thread}>
                <View style={styles.initial}>
                  <Text style={styles.initialTxt}>
                    {(item.name || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex:1, marginHorizontal:S.md }}>
                  <Text style={styles.clientName}>{item.name}</Text>
                  <Text style={T.small} numberOfLines={1}>
                    {item.from === 'coach' ? 'You: ' : ''}{item.last}
                  </Text>
                </View>
                {item.from === 'client'
                  ? <View style={styles.unread} />
                  : <Text style={T.tiny}>
                      {new Date(item.at).toLocaleDateString(undefined,{day:'numeric',month:'short'})}
                    </Text>}
              </Press>
            </FadeIn>
          )}
        />
      )}

      <View style={{ padding:S.lg }}>
        <Press onPress={signOut} style={styles.signout}>
          <Text style={[T.small, { textAlign:'center' }]}>Sign out</Text>
        </Press>
      </View>
    </View>
  );
}

function Thread({ t, onBack }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [food, setFood] = useState(null);
  const listRef = useRef(null);

  const refresh = useCallback(() => { loadThread(t.userId).then(setMsgs); }, [t.userId]);
  useEffect(() => {
    refresh();
    loadRange(t.userId, 7).then(setFood);
    const stop = listen(refresh);
    return stop;
  }, [refresh, t.userId]);

  async function reply() {
    const body = text.trim();
    if (!body) return;
    setText('');
    await sendAsCoach(t.userId, body);
    refresh();
  }

  const week = totals(food);
  const days = food ? new Set(food.map((r) => r.day)).size : 0;

  return (
    <KeyboardAvoidingView style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
      <View style={styles.head}>
        <Press onPress={onBack} scaleTo={0.94} style={{ alignSelf:'flex-start' }}>
          <Text style={[T.small, { color:C.ember }]}>← All clients</Text>
        </Press>
        <Text style={[styles.title, { fontSize:26, marginTop:6 }]}>{t.name}</Text>
        {food ? (
          <View style={styles.statsRow}>
            <Stat v={days} label="days logged" />
            <Stat v={days ? Math.round(week.kcal / days) : 0} label="avg kcal" />
            <Stat v={days ? Math.round(week.protein / days) : 0} label="avg protein" />
          </View>
        ) : null}
      </View>

      <FlatList
        ref={listRef} data={msgs || []} keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding:S.lg }}
        onContentSizeChange={() => listRef.current && listRef.current.scrollToEnd({ animated:true })}
        renderItem={({ item }) => {
          const fromClient = item.sender === 'client';
          return (
            <FadeIn from={8}>
              <View style={{ marginBottom:S.md, alignItems: fromClient ? 'flex-start':'flex-end' }}>
                <Label style={{ marginBottom:4 }}>{fromClient ? t.name : 'You'}</Label>
                <View style={[styles.bubble, fromClient ? styles.theirs : styles.mine]}>
                  <Text style={[T.bodyOn, !fromClient && { color:C.onAccent }]}>{item.text}</Text>
                </View>
                <Text style={[T.tiny, { marginTop:4 }]}>
                  {new Date(item.at).toLocaleString(undefined,
                    { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' })}
                </Text>
              </View>
            </FadeIn>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput value={text} onChangeText={setText} placeholder="Reply as Sid…"
          placeholderTextColor={C.faint} style={styles.input} multiline />
        <Press onPress={reply} disabled={!text.trim()} scaleTo={0.9}
          style={[styles.send, { opacity: text.trim() ? 1 : 0.35 }]}>
          <Text style={styles.sendTxt}>Send</Text>
        </Press>
      </View>
    </KeyboardAvoidingView>
  );
}

function Stat({ v, label }) {
  const { C, T } = useTheme();
  const styles = makeStyles(C, T);
  return (
    <View style={{ flex:1 }}>
      <Text style={styles.statNum}>{v}</Text>
      <Text style={T.tiny}>{label}</Text>
    </View>
  );
}

const makeStyles = (C, T) => StyleSheet.create({
  wrap:{ flex:1, backgroundColor:C.bg },
  head:{ paddingHorizontal:S.lg, paddingTop:S.lg, paddingBottom:S.md, backgroundColor:C.surface },
  title:{ fontFamily:'Forum_400Regular', fontSize:32, color:C.text, marginTop:2 },
  statsRow:{ flexDirection:'row', marginTop:S.md },
  statNum:{ fontFamily:'Forum_400Regular', fontSize:22, color:C.ember },
  thread:{ flexDirection:'row', alignItems:'center', backgroundColor:C.surface,
           borderRadius:R.md, padding:S.md, marginBottom:10 },
  initial:{ width:44, height:44, borderRadius:22, backgroundColor:C.ember,
            alignItems:'center', justifyContent:'center' },
  initialTxt:{ fontFamily:'Forum_400Regular', fontSize:20, color:C.onAccent },
  clientName:{ fontFamily:'WorkSans_500Medium', fontSize:15.5, color:C.text },
  unread:{ width:9, height:9, borderRadius:5, backgroundColor:C.ember },
  bubble:{ maxWidth:'88%', paddingVertical:12, paddingHorizontal:15, borderRadius:R.md },
  mine:{ backgroundColor:C.ember, borderBottomRightRadius:4 },
  theirs:{ backgroundColor:C.surface, borderWidth:1, borderColor:C.line, borderBottomLeftRadius:4 },
  composer:{ flexDirection:'row', alignItems:'flex-end', padding:S.md,
             borderTopWidth:1, borderTopColor:C.line },
  input:{ flex:1, backgroundColor:C.surface, borderRadius:R.md, paddingHorizontal:14,
          paddingVertical:12, marginRight:10, maxHeight:120,
          fontFamily:'WorkSans_400Regular', fontSize:15, color:C.text },
  send:{ backgroundColor:C.ember, borderRadius:R.md, paddingHorizontal:18, paddingVertical:13 },
  sendTxt:{ fontFamily:'WorkSans_500Medium', fontSize:13.5, color:C.onAccent },
  signout:{ paddingVertical:12, borderRadius:R.md, borderWidth:1, borderColor:C.line },
});
