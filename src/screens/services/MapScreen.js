import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { COLORS, FONTS, SIZES } from "../../config/theme";
import {
  getCurrentLocation,
  getNearbyHealthCenters,
} from "../../services/locationService";
import { db, isMockMode } from "../../config/firebase";

// Fallback region (COMSATS Attock Campus)
const DEFAULT_REGION = {
  latitude: 33.5773696,
  longitude: 73.0300416,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

// Platform-aware WebViewComponent definition
let WebViewComponent;
if (Platform.OS === "web") {
  WebViewComponent = React.forwardRef(({ source, onMessage, style }, ref) => {
    useEffect(() => {
      const handleWebMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage({ nativeEvent: { data: event.data } });
        } catch (e) {
          // ignore non-JSON messages
        }
      };
      window.addEventListener("message", handleWebMessage);
      return () => window.removeEventListener("message", handleWebMessage);
    }, [onMessage]);

    return (
      <iframe
        ref={ref}
        srcDoc={source.html}
        style={{ width: "100%", height: "100%", border: "none", ...style }}
      />
    );
  });
} else {
  const { WebView } = require("react-native-webview");
  WebViewComponent = React.forwardRef((props, ref) => {
    return (
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        {...props}
      />
    );
  });
}

// Helper to generate the Leaflet HTML source
const getMapHtml = (
  initialRegion,
  initialCenters,
  initialUserLocation,
  isDark,
) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; }
    html, body, #map { height: 100%; width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .leaflet-control-attribution { display: none !important; }
    
    /* Pulsing user marker */
    .user-location-icon {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .user-pulse {
      background-color: #0ea5e9;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 8px #0ea5e9;
      animation: pulse 2s infinite ease-in-out;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 0 0px rgba(14, 165, 233, 0.7); }
      70% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
      100% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 0 0px rgba(14, 165, 233, 0); }
    }
    
    /* Custom Marker CSS */
    .custom-marker {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .custom-marker-inner {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 0.2s ease-in-out;
    }
    .custom-marker-inner:active {
      transform: scale(0.9);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize map
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${initialRegion.latitude}, ${initialRegion.longitude}], 14);

    // Tile Layers
    var lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    });
    var darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    });

    // Add initial tiles
    var isDark = ${isDark};
    if (isDark) {
      darkTiles.addTo(map);
    } else {
      lightTiles.addTo(map);
    }

    var userMarker = null;
    var markersLayer = L.layerGroup().addTo(map);

    function sendToRN(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      } else {
        window.parent.postMessage(JSON.stringify(msg), '*');
      }
    }

    // Custom SVGs matching category icons
    var icons = {
      hospital: '<svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/></svg>',
      pharmacy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 19c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 9h-3v3h-2v-3H8v-2h3V7h2v3h3v2z"/></svg>',
      clinic: '<svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.83 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
      default: '<svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
    };

    function getMarkerColor(type) {
      switch (type) {
        case 'hospital': return '#EF4444';
        case 'pharmacy': return '#10B981';
        case 'clinic': return '#0EA5E9';
        default: return '#748b8c';
      }
    }

    window.updateMap = function(center, centers, userLoc, isDarkTheme) {
      // Toggle Theme
      if (isDarkTheme) {
        if (map.hasLayer(lightTiles)) map.removeLayer(lightTiles);
        darkTiles.addTo(map);
      } else {
        if (map.hasLayer(darkTiles)) map.removeLayer(darkTiles);
        lightTiles.addTo(map);
      }

      // Recenter Map if requested
      if (center) {
        map.setView([center.latitude, center.longitude], map.getZoom() || 14);
      }

      // Update User Marker
      if (userLoc) {
        var userLatLng = [userLoc.latitude, userLoc.longitude];
        if (!userMarker) {
          var pulsingIcon = L.divIcon({
            className: 'user-location-icon',
            html: '<div class="user-pulse"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          userMarker = L.marker(userLatLng, { icon: pulsingIcon }).addTo(map);
        } else {
          userMarker.setLatLng(userLatLng);
        }
      }

      // Update Health Center Markers
      markersLayer.clearLayers();
      if (centers && centers.length > 0) {
        centers.forEach(function(centerItem) {
          var color = getMarkerColor(centerItem.type);
          var svgIcon = icons[centerItem.type] || icons.default;
          var htmlContent = '<div class="custom-marker-inner" style="background-color: ' + color + ';">' + svgIcon + '</div>';

          var customIcon = L.divIcon({
            className: 'custom-marker',
            html: htmlContent,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          var marker = L.marker([centerItem.latitude, centerItem.longitude], { icon: customIcon });
          marker.on('click', function() {
            sendToRN({ type: 'SELECT_CENTER', data: centerItem });
          });
          
          markersLayer.addLayer(marker);
        });
      }
    };

    // Forward map click to close selected panel
    map.on('click', function(e) {
      if (e.originalEvent.target.id === 'map' || e.originalEvent.target.classList.contains('leaflet-container')) {
        sendToRN({ type: 'DESELECT_CENTER' });
      }
    });

    window.addEventListener('resize', function() {
      map.invalidateSize();
    });

    // Notify parent window that map is loaded
    sendToRN({ type: 'MAP_READY' });

    window.addEventListener('message', function(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'UPDATE_MAP') {
          window.updateMap(msg.center, msg.centers, msg.userLocation, msg.isDark);
        }
      } catch (e) {}
    });
    document.addEventListener('message', function(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'UPDATE_MAP') {
          window.updateMap(msg.center, msg.centers, msg.userLocation, msg.isDark);
        }
      } catch (e) {}
    });
  </script>
</body>
</html>
  `;
};

export default function MapScreen() {
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = user?.darkMode || false;
  const theme = isDarkMode ? "dark" : "light";
  const activeColors = COLORS[theme];

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthCenters, setHealthCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, hospital, pharmacy, clinic
  const [mapReady, setMapReady] = useState(false);

  const webViewRef = useRef(null);

  const saveLocationToFirebase = async (coords) => {
    if (!user?.email || isMockMode) return;
    try {
      const { ref, update } = require("firebase/database");
      const sanitizeEmail = (e) =>
        e
          .toLowerCase()
          .trim()
          .replace(/[.$#[\]]/g, "_");
      const userRef = ref(db, "users/" + sanitizeEmail(user.email));
      await update(userRef, {
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          updatedAt: new Date().toISOString(),
        },
      });
      console.log("User location stored in Firebase successfully.");
    } catch (e) {
      console.warn("Failed to store location in Firebase:", e);
    }
  };

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const coords = await getCurrentLocation();
      setRegion(coords);
      setUserLocation(coords);

      // Save user location to Firebase
      await saveLocationToFirebase(coords);

      const centers = getNearbyHealthCenters(coords.latitude, coords.longitude);
      setHealthCenters(centers);
      setSelectedCenter(null);

      // If map is already ready, push a direct recenter update
      if (mapReady) {
        const payload = {
          center: coords,
          centers: centers.filter(
            (c) => filterType === "all" || c.type === filterType,
          ),
          userLocation: coords,
          isDark: isDarkMode,
        };
        if (Platform.OS === "web") {
          webViewRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: "UPDATE_MAP", ...payload }),
            "*",
          );
        } else {
          webViewRef.current?.injectJavaScript(
            `window.updateMap(
              ${JSON.stringify(payload.center)},
              ${JSON.stringify(payload.centers)},
              ${JSON.stringify(payload.userLocation)},
              ${payload.isDark}
            ); true;`,
          );
        }
      }
    } catch (err) {
      console.warn("Location retrieval failed, falling back to default:", err);
      const fallbackCoords = DEFAULT_REGION;
      setRegion(fallbackCoords);
      setUserLocation(fallbackCoords);

      // Save default/fallback coordinates to Firebase to keep database and map in sync
      await saveLocationToFirebase(fallbackCoords);

      const centers = getNearbyHealthCenters(
        fallbackCoords.latitude,
        fallbackCoords.longitude,
      );
      setHealthCenters(centers);
      setSelectedCenter(null);

      Toast.show({
        type: "info",
        text1: "Mock GPS Mode",
        text2: "Using simulated location at COMSATS Attock Campus.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // Filter centers
  const filteredCenters = healthCenters.filter((center) => {
    if (filterType === "all") return true;
    return center.type === filterType;
  });

  // Keep Leaflet markers, theme, and user location synced when filters or configuration change
  useEffect(() => {
    if (mapReady) {
      const payload = {
        center: null, // Don't snap-recenter on every list filter/theme switch
        centers: filteredCenters,
        userLocation: userLocation,
        isDark: isDarkMode,
      };

      if (Platform.OS === "web") {
        webViewRef.current?.contentWindow?.postMessage(
          JSON.stringify({ type: "UPDATE_MAP", ...payload }),
          "*",
        );
      } else {
        webViewRef.current?.injectJavaScript(
          `window.updateMap(
            null,
            ${JSON.stringify(payload.centers)},
            ${JSON.stringify(payload.userLocation)},
            ${payload.isDark}
          ); true;`,
        );
      }
    }
  }, [mapReady, filteredCenters, userLocation, isDarkMode]);

  const getMarkerColor = (type) => {
    switch (type) {
      case "hospital":
        return activeColors.error;
      case "pharmacy":
        return activeColors.success;
      case "clinic":
        return activeColors.primary;
      default:
        return "#748b8c";
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case "hospital":
        return "medical";
      case "pharmacy":
        return "leaf";
      case "clinic":
        return "people";
      default:
        return "help";
    }
  };

  const handleCallCenter = (center) => {
    Alert.alert(
      "Contact Health Center",
      `Would you like to dial ${center.name} (${center.phone})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dial",
          onPress: () => {
            Linking.openURL(`tel:${center.phone}`).catch(() => {
              Toast.show({
                type: "info",
                text1: "Simulated Call",
                text2: `Calling ${center.name}...`,
              });
            });
          },
        },
      ],
    );
  };

  const handleGetDirections = (center) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${center.name}@${center.latitude},${center.longitude}`,
      android: `geo:0,0?q=${center.latitude},${center.longitude}(${center.name})`,
      web: `https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`,
    });

    Linking.openURL(url).catch(() => {
      Toast.show({
        type: "info",
        text1: "Simulated Directions",
        text2: `Showing directions to ${center.name}...`,
      });
    });
  };

  const handleMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "SELECT_CENTER") {
        setSelectedCenter(msg.data);
      } else if (msg.type === "DESELECT_CENTER") {
        setSelectedCenter(null);
      } else if (msg.type === "MAP_READY") {
        setMapReady(true);
      }
    } catch (e) {
      console.warn("Error parsing WebView message:", e);
    }
  };

  if (loading && !userLocation) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: activeColors.background },
        ]}
      >
        <ActivityIndicator size="large" color={activeColors.primary} />
        <Text style={[styles.loadingText, { color: activeColors.text }]}>
          Locating nearby medical centers...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: activeColors.background }]}
    >
      {/* Search Filter Header */}
      <View
        style={[
          styles.filterBar,
          {
            backgroundColor: activeColors.surface,
            borderBottomColor: activeColors.border,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === "all" && {
                backgroundColor: activeColors.primary,
                borderColor: activeColors.primary,
              },
            ]}
            onPress={() => setFilterType("all")}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filterType === "all"
                      ? "#FFFFFF"
                      : activeColors.textSecondary,
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === "hospital" && {
                backgroundColor: activeColors.error,
                borderColor: activeColors.error,
              },
            ]}
            onPress={() => setFilterType("hospital")}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filterType === "hospital"
                      ? "#FFFFFF"
                      : activeColors.textSecondary,
                },
              ]}
            >
              Hospitals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === "pharmacy" && {
                backgroundColor: activeColors.success,
                borderColor: activeColors.success,
              },
            ]}
            onPress={() => setFilterType("pharmacy")}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filterType === "pharmacy"
                      ? "#FFFFFF"
                      : activeColors.textSecondary,
                },
              ]}
            >
              Pharmacies
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === "clinic" && {
                backgroundColor: activeColors.primary,
                borderColor: activeColors.primary,
              },
            ]}
            onPress={() => setFilterType("clinic")}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filterType === "clinic"
                      ? "#FFFFFF"
                      : activeColors.textSecondary,
                },
              ]}
            >
              Clinics
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.container}>
        {/* Leaflet WebView Map Container */}
        <WebViewComponent
          ref={webViewRef}
          source={{
            html: getMapHtml(region, filteredCenters, userLocation, isDarkMode),
          }}
          onMessage={handleMessage}
          style={styles.map}
        />

        {/* GPS Recenter Floating Button */}
        <TouchableOpacity
          style={[
            styles.recenterBtn,
            {
              backgroundColor: activeColors.surface,
              borderColor: activeColors.border,
            },
          ]}
          onPress={fetchLocation}
        >
          <Ionicons name="locate" size={24} color={activeColors.primary} />
        </TouchableOpacity>

        {/* Detail Panel at Bottom */}
        {selectedCenter && (
          <View
            style={[
              styles.detailPanel,
              {
                backgroundColor: activeColors.surface,
                borderTopColor: activeColors.border,
              },
            ]}
          >
            <View style={styles.detailHeader}>
              <View style={styles.detailTitleRow}>
                <Ionicons
                  name={getMarkerIcon(selectedCenter.type)}
                  size={20}
                  color={getMarkerColor(selectedCenter.type)}
                  style={styles.detailIcon}
                />
                <Text
                  style={[styles.detailTitle, { color: activeColors.text }]}
                  numberOfLines={1}
                >
                  {selectedCenter.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedCenter(null)}>
                <Ionicons
                  name="close"
                  size={20}
                  color={activeColors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.detailAddress,
                { color: activeColors.textSecondary },
              ]}
            >
              {selectedCenter.address}
            </Text>
            <Text
              style={[styles.detailPhone, { color: activeColors.textMuted }]}
            >
              📞 Phone: {selectedCenter.phone}
            </Text>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: activeColors.primary },
                ]}
                onPress={() => handleGetDirections(selectedCenter)}
              >
                <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: activeColors.primary,
                  },
                ]}
                onPress={() => handleCallCenter(selectedCenter)}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={activeColors.primary}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: activeColors.primary },
                  ]}
                >
                  Call
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  filterBar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterBarScroll: {
    paddingHorizontal: 12,
  },
  filterPill: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
  },
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    ...FONTS.body2,
    marginTop: 12,
  },
  recenterBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  detailPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    zIndex: 15,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  detailAddress: {
    ...FONTS.body2,
    marginBottom: 4,
  },
  detailPhone: {
    ...FONTS.caption,
    marginBottom: 16,
  },
  detailActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },
});
