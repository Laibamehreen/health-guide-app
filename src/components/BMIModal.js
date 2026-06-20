import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../config/theme';
import CustomInput from './CustomInput';
import CustomButton from './CustomButton';
import { validateNumber } from '../utils/validation';

export const BMIModal = ({
  visible,
  onClose,
  initialHeight = '',
  initialWeight = '',
  onSaveProfile,
  theme = 'light',
}) => {
  const activeColors = COLORS[theme];
  const [height, setHeight] = useState(String(initialHeight || ''));
  const [weight, setWeight] = useState(String(initialWeight || ''));
  const [errors, setErrors] = useState({});
  const [bmiResult, setBmiResult] = useState(null);

  useEffect(() => {
    if (visible) {
      setHeight(String(initialHeight || ''));
      setWeight(String(initialWeight || ''));
      setBmiResult(null);
      setErrors({});
    }
  }, [visible, initialHeight, initialWeight]);

  const handleCalculate = () => {
    const heightErr = validateNumber(height, 'Height', 100, 250);
    const weightErr = validateNumber(weight, 'Weight', 30, 250);

    if (heightErr || weightErr) {
      setErrors({ height: heightErr, weight: weightErr });
      return;
    }

    setErrors({});

    const heightInMeters = Number(height) / 100;
    const weightInKg = Number(weight);
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(bmi * 10) / 10;

    let classification = '';
    let color = '';
    let advice = '';

    if (roundedBmi < 18.5) {
      classification = 'Underweight';
      color = activeColors.warning;
      advice = 'Consider consulting a healthcare provider or nutritionist. Focus on energy-dense, nutrient-rich foods and strength training.';
    } else if (roundedBmi >= 18.5 && roundedBmi < 25) {
      classification = 'Normal Weight';
      color = activeColors.success;
      advice = 'Great job! Maintain your balanced diet, regular exercise, and healthy habits to keep your BMI in this optimal range.';
    } else if (roundedBmi >= 25 && roundedBmi < 30) {
      classification = 'Overweight';
      color = activeColors.warning;
      advice = 'Incorporate more aerobic exercise (like brisk walking or cycling) and focus on fiber-rich whole foods while portioning meals.';
    } else {
      classification = 'Obese';
      color = activeColors.error;
      advice = 'Consult a medical professional for advice tailored to your needs. Prioritize physical activity and small, consistent dietary improvements.';
    }

    setBmiResult({
      score: roundedBmi,
      classification,
      color,
      advice,
    });
  };

  const handleSave = () => {
    if (onSaveProfile && bmiResult) {
      onSaveProfile(Number(height), Number(weight));
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: activeColors.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: activeColors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: activeColors.border }]}>
            <Text style={[styles.title, { color: activeColors.text }]}>BMI Calculator</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-outline" size={24} color={activeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Input fields */}
            <View style={styles.inputsSection}>
              <CustomInput
                label="Height (cm)"
                placeholder="e.g. 175"
                keyboardType="numeric"
                value={height}
                onChangeText={(val) => {
                  setHeight(val);
                  setErrors((prev) => ({ ...prev, height: null }));
                }}
                error={errors.height}
                iconName="resize-outline"
                theme={theme}
              />
              <CustomInput
                label="Weight (kg)"
                placeholder="e.g. 70"
                keyboardType="numeric"
                value={weight}
                onChangeText={(val) => {
                  setWeight(val);
                  setErrors((prev) => ({ ...prev, weight: null }));
                }}
                error={errors.weight}
                iconName="speedometer-outline"
                theme={theme}
              />

              <CustomButton
                title="Calculate BMI"
                onPress={handleCalculate}
                theme={theme}
                style={styles.calcBtn}
              />
            </View>

            {/* Results Section */}
            {bmiResult && (
              <View style={[styles.resultsSection, { backgroundColor: activeColors.background }]}>
                <Text style={[styles.resultLabel, { color: activeColors.textSecondary }]}>Your Calculated BMI</Text>
                
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreText, { color: bmiResult.color }]}>{bmiResult.score}</Text>
                  <View style={[styles.badge, { backgroundColor: bmiResult.color }]}>
                    <Text style={styles.badgeText}>{bmiResult.classification}</Text>
                  </View>
                </View>

                {/* Simple visual progress gauge */}
                <View style={styles.gaugeBg}>
                  <View
                    style={[
                      styles.gaugeFill,
                      {
                        backgroundColor: bmiResult.color,
                        width: `${Math.min(Math.max((bmiResult.score / 40) * 100, 10), 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.gaugeLabels}>
                  <Text style={[styles.gaugeLabelText, { color: activeColors.textMuted }]}>18.5 (Under)</Text>
                  <Text style={[styles.gaugeLabelText, { color: activeColors.textMuted }]}>25 (Normal)</Text>
                  <Text style={[styles.gaugeLabelText, { color: activeColors.textMuted }]}>30 (Over)</Text>
                </View>

                <Text style={[styles.adviceText, { color: activeColors.text }]}>
                  {bmiResult.advice}
                </Text>

                {onSaveProfile && (
                  <CustomButton
                    title="Save to My Profile"
                    onPress={handleSave}
                    variant="outline"
                    theme={theme}
                    style={styles.saveBtn}
                  />
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    maxHeight: '85%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    ...FONTS.h2,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputsSection: {
    marginBottom: 16,
  },
  calcBtn: {
    marginTop: 8,
  },
  resultsSection: {
    borderRadius: SIZES.radius,
    padding: 16,
    alignItems: 'center',
  },
  resultLabel: {
    ...FONTS.body2,
    fontWeight: '500',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '800',
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  gaugeBg: {
    height: 10,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 5,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  gaugeLabelText: {
    ...FONTS.caption,
  },
  adviceText: {
    ...FONTS.body2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  saveBtn: {
    width: '100%',
  },
});

export default BMIModal;
