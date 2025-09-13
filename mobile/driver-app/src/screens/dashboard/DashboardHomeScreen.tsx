/**
 * Dashboard Home Screen Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import types
import { DashboardStackParamList } from '../../navigation/types';
import { RootState } from '../../store';

type DashboardHomeScreenNavigationProp = StackNavigationProp<DashboardStackParamList, 'DashboardHome'>;

const DashboardHomeScreen: React.FC = () => {
  const navigation = useNavigation<DashboardHomeScreenNavigationProp>();
  const { driver, isOnline } = useSelector((state: RootState) => state.auth);

  const handleToggleOnlineStatus = () => {
    // TODO: Implement toggle online status
    console.log('Toggle online status');
  };

  const handleViewRideDetails = () => {
    navigation.navigate('RideDetails', { rideId: 'sample-ride-id' });
  };

  const handleViewDriverStatus = () => {
    navigation.navigate('DriverStatus');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hello, {driver?.firstName || 'Driver'}!
        </Text>
        <Text style={styles.subtitle}>Ready to start earning?</Text>
      </View>

      {/* Online Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Driver Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            Status: {isOnline ? 'Online' : 'Offline'}
          </Text>
          <TouchableOpacity
            style={[styles.statusButton, isOnline ? styles.offlineButton : styles.onlineButton]}
            onPress={handleToggleOnlineStatus}
          >
            <Text style={styles.statusButtonText}>
              Go {isOnline ? 'Offline' : 'Online'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Today's Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0h</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewRideDetails}>
            <Text style={styles.actionButtonText}>View Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewDriverStatus}>
            <Text style={styles.actionButtonText}>Driver Status</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityCard}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <Text style={styles.emptyText}>No recent rides</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onlineButton: {
    backgroundColor: '#34C759',
  },
  offlineButton: {
    backgroundColor: '#FF3B30',
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DashboardHomeScreen;
