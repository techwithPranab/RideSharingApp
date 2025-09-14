/**
 * My Offers Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { OfferRideStackParamList } from '../../navigation/types';
import { rideOfferAPI } from '../../services/api';

type MyOffersScreenNavigationProp = StackNavigationProp<OfferRideStackParamList, 'MyOffers'>;

interface RideOffer {
  id: string;
  status: string;
  source: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  destination: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  schedule: {
    departureDate: string;
    departureTime: string;
    isFlexible: boolean;
    flexibilityMinutes: number;
    recurring: {
      isRecurring: boolean;
      type: string;
      days: string[];
    };
  };
  pricing: {
    seats: number;
    pricePerSeat: number;
    acceptsNegotiation: boolean;
    minimumPrice: number;
    totalEarnings: number;
  };
  availableSeats: number;
  bookedSeats: number;
  totalBookings: number;
  specialInstructions: string;
  createdAt: string;
}

const MyOffersScreen: React.FC = () => {
  const navigation = useNavigation<MyOffersScreenNavigationProp>();
  const [rideOffers, setRideOffers] = useState<RideOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRideOffers();
  }, []);

  const loadRideOffers = async () => {
    try {
      setLoading(true);
      const response = await rideOfferAPI.getRideOffers();
      
      if (response.data.success && response.data.data) {
        setRideOffers(response.data.data.rideOffers || []);
      } else {
        setRideOffers([]);
      }
    } catch (error: any) {
      console.error('Error loading ride offers:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load ride offers';
      Alert.alert('Error', errorMessage);
      setRideOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRideOffers();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return '#4CAF50';
      case 'draft':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'completed':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const renderRideOffer = (offer: RideOffer) => (
    <TouchableOpacity
      key={offer.id}
      style={styles.offerCard}
      onPress={() => {
        // Navigate to offer details (you might need to create this screen)
        Alert.alert('Offer Details', `Offer ID: ${offer.id}\nStatus: ${offer.status}`);
      }}
    >
      <View style={styles.offerHeader}>
        <View style={styles.routeContainer}>
          <Text style={styles.sourceText} numberOfLines={1}>
            {offer.source.name}
          </Text>
          <Icon name="arrow-forward" size={16} color="#666" style={styles.arrowIcon} />
          <Text style={styles.destinationText} numberOfLines={1}>
            {offer.destination.name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(offer.status) }]}>
          <Text style={styles.statusText}>{offer.status}</Text>
        </View>
      </View>

      <View style={styles.offerDetails}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.detailText}>
            {formatDate(offer.schedule.departureDate)} at {formatTime(offer.schedule.departureTime)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="people" size={16} color="#666" />
          <Text style={styles.detailText}>
            {offer.availableSeats} seats available
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="attach-money" size={16} color="#666" />
          <Text style={styles.detailText}>
            ₹{offer.pricing.pricePerSeat} per seat
          </Text>
        </View>

        {offer.totalBookings > 0 && (
          <View style={styles.detailRow}>
            <Icon name="confirmation-number" size={16} color="#666" />
            <Text style={styles.detailText}>
              {offer.totalBookings} booking{offer.totalBookings !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Ride Offers</Text>
          <Text style={styles.subtitle}>
            Manage your published ride offers
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride offers...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Ride Offers</Text>
        <Text style={styles.subtitle}>
          Manage your published ride offers
        </Text>
      </View>

      {rideOffers.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="directions-car" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Ride Offers Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start by creating your first ride offer to connect with passengers looking for rides
          </Text>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('OfferRideHome')}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Your First Offer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.offersList}>
          {rideOffers.map(renderRideOffer)}
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offersList: {
    padding: 16,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: 8,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  offerDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default MyOffersScreen;
