/**
 * Support Screen for RideShare Rider App
 * Shows support options and help resources
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '../../hooks/navigation';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../../constants/config';

const SupportScreen: React.FC = () => {
  const navigation = useNavigation();

  const supportOptions = [
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions',
      icon: '❓',
      action: () => Alert.alert('Coming Soon', 'FAQ section will be available soon!'),
    },
    {
      id: 'contact',
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: '📞',
      action: () => Alert.alert('Coming Soon', 'Contact support feature will be available soon!'),
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our support agents',
      icon: '💬',
      action: () => Alert.alert('Coming Soon', 'Live chat feature will be available soon!'),
    },
    {
      id: 'report',
      title: 'Report an Issue',
      description: 'Report problems or safety concerns',
      icon: '🚨',
      action: () => Alert.alert('Coming Soon', 'Report issue feature will be available soon!'),
    },
  ];

  const quickHelpOptions = [
    {
      id: 'safety',
      title: 'Safety Guidelines',
      description: 'Learn about riding safely',
      icon: '🛡️',
    },
    {
      id: 'payment',
      title: 'Payment Help',
      description: 'Issues with payments or refunds',
      icon: '💳',
    },
    {
      id: 'account',
      title: 'Account & Profile',
      description: 'Manage your account settings',
      icon: '👤',
    },
    {
      id: 'rides',
      title: 'Ride Issues',
      description: 'Problems with booking or completing rides',
      icon: '🚗',
    },
  ];

  const handleCallSupport = () => {
    const phoneNumber = '+91-1800-XXX-XXXX'; // Replace with actual support number
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmailSupport = () => {
    const email = 'support@rideshare.com'; // Replace with actual support email
    Linking.openURL(`mailto:${email}`);
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
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Emergency Contact */}
        <View style={styles.emergencyContainer}>
          <Text style={styles.emergencyTitle}>🚨 Emergency</Text>
          <Text style={styles.emergencyDescription}>
            For immediate safety concerns or emergencies, contact emergency services directly.
          </Text>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => Linking.openURL('tel:112')}
          >
            <Text style={styles.emergencyButtonText}>Call Emergency Services</Text>
          </TouchableOpacity>
        </View>

        {/* Support Options */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          {supportOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={option.action}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
              </View>
              <Text style={styles.optionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Help */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          <View style={styles.quickHelpGrid}>
            {quickHelpOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.quickHelpCard}
                onPress={() => Alert.alert('Coming Soon', `${option.title} help will be available soon!`)}
              >
                <Text style={styles.quickHelpIcon}>{option.icon}</Text>
                <Text style={styles.quickHelpTitle}>{option.title}</Text>
                <Text style={styles.quickHelpDescription} numberOfLines={2}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Contact Us</Text>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleCallSupport}
          >
            <Text style={styles.contactIcon}>📞</Text>
            <View style={styles.contactContent}>
              <Text style={styles.contactButtonTitle}>Call Support</Text>
              <Text style={styles.contactButtonSubtitle}>Mon-Fri 9AM-6PM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleEmailSupport}
          >
            <Text style={styles.contactIcon}>✉️</Text>
            <View style={styles.contactContent}>
              <Text style={styles.contactButtonTitle}>Email Support</Text>
              <Text style={styles.contactButtonSubtitle}>We respond within 24 hours</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoTitle}>App Information</Text>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Version:</Text>
            <Text style={styles.appInfoValue}>1.0.0</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Text style={styles.appInfoLabel}>Last Updated:</Text>
            <Text style={styles.appInfoValue}>January 2024</Text>
          </View>
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  emergencyContainer: {
    backgroundColor: COLORS.error,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  emergencyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  emergencyDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.md,
  },
  emergencyButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'flex-start',
  },
  emergencyButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '600',
  },
  sectionContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  optionArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickHelpCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    width: '48%',
    ...SHADOWS.small,
  },
  quickHelpIcon: {
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING.sm,
  },
  quickHelpTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  quickHelpDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  contactContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  contactTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.md,
    width: 24,
    textAlign: 'center',
  },
  contactContent: {
    flex: 1,
  },
  contactButtonTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  contactButtonSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  appInfoContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  appInfoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  appInfoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  appInfoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
});

export default SupportScreen;
