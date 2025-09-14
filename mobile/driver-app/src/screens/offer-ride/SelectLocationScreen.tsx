/**
 * Select Location Screen
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { OfferRideStackParamList } from '../../navigation/types';
import { placesAPI } from '../../services/api';
import { locationUtils } from '../../utils';

type SelectLocationScreenNavigationProp = StackNavigationProp<OfferRideStackParamList, 'SelectLocation'>;
type SelectLocationScreenRouteProp = RouteProp<OfferRideStackParamList, 'SelectLocation'>;

interface Location {
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const SelectLocationScreen: React.FC = () => {
  const navigation = useNavigation<SelectLocationScreenNavigationProp>();
  const route = useRoute<SelectLocationScreenRouteProp>();
  
  const { locationType } = route.params;
  const [searchText, setSearchText] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Search places when query changes
  useEffect(() => {
    if (searchText.length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchPlaces(searchText);
      }, 300);
    } else {
      setLocations([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await locationUtils.requestPermissions();
      if (hasPermission) {
        const location = await locationUtils.getCurrentLocation();
        setCurrentLocation(location);
      }
    } catch (error) {
      console.warn('Error getting current location:', error);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const location = currentLocation ? {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      } : undefined;

      const response = await placesAPI.searchPlaces(query, location);
      const searchResults = response.data.data || [];

      // Transform API response to our Location format
      const transformedLocations: Location[] = searchResults.map((result: {
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
        coordinates: {
          latitude: result.location?.latitude || result.geometry?.location?.lat || 0,
          longitude: result.location?.longitude || result.geometry?.location?.lng || 0,
        },
      }));

      setLocations(transformedLocations);
    } catch (error: unknown) {
      console.warn('Error searching places:', error);
      Alert.alert('Error', 'Failed to search places. Please try again.');
      setLocations([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: Location) => {
    // Navigate back with the selected location
    navigation.navigate('CreateRideOffer', {
      selectedLocation: {
        name: location.name,
        address: location.address,
        coordinates: location.coordinates,
      },
      locationType,
    } as any);
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
      navigation.navigate('CreateRideOffer', {
        selectedLocation: {
          name: 'Current Location',
          address,
          coordinates: currentLocation,
        },
        locationType,
      } as any);
    } catch (error) {
      console.warn('Error reverse geocoding:', error);
      // Fallback to basic current location
      navigation.navigate('CreateRideOffer', {
        selectedLocation: {
          name: 'Current Location',
          address: 'Current Location',
          coordinates: currentLocation,
        },
        locationType,
      } as any);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const getLocationTitle = () => {
    switch (locationType) {
      case 'source':
        return 'Pickup';
      case 'destination':
        return 'Drop-off';
      default:
        return 'Stop';
    }
  };

  const renderLocationItem = ({ item }: { item: Location }) => (
    <TouchableOpacity 
      style={styles.locationItem} 
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.locationIcon}>
        <Icon name="location-on" size={24} color="#007AFF" />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyText}>Searching places...</Text>
        </View>
      );
    }

    if (searchText.length <= 2) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            Start typing to search for places
          </Text>
          <Text style={styles.emptySubtext}>
            Enter at least 3 characters to begin searching
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="location-off" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No places found</Text>
        <Text style={styles.emptySubtext}>
          Try searching with different keywords
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Select {getLocationTitle()} Location
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search locations..."
            value={searchText}
            onChangeText={handleSearch}
            autoFocus
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
        <Icon name="my-location" size={24} color="#007AFF" />
        <View style={styles.currentLocationInfo}>
          <Text style={styles.currentLocationText}>Use Current Location</Text>
          <Text style={styles.currentLocationSubtext}>GPS location</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />

      <FlatList
        data={locations}
        keyExtractor={(item) => item.placeId}
        renderItem={renderLocationItem}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="location-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>
              {isSearching ? 'Searching...' : 'No locations found'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  currentLocationInfo: {
    marginLeft: 12,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  currentLocationSubtext: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationIcon: {
    width: 40,
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SelectLocationScreen;
