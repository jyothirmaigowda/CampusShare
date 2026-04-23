import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { getAIResponse } from '@/services/backend';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'ai';
  timestamp: Date;
}

const SUGGESTIONS = [
  'How do I borrow an item?',
  'What is trust score?',
  'How to earn reward points?',
  'What happens if I return late?',
  'How to share notes?',
];

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "Hi! I'm your Campus Share AI assistant. I can help you with borrowing items, trust scores, reward points, notes, and notices. What would you like to know?",
      role: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u-${Date.now()}`, text: text.trim(), role: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text.trim());
      const aiMsg: Message = { id: `a-${Date.now()}`, text: response, role: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, 800 + Math.random() * 600);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgWrap, isUser ? styles.msgWrapUser : styles.msgWrapAI]}>
        {!isUser ? (
          <View style={styles.aiAvatar}>
            <MaterialIcons name="smart-toy" size={18} color={Colors.primary} />
          </View>
        ) : null}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>{item.text}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <MaterialIcons name="smart-toy" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Campus AI</Text>
            <Text style={styles.headerSub}>Always here to help</Text>
          </View>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        ListFooterComponent={isTyping ? (
          <View style={styles.typingWrap}>
            <View style={styles.aiAvatar}>
              <MaterialIcons name="smart-toy" size={18} color={Colors.primary} />
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        ) : null}
        renderItem={renderMessage}
      />

      {/* Suggestions */}
      <View style={styles.suggestWrap}>
        <FlatList
          data={SUGGESTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={s => s}
          contentContainerStyle={styles.suggestList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestChip} onPress={() => sendMessage(item)}>
              <Text style={styles.suggestText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            multiline
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
          >
            <MaterialIcons name="send" size={20} color={input.trim() ? '#ffffff' : Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  aiIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary + '50',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.neonGreen, borderWidth: 2, borderColor: Colors.background },
  msgList: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.sm },
  msgWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgWrapUser: { justifyContent: 'flex-end' },
  msgWrapAI: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  bubble: { maxWidth: '78%', borderRadius: Radius.lg, padding: Spacing.md },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FontSize.base, lineHeight: 22 },
  bubbleTextUser: { color: '#ffffff' },
  bubbleTextAI: { color: Colors.textPrimary },
  typingWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: Spacing.sm },
  typingBubble: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: Radius.lg, borderBottomLeftRadius: 4, padding: Spacing.md,
  },
  typingText: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
  suggestWrap: { borderTopWidth: 1, borderColor: Colors.divider, paddingVertical: Spacing.sm },
  suggestList: { paddingHorizontal: Spacing.md, gap: 8 },
  suggestChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.primary + '50', backgroundColor: Colors.primaryGlow,
  },
  suggestText: { fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.md, borderTopWidth: 1, borderColor: Colors.border,
  },
  input: {
    flex: 1, backgroundColor: Colors.inputBg, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.inputBorder,
    color: Colors.textPrimary, fontSize: FontSize.base,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    maxHeight: 100,
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
});
