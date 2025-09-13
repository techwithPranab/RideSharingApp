/**
 * Payment Methods Screen for RideShare Rider App
 * Shows and manages user's payment methods
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
import { PaymentMethod } from '../../types';
import { paymentAPI } from '../../services/api';

const PaymentMethodsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentAPI.getPaymentMethods();
      const paymentMethods = response.data.data || [];
      setMethods(paymentMethods);
    } catch (error) {
      // Error loading payment methods handled with alert
      Alert.alert('Error', 'Failed to load payment methods');
      setMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMethod = (methodId: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentAPI.deletePaymentMethod(methodId);
              setMethods(prev => prev.filter(method => method.id !== methodId));
              Alert.alert('Success', 'Payment method deleted successfully');
            } catch (error) {
              // Error deleting payment method handled with alert
              Alert.alert('Error', 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await paymentAPI.setDefaultPaymentMethod(methodId);
      // Update the local state to reflect the change
      setMethods(prev => prev.map(method => ({
        ...method,
        isDefault: method.id === methodId
      })));
      Alert.alert('Success', 'Default payment method updated successfully');
    } catch (error: unknown) {
      // Error setting default payment method handled with alert
      const message = error instanceof Error && typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to set default payment method'
        : 'Failed to set default payment method';
      Alert.alert('Error', message);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return '💳';
      case 'upi':
        return '📱';
      case 'wallet':
        return '👛';
      default:
        return '💳';
    }
  };

  const getPaymentMethodDetails = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `**** **** **** ${method.details.cardNumber?.slice(-4) || '****'}`;
      case 'upi':
        return method.details.upiId || 'UPI ID';
      case 'wallet':
        return method.details.walletProvider || 'Wallet';
      default:
        return 'Payment Method';
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payment methods...</Text>
        </View>
      );
    }

    if (methods.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💳</Text>
          <Text style={styles.emptyTitle}>No Payment Methods</Text>
          <Text style={styles.emptyDescription}>
            Add a payment method to make booking rides easier
          </Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => Alert.alert('Coming Soon', 'Add payment method feature will be available soon!')}
          >
            <Text style={styles.addFirstButtonText}>Add Payment Method</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.methodsContainer}>
        {methods.map((method) => (
          <View key={method.id} style={styles.methodCard}>
            <View style={styles.methodLeft}>
              <Text style={styles.methodIcon}>
                {getPaymentMethodIcon(method.type)}
              </Text>
              <View style={styles.methodDetails}>
                <Text style={styles.methodType}>
                  {method.type.toUpperCase()}
                </Text>
                <Text style={styles.methodInfo}>
                  {getPaymentMethodDetails(method)}
                </Text>
              </View>
            </View>

            <View style={styles.methodRight}>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => {
                  Alert.alert(
                    'Payment Method Options',
                    '',
                    [
                      {
                        text: method.isDefault ? 'Already Default' : 'Set as Default',
                        onPress: () => !method.isDefault && handleSetDefault(method.id),
                      },
                      {
                        text: 'Delete',
                        onPress: () => handleDeleteMethod(method.id),
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
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Coming Soon', 'Add payment method feature will be available soon!')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderContent()}

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>💡 Payment Tips</Text>
          <Text style={styles.infoText}>
            • Add multiple payment methods for convenience{'\n'}
            • Set your preferred payment method as default{'\n'}
            • Your payment information is secure and encrypted
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
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
  methodsContainer: {
    paddingHorizontal: SPACING.md,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.md,
  },
  methodDetails: {
    flex: 1,
  },
  methodType: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  methodInfo: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  methodRight: {
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  defaultBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '600',
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

export default PaymentMethodsScreen;
