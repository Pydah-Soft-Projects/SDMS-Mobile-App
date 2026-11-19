import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Alert,
  Platform,
  Dimensions,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Bus,
  MapPin,
  Navigation,
  Clock,
  Phone,
  ShieldCheck,
  AlertCircle,
  Calendar,
  ChevronRight,
  Search,
  X,
  ExternalLink,
  Compass,
  RotateCw,
  CheckCircle2,
  Building2,
  Flag,
  User,
  Radio,
  Crosshair,
} from 'lucide-react-native';
import api from '../config/api';
import { ModuleContentSkeleton } from './SkeletonLoader';

const RNWebView = WebView as any;

/* ── Scheduled Commencement & Terminus Timing Constants ─────────────── */
const MORNING_ORIGIN_START_TIME = '07:00 AM';
const MORNING_CAMPUS_END_TIME = '08:15 AM';
const EVENING_CAMPUS_START_TIME = '04:30 PM';
const EVENING_ORIGIN_END_TIME = '05:45 PM';

/* ── Helper: Add minutes to time string ("07:00 AM") ────────────────── */
const addMinutesToTimeStr = (baseTimeStr: string, minutesToAdd: number): string => {
  try {
    const parts = baseTimeStr.split(' ');
    const [hStr, mStr] = parts[0].split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const isPM = parts[1] === 'PM';
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;

    const totalMinutes = h * 60 + m + Math.round(minutesToAdd);
    const resH = Math.floor(totalMinutes / 60) % 24;
    const resM = totalMinutes % 60;
    const resAmpm = resH >= 12 ? 'PM' : 'AM';
    const formattedH = resH % 12 || 12;
    const formattedM = resM < 10 ? `0${resM}` : resM;
    return `${formattedH}:${formattedM} ${resAmpm}`;
  } catch {
    return baseTimeStr;
  }
};

/* ── Helper: Haversine distance in KM ────────────────────────────────── */
const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/* ── Helper: Compass Heading Direction ───────────────────────────────── */
const getCompassDirection = (deg?: number | null): string => {
  if (deg == null || isNaN(deg) || deg < 0) return '';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return directions[index];
};

/* ── Props ──────────────────────────────────────────────────────────── */
interface StudentTransportViewProps {
  data: any;
  student?: any;
  onRefresh?: () => void;
}

export const StudentTransportView: React.FC<StudentTransportViewProps> = ({
  data: initialData,
  student,
  onRefresh: parentRefresh,
}) => {
  const admissionNo = student?.admission_number || student?.pin_no || '';
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCompactScreen = screenWidth < 380;

  // Data & Telemetry States
  const [transportData, setTransportData] = useState<any>(initialData || null);
  const [liveBusData, setLiveBusData] = useState<any>(initialData?.liveLocation || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [lastPingTime, setLastPingTime] = useState<string>('Just now');
  const [showFullRouteModal, setShowFullRouteModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshingGps, setIsRefreshingGps] = useState<boolean>(false);

  // Opens directly with the 'bus' option active by default
  const [mapFocusMode, setMapFocusMode] = useState<'bus' | 'stop' | 'campus' | 'fit'>('bus');

  const pollIntervalRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  // Dynamic responsive map height tailored to device viewport height
  const responsiveMapHeight = useMemo(() => {
    return Math.max(280, Math.min(420, Math.round(screenHeight * 0.38)));
  }, [screenHeight]);

  // Sync initialData when parent updates
  useEffect(() => {
    if (initialData) {
      setTransportData(initialData);
      if (initialData.liveLocation) {
        setLiveBusData(initialData.liveLocation);
      }
    }
  }, [initialData]);

  // Fetch transport details from backend
  const fetchTransportDetails = useCallback(async () => {
    try {
      setLoading(true);
      const query = admissionNo ? `?admission_number=${encodeURIComponent(admissionNo)}` : '';
      const res = await api.get(`/transport/my-details${query}`);
      if (res.data && res.data.success) {
        setTransportData(res.data);
        if (res.data.liveLocation) {
          setLiveBusData(res.data.liveLocation);
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch transport details:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [admissionNo]);

  // Initial load if no data passed
  useEffect(() => {
    if (!initialData) {
      fetchTransportDetails();
    }
  }, [initialData, fetchTransportDetails]);

  // Resolve active pass
  const activePass = transportData?.activePass || (transportData?.hasActivePass ? transportData?.route : null);
  const hasActivePass = Boolean(transportData?.hasActivePass && activePass);
  const busIdentifier = activePass?.busId || activePass?.routeId || activePass?.busDetails?.busNumber;

  // Poll GPS telemetry periodically every 10 seconds
  const fetchLiveGps = useCallback(async () => {
    if (!hasActivePass || !busIdentifier) return;
    try {
      setIsRefreshingGps(true);
      const cleanKey = encodeURIComponent(String(busIdentifier).trim());
      const res = await api.get(`/transport/gps/live-location/${cleanKey}`);
      if (res.data && res.data.success && res.data.data) {
        setLiveBusData(res.data.data);
        setLastPingTime('Just now');

        // Dynamically update bus marker in WebView without reloading map
        const loc = res.data.data.location;
        if (loc?.latitude && loc?.longitude && webViewRef.current) {
          const lat = Number(loc.latitude);
          const lng = Number(loc.longitude);
          const spd = Number(loc.speed || 0);
          const mov = loc.status === 'Moving' || spd > 0;
          const hdg = Number(loc.heading || 0);
          webViewRef.current.injectJavaScript(`
            if (typeof window.updateBusPosition === 'function') {
              window.updateBusPosition(${lat}, ${lng}, ${spd}, ${mov}, ${hdg});
            }
            true;
          `);
        }
      }
    } catch {
      // Keep last known telemetry silently
    } finally {
      setIsRefreshingGps(false);
    }
  }, [hasActivePass, busIdentifier]);

  // 10-second polling interval
  useEffect(() => {
    if (!hasActivePass || !busIdentifier) return;

    fetchLiveGps();
    pollIntervalRef.current = setInterval(() => {
      fetchLiveGps();
    }, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [hasActivePass, busIdentifier, fetchLiveGps]);

  // 10-second ping timer counter ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLastPingTime((prev) => {
        if (prev === 'Just now') return '10s ago';
        const match = prev.match(/(\d+)s/);
        if (match) {
          const secs = parseInt(match[1], 10) + 10;
          return `${secs}s ago`;
        }
        return 'Just now';
      });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Live GPS Telemetry calculations
  const liveSpeed =
    liveBusData?.location?.speed != null ? Number(liveBusData.location.speed) : 0;
  const isMoving =
    liveBusData?.location?.status === 'Moving' || liveSpeed > 0;
  const ignitionActive = Boolean(liveBusData?.location?.ignition);
  const busHeading = liveBusData?.location?.heading || 0;

  // All route stages
  const allRouteStages: any[] = useMemo(() => {
    if (!activePass?.routeDetails?.stages || !Array.isArray(activePass.routeDetails.stages)) {
      return [];
    }
    return activePass.routeDetails.stages;
  }, [activePass]);

  // Total route distance in KM
  const totalRouteDistanceKm = useMemo(() => {
    if (activePass?.routeDetails?.totalDistance) {
      return Number(activePass.routeDetails.totalDistance);
    }
    if (allRouteStages.length > 0) {
      const last = allRouteStages[allRouteStages.length - 1];
      if (last?.distanceFromStart) {
        return Number(last.distanceFromStart);
      }
    }
    return 30;
  }, [activePass, allRouteStages]);

  // Stage Timing Calculator
  const getStageMetrics = useCallback(
    (stage: any) => {
      const distFromStart = Number(stage.distanceFromStart) || 0;
      const distToCampus =
        stage.distanceToDestination != null
          ? Number(stage.distanceToDestination)
          : Math.max(0, totalRouteDistanceKm - distFromStart);

      const morningTravelMins = Math.round((distFromStart / 35) * 60);
      const morningScheduledTime = addMinutesToTimeStr(
        MORNING_ORIGIN_START_TIME,
        morningTravelMins
      );
      const morningTravelTimeStr =
        morningTravelMins >= 60
          ? `${Math.floor(morningTravelMins / 60)}h ${morningTravelMins % 60}m`
          : `${morningTravelMins}m`;

      const eveningTravelMins = Math.round((distToCampus / 35) * 60);
      const eveningScheduledTime = addMinutesToTimeStr(
        EVENING_CAMPUS_START_TIME,
        eveningTravelMins
      );
      const eveningTravelTimeStr =
        eveningTravelMins >= 60
          ? `${Math.floor(eveningTravelMins / 60)}h ${eveningTravelMins % 60}m`
          : `${eveningTravelMins}m`;

      return {
        morningScheduledTime,
        morningTravelTimeStr,
        eveningScheduledTime,
        eveningTravelTimeStr,
        distFromStart: distFromStart.toFixed(1),
        distToCampus: distToCampus.toFixed(1),
      };
    },
    [totalRouteDistanceKm]
  );

  // Student's stage object
  const studentStage = useMemo(() => {
    if (activePass?.stopDetails && (activePass.stopDetails.latitude || activePass.stopDetails.stageName)) {
      return activePass.stopDetails;
    }
    if (activePass?.stopName && allRouteStages.length > 0) {
      const target = String(activePass.stopName).trim().toLowerCase();
      const found = allRouteStages.find(
        (s) => s.stageName && String(s.stageName).trim().toLowerCase() === target
      );
      if (found) return found;
    }
    return null;
  }, [activePass, allRouteStages]);

  // Student's stage index (1-based)
  const studentStageIndex = useMemo(() => {
    if (!activePass?.stopName || !allRouteStages.length) return null;
    const target = String(activePass.stopName).trim().toLowerCase();
    const idx = allRouteStages.findIndex(
      (s) => s.stageName && String(s.stageName).trim().toLowerCase() === target
    );
    return idx !== -1 ? idx + 1 : null;
  }, [activePass, allRouteStages]);

  // Coordinates
  const stopCoords = useMemo(() => {
    if (studentStage?.latitude && studentStage?.longitude) {
      return {
        lat: Number(studentStage.latitude),
        lng: Number(studentStage.longitude),
      };
    }
    return null;
  }, [studentStage]);

  const busCoords = useMemo(() => {
    if (liveBusData?.location?.latitude && liveBusData?.location?.longitude) {
      return {
        lat: Number(liveBusData.location.latitude),
        lng: Number(liveBusData.location.longitude),
      };
    }
    return null;
  }, [liveBusData]);

  const campusCoords = useMemo(() => {
    if (activePass?.routeDetails?.destination?.latitude && activePass?.routeDetails?.destination?.longitude) {
      return {
        lat: Number(activePass.routeDetails.destination.latitude),
        lng: Number(activePass.routeDetails.destination.longitude),
      };
    }
    const campusStage = allRouteStages.find(
      (s) => s.isCampusDestination || (s.stageName && s.stageName.toUpperCase().includes('PYDAH'))
    );
    if (campusStage?.latitude && campusStage?.longitude) {
      return {
        lat: Number(campusStage.latitude),
        lng: Number(campusStage.longitude),
      };
    }
    return { lat: 16.839036, lng: 82.225011 }; // Pydah College default
  }, [activePass, allRouteStages]);

  const originCoords = useMemo(() => {
    if (allRouteStages.length > 0 && allRouteStages[0]?.latitude && allRouteStages[0]?.longitude) {
      return {
        lat: Number(allRouteStages[0].latitude),
        lng: Number(allRouteStages[0].longitude),
      };
    }
    return null;
  }, [allRouteStages]);

  // Distance from Live Bus to Student Boarding Stop
  const distanceBusToStop = useMemo(() => {
    if (!busCoords || !stopCoords) return null;
    return calculateDistanceKm(
      busCoords.lat,
      busCoords.lng,
      stopCoords.lat,
      stopCoords.lng
    ).toFixed(1);
  }, [busCoords, stopCoords]);

  // Live ETA to Student Boarding Stop
  const etaToStop = useMemo(() => {
    if (!distanceBusToStop) return null;
    const dist = parseFloat(distanceBusToStop);
    if (isNaN(dist)) return null;

    const effectiveSpeed = liveSpeed >= 15 ? liveSpeed : 35;
    const minutes = Math.max(1, Math.round((dist / effectiveSpeed) * 60));

    const arrivalDate = new Date(Date.now() + minutes * 60000);
    const hours = arrivalDate.getHours();
    const mins = arrivalDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMins = mins < 10 ? `0${mins}` : mins;
    const etaClock = `${formattedHours}:${formattedMins} ${ampm}`;

    return {
      minutes,
      formattedTime:
        minutes >= 60
          ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
          : `${minutes} min`,
      etaClock,
    };
  }, [distanceBusToStop, liveSpeed]);

  // Map Focus Control helper
  const handleMapFocus = (focus: 'bus' | 'stop' | 'campus' | 'fit') => {
    setMapFocusMode(focus);
    if (!webViewRef.current) return;

    if (focus === 'bus' && busCoords) {
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.flyTo([${busCoords.lat}, ${busCoords.lng}], 16, { animate: true });
          if (window.busMarker) window.busMarker.openPopup();
        }
        true;
      `);
    } else if (focus === 'stop' && stopCoords) {
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.flyTo([${stopCoords.lat}, ${stopCoords.lng}], 15, { animate: true });
          if (window.stopMarker) window.stopMarker.openPopup();
        }
        true;
      `);
    } else if (focus === 'campus' && campusCoords) {
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.flyTo([${campusCoords.lat}, ${campusCoords.lng}], 15, { animate: true });
          if (window.campusMarker) window.campusMarker.openPopup();
        }
        true;
      `);
    } else {
      webViewRef.current.injectJavaScript(`
        if (window.fitAllBounds) {
          window.fitAllBounds();
        }
        true;
      `);
    }
  };

  // HTML content for Leaflet map inside WebView - Opens focused directly on Live Bus (NO BLUE ROUTE LINE)
  const leafletMapHtml = useMemo(() => {
    const busLat = busCoords ? busCoords.lat : (stopCoords ? stopCoords.lat : campusCoords.lat);
    const busLng = busCoords ? busCoords.lng : (stopCoords ? stopCoords.lng : campusCoords.lng);
    const stopLat = stopCoords ? stopCoords.lat : busLat;
    const stopLng = stopCoords ? stopCoords.lng : busLng;
    const campusLat = campusCoords.lat;
    const campusLng = campusCoords.lng;
    const originLat = originCoords ? originCoords.lat : stopLat;
    const originLng = originCoords ? originCoords.lng : stopLng;

    const stopName = activePass?.stopName || studentStage?.stageName || 'Boarding Stop';
    const busLabel = activePass?.busId || liveBusData?.busNumber || 'Assigned Bus';
    const campusName = activePass?.routeDetails?.destination?.name || 'Pydah College Campus';
    const originName = allRouteStages[0]?.stageName || 'Route Origin';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          .clean-leaflet-marker { background: transparent !important; border: none !important; }
          .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; padding: 4px; }
          .leaflet-popup-content { margin: 8px 10px; font-size: 12px; line-height: 1.4; color: #0f172a; }
          @keyframes ping {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize focused directly on the Live Bus (Zoom level 16)
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${busLat}, ${busLng}], 16);

          // Tile Layer (OpenStreetMap Clean)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          // 1. Campus Geofence Circle
          var campusCircle = L.circle([${campusLat}, ${campusLng}], {
            color: '#7C3AED',
            fillColor: '#8B5CF6',
            fillOpacity: 0.15,
            radius: 200,
            weight: 2,
            dashArray: '4, 4'
          }).addTo(map);

          // 2. Campus Gate Marker
          var campusIcon = L.divIcon({
            className: 'clean-leaflet-marker',
            html: '<div style="width:34px;height:34px;border-radius:17px;background:#7C3AED;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(124,58,237,0.4);border:2.5px solid #fff;font-size:15px;">🎓</div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });
          window.campusMarker = L.marker([${campusLat}, ${campusLng}], { icon: campusIcon }).addTo(map)
            .bindPopup('<b>🏁 Destination</b><br>${campusName}');

          // 3. Origin Marker
          var originIcon = L.divIcon({
            className: 'clean-leaflet-marker',
            html: '<div style="width:30px;height:30px;border-radius:15px;background:#0284C7;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(2,132,199,0.3);border:2px solid #fff;font-size:13px;">🚩</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          window.originMarker = L.marker([${originLat}, ${originLng}], { icon: originIcon }).addTo(map)
            .bindPopup('<b>🚩 Route Origin</b><br>${originName}');

          // 4. Student Boarding Stop Marker (Pulsing Emerald Beacon)
          var stopIcon = L.divIcon({
            className: 'clean-leaflet-marker',
            html: '<div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">' +
                  '<div style="position:absolute;inset:0;border-radius:50%;background:#10B981;opacity:0.35;animation:pulse 2s infinite;"></div>' +
                  '<div style="position:relative;width:32px;height:32px;border-radius:16px;background:#059669;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(5,150,105,0.45);border:2.5px solid #fff;font-size:15px;">📍</div>' +
                  '</div>',
            iconSize: [42, 42],
            iconAnchor: [21, 21]
          });
          window.stopMarker = L.marker([${stopLat}, ${stopLng}], { icon: stopIcon }).addTo(map)
            .bindPopup('<b>📍 Your Boarding Stop</b><br>${stopName}');

          // 5. Live GPS Bus Marker (Radar Waves)
          function createBusIcon(heading, isMoving) {
            return L.divIcon({
              className: 'clean-leaflet-marker',
              html: '<div style="position:relative;width:50px;height:50px;display:flex;align-items:center;justify-content:center;">' +
                    (isMoving ? '<div style="position:absolute;inset:0;border-radius:50%;background:#10B981;opacity:0.35;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>' : '') +
                    '<div style="position:relative;width:36px;height:36px;border-radius:18px;background:' + (isMoving ? '#059669' : '#2563EB') + ';color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.3);border:2.5px solid #fff;font-size:17px;">🚌' +
                    (heading > 0 ? '<div style="position:absolute;top:-4px;right:-4px;width:15px;height:15px;border-radius:7.5px;background:#0284C7;border:1.5px solid #fff;display:flex;align-items:center;justify-content:center;transform:rotate(' + heading + 'deg);font-size:8px;">▲</div>' : '') +
                    '</div>' +
                    '</div>',
              iconSize: [50, 50],
              iconAnchor: [25, 25]
            });
          }

          window.busMarker = L.marker([${busLat}, ${busLng}], {
            icon: createBusIcon(${busHeading}, ${isMoving})
          }).addTo(map).bindPopup('<b>🚌 Live Bus: ${busLabel}</b><br>Speed: ${liveSpeed} km/h<br>Status: ${isMoving ? "In Motion" : "Stationary"}');

          // Bounds fitter
          window.fitAllBounds = function() {
            var allPoints = [[${busLat}, ${busLng}], [${stopLat}, ${stopLng}], [${campusLat}, ${campusLng}], [${originLat}, ${originLng}]];
            var bounds = L.latLngBounds(allPoints);
            map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
          };

          // On map open, directly focus and zoom on the LIVE BUS option
          setTimeout(function() {
            if (window.busMarker) {
              map.setView([${busLat}, ${busLng}], 16, { animate: true });
              window.busMarker.openPopup();
            }
          }, 350);

          // Dynamic live update handler without reload
          window.updateBusPosition = function(lat, lng, speed, moving, heading) {
            if (window.busMarker) {
              window.busMarker.setLatLng([lat, lng]);
              window.busMarker.setIcon(createBusIcon(heading, moving));
              window.busMarker.setPopupContent('<b>🚌 Live Bus: ${busLabel}</b><br>Speed: ' + speed + ' km/h<br>Status: ' + (moving ? "In Motion" : "Stationary"));
            }
          };
        </script>
      </body>
      </html>
    `;
  }, [busCoords, stopCoords, campusCoords, originCoords, activePass, liveBusData, allRouteStages, isMoving, liveSpeed, busHeading]);

  // Open Phone call
  const handleCallDriver = (phone?: string) => {
    if (!phone) {
      Alert.alert('Phone Unavailable', 'Driver contact number is not registered.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Unable to Call', 'Your device does not support telephone dialing.');
    });
  };

  // Open Google Maps navigation to a stop
  const handleOpenNavigation = (lat?: number, lng?: number, label?: string) => {
    if (!lat || !lng) {
      Alert.alert('Coordinates Unavailable', 'GPS coordinates for this stop are not specified.');
      return;
    }
    const url = Platform.select({
      ios: `maps:0,0?q=${label || 'Stop'}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(label || 'Stop')})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  // Filtered stages for the full schedule modal
  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) return allRouteStages;
    const q = searchQuery.toLowerCase().trim();
    return allRouteStages.filter((s) => (s.stageName || '').toLowerCase().includes(q));
  }, [allRouteStages, searchQuery]);

  // Past Requests List
  const requestsList = transportData?.requests || [];

  // Loading skeleton state (No spinning loaders)
  if (loading && !transportData) {
    return <ModuleContentSkeleton />;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // VIEW: NO ACTIVE PASS (Matches Web Empty State)
  // ═════════════════════════════════════════════════════════════════════════
  if (!hasActivePass) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Bus size={36} color="#059669" />
          </View>
          <Text style={styles.emptyTitle}>No Active Transport Pass</Text>
          <Text style={styles.emptySub}>
            No active transport pass or bus allocation found for admission #{admissionNo || '—'}.
          </Text>

          {/* Need Transport Card */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <AlertCircle size={18} color="#D97706" />
              <Text style={styles.noticeTitle}>Need Transport Facility?</Text>
            </View>
            <Text style={styles.noticeBody}>
              If you recently enrolled for college bus transport or submitted an application, please
              contact the campus Transport Office to have your pass verified and activated.
            </Text>
          </View>

          {/* Transport Coordinator Info Card */}
          <View style={styles.supportCard}>
            <View style={styles.supportRow}>
              <Building2 size={18} color="#2563EB" />
              <View style={styles.supportCol}>
                <Text style={styles.supportLabel}>Transport Cell Location</Text>
                <Text style={styles.supportVal}>Room 104, Ground Floor, Admin Block</Text>
              </View>
            </View>
            <View style={styles.supportDivider} />
            <View style={styles.supportRow}>
              <Clock size={18} color="#2563EB" />
              <View style={styles.supportCol}>
                <Text style={styles.supportLabel}>Helpdesk Timings</Text>
                <Text style={styles.supportVal}>09:00 AM – 05:00 PM (Monday – Saturday)</Text>
              </View>
            </View>
          </View>

          {/* Requests History if available */}
          {requestsList.length > 0 && (
            <View style={styles.requestsCard}>
              <Text style={styles.requestsTitle}>Your Transport Applications</Text>
              {requestsList.map((req: any, idx: number) => (
                <View key={req.requestId || req.mongoId || idx} style={styles.requestItem}>
                  <View style={styles.requestItemLeft}>
                    <Text style={styles.requestRouteName}>
                      {req.routeName || `Route #${req.routeId || idx + 1}`}
                    </Text>
                    <Text style={styles.requestStage}>
                      Stop: {req.stopName || 'Designated Stop'}
                    </Text>
                    {req.createdAt && (
                      <Text style={styles.requestDate}>
                        Applied: {new Date(req.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      req.status?.toLowerCase() === 'approved'
                        ? styles.statusApproved
                        : req.status?.toLowerCase() === 'rejected'
                        ? styles.statusRejected
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        req.status?.toLowerCase() === 'approved'
                          ? styles.statusTextApproved
                          : req.status?.toLowerCase() === 'rejected'
                          ? styles.statusTextRejected
                          : styles.statusTextPending,
                      ]}
                    >
                      {req.status ? req.status.toUpperCase() : 'PENDING'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Refresh Action */}
          <TouchableOpacity style={styles.reloadBtn} onPress={fetchTransportDetails}>
            <RotateCw size={15} color="#059669" />
            <Text style={styles.reloadBtnText}>Check Pass Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // VIEW: ACTIVE PASS DASHBOARD (WITH LIVE TRACKING MAP)
  // ═════════════════════════════════════════════════════════════════════════
  const driverName =
    activePass.busDetails?.driverName || activePass.driverName || 'Designated Driver';
  const driverPhone =
    activePass.busDetails?.driverPhone || activePass.driverPhone || '';
  const attendantName = activePass.busDetails?.attendantName;
  const busPlateNumber =
    activePass.busId ||
    liveBusData?.busNumber ||
    activePass.busDetails?.busNumber ||
    'Assigned Bus';

  return (
    <View style={styles.container}>
      {/* ── 1. UNIFIED TRANSIT PASS BANNER WITH PASS DETAILS AT TOP ── */}
      <View style={styles.passCard}>
        {/* Pass Header Row */}
        <View style={styles.passHeaderRow}>
          <View style={styles.passBadgeGroup}>
            <Text style={styles.passTitle}>Transport Pass</Text>
            <View style={styles.activePill}>
              <View style={styles.activePillDot} />
              <Text style={styles.activePillText}>ACTIVE</Text>
            </View>
          </View>

          {/* Live GPS Telemetry Indicator (10-second timer & manual refresh) */}
          <TouchableOpacity
            style={styles.gpsSignalBadge}
            onPress={fetchLiveGps}
            activeOpacity={0.7}
          >
            <Radio size={12} color="#059669" />
            <Text style={styles.gpsSignalText}>Live GPS</Text>
            <Text style={styles.gpsPingDot}>•</Text>
            <Text style={styles.gpsPingTime}>{lastPingTime}</Text>
            {isRefreshingGps && <ActivityIndicator size="small" color="#059669" style={{ marginLeft: 3 }} />}
          </TouchableOpacity>
        </View>

        {/* Route Ribbon */}
        <View style={styles.routeRibbon}>
          <View style={styles.routeRibbonLeft}>
            {activePass.routeId ? (
              <View style={styles.routeIdBadge}>
                <Text style={styles.routeIdText}>{activePass.routeId}</Text>
              </View>
            ) : null}
            <Text style={styles.routeNameText} numberOfLines={1}>
              {activePass.routeName ||
                activePass.routeDetails?.routeName ||
                (activePass.routeId ? `Route ${activePass.routeId}` : 'Assigned Route')}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.schedulePillBtn}
            onPress={() => setShowFullRouteModal(true)}
            activeOpacity={0.8}
          >
            <Navigation size={12} color="#2563EB" />
            <Text style={styles.schedulePillText}>
              {allRouteStages.length > 0 ? `${allRouteStages.length} Stops` : 'Schedule'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pass Details Highlights (Application #, Academic Year, Annual Fare) - AT TOP */}
        <View style={styles.passDetailsTopRow}>
          <View style={styles.passDetailTopItem}>
            <Text style={styles.passDetailTopLabel}>Pass / App #</Text>
            <Text style={styles.passDetailTopVal} numberOfLines={1} adjustsFontSizeToFit>
              {activePass.applicationNumber || activePass.requestId || `#${activePass.passNumber || 'PASS-01'}`}
            </Text>
          </View>
          <View style={styles.passDetailTopDivider} />
          <View style={styles.passDetailTopItem}>
            <Text style={styles.passDetailTopLabel}>Academic Year</Text>
            <Text style={styles.passDetailTopVal} numberOfLines={1} adjustsFontSizeToFit>
              {activePass.academicYear || '2024-2025'}
            </Text>
          </View>
          <View style={styles.passDetailTopDivider} />
          <View style={styles.passDetailTopItem}>
            <Text style={styles.passDetailTopLabel}>Annual Fare</Text>
            <Text style={styles.passDetailTopVal} numberOfLines={1} adjustsFontSizeToFit>
              {activePass.fare ? `₹${Number(activePass.fare).toLocaleString()}` : 'Allocated'}
            </Text>
          </View>
        </View>

        {/* Start to Destination Subtitle */}
        <View style={styles.corridorRow}>
          <Text style={styles.corridorPoint} numberOfLines={1}>
            🚩 {activePass.routeDetails?.startPoint || allRouteStages[0]?.stageName || 'Route Origin'}
          </Text>
          <ChevronRight size={13} color="#94A3B8" />
          <Text style={styles.corridorPoint} numberOfLines={1}>
            🏁 {activePass.routeDetails?.destination?.name || 'Pydah College Campus'}
          </Text>
        </View>
      </View>

      {/* ── 2. BOARDING POINT & ASSIGNED BUS (Placed right after Transport Pass) ── */}
      <View style={[styles.statGrid, isCompactScreen && styles.statGridCompact]}>
        {/* Boarding Stop Card */}
        <View style={styles.statCardGreen}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statCardLabelGreen}>BOARDING STOP</Text>
            <MapPin size={14} color="#059669" />
          </View>
          <Text style={styles.statCardTitleGreen} numberOfLines={1}>
            {activePass.stopName || studentStage?.stageName || 'Designated Stop'}
          </Text>
          <View style={styles.statCardFooter}>
            <Text style={styles.statCardSubGreen} numberOfLines={1}>
              {studentStageIndex ? `Stage #${studentStageIndex}` : 'Your Stop'}
              {distanceBusToStop ? ` • ~${distanceBusToStop} km away` : ''}
            </Text>
          </View>
        </View>

        {/* Assigned Bus Card */}
        <View style={styles.statCardBlue}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statCardLabelBlue}>ASSIGNED BUS</Text>
            <Bus size={14} color="#2563EB" />
          </View>
          <Text style={styles.statCardTitleBlue} numberOfLines={1}>
            {busPlateNumber}
          </Text>
          <View style={styles.statCardFooter}>
            <View
              style={[
                styles.busMiniStatusBadge,
                isMoving ? styles.busMiniStatusMoving : styles.busMiniStatusStationary,
              ]}
            >
              <Text
                style={[
                  styles.busMiniStatusText,
                  isMoving ? styles.busMiniTextMoving : styles.busMiniTextStationary,
                ]}
                numberOfLines={1}
              >
                {isMoving ? `Moving (${liveSpeed}k)` : 'Parked'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── 3. LIVE BUS MOVEMENT & REAL-TIME TIMINGS BAR ── */}
      <View
        style={[
          styles.movementBar,
          isMoving ? styles.movementBarMoving : styles.movementBarStationary,
        ]}
      >
        <View style={styles.movementLeft}>
          {/* Circular Speedometer */}
          <View
            style={[
              styles.speedCircle,
              isMoving ? styles.speedCircleMoving : styles.speedCircleStationary,
            ]}
          >
            <Text style={[styles.speedVal, isMoving && styles.speedValMoving]}>
              {isMoving ? liveSpeed : '0'}
            </Text>
            <Text style={styles.speedUnit}>KM/H</Text>
          </View>

          {/* Movement Details */}
          <View style={styles.movementCol}>
            <View style={styles.motionStatusRow}>
              <View
                style={[
                  styles.motionDot,
                  isMoving ? styles.motionDotMoving : styles.motionDotStationary,
                ]}
              />
              <Text
                style={[
                  styles.motionStatusText,
                  isMoving ? styles.motionTextMoving : styles.motionTextStationary,
                ]}
              >
                {isMoving ? 'IN MOTION' : 'STATIONARY'}
              </Text>
              {busHeading > 0 && (
                <Text style={styles.headingBadge}>
                  {getCompassDirection(busHeading)} {busHeading}°
                </Text>
              )}
            </View>
            <Text style={styles.movementSub} numberOfLines={1}>
              {isMoving
                ? `Heading to ${activePass.stopName || studentStage?.stageName || 'Stop'}`
                : `Parked • Engine ${ignitionActive ? 'ON' : 'OFF'}`}
            </Text>
          </View>
        </View>

        {/* Live ETA Countdown */}
        <View style={styles.etaCol}>
          {etaToStop ? (
            <>
              <Text style={[styles.etaClock, isMoving ? styles.etaClockMoving : styles.etaClockIdle]}>
                ETA: {isMoving ? `~${etaToStop.etaClock}` : '—'}
              </Text>
              <Text style={styles.etaDuration} numberOfLines={1}>
                {isMoving
                  ? `${etaToStop.formattedTime} (${distanceBusToStop || '—'} km)`
                  : 'Bus Stopped'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.etaClockIdle}>Tracking</Text>
              <Text style={styles.etaDuration} numberOfLines={1}>
                {distanceBusToStop ? `~${distanceBusToStop} km away` : 'Live Telemetry'}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── 4. LIVE TRACKING MAP (Responsive height, opens directly on Live Bus option) ── */}
      <View style={styles.mapCard}>
        {/* Map Header & Quick Focus Controls */}
        <View style={styles.mapHeaderRow}>
          <View style={styles.mapTitleGroup}>
            <Text style={styles.mapSectionTitle}>Live Route Tracking</Text>
            <View style={styles.mapLiveBadge}>
              <View style={styles.mapLiveDot} />
              <Text style={styles.mapLiveText}>RADAR ACTIVE</Text>
            </View>
          </View>

          {/* Quick Focus Pill Buttons - 'Bus' is active by default */}
          <View style={styles.mapFocusPills}>
            <TouchableOpacity
              style={[styles.mapPillBtn, mapFocusMode === 'bus' && styles.mapPillBtnActive]}
              onPress={() => handleMapFocus('bus')}
              activeOpacity={0.8}
            >
              <Bus size={11} color={mapFocusMode === 'bus' ? '#FFFFFF' : '#2563EB'} />
              <Text style={[styles.mapPillText, mapFocusMode === 'bus' && styles.mapPillTextActive]}>
                Bus
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapPillBtn, mapFocusMode === 'stop' && styles.mapPillBtnActive]}
              onPress={() => handleMapFocus('stop')}
              activeOpacity={0.8}
            >
              <MapPin size={11} color={mapFocusMode === 'stop' ? '#FFFFFF' : '#059669'} />
              <Text style={[styles.mapPillText, mapFocusMode === 'stop' && styles.mapPillTextActive]}>
                Stop
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapPillBtn, mapFocusMode === 'campus' && styles.mapPillBtnActive]}
              onPress={() => handleMapFocus('campus')}
              activeOpacity={0.8}
            >
              <Building2 size={11} color={mapFocusMode === 'campus' ? '#FFFFFF' : '#7C3AED'} />
              <Text style={[styles.mapPillText, mapFocusMode === 'campus' && styles.mapPillTextActive]}>
                Campus
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapPillBtn, mapFocusMode === 'fit' && styles.mapPillBtnActive]}
              onPress={() => handleMapFocus('fit')}
              activeOpacity={0.8}
            >
              <Crosshair size={11} color={mapFocusMode === 'fit' ? '#FFFFFF' : '#475569'} />
              <Text style={[styles.mapPillText, mapFocusMode === 'fit' && styles.mapPillTextActive]}>
                Fit
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Embedded Interactive Map Container (Dynamic responsive height) */}
        <View style={[styles.mapWrapper, { height: responsiveMapHeight }]}>
          <RNWebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: leafletMapHtml }}
            style={styles.webViewMap}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            onError={(syntheticEvent: any) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView map error: ', nativeEvent);
            }}
          />
        </View>
      </View>

      {/* ── 5. DRIVER & CREW CONTACT CARD ── */}
      <View style={styles.driverCard}>
        <View style={styles.driverLeft}>
          <View style={styles.driverAvatar}>
            <User size={18} color="#2563EB" />
          </View>
          <View style={styles.driverInfoCol}>
            <Text style={styles.driverLabel}>Vehicle Crew & Driver</Text>
            <Text style={styles.driverName} numberOfLines={1}>
              {driverName}
            </Text>
            {attendantName && (
              <Text style={styles.attendantSub} numberOfLines={1}>Attendant: {attendantName}</Text>
            )}
          </View>
        </View>

        {driverPhone ? (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => handleCallDriver(driverPhone)}
            activeOpacity={0.8}
          >
            <Phone size={13} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call Driver</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noPhonePill}>
            <Text style={styles.noPhoneText}>Helpline Active</Text>
          </View>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: FULL BUS ROUTE SCHEDULE & STOP FINDER                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFullRouteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFullRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalRouteBadge}>
                  <Text style={styles.modalRouteBadgeText}>
                    {activePass.routeId || 'ROUTE'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>Complete Route Schedule</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {activePass.routeName || 'Assigned Bus Corridor'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowFullRouteModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Timings Legend */}
            <View style={styles.modalLegend}>
              <Text style={styles.modalLegendText}>
                Morning Origin: <Text style={styles.bold}>{MORNING_ORIGIN_START_TIME}</Text> • Campus
                Dispersal: <Text style={styles.bold}>{EVENING_CAMPUS_START_TIME}</Text>
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Search size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stop name..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Stops List */}
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {filteredStages.map((stage: any, idx: number) => {
                const isStudentStop =
                  activePass?.stopName &&
                  stage.stageName?.trim().toLowerCase() ===
                    activePass.stopName.trim().toLowerCase();
                const isOrigin = idx === 0;
                const isCampus =
                  stage.isCampusDestination ||
                  (idx === allRouteStages.length - 1 &&
                    stage.stageName?.toUpperCase().includes('PYDAH'));
                const metrics = getStageMetrics(stage);

                return (
                  <View
                    key={`modal_stage_${idx}`}
                    style={[
                      styles.modalStageItem,
                      isStudentStop && styles.modalStageItemStudent,
                      isCampus && styles.modalStageItemCampus,
                    ]}
                  >
                    <View style={styles.modalStageLeft}>
                      <View
                        style={[
                          styles.modalStageNum,
                          isStudentStop
                            ? styles.modalStageNumStudent
                            : isCampus
                            ? styles.modalStageNumCampus
                            : isOrigin
                            ? styles.modalStageNumOrigin
                            : styles.modalStageNumNormal,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalStageNumText,
                            (isStudentStop || isCampus || isOrigin) && styles.textWhite,
                          ]}
                        >
                          {isCampus ? '🏁' : isOrigin ? '🚩' : idx + 1}
                        </Text>
                      </View>

                      <View style={styles.modalStageDetails}>
                        <View style={styles.modalStageTitleRow}>
                          <Text
                            style={[
                              styles.modalStageName,
                              isStudentStop && styles.textGreenBold,
                              isCampus && styles.textBlueBold,
                            ]}
                          >
                            {stage.stageName}
                          </Text>
                          {isStudentStop && (
                            <View style={styles.modalMiniBadge}>
                              <Text style={styles.modalMiniBadgeText}>YOUR STOP</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.modalTimingsGrid}>
                          <View style={styles.modalTimingPill}>
                            <Text style={styles.modalTimingPillText}>
                              🌅 Pickup: <Text style={styles.bold}>~{metrics.morningScheduledTime}</Text>
                            </Text>
                          </View>
                          <View style={styles.modalTimingPill}>
                            <Text style={styles.modalTimingPillText}>
                              🌇 Drop: <Text style={styles.bold}>~{metrics.eveningScheduledTime}</Text>
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.modalDistanceFootnote}>
                          {metrics.distFromStart} KM from origin • {metrics.distToCampus} KM to campus
                        </Text>
                      </View>
                    </View>

                    {/* Google Maps Pin Navigate */}
                    {stage.latitude && stage.longitude ? (
                      <TouchableOpacity
                        style={styles.modalLocateBtn}
                        onPress={() =>
                          handleOpenNavigation(
                            Number(stage.latitude),
                            Number(stage.longitude),
                            stage.stageName
                          )
                        }
                      >
                        <Navigation size={13} color="#2563EB" />
                        <Text style={styles.modalLocateText}>Navigate</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterInfo}>
                {filteredStages.length} of {allRouteStages.length} stops displayed
              </Text>
              <TouchableOpacity
                style={styles.modalCloseFooterBtn}
                onPress={() => setShowFullRouteModal(false)}
              >
                <Text style={styles.modalCloseFooterBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ── RESPONSIVE STYLESHEET ───────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
    paddingBottom: 8,
  },
  loadingContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Empty State Styles */
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  noticeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
    gap: 6,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noticeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B45309',
  },
  noticeBody: {
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  supportCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    gap: 10,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supportCol: {
    flex: 1,
  },
  supportLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  supportVal: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
    marginTop: 1,
  },
  supportDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  requestsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  requestsTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  requestItemLeft: {
    flex: 1,
  },
  requestRouteName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestStage: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  requestDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextApproved: {
    color: '#15803D',
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextRejected: {
    color: '#B91C1C',
  },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 4,
  },
  reloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  /* ── 1. Pass Overview Card (With Details at Top) ─────────────────── */
  passCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  passHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  passTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  activePillDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  gpsSignalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 4,
  },
  gpsSignalText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  gpsPingDot: {
    fontSize: 9,
    color: '#94A3B8',
  },
  gpsPingTime: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  routeRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  routeRibbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  routeIdBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  routeIdText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  routeNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  schedulePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
  },
  schedulePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  passDetailsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passDetailTopItem: {
    flex: 1,
    alignItems: 'center',
  },
  passDetailTopDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#CBD5E1',
  },
  passDetailTopLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  passDetailTopVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  corridorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 4,
  },
  corridorPoint: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },

  /* ── 2. Quick Stat Grid (Boarding Stop & Assigned Bus) ─────────────── */
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  statGridCompact: {
    gap: 6,
  },
  statCardGreen: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    justifyContent: 'space-between',
    gap: 3,
  },
  statCardLabelGreen: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  statCardTitleGreen: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#047857',
    marginTop: 1,
  },
  statCardSubGreen: {
    fontSize: 9.5,
    color: '#059669',
    fontWeight: '600',
  },
  statCardBlue: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'space-between',
    gap: 3,
  },
  statCardLabelBlue: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  statCardTitleBlue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1D4ED8',
    marginTop: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardFooter: {
    marginTop: 2,
  },
  busMiniStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  busMiniStatusMoving: {
    backgroundColor: '#DCFCE7',
  },
  busMiniStatusStationary: {
    backgroundColor: '#FEF3C7',
  },
  busMiniStatusText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  busMiniTextMoving: {
    color: '#15803D',
  },
  busMiniTextStationary: {
    color: '#B45309',
  },

  /* ── 3. Live Bus Movement Bar ────────────────────────────────────── */
  movementBar: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  movementBarMoving: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  movementBarStationary: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  movementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 9,
  },
  speedCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedCircleMoving: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  speedCircleStationary: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  speedVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#64748B',
    lineHeight: 15,
  },
  speedValMoving: {
    color: '#15803D',
  },
  speedUnit: {
    fontSize: 6.5,
    fontWeight: '900',
    color: '#94A3B8',
    marginTop: -1,
  },
  movementCol: {
    flex: 1,
  },
  motionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  motionDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
  },
  motionDotMoving: {
    backgroundColor: '#16A34A',
  },
  motionDotStationary: {
    backgroundColor: '#D97706',
  },
  motionStatusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  motionTextMoving: {
    color: '#15803D',
  },
  motionTextStationary: {
    color: '#B45309',
  },
  headingBadge: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 3,
  },
  movementSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  etaCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  etaClock: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  etaClockMoving: {
    color: '#15803D',
  },
  etaClockIdle: {
    color: '#64748B',
  },
  etaDuration: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },

  /* ── 4. Live Tracking Map Card ───────────────────────────────────── */
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    width: '100%',
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 6,
  },
  mapTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  mapLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    gap: 3.5,
  },
  mapLiveDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  mapLiveText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.4,
  },
  mapFocusPills: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    padding: 2,
    gap: 2,
  },
  mapPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6.5,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 2.5,
  },
  mapPillBtnActive: {
    backgroundColor: '#0F172A',
  },
  mapPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },
  mapPillTextActive: {
    color: '#FFFFFF',
  },
  mapWrapper: {
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
  webViewMap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* ── 5. Driver & Crew Card ───────────────────────────────────────── */
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  driverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 9,
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfoCol: {
    flex: 1,
  },
  driverLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  driverName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  attendantSub: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 2,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  noPhonePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#F1F5F9',
  },
  noPhoneText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  /* ── MODAL STYLES ─────────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalRouteBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  modalRouteBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  modalTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  modalLegend: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalLegendText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  bold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    padding: 0,
  },
  modalList: {
    maxHeight: Dimensions.get('window').height * 0.52,
    paddingHorizontal: 16,
  },
  modalListContent: {
    paddingBottom: 16,
    gap: 8,
  },
  modalStageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  modalStageItemStudent: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  modalStageItemCampus: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  modalStageLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
  },
  modalStageNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  modalStageNumNormal: {
    backgroundColor: '#E2E8F0',
  },
  modalStageNumStudent: {
    backgroundColor: '#16A34A',
  },
  modalStageNumOrigin: {
    backgroundColor: '#2563EB',
  },
  modalStageNumCampus: {
    backgroundColor: '#7C3AED',
  },
  modalStageNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textGreenBold: {
    color: '#15803D',
    fontWeight: '900',
  },
  textBlueBold: {
    color: '#7C3AED',
    fontWeight: '900',
  },
  modalStageDetails: {
    flex: 1,
  },
  modalStageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalStageName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalMiniBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  modalMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  modalTimingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  modalTimingPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTimingPillText: {
    fontSize: 9,
    color: '#475569',
  },
  modalDistanceFootnote: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 3,
  },
  modalLocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
  },
  modalLocateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalFooterInfo: {
    fontSize: 10.5,
    color: '#64748B',
  },
  modalCloseFooterBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalCloseFooterBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});

export default StudentTransportView;
