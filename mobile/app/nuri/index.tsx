import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { sendMessageToNuri, NuriContext } from '../../services/ai/nuriService';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

function parseContext(raw: string | string[] | undefined): NuriContext | undefined {
  if (!raw) {
    return undefined;
  }

  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export default function NuriScreen() {
  const params = useLocalSearchParams<{ source?: string; context?: string }>();
  const context = useMemo(() => parseContext(params.context), [params.context]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingWelcome, setLoadingWelcome] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadWelcomeMessage = async () => {
      try {
        const reply = await sendMessageToNuri({
          input: 'welcome',
          context: {
            ...context,
            source: (params.source as 'home' | 'product' | undefined) || context?.source,
          },
          isWelcome: true,
        });

        if (!mounted) {
          return;
        }

        setMessages([
          {
            id: `assistant-welcome-${Date.now()}`,
            role: 'assistant',
            text:
              reply ||
              "Hi, I'm Nuri. How can I help you with this product or your health today?",
          },
        ]);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setMessages([
          {
            id: `assistant-welcome-${Date.now()}`,
            role: 'assistant',
            text: "Hi, I'm Nuri. How can I help you with this product or your health today?",
          },
        ]);
      } finally {
        if (mounted) {
          setLoadingWelcome(false);
        }
      }
    };

    loadWelcomeMessage();

    return () => {
      mounted = false;
    };
  }, [context, params.source]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const reply = await sendMessageToNuri({
        input: trimmed,
        context: {
          ...context,
          source: (params.source as 'home' | 'product' | undefined) || context?.source,
        },
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: reply,
        },
      ]);
    } catch (error: any) {
      Alert.alert('Nuri is unavailable', error?.message || 'Please try again in a moment.');
    } finally {
      setSending(false);
    }
  };

  const handleMicPress = () => {
    Alert.alert('Voice input', 'Voice input can be connected next with expo-av recording.');
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isAssistant = item.role === 'assistant';

    return (
      <View style={[styles.messageRow, isAssistant ? styles.leftAlign : styles.rightAlign]}>
        <View style={[styles.messageBubble, isAssistant ? styles.assistantBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isAssistant ? styles.assistantText : styles.userText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <MaterialIcons name="psychology" size={20} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Nuri</Text>
          <Text style={styles.headerSubtitle}>AI health and product assistant</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>
              {loadingWelcome ? 'Nuri is getting ready...' : 'Start a conversation with Nuri'}
            </Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.micButton} onPress={handleMicPress}>
          <MaterialIcons name="mic" size={20} color="#4CAF50" />
        </TouchableOpacity>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Nuri anything"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          editable={!sending}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <MaterialIcons name="send" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf7',
  },
  header: {
    paddingTop: 64,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  messagesContainer: {
    padding: 16,
    gap: 10,
    paddingBottom: 20,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  leftAlign: {
    justifyContent: 'flex-start',
  },
  rightAlign: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assistantBubble: {
    backgroundColor: '#e8f5e9',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  assistantText: {
    color: '#1f2937',
  },
  userText: {
    color: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  micButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
