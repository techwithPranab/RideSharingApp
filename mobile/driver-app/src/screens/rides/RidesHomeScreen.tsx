/**
 * Rides Home Screen Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import types
import { RidesStackParamList } from '../../navigation/types';

type RidesHomeScreenNavigationProp = StackNavigationProp<RidesStackParamList, 'RidesHome'>;

const RidesHomeScreen: React.FC = () => {
  const navigation = useNavigation<RidesHomeScreenNavigationProp>();

  const handleViewRideDetails = () => {
    navigation.navigate('RideDetails', { rideId: 'sample-ride-id' });
  };

  const handleViewRideHistory = () => {
    navigation.navigate('RideHistory');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Rides</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={handleViewRideDetails}>
          <Text style={styles.buttonText}>View Ride Details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleViewRideHistory}>
          <Text style={styles.buttonText}>View Ride History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RidesHomeScreen;
