/**
 * Address Book Screen for RideShare Rider App
 * Shows and manages user's saved addresses
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
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';
import { Address } from '../../types';
import { userAPI } from '../../services/api';

const AddressBookScreen: React.FC = () => {
  const navigation = useNavigation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const response = await userAPI.getSavedAddresses();
      const addressData = response.data.data || [];
      setAddresses(addressData);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'Failed to load saved addresses');
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddressById = (addressId: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    Alert.alert('Success', 'Address deleted successfully');
  };

  const handleEditAddress = (address: Address) => {
    Alert.alert('Coming Soon', 'Edit address feature will be available soon!');
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this saved address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await userAPI.deleteSavedAddress(addressId);
              deleteAddressById(addressId);
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleAddAddress = () => {
    Alert.alert('Coming Soon', 'Add address feature will be available soon!');
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return '🏠';
      case 'work':
        return '🏢';
      default:
        return '📍';
    }
  };

  const renderAddressCard = (address: Address) => (
    <View key={address.id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressLeft}>
          <Text style={styles.addressIcon}>{getAddressIcon(address.type)}</Text>
          <View style={styles.addressInfo}>
            <Text style={styles.addressName}>{address.name}</Text>
            <Text style={styles.addressType}>
              {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              'Address Options',
              '',
              [
                {
                  text: 'Edit',
                  onPress: () => handleEditAddress(address),
                },
                {
                  text: 'Delete',
                  onPress: () => handleDeleteAddress(address.id!),
                  style: 'destructive',
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.addressText} numberOfLines={2}>
        {address.address}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddAddress}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No Saved Addresses</Text>
            <Text style={styles.emptyDescription}>
              Add your frequently used addresses for quick booking
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddAddress}
            >
              <Text style={styles.addFirstButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressesContainer}>
            {addresses.map(renderAddressCard)}

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => Alert.alert('Coming Soon', 'Set home address feature will be available soon!')}
              >
                <Text style={styles.quickActionIcon}>🏠</Text>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionTitle}>Set Home Address</Text>
                  <Text style={styles.quickActionDescription}>
                    Save your home location for quick access
                  </Text>
                </View>
                <Text style={styles.quickActionArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => Alert.alert('Coming Soon', 'Set work address feature will be available soon!')}
              >
                <Text style={styles.quickActionIcon}>🏢</Text>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionTitle}>Set Work Address</Text>
                  <Text style={styles.quickActionDescription}>
                    Save your work location for quick access
                  </Text>
                </View>
                <Text style={styles.quickActionArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>💡 Address Tips</Text>
          <Text style={styles.infoText}>
            • Save frequently used addresses for faster booking{'\n'}
            • Set home and work addresses for quick selection{'\n'}
            • Your saved addresses are private and secure
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  addFirstButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  addFirstButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  addressesContainer: {
    paddingHorizontal: SPACING.md,
  },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  addressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.md,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  addressType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  addressText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  quickActionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  quickActionsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quickActionIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.md,
    width: 24,
    textAlign: 'center',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  quickActionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  quickActionArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  infoContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default AddressBookScreen;
