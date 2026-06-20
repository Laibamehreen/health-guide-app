import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { validateEmail } from '../../utils/validation';
import { COLORS, FONTS } from '../../config/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { ref, get } = require('firebase/database');
      const { db } = require('../../config/firebase');
      
      const sanitizeEmail = (e) => e.toLowerCase().trim().replace(/[.$#[\]]/g, '_');
      const sanitizedEmail = sanitizeEmail(email);

      const userRef = ref(db, 'users/' + sanitizedEmail);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('No user found with this email address.');
      }

      const userPassword = snapshot.val().password;

      Toast.show({
        type: 'success',
        text1: 'Password Retrieved',
        text2: `Your password is: ${userPassword}`,
        visibilityTime: 6000,
      });
      navigation.navigate('Login');
    } catch (err) {
      const msg = err.message || 'Failed to retrieve password. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Retrieval Failed',
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back to Login</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email address and we'll send you instructions to reset your password</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <CustomInput
              label="Email Address"
              placeholder="e.g. user@health.com"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                setError(null);
              }}
              error={error}
              iconName="mail-outline"
            />

            <CustomButton
              title="Send Reset Instructions"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 32,
  },
  backBtn: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    ...FONTS.body2,
    color: '#0D9488',
    fontWeight: '600',
  },
  title: {
    ...FONTS.h1,
    color: '#0F172A',
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body1,
    color: '#64748B',
  },
  formSection: {
    width: '100%',
  },
  submitBtn: {
    width: '100%',
    marginTop: 16,
  },
});
