import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONTS, SIZES } from '../../config/theme';
import { updateProfileSuccess } from '../../redux/authSlice';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { db } from '../../config/firebase';
import {
  scheduleMedicineReminder,
  cancelAllReminders,
  getScheduledReminders,
  cancelReminder
} from '../../services/notificationService';

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  // Reminder Form States
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('60'); // default 60s
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, [user?.uid]);

  const fetchReminders = async () => {
    if (!user?.uid) return;
    try {
      const { ref, get } = require('firebase/database');
      const remindersRef = ref(db, `reminders/${user.uid}`);
      const snapshot = await get(remindersRef);
      const firebaseReminders = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          firebaseReminders.push({ id: key, ...data[key] });
        });
      }
      firebaseReminders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReminders(firebaseReminders);
    } catch (e) {
      console.warn('Failed to load active reminders from database:', e);
    }
  };

  const handleToggleTheme = async (value) => {
    dispatch(updateProfileSuccess({ darkMode: value }));

    try {
      const { ref, update } = require('firebase/database');
      const sanitizeEmail = (e) => e.toLowerCase().trim().replace(/[.$#[\]]/g, '_');
      const userRef = ref(db, 'users/' + sanitizeEmail(user.email));
      await update(userRef, { darkMode: value });

      // Update local storage representation of user session to preserve theme state on reload
      const storedUser = await AsyncStorage.getItem('@health_guide_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        const newUserObj = { ...userObj, darkMode: value };
        await AsyncStorage.setItem('@health_guide_user', JSON.stringify(newUserObj));
      }

      Toast.show({
        type: 'success',
        text1: 'Theme Changed',
        text2: `Dark mode ${value ? 'enabled' : 'disabled'}.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleReminder = async () => {
    if (!medName.trim() || !dosage.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please enter medicine name and dosage instructions.',
      });
      return;
    }

    const seconds = parseInt(delaySeconds, 10);
    if (isNaN(seconds) || seconds <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Time',
        text2: 'Please specify a positive number of seconds.',
      });
      return;
    }

    setLoading(true);
    try {
      const identifier = await scheduleMedicineReminder(medName.trim(), dosage.trim(), seconds);
      
      const newReminder = {
        id: identifier,
        medicineName: medName.trim(),
        dosage: dosage.trim(),
        delaySeconds: seconds,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      const { ref, set } = require('firebase/database');
      await set(ref(db, `reminders/${user.uid}/${identifier}`), newReminder);

      Toast.show({
        type: 'success',
        text1: 'Reminder Scheduled',
        text2: `Notification for ${medName} set in ${seconds}s.`,
      });
      setMedName('');
      setDosage('');
      // Refresh list
      await fetchReminders();
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Scheduling Failed',
        text2: err.message || 'Make sure notification permissions are granted.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllReminders = () => {
    Alert.alert(
      'Clear All Reminders',
      'Are you sure you want to cancel all scheduled medicine reminders?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllReminders();

              const { ref, set } = require('firebase/database');
              await set(ref(db, `reminders/${user.uid}`), null);

              await fetchReminders();
              Toast.show({
                type: 'success',
                text1: 'Cleared',
                text2: 'All active notifications have been removed.',
              });
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const handleRemoveItem = async (id, name) => {
    try {
      await cancelReminder(id);

      const { ref, set } = require('firebase/database');
      await set(ref(db, `reminders/${user.uid}/${id}`), null);

      await fetchReminders();
      Toast.show({
        type: 'success',
        text1: 'Reminder Removed',
        text2: `Cleared reminder for ${name}.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Appearance Settings */}
        <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Appearance</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={22} color={activeColors.primary} style={styles.icon} />
              <View>
                <Text style={[styles.settingLabel, { color: activeColors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingSub, { color: activeColors.textMuted }]}>Toggle app appearance theme</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#767577', true: activeColors.primary + '80' }}
              thumbColor={isDarkMode ? activeColors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Medicine Reminder Schedule Form */}
        <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border }]}>
          <Text style={[styles.sectionTitle, { color: activeColors.text }]}>Schedule Medicine Reminder 💊</Text>
          <Text style={[styles.descriptionText, { color: activeColors.textSecondary }]}>
            Create a local push notification reminder to take your prescription medicine.
          </Text>

          <CustomInput
            label="Medicine Name"
            placeholder="e.g. Paracetamol"
            value={medName}
            onChangeText={setMedName}
            iconName="medkit-outline"
            theme={theme}
          />

          <CustomInput
            label="Dosage / Instructions"
            placeholder="e.g. 1 Tablet after meal"
            value={dosage}
            onChangeText={setDosage}
            iconName="information-circle-outline"
            theme={theme}
          />

          <CustomInput
            label="Remind Me In (Seconds)"
            placeholder="e.g. 60"
            keyboardType="numeric"
            value={delaySeconds}
            onChangeText={setDelaySeconds}
            iconName="time-outline"
            theme={theme}
          />

          <CustomButton
            title="Add Reminder Notification"
            onPress={handleScheduleReminder}
            loading={loading}
            theme={theme}
            style={styles.actionBtn}
          />
        </View>

        {/* Active Reminders List */}
        <View style={[styles.card, { backgroundColor: activeColors.surface, borderColor: activeColors.border, marginBottom: 24 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, { color: activeColors.text, marginBottom: 0 }]}>Active Scheduled Reminders</Text>
            {reminders.length > 0 && (
              <TouchableOpacity onPress={handleClearAllReminders}>
                <Text style={[styles.clearAllText, { color: activeColors.error }]}>Cancel All</Text>
              </TouchableOpacity>
            )}
          </View>

          {reminders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={32} color={activeColors.textMuted} />
              <Text style={[styles.emptyText, { color: activeColors.textMuted }]}>No active reminders scheduled</Text>
            </View>
          ) : (
            reminders.map((item) => {
              const med = item.medicineName || 'Medicine';
              const dose = item.dosage || 'As prescribed';
              return (
                <View key={item.id} style={[styles.reminderItem, { borderBottomColor: activeColors.border }]}>
                  <View style={styles.reminderDetails}>
                    <Ionicons name="alarm-outline" size={18} color={activeColors.primary} style={styles.reminderIcon} />
                    <View>
                      <Text style={[styles.reminderTitleText, { color: activeColors.text }]}>{med}</Text>
                      <Text style={[styles.reminderSubtitleText, { color: activeColors.textMuted }]}>{dose}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id, med)}>
                    <Ionicons name="trash-outline" size={18} color={activeColors.error} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
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
  card: {
    padding: 20,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    ...FONTS.h3,
    fontWeight: '700',
    marginBottom: 16,
  },
  descriptionText: {
    ...FONTS.body2,
    lineHeight: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 16,
  },
  settingLabel: {
    ...FONTS.body1,
    fontWeight: '600',
  },
  settingSub: {
    ...FONTS.caption,
    marginTop: 2,
  },
  actionBtn: {
    width: '100%',
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearAllText: {
    ...FONTS.body2,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
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
  reminderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderIcon: {
    marginRight: 12,
  },
  reminderTitleText: {
    ...FONTS.body1,
    fontWeight: '600',
  },
  reminderSubtitleText: {
    ...FONTS.caption,
  },
});
