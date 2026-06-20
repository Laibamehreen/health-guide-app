import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { authSuccess, logoutSuccess, authStart } from '../redux/authSlice';
import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import SplashScreen from '../screens/splash/SplashScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    dispatch(authStart());

    const resolveUserSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@health_guide_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Log in immediately with cached local data
          dispatch(authSuccess(parsedUser));

          // Asynchronously fetch and sync the latest user data in the background
          (async () => {
            try {
              const { ref, get } = require('firebase/database');
              const { db } = require('../config/firebase');
              const sanitizeEmail = (e) => e.toLowerCase().trim().replace(/[.$#[\]]/g, '_');
              const userRef = ref(db, 'users/' + sanitizeEmail(parsedUser.email));
              const snapshot = await get(userRef);
              if (snapshot.exists()) {
                const latestData = snapshot.val();
                dispatch(authSuccess(latestData));
                await AsyncStorage.setItem('@health_guide_user', JSON.stringify(latestData));
              }
            } catch (fsErr) {
              console.warn('Could not read user profile from Realtime Database in background:', fsErr.message);
            }
          })();
        } else {
          dispatch(logoutSuccess());
        }
      } catch (e) {
        console.error('Failed to resolve user session: ', e);
        dispatch(logoutSuccess());
      } finally {
        // Enforce transition off splash screen
        setTimeout(() => {
          setIsInitializing(false);
        }, 1500);
      }
    };

    resolveUserSession();
  }, [dispatch]);

  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Drawer" component={DrawerNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
