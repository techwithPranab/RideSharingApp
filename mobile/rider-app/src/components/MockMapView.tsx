/**
 * Mock MapView Component
 * Temporary replacement for react-native-maps until the integration issue is resolved
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface MockMapViewProps {
  style?: ViewStyle;
  region?: any;
  onRegionChange?: (region: any) => void;
  onPress?: (event: any) => void;
  children?: React.ReactNode;
  provider?: string;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsPointsOfInterest?: boolean;
  showsCompass?: boolean;
  showsScale?: boolean;
  showsBuildings?: boolean;
  showsTraffic?: boolean;
  showsIndoors?: boolean;
  loadingEnabled?: boolean;
  loadingBackgroundColor?: string;
  loadingIndicatorColor?: string;
  moveOnMarkerPress?: boolean;
  liteMode?: boolean;
  mapPadding?: { top: number; right: number; bottom: number; left: number };
  initialRegion?: any;
  customMapStyle?: any[];
  ref?: any;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  onMapReady?: () => void;
}

interface MockMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  pinColor?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  anchor?: { x: number; y: number };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  centerOffset?: { x: number; y: number };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calloutOffset?: { x: number; y: number };
}

interface MockPolylineProps {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  strokeColor?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  strokeWidth?: number;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lineCap?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lineJoin?: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  miterLimit?: number;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  geodesic?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lineDashPattern?: number[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lineDashPhase?: number;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const MockMapView: React.FC<MockMapViewProps> = ({ style, children, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Map View</Text>
      <Text style={styles.subText}>(Mock - react-native-maps disabled)</Text>
      {children}
    </View>
  );
};

const MockMarker: React.FC<MockMarkerProps> = ({ title, description, children, onPress }) => {
  return (
    <View style={styles.marker} onTouchEnd={onPress}>
      <Text style={styles.markerText}>📍</Text>
      {title && <Text style={styles.markerTitle}>{title}</Text>}
      {children}
    </View>
  );
};

const MockPolyline: React.FC<MockPolylineProps> = ({ coordinates }) => {
  return (
    <View style={styles.polyline}>
      <Text style={styles.polylineText}>Route ({coordinates.length} points)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  subText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 20,
  },
  markerTitle: {
    fontSize: 10,
    color: '#333',
    backgroundColor: 'white',
    padding: 2,
    borderRadius: 2,
  },
  polyline: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
  },
  polylineText: {
    color: 'white',
    fontSize: 10,
  },
});

// Mock constants
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

export { MockMarker as Marker, MockPolyline as Polyline };
export default MockMapView;
