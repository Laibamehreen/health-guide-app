import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../config/theme';

export const CustomInput = ({
  label,
  iconName,
  error,
  secureTextEntry,
  theme = 'light',
  containerStyle,
  style,
  ...props
}) => {
  const activeColors = COLORS[theme];
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: activeColors.textSecondary }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: activeColors.surface,
            borderColor: error
              ? activeColors.error
              : isFocused
              ? activeColors.primary
              : activeColors.border,
          },
          style,
        ]}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={error ? activeColors.error : isFocused ? activeColors.primary : activeColors.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, { color: activeColors.text }]}
          placeholderTextColor={activeColors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          autoCapitalize="none"
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={activeColors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: activeColors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    ...FONTS.body2,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    ...FONTS.body1,
  },
  eyeIcon: {
    padding: 6,
  },
  errorText: {
    ...FONTS.caption,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default CustomInput;
