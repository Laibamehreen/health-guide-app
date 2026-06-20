import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SIZES } from '../../config/theme';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { updateProfileSuccess } from '../../redux/authSlice';
import { validateNumber } from '../../utils/validation';
import { db } from '../../config/firebase';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || 'Not Specified');
  const [height, setHeight] = useState(user?.height ? String(user.height) : '');
  const [weight, setWeight] = useState(user?.weight ? String(user.weight) : '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const genders = ['Male', 'Female', 'Other', 'Not Specified'];

  const handleUpdate = async () => {
    // Validate numerical inputs
    const ageErr = validateNumber(age, 'Age', 1, 120);
    const heightErr = validateNumber(height, 'Height', 50, 250);
    const weightErr = validateNumber(weight, 'Weight', 5, 300);

    if (ageErr || heightErr || weightErr) {
      setErrors({ age: ageErr, height: heightErr, weight: weightErr });
      return;
    }

    setErrors({});
    setSaving(true);

    const updatedProfile = {
      displayName: displayName.trim() || 'Health User',
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
    };

    try {
      const { ref, update } = require('firebase/database');
      const sanitizeEmail = (e) => e.toLowerCase().trim().replace(/[.$#[\]]/g, '_');
      const userRef = ref(db, 'users/' + sanitizeEmail(user.email));
      await update(userRef, updatedProfile);

      const storedUser = await AsyncStorage.getItem('@health_guide_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        const newUserObj = { ...userObj, ...updatedProfile };
        await AsyncStorage.setItem('@health_guide_user', JSON.stringify(newUserObj));
      }

      dispatch(updateProfileSuccess(updatedProfile));
      Toast.show({
        type: 'success',
        text1: 'Profile Saved',
        text2: 'Your health profile has been synchronized successfully.',
      });
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'An error occurred while saving your details.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Profile Card */}
          <View style={[styles.profileHeaderCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
            <View style={[styles.avatarBox, { backgroundColor: activeColors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={[styles.emailText, { color: activeColors.textMuted }]}>{user?.email}</Text>
          </View>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
            <Text style={[styles.formTitle, { color: activeColors.text }]}>Health Characteristics</Text>
            
            <CustomInput
              label="Full Name"
              placeholder="Enter your name"
              value={displayName}
              onChangeText={setDisplayName}
              iconName="person-outline"
              theme={theme}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <CustomInput
                  label="Age (Years)"
                  placeholder="e.g. 28"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={(val) => {
                    setAge(val);
                    setErrors((prev) => ({ ...prev, age: null }));
                  }}
                  error={errors.age}
                  iconName="calendar-outline"
                  theme={theme}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.dropdownLabel, { color: activeColors.textSecondary }]}>Gender</Text>
                <View style={styles.genderContainer}>
                  {genders.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderPill,
                        {
                          borderColor: activeColors.border,
                          backgroundColor: gender === g ? activeColors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          { color: gender === g ? '#FFFFFF' : activeColors.textSecondary },
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

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
              title="Save Changes"
              onPress={handleUpdate}
              loading={saving}
              theme={theme}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileHeaderCard: {
    padding: 24,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  emailText: {
    ...FONTS.body2,
  },
  formCard: {
    padding: 20,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 24,
  },
  formTitle: {
    ...FONTS.h3,
    fontWeight: '700',
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  halfInput: {
    width: '100%',
    marginBottom: 8,
  },
  dropdownLabel: {
    ...FONTS.caption,
    fontWeight: '600',
    marginBottom: 6,
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  genderPill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 12,
    width: '100%',
  },
});
