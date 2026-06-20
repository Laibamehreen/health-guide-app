import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../config/theme';
import TabNavigator from './TabNavigator';
import ProfileScreen from '../screens/dashboard/ProfileScreen';
import SettingsScreen from '../screens/dashboard/SettingsScreen';
import { logoutSuccess } from '../redux/authSlice';
import { clearRecords } from '../redux/recordsSlice';
import { clearChat } from '../redux/chatbotSlice';


const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  const handleLogout = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('@health_guide_user');
      dispatch(logoutSuccess());
      dispatch(clearRecords());
      dispatch(clearChat());
    } catch (err) {
      console.error('Logout error: ', err);
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ backgroundColor: activeColors.surface, flex: 1 }}
    >
      {/* Header Profile Info */}
      <View style={[styles.header, { borderBottomColor: activeColors.border }]}>
        <View style={[styles.avatar, { backgroundColor: activeColors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={[styles.name, { color: activeColors.text }]}>
          {user?.displayName || 'Health User'}
        </Text>
        <Text style={[styles.email, { color: activeColors.textMuted }]}>
          {user?.email || 'user@healthguide.com'}
        </Text>
      </View>

      {/* Drawer navigation list */}
      <View style={styles.itemsList}>
        <DrawerItemList {...props} />
      </View>

      {/* Footer log out button */}
      <View style={[styles.footer, { borderTopColor: activeColors.border }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={activeColors.error} />
          <Text style={[styles.logoutText, { color: activeColors.error }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const isDarkMode = useSelector((state) => state.auth.user?.darkMode || false);
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: activeColors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: activeColors.border,
        },
        headerTintColor: activeColors.text,
        drawerActiveTintColor: activeColors.primary,
        drawerInactiveTintColor: activeColors.textMuted,
        drawerStyle: {
          backgroundColor: activeColors.surface,
          width: 280,
        },
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          title: 'Health Dashboard',
          drawerLabel: 'Home Dashboard',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Health Profile',
          drawerLabel: 'Profile Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'App Settings',
          drawerLabel: 'Preferences',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    ...FONTS.h3,
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    ...FONTS.body2,
  },
  itemsList: {
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    ...FONTS.body1,
    fontWeight: '600',
    marginLeft: 10,
  },
});
