/**
 * Payment Configuration
 * Mock payments are enabled only in development and staging environments.
 */

import { APP_ENV, isMockEnvironment } from "./appEnvironment";

export const PAYMENT_METHODS = {
  CARD: 'card',
  UPI: 'upi',
  NETBANKING: 'netbanking',
  PAYPAL: 'paypal',
  STRIPE: 'stripe'
};

export const UPI_APPS = {
  GOOGLE_PAY: 'google_pay',
  PHONE_PE: 'phone_pe',
  PAYTM: 'paytm'
};

export const CARD_TYPES = {
  DEBIT: 'debit',
  CREDIT: 'credit'
};

export const isBetaTestingEnabled = () => isMockEnvironment;

export const PAYMENT_CONFIG = {
  environment: APP_ENV,
  isMockEnvironment,
  isBetaTesting: isBetaTestingEnabled(),
  
  // Razorpay Configuration (Primary payment gateway for Indian market)
  razorpay: {
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    enabled: !isMockEnvironment,
    currency: 'INR',
    supportedMethods: ['card', 'upi', 'netbanking', 'wallet']
  },
  
  // Stripe Configuration (Alternative for international payments)
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    enabled: false // Can be enabled for international payments
  },
  
  // PayPal Configuration
  paypal: {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    enabled: false // Can be enabled if needed
  },
  
  // UPI Configuration
  upi: {
    merchantVPA: process.env.NEXT_PUBLIC_UPI_MERCHANT_VPA || '',
    merchantName: process.env.NEXT_PUBLIC_UPI_MERCHANT_NAME || 'Impression',
    enabled: !isMockEnvironment
  },
  
  // API Endpoint
  apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '',
  
  // Mock Payment Settings (for beta testing)
  mock: {
    enabled: isMockEnvironment,
    simulateDelay: true,
    delayMs: 300,
    successRate: 1.0 // 100% success rate for testing
  }
};

export const SUPPORTED_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'pnb', name: 'Punjab National Bank' },
  { id: 'bob', name: 'Bank of Baroda' },
  { id: 'canara', name: 'Canara Bank' },
  { id: 'union', name: 'Union Bank of India' },
  { id: 'idbi', name: 'IDBI Bank' },
  { id: 'yes', name: 'Yes Bank' },
  { id: 'indusind', name: 'IndusInd Bank' }
];

export default PAYMENT_CONFIG;

