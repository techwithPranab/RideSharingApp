/**
 * Mobile unit test setup
 * Configuration for React Native testing environment
 */

import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    Alert: {
      alert: jest.fn()
    },
    Linking: {
      openURL: jest.fn().mockResolvedValue(true),
      canOpenURL: jest.fn().mockResolvedValue(true)
    },
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 375, height: 812 })
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default)
    },
    PermissionsAndroid: {
      request: jest.fn().mockResolvedValue('granted'),
      PERMISSIONS: {
        ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION'
      },
      RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied'
      }
    }
  };
});

// Mock Expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 5
    },
    timestamp: Date.now()
  }),
  watchPositionAsync: jest.fn().mockResolvedValue({
    remove: jest.fn()
  }),
  Accuracy: {
    High: 4,
    Balanced: 3,
    Low: 2
  }
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id')
}));

jest.mock('expo-constants', () => ({
  default: {
    deviceId: 'test-device-id',
    platform: {
      ios: {
        platform: 'ios'
      }
    }
  }
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn()
  })),
  useRoute: jest.fn(() => ({
    params: {}
  })),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }) => children
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children
  }))
}));

// Mock Redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(() => jest.fn()),
  Provider: ({ children }) => children
}));

// Mock Socket.IO client
jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true
  }))
}));

// Mock Maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const MockMapView = (props) => React.createElement(View, props, props.children);
  const MockMarker = (props) => React.createElement(View, props, props.children);
  const MockPolyline = (props) => React.createElement(View, props);
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
    PROVIDER_GOOGLE: 'google'
  };
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(component => component),
    Directions: {}
  };
});

// Mock Image Picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    cancelled: false,
    assets: [{
      uri: 'mock-image-uri',
      width: 100,
      height: 100
    }]
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    cancelled: false,
    assets: [{
      uri: 'mock-image-uri',
      width: 100,
      height: 100
    }]
  })
}));

// Global test timeout
jest.setTimeout(10000);

// Suppress console warnings
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
});

// Global test utilities for React Native
global.mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn()
};

global.mockRoute = {
  params: {}
};

global.mockDispatch = jest.fn();

global.createMockStore = (initialState = {}) => ({
  getState: jest.fn(() => initialState),
  dispatch: mockDispatch,
  subscribe: jest.fn()
});
