import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { authStart, authSuccess, authFailure } from '../../redux/authSlice';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { validateEmail, validatePassword } from '../../utils/validation';
import { COLORS, FONTS, SIZES } from '../../config/theme';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validate inputs
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setErrors({});
    setLoading(true);
    dispatch(authStart());

    // Database login flow
    try {
      const { ref, get } = require('firebase/database');
      const { db } = require('../../config/firebase');
      
      const sanitizeEmail = (e) => e.toLowerCase().trim().replace(/[.$#[\]]/g, '_');
      const sanitizedEmail = sanitizeEmail(email);

      const userRef = ref(db, 'users/' + sanitizedEmail);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('No user found with this email.');
      }

      const userData = snapshot.val();
      if (userData.password !== password) {
        throw new Error('Incorrect password.');
      }

      // Save session locally
      await AsyncStorage.setItem('@health_guide_user', JSON.stringify(userData));

      dispatch(authSuccess(userData));
      Toast.show({
        type: 'success',
        text1: 'Welcome Back',
        text2: `Hello, ${userData.displayName}!`,
      });
    } catch (err) {
      console.error('Login error details:', err);
      const msg = err.message || 'Invalid credentials. Please try again.';
      
      dispatch(authFailure(msg));
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
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
          {/* Brand Header */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to access your personal health guide</Text>
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
                setErrors((prev) => ({ ...prev, email: null }));
              }}
              error={errors.email}
              iconName="mail-outline"
            />

            <CustomInput
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                setErrors((prev) => ({ ...prev, password: null }));
              }}
              error={errors.password}
              iconName="lock-closed-outline"
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />
          </View>

          {/* Footer Navigation */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupText}>Sign Up</Text>
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
  },
  headerSection: {
    marginBottom: 32,
    alignItems: 'left',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotText: {
    ...FONTS.body2,
    color: '#0D9488',
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
    marginBottom: 24,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 24,
  },
  footerText: {
    ...FONTS.body2,
    color: '#64748B',
  },
  signupText: {
    ...FONTS.body2,
    color: '#0D9488',
    fontWeight: '700',
  },
});
