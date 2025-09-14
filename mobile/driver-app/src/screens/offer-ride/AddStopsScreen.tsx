/**
 * Add Stops Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { OfferRideStackParamList } from '../../navigation/types';

type AddStopsScreenNavigationProp = StackNavigationProp<OfferRideStackParamList, 'AddStops'>;
type AddStopsScreenRouteProp = RouteProp<OfferRideStackParamList, 'AddStops'>;

interface Stop {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

const AddStopsScreen: React.FC = () => {
  const navigation = useNavigation<AddStopsScreenNavigationProp>();
  const route = useRoute<AddStopsScreenRouteProp>();
  
  const { source, destination } = route.params;
  const [stops, setStops] = useState<Stop[]>([]);

  const handleAddStop = () => {
    navigation.navigate('SelectLocation', { 
      locationType: 'stop'
    });
  };

  const handleRemoveStop = (stopId: string) => {
    setStops(stops.filter(stop => stop.id !== stopId));
  };

  const handleContinue = () => {
    const params: any = {
      source, 
      destination
    };
    
    if (stops.length > 0) {
      params.stops = stops;
    }
    
    navigation.navigate('SetSchedule', params);
  };

  const handleSkip = () => {
    navigation.navigate('SetSchedule', { 
      source, 
      destination 
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Stops (Optional)</Text>
        <Text style={styles.subtitle}>
          Add pickup points along your route to accommodate more passengers
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.locationItem}>
          <View style={styles.locationIcon}>
            <Icon name="radio-button-checked" size={20} color="#4CAF50" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>From</Text>
            <Text style={styles.locationName}>{source.name}</Text>
            <Text style={styles.locationAddress}>{source.address}</Text>
          </View>
        </View>

        {stops.map((stop, index) => (
          <View key={stop.id}>
            <View style={styles.routeLine} />
            <View style={styles.locationItem}>
              <View style={styles.locationIcon}>
                <Icon name="location-on" size={20} color="#FF9800" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Stop {index + 1}</Text>
                <Text style={styles.locationName}>{stop.name}</Text>
                <Text style={styles.locationAddress}>{stop.address}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveStop(stop.id)}
              >
                <Icon name="close" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.routeLine} />
        
        <View style={styles.locationItem}>
          <View style={styles.locationIcon}>
            <Icon name="location-on" size={20} color="#F44336" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>To</Text>
            <Text style={styles.locationName}>{destination.name}</Text>
            <Text style={styles.locationAddress}>{destination.address}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop}>
        <Icon name="add-circle-outline" size={24} color="#007AFF" />
        <Text style={styles.addStopText}>Add Stop</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Icon name="info-outline" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Adding stops can help you earn more by picking up additional passengers along the way
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="schedule" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Each stop should add only a few minutes to your journey
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
        
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  routeContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationIcon: {
    width: 40,
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 8,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  locationName: {
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
  removeButton: {
    padding: 8,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addStopText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
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
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default AddStopsScreen;
