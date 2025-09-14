/**
 * Offer Details Screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';

import { OfferRideStackParamList } from '../../navigation/types';

type OfferDetailsScreenRouteProp = RouteProp<OfferRideStackParamList, 'OfferDetails'>;

const OfferDetailsScreen: React.FC = () => {
  const route = useRoute<OfferDetailsScreenRouteProp>();
  const { offerId } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offer Details</Text>
        <Text style={styles.subtitle}>
          View and manage your ride offer #{offerId}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Offer details will be displayed here when integrated with the backend API.
        </Text>
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
  content: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default OfferDetailsScreen;
