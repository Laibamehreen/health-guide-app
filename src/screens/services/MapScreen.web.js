import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { COLORS } from "../../config/theme";
import {
  getCurrentLocation,
  getNearbyHealthCenters,
} from "../../services/locationService";

const DEFAULT_REGION = {
  latitude: 33.5773696,
  longitude: 73.0300416,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const getMapHtml = (initialRegion, initialCenters, isDark) => {
  const centersJson = JSON.stringify(initialCenters || []);
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { height: 100%; width: 100%; margin: 0; padding: 0; font-family: sans-serif; }
    .leaflet-control-attribution { display: none !important; }
    .user-marker {
      width: 14px;
      height: 14px;
      background: #0ea5e9;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(14, 165, 233, 0.8);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${initialRegion.latitude}, ${initialRegion.longitude}], 14);
    L.tileLayer('${tileUrl}', { maxZoom: 19 }).addTo(map);

    // User marker
    var userIcon = L.divIcon({
      className: 'user-marker',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    L.marker([${initialRegion.latitude}, ${initialRegion.longitude}], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b>Your Location</b>');

    // Health centers
    var centers = ${centersJson};
    centers.forEach(function(c) {
      var iconEmoji = c.type === 'hospital' ? '🏥' : c.type === 'pharmacy' ? '💊' : '🩺';
      var markerIcon = L.divIcon({
        html: '<div style="font-size:22px;">' + iconEmoji + '</div>',
        className: 'custom-pin',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      L.marker([c.latitude, c.longitude], { icon: markerIcon })
        .addTo(map)
        .bindPopup('<b>' + c.name + '</b><br>' + c.address + '<br>📞 ' + c.phone);
    });
  </script>
</body>
</html>`;
};

export default function MapScreen() {
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? "dark" : "light";
  const activeColors = COLORS[theme];

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentLocation();
        setRegion(loc);
        setCenters(getNearbyHealthCenters(loc.latitude, loc.longitude));
      } catch (err) {
        setCenters(
          getNearbyHealthCenters(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude)
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: activeColors.background }]}>
        <ActivityIndicator size="large" color={activeColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeColors.background }]}>
      <iframe
        srcDoc={getMapHtml(region, centers, isDarkMode)}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
