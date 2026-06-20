import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, FONTS, SIZES } from '../../config/theme';
import ChatBubble from '../../components/ChatBubble';
import { getAIResponse } from '../../services/aiService';
import { addMessage, setMessages, setChatLoading, clearChat } from '../../redux/chatbotSlice';
import { db } from '../../config/firebase';

const SUGGESTIONS = [
  { id: 'sug-1', label: '🤕 Sore Throat Tips', text: 'I have a sore throat, what should I do?' },
  { id: 'sug-2', label: '🥗 Daily Diet Advice', text: 'What are the basic guidelines for a healthy diet?' },
  { id: 'sug-3', label: '🏋️ Exercise Tips', text: 'Can you recommend a basic fitness routine?' },
  { id: 'sug-4', label: '🤒 Fever Treatment', text: 'How should I treat a mild fever?' },
];

export default function ChatbotScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  const { messages, loading } = useSelector((state) => state.chatbot);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Load chat history from Database on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.uid) return;

      try {
        const { ref, get, set } = require('firebase/database');
        const chatsRef = ref(db, `chats/${user.uid}`);
        const snapshot = await get(chatsRef);
        const firebaseMessages = [];
        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.keys(data).forEach((key) => {
            firebaseMessages.push({ id: key, ...data[key] });
          });
        }

        firebaseMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (firebaseMessages.length > 0) {
          dispatch(setMessages(firebaseMessages));
        } else {
          // Write welcome message to database
          const welcomeMsg = {
            id: 'welcome-msg',
            text: "Hello! I am your AI Health Assistant. Ask me anything about health, diet, or fitness. \n\n*Disclaimer: I provide information for general guidance. I am not a doctor. In case of medical emergencies, please consult a healthcare professional.*",
            sender: 'bot',
            timestamp: new Date().toISOString(),
            userId: user.uid,
          };
          await set(ref(db, `chats/${user.uid}/${welcomeMsg.id}`), welcomeMsg);
          dispatch(setMessages([welcomeMsg]));
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    };

    loadChatHistory();
  }, [user?.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const cleanText = textToSend || inputText;
    if (!cleanText.trim() || loading) return;

    if (!textToSend) {
      setInputText('');
    }

    // 1. Add User Message
    const userMsg = {
      id: 'msg-' + Date.now() + '-user',
      text: cleanText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      userId: user.uid,
    };
    dispatch(addMessage(userMsg));
    dispatch(setChatLoading(true));

    try {
      // Save User Message to Database
      const { ref, set } = require('firebase/database');
      await set(ref(db, `chats/${user.uid}/${userMsg.id}`), userMsg);

      // 2. Fetch AI Response
      const response = await getAIResponse(cleanText);

      // 3. Add Bot Response
      const botMsg = {
        id: 'msg-' + Date.now() + '-bot',
        text: response,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        userId: user.uid,
      };
      dispatch(addMessage(botMsg));

      // Save Bot Message to Database
      await set(ref(db, `chats/${user.uid}/${botMsg.id}`), botMsg);
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Chat Error',
        text2: 'Could not connect to the AI engine.',
      });
    } finally {
      dispatch(setChatLoading(false));
    }
  };

  const handleClearChat = async () => {
    dispatch(clearChat());
    try {
      const welcomeMsg = {
        id: 'welcome-msg',
        text: "Hello! I am your AI Health Assistant. Ask me anything about health, diet, or fitness. \n\n*Disclaimer: I provide information for general guidance. I am not a doctor. In case of medical emergencies, please consult a healthcare professional.*",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        userId: user.uid,
      };

      const { ref, set } = require('firebase/database');
      
      // Delete all messages
      await set(ref(db, `chats/${user.uid}`), null);

      // Write fresh welcome message
      await set(ref(db, `chats/${user.uid}/${welcomeMsg.id}`), welcomeMsg);

      Toast.show({
        type: 'info',
        text1: 'Chat Cleared',
        text2: 'Conversation history reset.',
      });
    } catch (e) {
      console.error('Failed to clear chat database:', e);
    }
  };

  const renderMessageItem = ({ item }) => {
    return (
      <ChatBubble
        message={item}
        theme={theme}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: activeColors.border }]}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={activeColors.primary} style={styles.headerIcon} />
          <View>
            <Text style={[styles.title, { color: activeColors.text }]}>Clinical AI Assistant</Text>
            <Text style={[styles.subTitle, { color: activeColors.success }]}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClearChat} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={20} color={activeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Warning Disclaimer Banner */}
      <View style={[styles.disclaimerBanner, { backgroundColor: activeColors.error + '10', borderColor: activeColors.error + '30' }]}>
        <Ionicons name="warning-outline" size={16} color={activeColors.error} style={styles.disclaimerIcon} />
        <Text style={[styles.disclaimerText, { color: activeColors.error }]}>
          Disclaimer: AI information is for educational purposes. Always seek a doctor's advice for diagnosis or treatment.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={styles.loadingBubbleContainer}>
                <View style={[styles.loadingBubble, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
                  <ActivityIndicator size="small" color={activeColors.primary} />
                  <Text style={[styles.loadingBubbleText, { color: activeColors.textSecondary }]}>Assistant is thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggestion Chips */}
        {messages.length === 1 && !loading && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsTitle, { color: activeColors.textMuted }]}>Recommended Topics:</Text>
            <View style={styles.chipsRow}>
              {SUGGESTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
                  onPress={() => handleSendMessage(item.text)}
                >
                  <Text style={[styles.chipText, { color: activeColors.textSecondary }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Text Section */}
        <View style={[styles.inputBar, { backgroundColor: activeColors.surface, borderTopColor: activeColors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: activeColors.background, color: activeColors.text, borderColor: activeColors.border }]}
            placeholder="Type your health question..."
            placeholderTextColor={activeColors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? activeColors.primary : activeColors.textMuted }]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 6,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  disclaimerIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  loadingBubbleContainer: {
    alignSelf: 'flex-start',
    marginVertical: 8,
    maxWidth: '80%',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  loadingBubbleText: {
    fontSize: 13,
    marginLeft: 8,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  suggestionsTitle: {
    ...FONTS.caption,
    fontWeight: '600',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
