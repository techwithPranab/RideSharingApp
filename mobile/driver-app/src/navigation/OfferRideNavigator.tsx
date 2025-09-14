/**
 * Offer Ride Navigator for Driver App
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import OfferRideHomeScreen from '../screens/offer-ride/OfferRideHomeScreen';
import CreateRideOfferScreen from '../screens/offer-ride/CreateRideOfferScreen';
import SelectLocationScreen from '../screens/offer-ride/SelectLocationScreen';
import AddStopsScreen from '../screens/offer-ride/AddStopsScreen';
import SetScheduleScreen from '../screens/offer-ride/SetScheduleScreen';
import SetPricingScreen from '../screens/offer-ride/SetPricingScreen';
import ReviewOfferScreen from '../screens/offer-ride/ReviewOfferScreen';
import MyOffersScreen from '../screens/offer-ride/MyOffersScreen';
import OfferDetailsScreen from '../screens/offer-ride/OfferDetailsScreen';
import CancelRideOfferScreen from '../screens/rides/CancelRideOfferScreen';

// Import types
import { OfferRideStackParamList } from './types';

const Stack = createStackNavigator<OfferRideStackParamList>();

const OfferRideNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="OfferRideHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="OfferRideHome" 
        component={OfferRideHomeScreen}
        options={{ title: 'Offer Ride' }}
      />
      <Stack.Screen 
        name="CreateRideOffer" 
        component={CreateRideOfferScreen}
        options={{ title: 'Create Ride Offer' }}
      />
      <Stack.Screen 
        name="SelectLocation" 
        component={SelectLocationScreen}
        options={{ title: 'Select Location' }}
      />
      <Stack.Screen 
        name="AddStops" 
        component={AddStopsScreen}
        options={{ title: 'Add Stops' }}
      />
      <Stack.Screen 
        name="SetSchedule" 
        component={SetScheduleScreen}
        options={{ title: 'Set Schedule' }}
      />
      <Stack.Screen 
        name="SetPricing" 
        component={SetPricingScreen}
        options={{ title: 'Set Pricing' }}
      />
      <Stack.Screen 
        name="ReviewOffer" 
        component={ReviewOfferScreen}
        options={{ title: 'Review Offer' }}
      />
      <Stack.Screen 
        name="MyOffers" 
        component={MyOffersScreen}
        options={{ title: 'My Offers' }}
      />
      <Stack.Screen 
        name="OfferDetails" 
        component={OfferDetailsScreen}
        options={{ title: 'Offer Details' }}
      />
      <Stack.Screen 
        name="CancelRideOffer" 
        component={CancelRideOfferScreen}
        options={{ title: 'Cancel Offer' }}
      />
    </Stack.Navigator>
  );
};

export default OfferRideNavigator;
