/**
 * Earnings Details Screen Component
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Import types
import { EarningsStackParamList } from '../../navigation/types';

type EarningsDetailsScreenNavigationProp = StackNavigationProp<EarningsStackParamList, 'EarningsDetails'>;
type EarningsDetailsScreenRouteProp = RouteProp<EarningsStackParamList, 'EarningsDetails'>;

const EarningsDetailsScreen: React.FC = () => {
  const navigation = useNavigation<EarningsDetailsScreenNavigationProp>();
  const route = useRoute<EarningsDetailsScreenRouteProp>();
  const { period } = route.params;

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Earnings Details</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.period}>Period: {period}</Text>
        <Text style={styles.placeholderText}>
          Earnings details will be displayed here
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default EarningsDetailsScreen;
