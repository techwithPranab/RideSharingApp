/**
 * PaymentScreen
 * Screen for handling payment processing with Stripe integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import api from '../../services/api';

interface RouteParams {
  bookingId: string;
  amount: number;
  description: string;
}

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId, amount, description } = route.params as RouteParams;

  const [isLoading, setIsLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [showWebView, setShowWebView] = useState(false);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/payments/create-stripe-intent', {
        bookingId
      });

      if (response.data.success) {
        setPaymentIntent(response.data.data);
      } else {
        Alert.alert('Error', response.data.error?.message || 'Failed to create payment intent');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Error', 'Failed to initialize payment. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Verify payment on backend
      const response = await api.post('/payments/verify-stripe', {
        paymentIntentId
      });

      if (response.data.success) {
        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to booking details or ride tracking
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Payment Verification Failed', 'Please contact support if amount was debited.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      Alert.alert('Payment Verification Failed', 'Please contact support if amount was debited.');
    }
  };

  const handlePaymentFailure = () => {
    Alert.alert(
      'Payment Failed',
      'Payment was not successful. Please try again.',
      [
        {
          text: 'Try Again',
          onPress: () => {
            createPaymentIntent();
          }
        },
        { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' }
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showWebView && paymentIntent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowWebView(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <WebView
          source={{
            uri: 'https://js.stripe.com/v3/',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <script src="https://js.stripe.com/v3/"></script>
                </head>
                <body>
                  <div id="payment-form"></div>
                  <script>
                    const stripe = Stripe('${process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}');
                    const elements = stripe.elements();
                    const cardElement = elements.create('card');
                    cardElement.mount('#payment-form');

                    const form = document.createElement('form');
                    form.innerHTML = \`
                      <div id="card-element"></div>
                      <button id="submit">Pay ${formatCurrency(amount)}</button>
                    \`;
                    document.getElementById('payment-form').appendChild(form);

                    const submitButton = document.getElementById('submit');
                    submitButton.addEventListener('click', async (e) => {
                      e.preventDefault();
                      const { error, paymentIntent } = await stripe.confirmCardPayment(
                        '${paymentIntent.clientSecret}',
                        {
                          payment_method: {
                            card: cardElement,
                          }
                        }
                      );

                      if (error) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'payment_error',
                          error: error.message
                        }));
                      } else {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'payment_success',
                          paymentIntentId: paymentIntent.id
                        }));
                      }
                    });
                  </script>
                </body>
              </html>
            `
          }}
          onMessage={(event: any) => {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'payment_success') {
              handlePaymentSuccess(data.paymentIntentId);
            } else if (data.type === 'payment_error') {
              handlePaymentFailure();
            }
          }}
          style={styles.webView}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Payment Details */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{formatCurrency(amount)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{description}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{bookingId}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={styles.paymentMethod}
            onPress={() => setShowWebView(true)}
          >
            <View style={styles.paymentMethodContent}>
              <Ionicons name="card" size={24} color="#007AFF" />
              <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodName}>Credit/Debit Card</Text>
                <Text style={styles.paymentMethodDescription}>Secure payment with Stripe</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* Pay Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => setShowWebView(true)}
            disabled={!paymentIntent}
          >
            <Text style={styles.payButtonText}>
              Pay {formatCurrency(amount)}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  paymentCard: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  paymentMethodDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  webView: {
    flex: 1,
  },
});

export default PaymentScreen;
