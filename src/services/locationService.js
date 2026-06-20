import { Platform } from "react-native";
import * as Location from "expo-location";

export const requestLocationPermissions = async () => {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(false);
        return;
      }
      resolve(true);
    });
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};

export const getCurrentLocation = async () => {
  if (Platform.OS === "web") {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }

  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    throw new Error("Location permission denied");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
};

// Generates realistic nearby clinics, hospitals, and pharmacies based on user location
export const getNearbyHealthCenters = (lat, lng) => {
  return [
    {
      id: "hosp-1",
      type: "hospital",
      name: "City General Hospital",
      address: "100 Medical Plaza Way",
      phone: "555-0199",
      latitude: lat + 0.005,
      longitude: lng - 0.004,
    },
    {
      id: "hosp-2",
      type: "hospital",
      name: "St. Jude Medical Center",
      address: "240 Hope Blvd",
      phone: "555-0143",
      latitude: lat - 0.006,
      longitude: lng + 0.007,
    },
    {
      id: "pharm-1",
      type: "pharmacy",
      name: "Green Cross Pharmacy",
      address: "45 Wellness Ave",
      phone: "555-0182",
      latitude: lat + 0.003,
      longitude: lng + 0.003,
    },
    {
      id: "pharm-2",
      type: "pharmacy",
      name: "Cure-All Rx Pharmacy",
      address: "88 Remedies Rd",
      phone: "555-0121",
      latitude: lat - 0.003,
      longitude: lng - 0.005,
    },
    {
      id: "clinic-1",
      type: "clinic",
      name: "Metro Family Care Clinic",
      address: "12 Healthstone St",
      phone: "555-0177",
      latitude: lat + 0.008,
      longitude: lng + 0.001,
    },
    {
      id: "clinic-2",
      type: "clinic",
      name: "Pediatric Health Clinic",
      address: "320 Growing Up Ln",
      phone: "555-0165",
      latitude: lat - 0.004,
      longitude: lng - 0.002,
    },
  ];
};
