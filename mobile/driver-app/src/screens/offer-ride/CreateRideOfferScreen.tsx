/**
 * Create Ride Offer Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { OfferRideStackParamList } from '../../navigation/types';

type CreateRideOfferScreenNavigationProp = StackNavigationProp<OfferRideStackParamList, 'CreateRideOffer'>;
type CreateRideOfferScreenRouteProp = RouteProp<OfferRideStackParamList, 'CreateRideOffer'>;

interface Location {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const CreateRideOfferScreen: React.FC = () => {
  const navigation = useNavigation<CreateRideOfferScreenNavigationProp>();
  const route = useRoute<CreateRideOfferScreenRouteProp>();
  
  const [source, setSource] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);

  // Handle location selection results from SelectLocation screen
  useEffect(() => {
    const params = route.params as any;
    if (params?.selectedLocation && params?.locationType) {
      const { selectedLocation, locationType } = params;
      
      if (locationType === 'source') {
        setSource(selectedLocation);
      } else if (locationType === 'destination') {
        setDestination(selectedLocation);
      }
    }
  }, [route.params]);

  const handleSelectSource = () => {
    navigation.navigate('SelectLocation', { 
      locationType: 'source',
      currentLocation: source 
    });
  };

  const handleSelectDestination = () => {
    navigation.navigate('SelectLocation', { 
      locationType: 'destination',
      currentLocation: destination 
    });
  };

  const handleContinue = () => {
    if (!source || !destination) {
      Alert.alert('Missing Information', 'Please select both source and destination locations.');
      return;
    }

    navigation.navigate('AddStops', { source, destination });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route Information</Text>
        
        <TouchableOpacity style={styles.locationButton} onPress={handleSelectSource}>
          <View style={styles.locationIconContainer}>
            <Icon name="radio-button-checked" size={20} color="#4CAF50" />
          </View>
          <View style={styles.locationContent}>
            <Text style={styles.locationLabel}>From</Text>
            <Text style={styles.locationText}>
              {source ? source.name : 'Select pickup location'}
            </Text>
            {source && (
              <Text style={styles.locationAddress}>{source.address}</Text>
            )}
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <View style={styles.routeLine} />

        <TouchableOpacity style={styles.locationButton} onPress={handleSelectDestination}>
          <View style={styles.locationIconContainer}>
            <Icon name="location-on" size={20} color="#F44336" />
          </View>
          <View style={styles.locationContent}>
            <Text style={styles.locationLabel}>To</Text>
            <Text style={styles.locationText}>
              {destination ? destination.name : 'Select destination'}
            </Text>
            {destination && (
              <Text style={styles.locationAddress}>{destination.address}</Text>
            )}
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Icon name="info-outline" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            You can add multiple stops along your route in the next step
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="schedule" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Set your departure time and recurring schedule options
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="people" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Choose how many passengers you can accommodate
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <Icon name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  locationContent: {
    flex: 1,
    marginLeft: 8,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 19,
    marginVertical: 4,
  },
  infoContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 16,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default CreateRideOfferScreen;
