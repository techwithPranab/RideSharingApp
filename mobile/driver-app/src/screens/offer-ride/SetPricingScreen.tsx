/**
 * Set Pricing Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { OfferRideStackParamList } from '../../navigation/types';

type SetPricingScreenNavigationProp = StackNavigationProp<OfferRideStackParamList, 'SetPricing'>;
type SetPricingScreenRouteProp = RouteProp<OfferRideStackParamList, 'SetPricing'>;

const SetPricingScreen: React.FC = () => {
  const navigation = useNavigation<SetPricingScreenNavigationProp>();
  const route = useRoute<SetPricingScreenRouteProp>();
  
  const { source, destination, stops, schedule } = route.params;
  const [seats, setSeats] = useState(route.params.seats || 4);
  const [pricePerSeat, setPricePerSeat] = useState('');
  const [acceptsNegotiation, setAcceptsNegotiation] = useState(false);
  const [minimumPrice, setMinimumPrice] = useState('');

  const handleSeatIncrease = () => {
    if (seats < 8) {
      setSeats(seats + 1);
    }
  };

  const handleSeatDecrease = () => {
    if (seats > 1) {
      setSeats(seats - 1);
    }
  };

  const calculateTotalEarnings = () => {
    const price = parseFloat(pricePerSeat) || 0;
    return (price * seats).toFixed(2);
  };

  const handleContinue = () => {
    const pricingData = {
      seats,
      pricePerSeat: parseFloat(pricePerSeat) || 0,
      acceptsNegotiation,
      minimumPrice: acceptsNegotiation ? parseFloat(minimumPrice) || 0 : 0,
      totalEarnings: parseFloat(calculateTotalEarnings()),
    };

    const rideOffer = {
      source,
      destination,
      stops,
      schedule,
      pricing: pricingData,
    };

    navigation.navigate('ReviewOffer', { rideOffer });
  };

  const isValidForm = () => {
    const price = parseFloat(pricePerSeat);
    if (!price || price <= 0) return false;
    
    if (acceptsNegotiation) {
      const minPrice = parseFloat(minimumPrice);
      return minPrice > 0 && minPrice <= price;
    }
    
    return true;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Set Your Pricing</Text>
        <Text style={styles.subtitle}>
          Determine seats available and pricing for your ride
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Seats</Text>
        <Text style={styles.sectionSubtitle}>
          How many passengers can you accommodate?
        </Text>
        
        <View style={styles.seatSelector}>
          <TouchableOpacity 
            style={[styles.seatButton, seats <= 1 && styles.seatButtonDisabled]}
            onPress={handleSeatDecrease}
            disabled={seats <= 1}
          >
            <Icon name="remove" size={24} color={seats <= 1 ? '#ccc' : '#007AFF'} />
          </TouchableOpacity>
          
          <View style={styles.seatDisplay}>
            <Text style={styles.seatNumber}>{seats}</Text>
            <Text style={styles.seatLabel}>seats</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.seatButton, seats >= 8 && styles.seatButtonDisabled]}
            onPress={handleSeatIncrease}
            disabled={seats >= 8}
          >
            <Icon name="add" size={24} color={seats >= 8 ? '#ccc' : '#007AFF'} />
          </TouchableOpacity>
        </View>

        <View style={styles.seatVisual}>
          {Array.from({ length: 8 }, (_, index) => (
            <View 
              key={index}
              style={[
                styles.seatIcon,
                index < seats ? styles.seatIconActive : styles.seatIconInactive
              ]}
            >
              <Icon 
                name="person" 
                size={20} 
                color={index < seats ? '#007AFF' : '#ddd'} 
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Per Seat</Text>
        <Text style={styles.sectionSubtitle}>
          Set a competitive price for each passenger
        </Text>
        
        <View style={styles.priceInput}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.priceTextInput}
            value={pricePerSeat}
            onChangeText={setPricePerSeat}
            placeholder="0"
            keyboardType="numeric"
            returnKeyType="done"
          />
          <Text style={styles.perSeatLabel}>per seat</Text>
        </View>

        <View style={styles.earningsPreview}>
          <Text style={styles.earningsLabel}>Potential Earnings:</Text>
          <Text style={styles.earningsAmount}>₹{calculateTotalEarnings()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.negotiationHeader}>
          <View>
            <Text style={styles.sectionTitle}>Allow Price Negotiation</Text>
            <Text style={styles.sectionSubtitle}>
              Let passengers make counter offers
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              acceptsNegotiation && styles.toggleButtonActive
            ]}
            onPress={() => setAcceptsNegotiation(!acceptsNegotiation)}
          >
            <View style={[
              styles.toggleIndicator,
              acceptsNegotiation && styles.toggleIndicatorActive
            ]} />
          </TouchableOpacity>
        </View>

        {acceptsNegotiation && (
          <View style={styles.minimumPriceContainer}>
            <Text style={styles.minimumPriceLabel}>Minimum acceptable price</Text>
            <View style={styles.priceInput}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.priceTextInput}
                value={minimumPrice}
                onChangeText={setMinimumPrice}
                placeholder="0"
                keyboardType="numeric"
                returnKeyType="done"
              />
              <Text style={styles.perSeatLabel}>per seat</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Icon name="info-outline" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Competitive pricing helps you get more bookings
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="trending-up" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            You'll receive 85% of the total fare after platform fees
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.continueButton,
          !isValidForm() && styles.continueButtonDisabled
        ]}
        onPress={handleContinue}
        disabled={!isValidForm()}
      >
        <Text style={[
          styles.continueButtonText,
          !isValidForm() && styles.continueButtonTextDisabled
        ]}>
          Review Offer
        </Text>
        <Icon 
          name="arrow-forward" 
          size={20} 
          color={!isValidForm() ? '#ccc' : '#fff'} 
        />
      </TouchableOpacity>
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  seatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  seatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatButtonDisabled: {
    backgroundColor: '#f8f8f8',
  },
  seatDisplay: {
    alignItems: 'center',
    marginHorizontal: 40,
  },
  seatNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  seatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  seatVisual: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  seatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  seatIconActive: {
    backgroundColor: '#e3f2fd',
  },
  seatIconInactive: {
    backgroundColor: '#f8f8f8',
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  priceTextInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    padding: 0,
  },
  perSeatLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  earningsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  earningsLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  negotiationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
  minimumPriceContainer: {
    marginTop: 8,
  },
  minimumPriceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
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
  continueButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  continueButtonTextDisabled: {
    color: '#ccc',
  },
});

export default SetPricingScreen;
