import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { RADIUS, T, shadowSm } from '../../theme/tokens';

type Message = {
  id: string;
  mine?: boolean;
  text: string;
  time: string;
  status?: 'sent' | 'read';
  senderName?: string;
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    senderName: 'Нина Петровна',
    text: 'Здравствуйте! Спасибо, что записались. Подскажите, во сколько вы планируете подъехать?',
    time: '14:30',
  },
  {
    id: '2',
    mine: true,
    text: 'Добрый день! Подъеду к 10:00 — могу захватить грабли и пакеты.',
    time: '14:32',
    status: 'read',
  },
  {
    id: '3',
    senderName: 'Нина Петровна',
    text: 'Прекрасно! Пакеты у нас есть, а вот лишние грабли точно пригодятся.',
    time: '14:33',
  },
];

type Props = {
  recipientName: string;
  requestTitle: string;
  requestSchedule?: string;
  onBack: () => void;
  onOpenRequest?: () => void;
};

export function ChatScreen({
  recipientName,
  requestTitle,
  requestSchedule,
  onBack,
  onOpenRequest,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const messages = MOCK_MESSAGES;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Icon name="chevL" size={22} color={T.ink} />
        </Pressable>
        <Avatar name={recipientName} size={38} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {recipientName}
            </Text>
            <Icon name="shield" size={13} color={T.success} strokeWidth={2.2} />
          </View>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>в сети</Text>
          </View>
        </View>
        <Pressable style={styles.infoBtn} hitSlop={8}>
          <Icon name="info" size={18} color={T.ink2} />
        </Pressable>
      </View>

      <Pressable style={styles.requestBar} onPress={onOpenRequest}>
        <Icon name="document" size={16} color={T.primary} strokeWidth={2} />
        <Text style={styles.requestBarText} numberOfLines={1}>
          {requestTitle}
          {requestSchedule ? ` · ${requestSchedule}` : ''}
        </Text>
        <Icon name="chevR" size={16} color={T.primary} />
      </Pressable>

      <ScrollView
        style={styles.messages}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) =>
            message.mine ? (
              <View key={message.id} style={styles.myMsgWrap}>
                <View style={[styles.bubble, styles.myBubble]}>
                  <Text style={styles.myBubbleText}>{message.text}</Text>
                </View>
                <Text style={styles.msgMeta}>
                  {message.time}
                  {message.status === 'read' ? ' · прочитано' : ''}
                </Text>
              </View>
            ) : (
              <View key={message.id} style={styles.theirMsgWrap}>
                <Avatar name={message.senderName ?? recipientName} size={28} />
                <View style={styles.theirBody}>
                  <View style={[styles.bubble, styles.theirBubble, shadowSm]}>
                    <Text style={styles.theirBubbleText}>{message.text}</Text>
                  </View>
                  <Text style={styles.msgMeta}>{message.time}</Text>
                </View>
              </View>
            ),
          )}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Сообщение…"
          placeholderTextColor={T.muted}
          style={styles.input}
          multiline
        />
        <Pressable style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}>
          <Icon name="arrowR" size={18} color="#fff" strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.borderSoft,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: T.ink },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.success },
  onlineText: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: T.muted },
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: T.primarySoft,
  },
  requestBarText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: T.primaryDark,
  },
  messages: { flex: 1 },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: T.ink },
  emptySub: { fontSize: 13, fontFamily: 'Manrope_400Regular', color: T.muted },
  theirMsgWrap: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'flex-end' },
  theirBody: { flex: 1, maxWidth: '82%' },
  myMsgWrap: { alignItems: 'flex-end', marginBottom: 12 },
  bubble: { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 },
  theirBubble: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 4,
  },
  myBubble: {
    backgroundColor: T.primary,
    borderTopRightRadius: 4,
    maxWidth: '82%',
  },
  theirBubbleText: { fontSize: 14, fontFamily: 'Manrope_400Regular', color: T.ink2, lineHeight: 20 },
  myBubbleText: { fontSize: 14, fontFamily: 'Manrope_400Regular', color: '#fff', lineHeight: 20 },
  msgMeta: { fontSize: 10, fontFamily: 'Manrope_400Regular', color: T.muted, marginTop: 4 },
  typingBubble: { paddingHorizontal: 16 },
  typingText: { fontSize: 18, color: T.muted, letterSpacing: 2 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.borderSoft,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: RADIUS.pill,
    backgroundColor: T.surface2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: T.ink,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
