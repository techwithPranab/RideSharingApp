/**
 * Earnings Home Screen Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import types
import { EarningsStackParamList } from '../../navigation/types';

type EarningsHomeScreenNavigationProp = StackNavigationProp<EarningsStackParamList, 'EarningsHome'>;

const EarningsHomeScreen: React.FC = () => {
  const navigation = useNavigation<EarningsHomeScreenNavigationProp>();

  const handleViewDetails = () => {
    navigation.navigate('EarningsDetails', { period: 'today' });
  };

  const handleViewPayoutHistory = () => {
    navigation.navigate('PayoutHistory');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={handleViewDetails}>
          <Text style={styles.buttonText}>View Earnings Details</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleViewPayoutHistory}>
          <Text style={styles.buttonText}>View Payout History</Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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

export default EarningsHomeScreen;
