import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../config/theme';

export const ChatBubble = ({ message, theme = 'light' }) => {
  const activeColors = COLORS[theme];
  const isBot = message.sender === 'bot';

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={[styles.container, isBot ? styles.botContainer : styles.userContainer]}>
      {isBot && (
        <View style={[styles.avatar, { backgroundColor: activeColors.primaryLight }]}>
          <Ionicons name="medical-outline" size={16} color={activeColors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isBot
            ? {
                backgroundColor: activeColors.surface,
                borderColor: activeColors.border,
                borderTopLeftRadius: 4,
              }
            : {
                backgroundColor: activeColors.primary,
                borderColor: activeColors.primary,
                borderTopRightRadius: 4,
              },
        ]}
      >
        <Text
          style={[
            styles.text,
            isBot ? { color: activeColors.text } : { color: '#FFFFFF' },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.time,
            isBot ? { color: activeColors.textMuted } : { color: 'rgba(255,255,255,0.7)' },
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '85%',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  text: {
    ...FONTS.body1,
    lineHeight: 20,
  },
  time: {
    ...FONTS.caption,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});

export default ChatBubble;
