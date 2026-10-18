import { initStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

import { STRIPE_PUBLISHABLE_KEY } from '@/config/runtime';
import { confirmStripePayment } from './payment-sheet-core';

export async function confirmProviderPayment(clientSecret: string, publishableKey = STRIPE_PUBLISHABLE_KEY) {
  return confirmStripePayment(clientSecret, publishableKey, {
    scheme: Constants.appOwnership === 'expo' ? Linking.createURL('/--/') : Linking.createURL(''),
    returnUrl: Linking.createURL('stripe-redirect'),
  }, { initStripe, initPaymentSheet, presentPaymentSheet });
}
