/**
 * Booking Management Screen
 * Allows riders to view their bookings and cancel them with refund information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';

type RootStackParamList = {
  BookingDetails: { bookingId: string };
  Payment: { bookingId: string };
};

interface Booking {
  bookingId: string;
  rideOfferId: string;
  driverId: string;
  seatsBooked: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'refund_pending';
  sourceLocation: {
    name: string;
    address: string;
  };
  destinationLocation: {
    name: string;
    address: string;
  };
  departureDateTime: string;
  estimatedArrival: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancellationDate?: string;
  refundAmount?: number;
  refundDate?: string;
  hoursUntilDeparture?: number;
}

interface CancellationInfo {
  canCancel: boolean;
  refundInfo: {
    amount: number;
    percentage: number;
    reason: string;
  };
  policy: {
    FREE_CANCELLATION_HOURS: number;
    PARTIAL_REFUND_HOURS: number;
    NO_REFUND_HOURS: number;
    FREE_CANCELLATION_PERCENTAGE: number;
    PARTIAL_REFUND_PERCENTAGE: number;
    NO_REFUND_PERCENTAGE: number;
  };
}

const BookingManagementScreen: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellationInfo, setCancellationInfo] = useState<CancellationInfo | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/rider');
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleBookingPress = (booking: Booking) => {
    // Navigate to booking details - implement when screen is available
    console.log('Navigate to booking details:', booking.bookingId);
  };

  const handleCancelPress = async (booking: Booking) => {
    try {
      const response = await api.get(`/bookings/${booking.bookingId}/cancellation-info`);
      if (response.data.success) {
        setSelectedBooking(booking);
        setCancellationInfo(response.data.data.cancellationInfo);
        setShowCancellationModal(true);
      }
    } catch (error) {
      console.error('Error fetching cancellation info:', error);
      Alert.alert('Error', 'Failed to load cancellation information');
    }
  };

  const performCancellation = async () => {
    if (!selectedBooking) return;

    try {
      const response = await api.put(`/bookings/${selectedBooking.bookingId}/cancel`, {
        reason: 'Cancelled by rider',
      });

      if (response.data.success) {
        Alert.alert(
          'Booking Cancelled',
          `Your booking has been cancelled. ${response.data.data?.refundInfo?.reason || ''}`,
          [{ text: 'OK', onPress: () => {
            setShowCancellationModal(false);
            setSelectedBooking(null);
            fetchBookings(); // Refresh the list
          }}]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'confirmed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      case 'refunded': return '#9C27B0';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => handleBookingPress(item)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingId}>Booking #{item.bookingId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <Text style={styles.locationText} numberOfLines={1}>
          📍 {item.sourceLocation.name}
        </Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.locationText} numberOfLines={1}>
          🎯 {item.destinationLocation.name}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>
          📅 {formatDate(item.departureDateTime)}
        </Text>
        <Text style={styles.detailText}>
          👥 {item.seatsBooked} seat{item.seatsBooked > 1 ? 's' : ''}
        </Text>
        <Text style={styles.detailText}>
          💰 ₹{item.totalAmount}
        </Text>
      </View>

      {item.hoursUntilDeparture !== undefined && (
        <Text style={styles.timeText}>
          ⏰ {item.hoursUntilDeparture > 0
            ? `${item.hoursUntilDeparture.toFixed(1)} hours until departure`
            : 'Departed'
          }
        </Text>
      )}

      {(item.status === 'pending' || item.status === 'confirmed') && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelPress(item)}
        >
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}

      {item.status === 'cancelled' && item.cancellationReason && (
        <View style={styles.cancellationInfo}>
          <Text style={styles.cancellationText}>
            ❌ Cancelled: {item.cancellationReason}
          </Text>
          {item.refundAmount !== undefined && (
            <Text style={styles.refundText}>
              💸 Refund: ₹{item.refundAmount}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            Your ride bookings will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.bookingId}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Cancellation Modal */}
      {showCancellationModal && selectedBooking && cancellationInfo && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalBookingId}>Booking #{selectedBooking.bookingId}</Text>

            <View style={styles.routeContainer}>
              <Text style={styles.modalLocationText}>
                From: {selectedBooking.sourceLocation.name}
              </Text>
              <Text style={styles.modalLocationText}>
                To: {selectedBooking.destinationLocation.name}
              </Text>
            </View>

            <View style={styles.refundContainer}>
              <Text style={styles.refundTitle}>Refund Information:</Text>
              <Text style={styles.refundAmount}>
                ₹{cancellationInfo.refundInfo.amount} ({cancellationInfo.refundInfo.percentage}%)
              </Text>
              <Text style={styles.refundReason}>
                {cancellationInfo.refundInfo.reason}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowCancellationModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={() => {
                  performCancellation();
                }}
              >
                <Text style={styles.confirmModalButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#666',
  },
  detailsContainer: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancellationInfo: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  cancellationText: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 4,
  },
  refundText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  modalBookingId: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  modalLocationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  refundContainer: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  refundAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  refundReason: {
    fontSize: 14,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelModalButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelModalButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalButton: {
    backgroundColor: '#F44336',
  },
  confirmModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingManagementScreen;
