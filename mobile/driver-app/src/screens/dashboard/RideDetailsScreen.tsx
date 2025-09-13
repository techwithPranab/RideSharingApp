/**
 * Ride Details Screen Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import types
import { DashboardStackParamList } from '../../navigation/types';

type RideDetailsScreenNavigationProp = StackNavigationProp<DashboardStackParamList, 'RideDetails'>;
type RideDetailsScreenRouteProp = RouteProp<DashboardStackParamList, 'RideDetails'>;

const RideDetailsScreen: React.FC = () => {
  const navigation = useNavigation<RideDetailsScreenNavigationProp>();
  const route = useRoute<RideDetailsScreenRouteProp>();
  const { rideId } = route.params;

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ride Details</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.rideId}>Ride ID: {rideId}</Text>
        <Text style={styles.placeholderText}>
          Ride details will be displayed here
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  rideId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RideDetailsScreen;
