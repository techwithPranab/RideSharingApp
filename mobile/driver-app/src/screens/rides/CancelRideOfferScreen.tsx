/**
 * CancelRideOfferScreen
 * Driver interface for cancelling ride offers with reason selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../../services/api';

interface RouteParams {
  offerId: string;
  rideOffer: {
    source: { name: string };
    destination: { name: string };
    departureDateTime: string;
    pricing: { pricePerSeat: number; seats: number };
    bookedSeats: number;
  };
}

const CancelRideOfferScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { offerId, rideOffer } = route.params as RouteParams;

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const cancellationReasons = [
    'Personal emergency',
    'Vehicle breakdown',
    'Weather conditions',
    'Traffic/Road conditions',
    'Health issues',
    'Family emergency',
    'Work commitment',
    'Other'
  ];

  const handleCancel = async () => {
    const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    
    if (!reason) {
      Alert.alert('Error', 'Please select or enter a cancellation reason.');
      return;
    }

    // Show confirmation alert with impact information
    const bookedSeats = rideOffer.bookedSeats || 0;
    const confirmMessage = bookedSeats > 0
      ? `This will cancel your ride offer and notify ${bookedSeats} rider(s) who have booked seats. Refunds will be processed automatically. Are you sure?`
      : 'This will cancel your ride offer. Are you sure?';

    Alert.alert(
      'Confirm Cancellation',
      confirmMessage,
      [
        {
          text: 'No, Keep Offer',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel Offer',
          style: 'destructive',
          onPress: () => {
            confirmCancellation().catch(console.error);
          },
        },
      ],
    );
  };

  const confirmCancellation = async () => {
    setIsLoading(true);
    
    try {
      const reason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
      
      const response = await api.patch(`/ride-offers/${offerId}/cancel`, {
        reason
      });

      if (response.data.success) {
        Alert.alert(
          'Offer Cancelled',
          'Your ride offer has been cancelled successfully. Affected riders have been notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to offers list
                navigation.navigate('RideOffersScreen' as never);
              },
            },
          ],
        );
      } else {
        throw new Error(response.data.message || 'Failed to cancel offer');
      }
    } catch (error: any) {
      console.error('Error cancelling ride offer:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to cancel ride offer. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cancel Ride Offer</Text>
        </View>

        {/* Ride Information */}
        <View style={styles.rideInfo}>
          <Text style={styles.sectionTitle}>Ride Details</Text>
          <View style={styles.routeContainer}>
            <View style={styles.routeItem}>
              <Ionicons name="location" size={16} color="#007AFF" />
              <Text style={styles.locationText}>{rideOffer.source.name}</Text>
            </View>
            <View style={styles.routeLine}>
              <View style={styles.dottedLine} />
            </View>
            <View style={styles.routeItem}>
              <Ionicons name="location" size={16} color="#FF3B30" />
              <Text style={styles.locationText}>{rideOffer.destination.name}</Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Departure</Text>
              <Text style={styles.detailValue}>{formatDateTime(rideOffer.departureDateTime)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Booked Seats</Text>
              <Text style={styles.detailValue}>{rideOffer.bookedSeats || 0} / {rideOffer.pricing.seats}</Text>
            </View>
          </View>

          {rideOffer.bookedSeats > 0 && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={16} color="#FF9500" />
              <Text style={styles.warningText}>
                {rideOffer.bookedSeats} rider(s) will be notified and refunded
              </Text>
            </View>
          )}
        </View>

        {/* Cancellation Reasons */}
        <View style={styles.reasonsSection}>
          <Text style={styles.sectionTitle}>Reason for Cancellation</Text>
          <Text style={styles.sectionSubtitle}>Please select a reason to help us improve our service</Text>
          
          {cancellationReasons.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonItem,
                selectedReason === reason && styles.selectedReasonItem
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <View style={[
                styles.radioButton,
                selectedReason === reason && styles.selectedRadioButton
              ]}>
                {selectedReason === reason && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <Text style={[
                styles.reasonText,
                selectedReason === reason && styles.selectedReasonText
              ]}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Custom reason input */}
          {selectedReason === 'Other' && (
            <View style={styles.customReasonContainer}>
              <TextInput
                style={styles.customReasonInput}
                placeholder="Please specify your reason..."
                placeholderTextColor="#999"
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.characterCount}>{customReason.length}/200</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Keep Offer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedReason || (selectedReason === 'Other' && !customReason.trim())) && styles.disabledButton
            ]}
            onPress={handleCancel}
            disabled={
              isLoading ||
              !selectedReason ||
              (selectedReason === 'Other' && !customReason.trim())
            }
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>Cancel Ride Offer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  rideInfo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  routeContainer: {
    marginBottom: 20,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  routeLine: {
    marginLeft: 8,
    height: 20,
    justifyContent: 'center',
  },
  dottedLine: {
    width: 1,
    height: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#DDD',
    borderStyle: 'dashed',
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  reasonsSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedReasonItem: {
    backgroundColor: '#F0F8FF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedReasonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  customReasonContainer: {
    marginTop: 16,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  cancelButton: {
    flex: 0.45,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  confirmButton: {
    flex: 0.5,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default CancelRideOfferScreen;
