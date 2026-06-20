import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS, SIZES } from '../config/theme';

export const Card = ({
  children,
  onPress,
  style,
  theme = 'light',
  activeOpacity = 0.9,
}) => {
  const activeColors = COLORS[theme];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: activeColors.cardBg,
            borderColor: activeColors.border,
          },
          style,
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: activeColors.cardBg,
          borderColor: activeColors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
});

export default Card;
