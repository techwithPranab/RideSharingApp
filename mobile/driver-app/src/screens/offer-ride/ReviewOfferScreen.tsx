/**
 * Review Offer Screen
 */

import React, { useState } from 'react';
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
import { rideOfferAPI } from '../../services/api';

type ReviewOfferScreenNavigationProp = StackNavigationProp<OfferRideStackParamList, 'ReviewOffer'>;
type ReviewOfferScreenRouteProp = RouteProp<OfferRideStackParamList, 'ReviewOffer'>;

const ReviewOfferScreen: React.FC = () => {
  const navigation = useNavigation<ReviewOfferScreenNavigationProp>();
  const route = useRoute<ReviewOfferScreenRouteProp>();
  
  const { rideOffer } = route.params;
  const { source, destination, stops, schedule, pricing } = rideOffer;
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string | Date) => {
    const timeObj = typeof time === 'string' ? new Date(time) : time;
    return timeObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const publishOffer = async () => {
    setIsPublishing(true);
    
    try {
      // Format the ride offer data for API
      const departureDateTime = schedule.departureDate instanceof Date 
        ? schedule.departureDate.toISOString() 
        : new Date(schedule.departureDate).toISOString();
        
      let recurringEndDate = null;
      if (schedule.recurring?.isRecurring && schedule.recurring.endDate) {
        recurringEndDate = schedule.recurring.endDate instanceof Date 
          ? schedule.recurring.endDate.toISOString() 
          : new Date(schedule.recurring.endDate).toISOString();
      }
      
      const rideOfferData = {
        source: {
          name: source.name || source.address,
          address: source.address,
          coordinates: [source.coordinates.longitude, source.coordinates.latitude],
          placeId: source.placeId
        },
        destination: {
          name: destination.name || destination.address,
          address: destination.address,
          coordinates: [destination.coordinates.longitude, destination.coordinates.latitude],
          placeId: destination.placeId
        },
        stops: stops?.map((stop: any) => ({
          id: stop.id,
          name: stop.name || stop.address,
          address: stop.address,
          coordinates: [stop.coordinates.longitude, stop.coordinates.latitude]
        })) || [],
        schedule: {
          departureDate: departureDateTime,
          departureTime: departureDateTime,
          isFlexible: schedule.isFlexible || false,
          flexibilityMinutes: schedule.flexibilityMinutes || 0,
          recurring: schedule.recurring?.isRecurring ? {
            isRecurring: true,
            type: 'weekly',
            days: schedule.recurring.days,
            endDate: recurringEndDate
          } : {
            isRecurring: false,
            type: 'none',
            days: [],
            endDate: null
          }
        },
        pricing: {
          seats: pricing.seats,
          pricePerSeat: pricing.pricePerSeat,
          acceptsNegotiation: pricing.acceptsNegotiation || false,
          minimumPrice: pricing.minimumPrice || pricing.pricePerSeat
        },
        vehicleId: null, // You might want to get this from user's vehicle data
        specialInstructions: '',
        status: 'published' // Publish immediately
      };

      console.log('Publishing ride offer:', rideOfferData);
      
      const response = await rideOfferAPI.createRideOffer(rideOfferData);
      
      console.log('Ride offer created successfully:', response.data);
      
      Alert.alert(
        'Success!',
        'Your ride offer has been published successfully. Passengers can now book seats.',
        [
          {
            text: 'View My Offers',
            onPress: () => navigation.navigate('MyOffers'),
          },
          {
            text: 'Create Another',
            onPress: () => navigation.navigate('OfferRideHome'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error publishing ride offer:', error);
      
      let errorMessage = 'Failed to publish ride offer. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again to continue.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your ride offer details and try again.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const saveAsDraft = async () => {
    setIsSavingDraft(true);
    
    try {
      // Format the ride offer data for API (same as publish but with draft status)
      const departureDateTime = schedule.departureDate instanceof Date 
        ? schedule.departureDate.toISOString() 
        : new Date(schedule.departureDate).toISOString();
        
      let recurringEndDate = null;
      if (schedule.recurring?.isRecurring && schedule.recurring.endDate) {
        recurringEndDate = schedule.recurring.endDate instanceof Date 
          ? schedule.recurring.endDate.toISOString() 
          : new Date(schedule.recurring.endDate).toISOString();
      }
      
      const rideOfferData = {
        source: {
          name: source.name || source.address,
          address: source.address,
          coordinates: [source.coordinates.longitude, source.coordinates.latitude],
          placeId: source.placeId
        },
        destination: {
          name: destination.name || destination.address,
          address: destination.address,
          coordinates: [destination.coordinates.longitude, destination.coordinates.latitude],
          placeId: destination.placeId
        },
        stops: stops?.map((stop: any) => ({
          id: stop.id,
          name: stop.name || stop.address,
          address: stop.address,
          coordinates: [stop.coordinates.longitude, stop.coordinates.latitude]
        })) || [],
        schedule: {
          departureDate: departureDateTime,
          departureTime: departureDateTime,
          isFlexible: schedule.isFlexible || false,
          flexibilityMinutes: schedule.flexibilityMinutes || 0,
          recurring: schedule.recurring?.isRecurring ? {
            isRecurring: true,
            type: 'weekly',
            days: schedule.recurring.days,
            endDate: recurringEndDate
          } : {
            isRecurring: false,
            type: 'none',
            days: [],
            endDate: null
          }
        },
        pricing: {
          seats: pricing.seats,
          pricePerSeat: pricing.pricePerSeat,
          acceptsNegotiation: pricing.acceptsNegotiation || false,
          minimumPrice: pricing.minimumPrice || pricing.pricePerSeat
        },
        vehicleId: null,
        specialInstructions: '',
        status: 'draft' // Save as draft
      };

      console.log('Saving ride offer as draft:', rideOfferData);
      
      const response = await rideOfferAPI.createRideOffer(rideOfferData);
      
      console.log('Ride offer saved as draft successfully:', response.data);
      
      Alert.alert(
        'Draft Saved!',
        'Your ride offer has been saved as a draft. You can publish it later.',
        [
          {
            text: 'View My Offers',
            onPress: () => navigation.navigate('MyOffers'),
          },
          {
            text: 'Create Another',
            onPress: () => navigation.navigate('OfferRideHome'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving ride offer as draft:', error);
      
      let errorMessage = 'Failed to save draft. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again to continue.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your ride offer details and try again.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSaveAsDraft = () => {
    Alert.alert(
      'Save as Draft',
      'This will save your ride offer as a draft. You can publish it later.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save Draft',
          style: 'default',
          onPress: () => {
            saveAsDraft().catch((error) => {
              console.error('Error saving draft:', error);
              Alert.alert('Error', 'Failed to save draft. Please try again.');
            });
          },
        },
      ]
    );
  };

  const handlePublishConfirm = () => {
    publishOffer().catch((error) => {
      console.error('Error publishing offer:', error);
      Alert.alert('Error', 'Failed to publish offer. Please try again.');
    });
  };

  const handlePublishOffer = () => {
    Alert.alert(
      'Publish Ride Offer',
      'Are you sure you want to publish this ride offer? Passengers will be able to book seats immediately.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Publish',
          style: 'default',
          onPress: handlePublishConfirm,
        },
      ]
    );
  };

  const handleEditSection = (section: string) => {
    switch (section) {
      case 'route':
        navigation.navigate('CreateRideOffer');
        break;
      case 'schedule':
        navigation.navigate('SetSchedule', { source, destination, stops });
        break;
      case 'pricing': {
        const scheduleData = { ...schedule, seats: pricing.seats };
        navigation.navigate('SetPricing', { 
          source, 
          destination, 
          stops, 
          schedule: scheduleData,
          seats: pricing.seats 
        });
        break;
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Your Offer</Text>
        <Text style={styles.subtitle}>
          Make sure all details are correct before publishing
        </Text>
      </View>

      {/* Route Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Route</Text>
          <TouchableOpacity onPress={() => handleEditSection('route')}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
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

          {stops && stops.length > 0 && stops.map((stop: any, index: number) => (
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
      </View>

      {/* Schedule Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <TouchableOpacity onPress={() => handleEditSection('schedule')}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.scheduleInfo}>
          <View style={styles.scheduleItem}>
            <Icon name="calendar-today" size={20} color="#007AFF" />
            <Text style={styles.scheduleText}>
              {formatDate(schedule.departureDate)}
            </Text>
          </View>
          
          <View style={styles.scheduleItem}>
            <Icon name="schedule" size={20} color="#007AFF" />
            <Text style={styles.scheduleText}>
              {formatTime(schedule.departureTime)}
              {schedule.isFlexible && (
                <Text style={styles.flexibilityText}>
                  {' '}(± {schedule.flexibilityMinutes} min)
                </Text>
              )}
            </Text>
          </View>

          {schedule.recurring.isRecurring && (
            <View style={styles.scheduleItem}>
              <Icon name="repeat" size={20} color="#007AFF" />
              <Text style={styles.scheduleText}>
                Recurring on {schedule.recurring.days.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Pricing Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pricing & Seats</Text>
          <TouchableOpacity onPress={() => handleEditSection('pricing')}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.pricingInfo}>
          <View style={styles.pricingItem}>
            <Text style={styles.pricingLabel}>Available Seats</Text>
            <Text style={styles.pricingValue}>{pricing.seats}</Text>
          </View>
          
          <View style={styles.pricingItem}>
            <Text style={styles.pricingLabel}>Price per Seat</Text>
            <Text style={styles.pricingValue}>₹{pricing.pricePerSeat}</Text>
          </View>
          
          {pricing.acceptsNegotiation && (
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Minimum Price</Text>
              <Text style={styles.pricingValue}>₹{pricing.minimumPrice}</Text>
            </View>
          )}
          
          <View style={[styles.pricingItem, styles.totalEarnings]}>
            <Text style={styles.totalEarningsLabel}>Potential Earnings</Text>
            <Text style={styles.totalEarningsValue}>₹{pricing.totalEarnings}</Text>
          </View>
        </View>

        {pricing.acceptsNegotiation && (
          <View style={styles.negotiationNote}>
            <Icon name="handshake" size={16} color="#2196F3" />
            <Text style={styles.negotiationText}>
              You accept price negotiations
            </Text>
          </View>
        )}
      </View>

      <View style={styles.termsContainer}>
        <View style={styles.termsItem}>
          <Icon name="info-outline" size={20} color="#2196F3" />
          <Text style={styles.termsText}>
            By publishing this offer, you agree to our terms of service and cancellation policy
          </Text>
        </View>
        <View style={styles.termsItem}>
          <Icon name="security" size={20} color="#4CAF50" />
          <Text style={styles.termsText}>
            All payments are processed securely through our platform
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.draftButton}
          onPress={handleSaveAsDraft}
        >
          <Text style={styles.draftButtonText}>Save as Draft</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.publishButton} onPress={handlePublishOffer}>
          <Text style={styles.publishButtonText}>Publish Offer</Text>
          <Icon name="publish" size={20} color="#fff" />
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
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  routeContainer: {
    marginTop: 8,
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
  scheduleInfo: {
    gap: 12,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  flexibilityText: {
    color: '#666',
    fontWeight: 'normal',
  },
  pricingInfo: {
    gap: 12,
  },
  pricingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalEarnings: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  totalEarningsLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  totalEarningsValue: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  negotiationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    gap: 6,
  },
  negotiationText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  termsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  termsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  draftButton: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  draftButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  publishButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReviewOfferScreen;
