import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { authStart, authSuccess, authFailure } from '../../redux/authSlice';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validation';
import { COLORS, FONTS, SIZES } from '../../config/theme';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validate inputs
    const nameErr = validateRequired(name, 'Full Name');
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    let confirmErr = null;

    if (password !== confirmPassword) {
      confirmErr = 'Passwords do not match';
    }

    if (nameErr || emailErr || passwordErr || confirmErr) {
      setErrors({
        name: nameErr,
        email: emailErr,
        password: passwordErr,
        confirmPassword: confirmErr,
      });
      return;
    }

    setErrors({});
    setLoading(true);
    dispatch(authStart());

    try {
      const { ref, set, get } = require('firebase/database');
      const { db } = require('../../config/firebase');
      
      const sanitizeEmail = (e) => e.toLowerCase().trim().replace(/[.$#[\]]/g, '_');
      const sanitizedEmail = sanitizeEmail(email);

      // Check if a user with this email already exists
      const userRef = ref(db, 'users/' + sanitizedEmail);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        throw new Error('This email is already registered.');
      }

      // Generate a unique user ID
      const generatedUid = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      const userData = {
        uid: generatedUid,
        email: email.toLowerCase().trim(),
        password: password, // Store password directly in DB as requested
        displayName: name,
        age: 28, // Default properties
        gender: 'Not Specified',
        height: 175,
        weight: 70,
        darkMode: false,
        createdAt: new Date().toISOString(),
      };

      // Save to Realtime Database
      await set(userRef, userData);

      // Save session locally
      await AsyncStorage.setItem('@health_guide_user', JSON.stringify(userData));

      dispatch(authSuccess(userData));
      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: `Welcome aboard, ${name}!`,
      });
    } catch (err) {
      console.error('Registration error details:', err);
      const msg = err.message || 'Registration failed. Please try again.';
      
      dispatch(authFailure(msg));
      Toast.show({
        type: 'error',
        text1: 'Registration Error',
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to start tracking your health records</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <CustomInput
              label="Full Name"
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={(val) => {
                setName(val);
                setErrors((prev) => ({ ...prev, name: null }));
              }}
              error={errors.name}
              iconName="person-outline"
            />

            <CustomInput
              label="Email Address"
              placeholder="e.g. john@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                setErrors((prev) => ({ ...prev, email: null }));
              }}
              error={errors.email}
              iconName="mail-outline"
            />

            <CustomInput
              label="Password"
              placeholder="Min 6 characters"
              secureTextEntry
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                setErrors((prev) => ({ ...prev, password: null }));
              }}
              error={errors.password}
              iconName="lock-closed-outline"
            />

            <CustomInput
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(val) => {
                setConfirmPassword(val);
                setErrors((prev) => ({ ...prev, confirmPassword: null }));
              }}
              error={errors.confirmPassword}
              iconName="lock-closed-outline"
            />

            <CustomButton
              title="Register"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerBtn}
            />
          </View>

          {/* Login link */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>
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
    paddingVertical: 20,
  },
  headerSection: {
    marginBottom: 24,
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
  registerBtn: {
    width: '100%',
    marginTop: 12,
    marginBottom: 24,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    ...FONTS.body2,
    color: '#64748B',
  },
  loginText: {
    ...FONTS.body2,
    color: '#0D9488',
    fontWeight: '700',
  },
});
