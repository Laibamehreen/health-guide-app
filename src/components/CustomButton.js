import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../config/theme';

export const CustomButton = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, danger
  loading = false,
  disabled = false,
  style,
  textStyle,
  theme = 'light',
}) => {
  const activeColors = COLORS[theme];

  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return [styles.btn, { backgroundColor: activeColors.primaryLight }, style];
      case 'outline':
        return [styles.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: activeColors.primary }, style];
      case 'danger':
        return [styles.btn, { backgroundColor: activeColors.error }, style];
      case 'primary':
      default:
        return [styles.btn, { backgroundColor: activeColors.primary }, style];
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return activeColors.primary;
    if (variant === 'secondary') return activeColors.primaryDark;
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getButtonStyles(),
        (disabled || loading) && { opacity: 0.6 }
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  text: {
    ...FONTS.button,
  },
});

export default CustomButton;
