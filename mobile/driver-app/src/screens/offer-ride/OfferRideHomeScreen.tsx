/**
 * Offer Ride Home Screen
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { OfferRideStackParamList } from '../../navigation/types';

type OfferRideHomeScreenNavigationProp = StackNavigationProp<OfferRideStackParamList, 'OfferRideHome'>;

const OfferRideHomeScreen: React.FC = () => {
  const navigation = useNavigation<OfferRideHomeScreenNavigationProp>();

  const handleCreateOffer = () => {
    navigation.navigate('CreateRideOffer');
  };

  const handleViewMyOffers = () => {
    navigation.navigate('MyOffers');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offer Rides</Text>
        <Text style={styles.subtitle}>
          Create ride offers and earn money by sharing your trips with passengers
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateOffer}>
          <Icon name="add-circle" size={24} color="#fff" />
          <Text style={styles.primaryButtonText}>Create New Ride Offer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleViewMyOffers}>
          <Icon name="list" size={24} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>My Ride Offers</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Set Your Route</Text>
            <Text style={styles.stepDescription}>
              Choose your starting point, destination, and any stops along the way
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Schedule & Seats</Text>
            <Text style={styles.stepDescription}>
              Set departure time, date, and available seats for passengers
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Set Your Price</Text>
            <Text style={styles.stepDescription}>
              Choose fixed pricing or let passengers make offers
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Accept Bookings</Text>
            <Text style={styles.stepDescription}>
              Review and accept booking requests from passengers
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>Benefits of Offering Rides:</Text>
        <View style={styles.benefitItem}>
          <Icon name="monetization-on" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Earn extra income from your trips</Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="eco" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Reduce environmental impact</Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="people" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Meet new people and socialize</Text>
        </View>
        <View style={styles.benefitItem}>
          <Icon name="local-gas-station" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Share fuel and travel costs</Text>
        </View>
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
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  benefitsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

export default OfferRideHomeScreen;
