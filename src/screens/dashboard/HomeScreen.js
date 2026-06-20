import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert, Linking, Share } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { COLORS, FONTS, SIZES } from '../../config/theme';
import { HEALTH_TIPS, EMERGENCY_CONTACTS } from '../../utils/healthTipsData';
import { getScheduledReminders, cancelReminder } from '../../services/notificationService';
import BMIModal from '../../components/BMIModal';
import { updateProfileSuccess } from '../../redux/authSlice';
import { db } from '../../config/firebase';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [bmiModalVisible, setBmiModalVisible] = useState(false);
  const [scheduledReminders, setScheduledReminders] = useState([]);

  // Fetch reminders when screen gains focus
  useFocusEffect(
    useCallback(() => {
      const fetchReminders = async () => {
        try {
          const reminders = await getScheduledReminders();
          setScheduledReminders(reminders);
        } catch (e) {
          console.warn('Failed to load scheduled reminders:', e);
        }
      };
      fetchReminders();
    }, [])
  );

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleNextTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex + 1) % HEALTH_TIPS.length);
  };

  const handlePrevTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex - 1 + HEALTH_TIPS.length) % HEALTH_TIPS.length);
  };

  const shareTip = async (tip) => {
    try {
      await Share.share({
        message: `Health Tip of the Day: *${tip.title}* (${tip.category})\n\n${tip.content}\n\nShared via Health Guide App`,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSaveBmiDetails = async (height, weight) => {
    const updatedFields = { height, weight };
    
    // Update local Redux store
    dispatch(updateProfileSuccess(updatedFields));

    try {
      const { ref, update } = require('firebase/database');
      const sanitizeEmail = (e) => e.toLowerCase().trim().replace(/[.$#[\]]/g, '_');
      const userRef = ref(db, 'users/' + sanitizeEmail(user.email));
      await update(userRef, updatedFields);

      const storedUser = await AsyncStorage.getItem('@health_guide_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        const newUserObj = { ...userObj, ...updatedFields };
        await AsyncStorage.setItem('@health_guide_user', JSON.stringify(newUserObj));
      }

      Toast.show({
        type: 'success',
        text1: 'Health Profile Updated',
        text2: `Height: ${height}cm, Weight: ${weight}kg saved!`,
      });
    } catch (e) {
      console.error('Failed to save BMI update:', e);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Could not sync updates to database.',
      });
    }
  };

  // Helper to calculate current BMI score
  const calculateBmiScore = () => {
    if (!user?.height || !user?.weight) return null;
    const hM = user.height / 100;
    const wK = user.weight;
    return Math.round((wK / (hM * hM)) * 10) / 10;
  };

  const bmiScore = calculateBmiScore();

  const getBmiStatus = (bmiVal) => {
    if (!bmiVal) return { label: 'None', color: activeColors.textMuted };
    if (bmiVal < 18.5) return { label: 'Underweight', color: activeColors.warning };
    if (bmiVal < 25) return { label: 'Normal', color: activeColors.success };
    if (bmiVal < 30) return { label: 'Overweight', color: activeColors.warning };
    return { label: 'Obese', color: activeColors.error };
  };

  const bmiStatus = getBmiStatus(bmiScore);
  const currentTip = HEALTH_TIPS[currentTipIndex];

  const handleCallEmergency = (contact) => {
    Alert.alert(
      'Emergency Call',
      `Would you like to dial emergency services for ${contact.name} (${contact.phone})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${contact.phone}`).catch(() => {
              // Fallback for simulators or unsupported devices
              Toast.show({
                type: 'info',
                text1: 'Simulated Call',
                text2: `Calling ${contact.name} at ${contact.phone}...`,
              });
            });
          },
        },
      ]
    );
  };

  const handleCancelReminder = async (id, medName) => {
    Alert.alert(
      'Cancel Reminder',
      `Do you want to cancel the reminder for ${medName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReminder(id);
              const updated = await getScheduledReminders();
              setScheduledReminders(updated);
              Toast.show({
                type: 'success',
                text1: 'Reminder Cancelled',
                text2: `${medName} notification has been cleared.`,
              });
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not cancel reminder.',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={activeColors.surface} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Welcome Section */}
        <View style={[styles.welcomeCard, { backgroundColor: activeColors.primary }]}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.usernameText}>{user?.displayName || 'Health Supporter'}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
            <Ionicons name="menu-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* BMI & Quick Stats Widget */}
        <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>My Quick Health Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: activeColors.textMuted }]}>Height</Text>
              <Text style={[styles.statValue, { color: activeColors.text }]}>{user?.height ? `${user.height} cm` : 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: activeColors.textMuted }]}>Weight</Text>
              <Text style={[styles.statValue, { color: activeColors.text }]}>{user?.weight ? `${user.weight} kg` : 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: activeColors.textMuted }]}>BMI Score</Text>
              <Text style={[styles.statValue, { color: bmiStatus.color }]}>{bmiScore !== null ? bmiScore : 'N/A'}</Text>
              <Text style={[styles.statStatus, { color: bmiStatus.color }]}>{bmiStatus.label}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: activeColors.primary + '15' }]}
            onPress={() => setBmiModalVisible(true)}
          >
            <Ionicons name="calculator" size={18} color={activeColors.primary} />
            <Text style={[styles.actionBtnText, { color: activeColors.primary }]}>
              {bmiScore ? 'Recalculate BMI' : 'Calculate BMI Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Features Grid */}
        <Text style={[styles.blockTitle, { color: activeColors.text }]}>Quick Access</Text>
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
            onPress={() => navigation.navigate('Records')}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="journal" size={24} color="#0284C7" />
            </View>
            <Text style={[styles.gridLabel, { color: activeColors.text }]}>Health Records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="map" size={24} color="#EF4444" />
            </View>
            <Text style={[styles.gridLabel, { color: activeColors.text }]}>Find Hospital</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}
            onPress={() => navigation.navigate('AI Chat')}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#10B981" />
            </View>
            <Text style={[styles.gridLabel, { color: activeColors.text }]}>AI Chatbot</Text>
          </TouchableOpacity>
        </View>

        {/* Health Tips Carousel */}
        <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Health Tip of the Day</Text>
            <TouchableOpacity onPress={() => shareTip(currentTip)}>
              <Ionicons name="share-social-outline" size={20} color={activeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tipContainer}>
            <View style={[styles.tipIconBox, { backgroundColor: currentTip.color + '15' }]}>
              <Ionicons name={currentTip.icon} size={28} color={currentTip.color} />
            </View>
            <View style={styles.tipTextContent}>
              <Text style={[styles.tipCategory, { color: currentTip.color }]}>{currentTip.category}</Text>
              <Text style={[styles.tipTitle, { color: activeColors.text }]}>{currentTip.title}</Text>
              <Text style={[styles.tipDesc, { color: activeColors.textSecondary }]}>{currentTip.content}</Text>
            </View>
          </View>

          <View style={styles.carouselControls}>
            <TouchableOpacity onPress={handlePrevTip} style={[styles.navBtn, { borderColor: activeColors.border }]}>
              <Ionicons name="arrow-back" size={18} color={activeColors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.carouselIndex, { color: activeColors.textMuted }]}>
              {currentTipIndex + 1} / {HEALTH_TIPS.length}
            </Text>
            <TouchableOpacity onPress={handleNextTip} style={[styles.navBtn, { borderColor: activeColors.border }]}>
              <Ionicons name="arrow-forward" size={18} color={activeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scheduled Reminders Summary */}
        <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Upcoming Medicine Reminders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="add-circle" size={24} color={activeColors.primary} />
            </TouchableOpacity>
          </View>

          {scheduledReminders.length === 0 ? (
            <View style={styles.emptyReminders}>
              <Ionicons name="alarm-outline" size={32} color={activeColors.textMuted} />
              <Text style={[styles.emptyText, { color: activeColors.textMuted }]}>No active reminders scheduled.</Text>
            </View>
          ) : (
            scheduledReminders.slice(0, 3).map((item) => {
              const medName = item.content.data?.medicineName || 'Medicine';
              const dosage = item.content.data?.dosage || 'As prescribed';
              return (
                <View key={item.identifier} style={[styles.reminderItem, { borderBottomColor: activeColors.border }]}>
                  <View style={styles.reminderInfo}>
                    <Ionicons name="medkit-outline" size={20} color={activeColors.primary} style={styles.reminderIcon} />
                    <View>
                      <Text style={[styles.reminderMed, { color: activeColors.text }]}>{medName}</Text>
                      <Text style={[styles.reminderTime, { color: activeColors.textMuted }]}>{dosage}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleCancelReminder(item.identifier, medName)}>
                    <Ionicons name="close-circle-outline" size={20} color={activeColors.error} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Emergency Panel */}
        <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border, marginBottom: 24 }]}>
          <Text style={[styles.sectionTitle, { color: activeColors.error }]}>🏥 Emergency Contacts</Text>
          <Text style={[styles.tipDesc, { color: activeColors.textSecondary, marginBottom: 12 }]}>
            In case of critical healthcare emergencies, tap below to contact essential support lines instantly.
          </Text>
          <View style={styles.emergencyGrid}>
            {EMERGENCY_CONTACTS.map((contact, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.emergencyBtn, { borderColor: activeColors.error }]}
                onPress={() => handleCallEmergency(contact)}
              >
                <Ionicons name="call" size={14} color={activeColors.error} />
                <Text style={[styles.emergencyBtnText, { color: activeColors.error }]}>{contact.name} ({contact.phone})</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* BMI Calculator Modal Component */}
      <BMIModal
        visible={bmiModalVisible}
        onClose={() => setBmiModalVisible(false)}
        initialHeight={user?.height}
        initialWeight={user?.weight}
        onSaveProfile={handleSaveBmiDetails}
        theme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: SIZES.radiusLarge,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  welcomeInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 4,
  },
  menuButton: {
    padding: 8,
  },
  card: {
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    ...FONTS.h3,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...FONTS.caption,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statStatus: {
    ...FONTS.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: SIZES.radius,
    marginTop: 12,
  },
  actionBtnText: {
    ...FONTS.body2,
    fontWeight: '700',
    marginLeft: 8,
  },
  blockTitle: {
    ...FONTS.h3,
    fontWeight: '700',
    marginVertical: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    ...FONTS.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipTextContent: {
    flex: 1,
  },
  tipCategory: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    ...FONTS.body1,
    fontWeight: '700',
    marginVertical: 2,
  },
  tipDesc: {
    ...FONTS.body2,
    lineHeight: 18,
  },
  carouselControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 6,
  },
  carouselIndex: {
    ...FONTS.body2,
    marginHorizontal: 16,
  },
  emptyReminders: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    ...FONTS.body2,
    marginTop: 8,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    marginRight: 12,
  },
  reminderMed: {
    ...FONTS.body1,
    fontWeight: '600',
  },
  reminderTime: {
    ...FONTS.caption,
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    width: '48%',
    justifyContent: 'center',
  },
  emergencyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
});
