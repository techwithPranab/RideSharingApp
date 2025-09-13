/**
 * Profile Home Screen Component
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
import { ProfileStackParamList } from '../../navigation/types';

type ProfileHomeScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

const ProfileHomeScreen: React.FC = () => {
  const navigation = useNavigation<ProfileHomeScreenNavigationProp>();

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

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

export default ProfileHomeScreen;
