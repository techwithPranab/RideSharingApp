/**
 * Profile Screen for RideShare Rider App
 * Shows user profile information and settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '../../hooks/navigation';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logoutUser } from '../../store/slices/authSlice';
import { subscriptionAPI } from '../../services/api';
import { SubscriptionValidation } from '../../types';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const [subscriptionValidation, setSubscriptionValidation] = useState<SubscriptionValidation | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await subscriptionAPI.validateSubscription();
      const result = response.data;

      if (result.success && result.data) {
        setSubscriptionValidation(result.data);
      }
    } catch (error) {
      // Error handled silently - could implement user notification here
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'subscription',
      title: 'Subscription',
      icon: '⭐',
      onPress: () => navigation.navigate('SubscriptionManagement'),
    },
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: '👤',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'payment-methods',
      title: 'Payment Methods',
      icon: '💳',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      id: 'trip-history',
      title: 'Trip History',
      icon: '🗂️',
      onPress: () => navigation.navigate('TripHistory'),
    },
    {
      id: 'address-book',
      title: 'Saved Addresses',
      icon: '🏠',
      onPress: () => navigation.navigate('AddressBook'),
    },
    {
      id: 'support',
      title: 'Support & Help',
      icon: '🆘',
      onPress: () => navigation.navigate('Support'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      onPress: () => Alert.alert('Coming Soon', 'Settings will be available soon!'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userPhone}>+91 {user?.phoneNumber}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email added'}</Text>
          </View>
        </View>

        {/* Subscription Status */}
        {subscriptionValidation && (
          <View style={styles.subscriptionContainer}>
            {subscriptionValidation.isValid ? (
              <View style={styles.activeSubscription}>
                <View style={styles.subscriptionLeft}>
                  <Text style={styles.subscriptionIcon}>⭐</Text>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionTitle}>Premium Member</Text>
                    <Text style={styles.subscriptionSubtitle}>
                      {subscriptionValidation.discount}% discount on all rides
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => navigation.navigate('SubscriptionManagement')}
                >
                  <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.noSubscription}
                onPress={() => navigation.navigate('SubscriptionPlans')}
              >
                <View style={styles.subscriptionLeft}>
                  <Text style={styles.subscriptionIcon}>💎</Text>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionTitle}>Upgrade to Premium</Text>
                    <Text style={styles.subscriptionSubtitle}>
                      Get up to 30% discount on rides
                    </Text>
                  </View>
                </View>
                <Text style={styles.upgradeArrow}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₹0</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>⭐ 0.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>RideShare v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e1e1e1',
    marginHorizontal: 16,
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutContainer: {
    marginHorizontal: 16,
    marginTop: 32,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
  subscriptionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  activeSubscription: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  noSubscription: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subscriptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  manageButton: {
    backgroundColor: '#4caf50',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  upgradeArrow: {
    fontSize: 20,
    color: '#666',
  },
});

export default ProfileScreen;
