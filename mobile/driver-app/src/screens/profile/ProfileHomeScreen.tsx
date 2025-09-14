/**
 * Profile Home Screen Component
 * Displays driver profile information with backend integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import types
import { ProfileStackParamList } from '../../navigation/types';
import { Driver } from '../../types';
import { RootState } from '../../store';

// Import API
import { driverAPI } from '../../services/api';

type ProfileHomeScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

const ProfileHomeScreen: React.FC = () => {
  const navigation = useNavigation<ProfileHomeScreenNavigationProp>();
  const authState = useSelector((state: RootState) => state.auth);
  const [profile, setProfile] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get driver ID from Redux first, then fallback to AsyncStorage
      let driverId = authState.driver?.id;
      console.log('ProfileHomeScreen: Driver ID from Redux:', driverId);
      
      if (!driverId) {
        console.log('ProfileHomeScreen: Driver ID not in Redux, checking AsyncStorage...');
        const storedDriverId = await AsyncStorage.getItem('driver_id');
        driverId = storedDriverId || undefined;
        console.log('ProfileHomeScreen: Retrieved driver_id from AsyncStorage:', driverId);
      }
      
      if (!driverId) {
        console.log('ProfileHomeScreen: Driver ID is null/undefined in both Redux and AsyncStorage');
        setError('Driver ID not found. Please log in again.');
        return;
      }

      console.log('ProfileHomeScreen: Making API call to get profile for driver:', driverId);
      const response = await driverAPI.getProfile(driverId);
      console.log('ProfileHomeScreen: API response:', response.data);
      
      if (response.data.success) {
        setProfile(response.data.data);
      } else {
        setError('Failed to load profile');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleVehicleManagement = () => {
    navigation.navigate('VehicleManagement');
  };

  const handleDocuments = () => {
    navigation.navigate('Documents');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleSupport = () => {
    navigation.navigate('Support');
  };

  const handleRefresh = () => {
    fetchProfile();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            {profile?.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.avatarText}>
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile?.firstName} {profile?.lastName}
            </Text>
            <Text style={styles.email}>{profile?.email}</Text>
            <Text style={styles.phone}>{profile?.phoneNumber}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: profile?.isOnline ? '#4CAF50' : '#FF9800' }]}>
                <Text style={styles.statusText}>
                  {profile?.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: profile?.isAvailable ? '#2196F3' : '#9E9E9E' }]}>
                <Text style={styles.statusText}>
                  {profile?.isAvailable ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.averageRating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.totalTrips || 0}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{profile?.totalEarnings?.toFixed(0) || '0'}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleVehicleManagement}>
          <Text style={styles.buttonText}>Vehicle Management</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleDocuments}>
          <Text style={styles.buttonText}>Documents</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSettings}>
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSupport}>
          <Text style={styles.buttonText}>Support</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
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
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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

export default ProfileHomeScreen;
