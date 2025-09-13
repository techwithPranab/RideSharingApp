/**
 * Place Search Screen
 * Search for pickup and dropoff locations with Google Places integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/config';
import { locationUtils, type LocationData } from '../utils';
import { placesAPI } from '../services/api';

interface Place {
  placeId: string;
  name: string;
  address: string;
  location: LocationData;
}

type PlaceSearchRouteProp = RouteProp<
  { PlaceSearch: { type: 'pickup' | 'dropoff'; onSelect: (location: LocationData, address: string) => void } },
  'PlaceSearch'
>;

const PlaceSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PlaceSearchRouteProp>();
  const { type, onSelect } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Get current location for better search results
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Search places when query changes
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(searchQuery);
      }, 300);
    } else {
      setPlaces([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await locationUtils.requestPermissions();
      if (hasPermission) {
        const location = await locationUtils.getCurrentLocation();
        setCurrentLocation(location);
      }
    } catch (error) {
      // Error getting current location handled silently
      console.warn('Error getting current location:', error);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const location = currentLocation ? {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      } : undefined;

      const response = await placesAPI.searchPlaces(query, location);
      const searchResults = response.data.data || [];

      // Transform API response to our Place format
      const transformedPlaces: Place[] = searchResults.map((result: {
        placeId?: string;
        id?: string;
        name?: string;
        description?: string;
        address?: string;
        formattedAddress?: string;
        location?: { latitude: number; longitude: number };
        geometry?: { location?: { lat: number; lng: number } };
      }) => ({
        placeId: result.placeId || result.id || '',
        name: result.name || result.description || '',
        address: result.address || result.formattedAddress || result.description || '',
        location: {
          latitude: result.location?.latitude || result.geometry?.location?.lat || 0,
          longitude: result.location?.longitude || result.geometry?.location?.lng || 0,
        },
      }));

      setPlaces(transformedPlaces);
    } catch (error: unknown) {
      // Error searching places handled with user alert
      console.warn('Error searching places:', error);
      Alert.alert('Error', 'Failed to search places. Please try again.');
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceSelect = (place: Place) => {
    onSelect(place.location, place.address);
    navigation.goBack();
  };

  const handleUseCurrentLocation = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get your current location. Please check your location permissions.');
      return;
    }

    try {
      // Reverse geocode to get address
      const response = await placesAPI.reverseGeocode(
        currentLocation.latitude,
        currentLocation.longitude
      );

      const address = response.data.data?.formattedAddress || 'Current Location';
      onSelect(currentLocation, address);
      navigation.goBack();
    } catch (error) {
      // Error reverse geocoding handled with fallback
      console.warn('Error reverse geocoding:', error);
      // Fallback to basic current location
      onSelect(currentLocation, 'Current Location');
      navigation.goBack();
    }
  };

  const renderPlaceItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => handlePlaceSelect(item)}
    >
      <View style={styles.placeIcon}>
        <Text style={styles.placeIconText}>📍</Text>
      </View>
      <View style={styles.placeDetails}>
        <Text style={styles.placeName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.placeAddress} numberOfLines={2}>
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyStateText}>Searching places...</Text>
        </View>
      );
    }

    if (searchQuery.length <= 2) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateEmoji}>🔍</Text>
          <Text style={styles.emptyStateText}>
            Start typing to search for places
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Enter at least 3 characters to begin searching
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>📍</Text>
        <Text style={styles.emptyStateText}>No places found</Text>
        <Text style={styles.emptyStateSubtext}>
          Try searching with different keywords
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'pickup' ? 'Pickup Location' : 'Dropoff Location'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search for ${type === 'pickup' ? 'pickup' : 'dropoff'} location`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Current Location Option */}
      {type === 'pickup' && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={handleUseCurrentLocation}
        >
          <View style={styles.currentLocationIcon}>
            <Text style={styles.currentLocationIconText}>📍</Text>
          </View>
          <View style={styles.currentLocationDetails}>
            <Text style={styles.currentLocationTitle}>Use current location</Text>
            <Text style={styles.currentLocationSubtitle}>
              {currentLocation ? 'Using GPS' : 'Location not available'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Places List */}
      <FlatList
        data={places}
        keyExtractor={(item) => item.placeId}
        renderItem={renderPlaceItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={places.length === 0 ? styles.emptyList : undefined}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
    color: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.xs,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  currentLocationIconText: {
    fontSize: FONT_SIZES.lg,
  },
  currentLocationDetails: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  currentLocationSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  placeIconText: {
    fontSize: FONT_SIZES.lg,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  placeAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateEmoji: {
    fontSize: FONT_SIZES.xxxl,
    marginBottom: SPACING.md,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});

export default PlaceSearchScreen;
