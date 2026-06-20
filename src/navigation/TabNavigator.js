import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';

import HomeScreen from '../screens/dashboard/HomeScreen';
import HealthRecordsScreen from '../screens/records/HealthRecordsScreen';
import AddEditRecordScreen from '../screens/records/AddEditRecordScreen';
import MapScreen from '../screens/services/MapScreen';
import ChatbotScreen from '../screens/services/ChatbotScreen';

const Tab = createBottomTabNavigator();
const RecordStack = createStackNavigator();

// Nested stack to transition between listing and adding/editing health records
function RecordStackNavigator() {
  return (
    <RecordStack.Navigator screenOptions={{ headerShown: false }}>
      <RecordStack.Screen name="RecordsList" component={HealthRecordsScreen} />
      <RecordStack.Screen name="AddEditRecord" component={AddEditRecordScreen} />
    </RecordStack.Navigator>
  );
}

export default function TabNavigator() {
  const isDarkMode = useSelector((state) => state.auth.user?.darkMode || false);
  const theme = isDarkMode ? 'dark' : 'light';
  const activeColors = COLORS[theme];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'grid-outline';
          } else if (route.name === 'Records') {
            iconName = 'journal-outline';
          } else if (route.name === 'Map') {
            iconName = 'map-outline';
          } else if (route.name === 'AI Chat') {
            iconName = 'chatbubble-ellipses-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: activeColors.primary,
        tabBarInactiveTintColor: activeColors.textMuted,
        tabBarStyle: {
          backgroundColor: activeColors.surface,
          borderTopColor: activeColors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Records" component={RecordStackNavigator} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="AI Chat" component={ChatbotScreen} />
    </Tab.Navigator>
  );
}
