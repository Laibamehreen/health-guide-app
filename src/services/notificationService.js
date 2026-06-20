import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up the notification handler to decide how incoming notifications are managed when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medicine-reminders', {
      name: 'Medicine Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0D9488',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

// Schedules a reminder after a specific interval or at a specific time
export const scheduleMedicineReminder = async (medicineName, dosage, timeInSeconds) => {
  if (Platform.OS === 'web') {
    throw new Error('Push notifications are not supported on Web. Please run the app on Android or iOS (Expo Go) to set reminders.');
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error('Notification permissions not granted');
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Medicine Reminder 💊',
      body: `It is time to take ${medicineName} (${dosage})`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { medicineName, dosage },
    },
    trigger: {
      seconds: timeInSeconds, // Delay in seconds for demonstration
    },
  });

  return identifier;
};

// Cancel a specific notification
export const cancelReminder = async (identifier) => {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(identifier);
};

// Cancel all notifications
export const cancelAllReminders = async () => {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Fetch all active scheduled notifications
export const getScheduledReminders = async () => {
  if (Platform.OS === 'web') return [];
  return await Notifications.getAllScheduledNotificationsAsync();
};
