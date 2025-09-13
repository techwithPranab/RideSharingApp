/**
 * Unit tests for Ride Booking Component
 * Tests ride request UI and booking flow
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import RideBookingScreen from '../../../../../../mobile/rider-app/src/screens/main/RideBookingScreen';
import { requestRide } from '../../../../../../mobile/rider-app/src/store/slices/rideSlice';

// Mock dependencies
jest.mock('react-redux');
jest.mock('@react-navigation/native');
jest.mock('../../../../../../mobile/rider-app/src/store/slices/rideSlice');
jest.mock('../../../../../../mobile/rider-app/src/services/locationService');

describe('RideBookingScreen', () => {
  let mockDispatch;
  let mockNavigation;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn()
    };

    useDispatch.mockReturnValue(mockDispatch);
    useNavigation.mockReturnValue(mockNavigation);

    // Default selector state
    useSelector.mockImplementation((selector) => {
      const state = {
        ride: {
          loading: false,
          error: null,
          currentRide: null,
          availableDrivers: []
        },
        location: {
          currentLocation: {
            latitude: 37.7749,
            longitude: -122.4194
          }
        }
      };
      return selector(state);
    });

    jest.clearAllMocks();
  });

  it('should render ride booking form correctly', () => {
    render(<RideBookingScreen />);

    expect(screen.getByText('Book a Ride')).toBeTruthy();
    expect(screen.getByPlaceholderText('Pickup location')).toBeTruthy();
    expect(screen.getByPlaceholderText('Drop-off location')).toBeTruthy();
    expect(screen.getByText('Find Drivers')).toBeTruthy();
  });

  it('should handle pickup location input', async () => {
    render(<RideBookingScreen />);

    const pickupInput = screen.getByPlaceholderText('Pickup location');
    fireEvent.changeText(pickupInput, '123 Main St');

    await waitFor(() => {
      expect(pickupInput.props.value).toBe('123 Main St');
    });
  });

  it('should handle dropoff location input', async () => {
    render(<RideBookingScreen />);

    const dropoffInput = screen.getByPlaceholderText('Drop-off location');
    fireEvent.changeText(dropoffInput, '456 Oak Ave');

    await waitFor(() => {
      expect(dropoffInput.props.value).toBe('456 Oak Ave');
    });
  });

  it('should validate required fields before booking', async () => {
    const mockAlert = jest.spyOn(Alert, 'alert');
    render(<RideBookingScreen />);

    const bookButton = screen.getByText('Find Drivers');
    fireEvent.press(bookButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Missing Information',
        'Please select both pickup and drop-off locations'
      );
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should dispatch ride request with valid locations', async () => {
    render(<RideBookingScreen />);

    // Set locations
    const pickupInput = screen.getByPlaceholderText('Pickup location');
    const dropoffInput = screen.getByPlaceholderText('Drop-off location');
    
    fireEvent.changeText(pickupInput, '123 Main St');
    fireEvent.changeText(dropoffInput, '456 Oak Ave');

    // Mock location selection (this would normally come from map interaction)
    const component = screen.getByTestId('ride-booking-screen');
    fireEvent(component, 'onLocationSelect', {
      type: 'pickup',
      address: '123 Main St',
      coordinates: { latitude: 37.7749, longitude: -122.4194 }
    });
    fireEvent(component, 'onLocationSelect', {
      type: 'dropoff',
      address: '456 Oak Ave',
      coordinates: { latitude: 37.7849, longitude: -122.4094 }
    });

    const bookButton = screen.getByText('Find Drivers');
    fireEvent.press(bookButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        requestRide({
          pickupLocation: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749],
            address: '123 Main St'
          },
          dropoffLocation: {
            type: 'Point',
            coordinates: [-122.4094, 37.7849],
            address: '456 Oak Ave'
          },
          rideType: 'regular'
        })
      );
    });
  });

  it('should show loading state during ride request', () => {
    useSelector.mockImplementation((selector) => {
      const state = {
        ride: {
          loading: true,
          error: null,
          currentRide: null
        }
      };
      return selector(state);
    });

    render(<RideBookingScreen />);

    expect(screen.getByText('Finding Drivers...')).toBeTruthy();
    expect(screen.getByTestId('find-drivers-button')).toBeDisabled();
  });

  it('should display available drivers when found', () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        firstName: 'John',
        lastName: 'Doe',
        rating: 4.8,
        estimatedFare: 25.50,
        estimatedTime: 5,
        vehicle: {
          make: 'Toyota',
          model: 'Camry',
          licensePlate: 'ABC123'
        }
      },
      {
        id: 'driver-2',
        firstName: 'Jane',
        lastName: 'Smith',
        rating: 4.9,
        estimatedFare: 23.00,
        estimatedTime: 3,
        vehicle: {
          make: 'Honda',
          model: 'Accord',
          licensePlate: 'XYZ789'
        }
      }
    ];

    useSelector.mockImplementation((selector) => {
      const state = {
        ride: {
          loading: false,
          error: null,
          availableDrivers: mockDrivers
        }
      };
      return selector(state);
    });

    render(<RideBookingScreen />);

    expect(screen.getByText('Available Drivers')).toBeTruthy();
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('Jane Smith')).toBeTruthy();
    expect(screen.getByText('4.8 ⭐')).toBeTruthy();
    expect(screen.getByText('$25.50')).toBeTruthy();
    expect(screen.getByText('5 min away')).toBeTruthy();
  });

  it('should handle driver selection', () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        firstName: 'John',
        lastName: 'Doe',
        rating: 4.8,
        estimatedFare: 25.50
      }
    ];

    useSelector.mockImplementation((selector) => {
      const state = {
        ride: {
          loading: false,
          availableDrivers: mockDrivers
        }
      };
      return selector(state);
    });

    render(<RideBookingScreen />);

    const driverCard = screen.getByTestId('driver-card-driver-1');
    fireEvent.press(driverCard);

    // This should trigger driver selection and navigate to confirmation
    expect(mockNavigation.navigate).toHaveBeenCalledWith('RideConfirmation', {
      selectedDriver: mockDrivers[0]
    });
  });

  it('should toggle ride type selection', () => {
    render(<RideBookingScreen />);

    const pooledToggle = screen.getByTestId('pooled-ride-toggle');
    
    // Initially should be regular ride
    expect(pooledToggle.props.value).toBe(false);

    fireEvent(pooledToggle, 'onValueChange', true);
    expect(pooledToggle.props.value).toBe(true);
  });

  it('should show estimated fare for pooled rides', () => {
    render(<RideBookingScreen />);

    const pooledToggle = screen.getByTestId('pooled-ride-toggle');
    fireEvent(pooledToggle, 'onValueChange', true);

    // Mock fare estimation
    const fareEstimate = screen.getByTestId('fare-estimate');
    expect(fareEstimate).toBeTruthy();
    expect(screen.getByText('Estimated: $18.00 (20% savings)')).toBeTruthy();
  });

  it('should handle location permission denied', async () => {
    const mockAlert = jest.spyOn(Alert, 'alert');
    
    // Mock location service to throw permission error
    const locationService = require('../../../../../../mobile/rider-app/src/services/locationService');
    locationService.getCurrentLocation.mockRejectedValue(new Error('Permission denied'));

    render(<RideBookingScreen />);

    const currentLocationButton = screen.getByTestId('current-location-button');
    fireEvent.press(currentLocationButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Location Permission',
        'Please enable location permission to use current location',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: expect.any(Function) }
        ]
      );
    });
  });

  it('should show error message when no drivers available', () => {
    useSelector.mockImplementation((selector) => {
      const state = {
        ride: {
          loading: false,
          error: 'No drivers available in your area',
          availableDrivers: []
        }
      };
      return selector(state);
    });

    render(<RideBookingScreen />);

    expect(screen.getByText('No drivers available in your area')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('should handle map region changes', () => {
    render(<RideBookingScreen />);

    const mapView = screen.getByTestId('map-view');
    const newRegion = {
      latitude: 37.7849,
      longitude: -122.4094,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    };

    fireEvent(mapView, 'onRegionChangeComplete', newRegion);

    // This should update the map region state
    expect(mapView.props.region).toEqual(
      expect.objectContaining({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude
      })
    );
  });

  it('should handle marker drag for location selection', () => {
    render(<RideBookingScreen />);

    const pickupMarker = screen.getByTestId('pickup-marker');
    const newCoordinate = {
      latitude: 37.7849,
      longitude: -122.4094
    };

    fireEvent(pickupMarker, 'onDragEnd', {
      nativeEvent: { coordinate: newCoordinate }
    });

    // This should update the pickup location
    expect(pickupMarker.props.coordinate).toEqual(newCoordinate);
  });

  it('should show scheduled ride option', () => {
    render(<RideBookingScreen />);

    const scheduleButton = screen.getByText('Schedule for Later');
    fireEvent.press(scheduleButton);

    expect(screen.getByText('Select Date and Time')).toBeTruthy();
    expect(screen.getByTestId('date-picker')).toBeTruthy();
    expect(screen.getByTestId('time-picker')).toBeTruthy();
  });

  it('should handle favorite locations', () => {
    const mockFavorites = [
      { id: 'home', name: 'Home', address: '123 Home St' },
      { id: 'work', name: 'Work', address: '456 Work Ave' }
    ];

    useSelector.mockImplementation((selector) => {
      const state = {
        user: {
          favoriteLocations: mockFavorites
        },
        ride: { loading: false }
      };
      return selector(state);
    });

    render(<RideBookingScreen />);

    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Work')).toBeTruthy();

    const homeButton = screen.getByTestId('favorite-location-home');
    fireEvent.press(homeButton);

    // This should set the pickup or dropoff location to home
    const pickupInput = screen.getByPlaceholderText('Pickup location');
    expect(pickupInput.props.value).toBe('123 Home St');
  });
});
