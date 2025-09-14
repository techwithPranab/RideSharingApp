import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Shield,
  CreditCard,
  MapPin,
  Car,
  Save,
  AlertCircle,
  Check,
  Globe,
  Database,
  Activity
} from 'lucide-react';
import api from '../services/api';
import { Card, LoadingSpinner, ErrorState } from '../components/ui';

interface SystemSettings {
  app: {
    name: string;
    version: string;
    description: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    supportEmail: string;
    supportPhone: string;
  };
  pricing: {
    baseFare: number;
    perKmRate: number;
    perMinuteRate: number;
    bookingFee: number;
    cancellationFee: number;
    adminCommission: number;
    currency: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    rideUpdates: boolean;
    promotionalMessages: boolean;
    driverNotifications: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
  };
  features: {
    rideScheduling: boolean;
    rideSharing: boolean;
    multipleStops: boolean;
    cashPayments: boolean;
    cardPayments: boolean;
    walletPayments: boolean;
    ratings: boolean;
    driverTracking: boolean;
  };
  geolocation: {
    defaultLatitude: number;
    defaultLongitude: number;
    searchRadius: number;
    maxPickupDistance: number;
    defaultCountry: string;
    defaultCity: string;
  };
  payment: {
    stripeEnabled: boolean;
    razorpayEnabled: boolean;
    paypalEnabled: boolean;
    stripePublishableKey: string;
    razorpayKeyId: string;
    paypalClientId: string;
    testMode: boolean;
  };
  api: {
    rateLimitEnabled: boolean;
    maxRequestsPerMinute: number;
    apiVersion: string;
    corsEnabled: boolean;
    allowedOrigins: string[];
  };
  backup: {
    autoBackupEnabled: boolean;
    backupFrequency: string;
    retentionDays: number;
    lastBackupDate: string;
    backupLocation: string;
  };
  monitoring: {
    errorLoggingEnabled: boolean;
    performanceMonitoring: boolean;
    userActivityTracking: boolean;
    logRetentionDays: number;
    alertEmail: string;
  };
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('app');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      // The backend returns { success, message, data } where data is the settings object
      setSettings(response.data.data.data);
      console.log(response.data);
    } catch (err: any) {
      console.log(err);
        setError(err.response?.data?.message || 'Failed to load settings');
      // Mock data for demonstration
      setSettings({
        app: {
          name: 'RideShare Pro',
          version: '1.0.0',
          description: 'Professional ride-sharing platform',
          maintenanceMode: false,
          registrationEnabled: true,
          supportEmail: 'support@rideshare.com',
          supportPhone: '+1-234-567-8900'
        },
        pricing: {
          baseFare: 5.0,
          perKmRate: 1.5,
          perMinuteRate: 0.25,
          bookingFee: 2.0,
          cancellationFee: 3.0,
          adminCommission: 15.0,
          currency: 'USD'
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          rideUpdates: true,
          promotionalMessages: false,
          driverNotifications: true
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordMinLength: 8,
          maxLoginAttempts: 5,
          requireEmailVerification: true
        },
        features: {
          rideScheduling: true,
          rideSharing: true,
          multipleStops: true,
          cashPayments: true,
          cardPayments: true,
          walletPayments: true,
          ratings: true,
          driverTracking: true
        },
        geolocation: {
          defaultLatitude: 12.9716,
          defaultLongitude: 77.5946,
          searchRadius: 5,
          maxPickupDistance: 2,
          defaultCountry: 'India',
          defaultCity: 'Bangalore'
        },
        payment: {
          stripeEnabled: true,
          razorpayEnabled: false,
          paypalEnabled: true,
          stripePublishableKey: 'pk_test_...',
          razorpayKeyId: '',
          paypalClientId: 'client_id_...',
          testMode: true
        },
        api: {
          rateLimitEnabled: true,
          maxRequestsPerMinute: 100,
          apiVersion: 'v1',
          corsEnabled: true,
          allowedOrigins: ['http://localhost:3000', 'https://yourapp.com']
        },
        backup: {
          autoBackupEnabled: true,
          backupFrequency: 'daily',
          retentionDays: 30,
          lastBackupDate: '2025-01-13T10:00:00Z',
          backupLocation: '/backups/database'
        },
        monitoring: {
          errorLoggingEnabled: true,
          performanceMonitoring: true,
          userActivityTracking: true,
          logRetentionDays: 90,
          alertEmail: 'admin@rideshare.com'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) {
      setError('No settings to save');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      await api.put('/admin/settings', { settings });
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    });
  };

  const tabs = [
    { id: 'app', label: 'Application', icon: Settings },
    { id: 'pricing', label: 'Pricing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'features', label: 'Features', icon: Car },
    { id: 'geolocation', label: 'Location', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'api', label: 'API', icon: Globe },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'monitoring', label: 'Monitoring', icon: Activity }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !settings) {
    return <ErrorState message={error} onRetry={fetchSettings} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your ride-sharing platform</p>
        </div>
        
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium"
        >
          {saving ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <Check className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {error && !settings && (
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {settings && (
            <>
              {/* Application Settings */}
              {activeTab === 'app' && settings.app && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Application Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="app-name" className="block text-sm font-medium text-gray-700 mb-2">
                        App Name
                      </label>
                      <input
                        id="app-name"
                        type="text"
                        value={settings.app.name || ''}
                        onChange={(e) => updateSettings('app', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="app-version" className="block text-sm font-medium text-gray-700 mb-2">
                        Version
                      </label>
                      <input
                        id="app-version"
                        type="text"
                        value={settings.app.version || ''}
                        onChange={(e) => updateSettings('app', 'version', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="app-description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="app-description"
                        value={settings.app.description || ''}
                        onChange={(e) => updateSettings('app', 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="support-email" className="block text-sm font-medium text-gray-700 mb-2">
                        Support Email
                      </label>
                      <input
                        id="support-email"
                        type="email"
                        value={settings.app.supportEmail || ''}
                        onChange={(e) => updateSettings('app', 'supportEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="support-phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Support Phone
                      </label>
                      <input
                        id="support-phone"
                        type="tel"
                        value={settings.app.supportPhone || ''}
                        onChange={(e) => updateSettings('app', 'supportPhone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                        <p className="text-sm text-gray-500">Temporarily disable the app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle maintenance mode">
                        <input
                          type="checkbox"
                          checked={settings.app.maintenanceMode || false}
                          onChange={(e) => updateSettings('app', 'maintenanceMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">User Registration</h4>
                        <p className="text-sm text-gray-500">Allow new users to register</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle user registration">
                        <input
                          type="checkbox"
                          checked={settings.app.registrationEnabled || false}
                          onChange={(e) => updateSettings('app', 'registrationEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              )}

              {/* Pricing Settings */}
              {activeTab === 'pricing' && settings.pricing && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Pricing Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="base-fare" className="block text-sm font-medium text-gray-700 mb-2">
                        Base Fare ($)
                      </label>
                      <input
                        id="base-fare"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.pricing.baseFare || 0}
                        onChange={(e) => updateSettings('pricing', 'baseFare', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="per-km-rate" className="block text-sm font-medium text-gray-700 mb-2">
                        Per Kilometer Rate ($)
                      </label>
                      <input
                        id="per-km-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.pricing.perKmRate || 0}
                        onChange={(e) => updateSettings('pricing', 'perKmRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="per-minute-rate" className="block text-sm font-medium text-gray-700 mb-2">
                        Per Minute Rate ($)
                      </label>
                      <input
                        id="per-minute-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.pricing.perMinuteRate || 0}
                        onChange={(e) => updateSettings('pricing', 'perMinuteRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="booking-fee" className="block text-sm font-medium text-gray-700 mb-2">
                        Booking Fee ($)
                      </label>
                      <input
                        id="booking-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.pricing.bookingFee || 0}
                        onChange={(e) => updateSettings('pricing', 'bookingFee', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cancellation-fee" className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Fee ($)
                      </label>
                      <input
                        id="cancellation-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.pricing.cancellationFee || 0}
                        onChange={(e) => updateSettings('pricing', 'cancellationFee', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="admin-commission" className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Commission (%)
                      </label>
                      <input
                        id="admin-commission"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={settings.pricing.adminCommission || 0}
                        onChange={(e) => updateSettings('pricing', 'adminCommission', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        id="currency"
                        value={settings.pricing.currency || 'USD'}
                        onChange={(e) => updateSettings('pricing', 'currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                  </div>
                </Card>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && settings.notifications && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Send notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle email notifications">
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailNotifications || false}
                          onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-500">Send notifications via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle SMS notifications">
                        <input
                          type="checkbox"
                          checked={settings.notifications.smsNotifications || false}
                          onChange={(e) => updateSettings('notifications', 'smsNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                        <p className="text-sm text-gray-500">Send push notifications to mobile apps</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle push notifications">
                        <input
                          type="checkbox"
                          checked={settings.notifications.pushNotifications || false}
                          onChange={(e) => updateSettings('notifications', 'pushNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Ride Updates</h4>
                        <p className="text-sm text-gray-500">Notify users about ride status changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle ride updates">
                        <input
                          type="checkbox"
                          checked={settings.notifications.rideUpdates || false}
                          onChange={(e) => updateSettings('notifications', 'rideUpdates', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Promotional Messages</h4>
                        <p className="text-sm text-gray-500">Send promotional and marketing messages</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle promotional messages">
                        <input
                          type="checkbox"
                          checked={settings.notifications.promotionalMessages || false}
                          onChange={(e) => updateSettings('notifications', 'promotionalMessages', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Driver Notifications</h4>
                        <p className="text-sm text-gray-500">Send notifications to drivers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle driver notifications">
                        <input
                          type="checkbox"
                          checked={settings.notifications.driverNotifications || false}
                          onChange={(e) => updateSettings('notifications', 'driverNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && settings.security && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Security Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        id="session-timeout"
                        type="number"
                        min="5"
                        max="480"
                        value={settings.security.sessionTimeout || 30}
                        onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="password-min-length" className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Password Length
                      </label>
                      <input
                        id="password-min-length"
                        type="number"
                        min="6"
                        max="32"
                        value={settings.security.passwordMinLength || 8}
                        onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value) || 8)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="max-login-attempts" className="block text-sm font-medium text-gray-700 mb-2">
                        Max Login Attempts
                      </label>
                      <input
                        id="max-login-attempts"
                        type="number"
                        min="3"
                        max="20"
                        value={settings.security.maxLoginAttempts || 5}
                        onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle 2FA">
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactorAuth || false}
                          onChange={(e) => updateSettings('security', 'twoFactorAuth', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Verification</h4>
                        <p className="text-sm text-gray-500">Require email verification for new accounts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle email verification">
                        <input
                          type="checkbox"
                          checked={settings.security.requireEmailVerification || false}
                          onChange={(e) => updateSettings('security', 'requireEmailVerification', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              )}

              {/* Features Settings */}
              {activeTab === 'features' && settings.features && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Feature Toggles</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Ride Scheduling</h4>
                        <p className="text-sm text-gray-500">Allow users to schedule rides in advance</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle ride scheduling">
                        <input
                          type="checkbox"
                          checked={settings.features.rideScheduling || false}
                          onChange={(e) => updateSettings('features', 'rideScheduling', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Ride Sharing</h4>
                        <p className="text-sm text-gray-500">Enable ride pooling for multiple passengers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle ride sharing">
                        <input
                          type="checkbox"
                          checked={settings.features.rideSharing || false}
                          onChange={(e) => updateSettings('features', 'rideSharing', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Multiple Stops</h4>
                        <p className="text-sm text-gray-500">Allow rides with multiple pickup/dropoff points</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle multiple stops">
                        <input
                          type="checkbox"
                          checked={settings.features.multipleStops || false}
                          onChange={(e) => updateSettings('features', 'multipleStops', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Cash Payments</h4>
                        <p className="text-sm text-gray-500">Allow cash payments for rides</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle cash payments">
                        <input
                          type="checkbox"
                          checked={settings.features.cashPayments || false}
                          onChange={(e) => updateSettings('features', 'cashPayments', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Card Payments</h4>
                        <p className="text-sm text-gray-500">Allow credit/debit card payments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle card payments">
                        <input
                          type="checkbox"
                          checked={settings.features.cardPayments || false}
                          onChange={(e) => updateSettings('features', 'cardPayments', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Wallet Payments</h4>
                        <p className="text-sm text-gray-500">Allow digital wallet payments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle wallet payments">
                        <input
                          type="checkbox"
                          checked={settings.features.walletPayments || false}
                          onChange={(e) => updateSettings('features', 'walletPayments', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Ratings & Reviews</h4>
                        <p className="text-sm text-gray-500">Enable rating system for rides</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle ratings">
                        <input
                          type="checkbox"
                          checked={settings.features.ratings || false}
                          onChange={(e) => updateSettings('features', 'ratings', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Driver Tracking</h4>
                        <p className="text-sm text-gray-500">Enable real-time driver location tracking</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle driver tracking">
                        <input
                          type="checkbox"
                          checked={settings.features.driverTracking || false}
                          onChange={(e) => updateSettings('features', 'driverTracking', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              )}

              {/* Geolocation Settings */}
              {activeTab === 'geolocation' && settings.geolocation && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Location Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="default-latitude" className="block text-sm font-medium text-gray-700 mb-2">
                        Default Latitude
                      </label>
                      <input
                        id="default-latitude"
                        type="number"
                        step="0.000001"
                        value={settings.geolocation.defaultLatitude || 0}
                        onChange={(e) => updateSettings('geolocation', 'defaultLatitude', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="default-longitude" className="block text-sm font-medium text-gray-700 mb-2">
                        Default Longitude
                      </label>
                      <input
                        id="default-longitude"
                        type="number"
                        step="0.000001"
                        value={settings.geolocation.defaultLongitude || 0}
                        onChange={(e) => updateSettings('geolocation', 'defaultLongitude', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="search-radius" className="block text-sm font-medium text-gray-700 mb-2">
                        Search Radius (km)
                      </label>
                      <input
                        id="search-radius"
                        type="number"
                        min="1"
                        max="50"
                        value={settings.geolocation.searchRadius || 5}
                        onChange={(e) => updateSettings('geolocation', 'searchRadius', parseInt(e.target.value) || 5)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="max-pickup-distance" className="block text-sm font-medium text-gray-700 mb-2">
                        Max Pickup Distance (km)
                      </label>
                      <input
                        id="max-pickup-distance"
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={settings.geolocation.maxPickupDistance || 2}
                        onChange={(e) => updateSettings('geolocation', 'maxPickupDistance', parseFloat(e.target.value) || 2)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="default-country" className="block text-sm font-medium text-gray-700 mb-2">
                        Default Country
                      </label>
                      <input
                        id="default-country"
                        type="text"
                        value={settings.geolocation.defaultCountry || ''}
                        onChange={(e) => updateSettings('geolocation', 'defaultCountry', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="default-city" className="block text-sm font-medium text-gray-700 mb-2">
                        Default City
                      </label>
                      <input
                        id="default-city"
                        type="text"
                        value={settings.geolocation.defaultCity || ''}
                        onChange={(e) => updateSettings('geolocation', 'defaultCity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && settings.payment && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Payment Gateway Configuration</h3>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Test Mode</h4>
                        <p className="text-sm text-gray-500">Use sandbox/test environment for payments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle test mode">
                        <input
                          type="checkbox"
                          checked={settings.payment.testMode || false}
                          onChange={(e) => updateSettings('payment', 'testMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Stripe Payments</h4>
                        <p className="text-sm text-gray-500">Enable Stripe payment gateway</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle Stripe">
                        <input
                          type="checkbox"
                          checked={settings.payment.stripeEnabled || false}
                          onChange={(e) => updateSettings('payment', 'stripeEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {settings.payment.stripeEnabled && (
                      <div>
                        <label htmlFor="stripe-key" className="block text-sm font-medium text-gray-700 mb-2">
                          Stripe Publishable Key
                        </label>
                        <input
                          id="stripe-key"
                          type="password"
                          value={settings.payment.stripePublishableKey || ''}
                          onChange={(e) => updateSettings('payment', 'stripePublishableKey', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="pk_test_..."
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Razorpay Payments</h4>
                        <p className="text-sm text-gray-500">Enable Razorpay payment gateway</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle Razorpay">
                        <input
                          type="checkbox"
                          checked={settings.payment.razorpayEnabled || false}
                          onChange={(e) => updateSettings('payment', 'razorpayEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {settings.payment.razorpayEnabled && (
                      <div>
                        <label htmlFor="razorpay-key" className="block text-sm font-medium text-gray-700 mb-2">
                          Razorpay Key ID
                        </label>
                        <input
                          id="razorpay-key"
                          type="text"
                          value={settings.payment.razorpayKeyId || ''}
                          onChange={(e) => updateSettings('payment', 'razorpayKeyId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="rzp_test_..."
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">PayPal Payments</h4>
                        <p className="text-sm text-gray-500">Enable PayPal payment gateway</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle PayPal">
                        <input
                          type="checkbox"
                          checked={settings.payment.paypalEnabled || false}
                          onChange={(e) => updateSettings('payment', 'paypalEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {settings.payment.paypalEnabled && (
                      <div>
                        <label htmlFor="paypal-client-id" className="block text-sm font-medium text-gray-700 mb-2">
                          PayPal Client ID
                        </label>
                        <input
                          id="paypal-client-id"
                          type="text"
                          value={settings.payment.paypalClientId || ''}
                          onChange={(e) => updateSettings('payment', 'paypalClientId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="client_id_..."
                        />
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* API Settings */}
              {activeTab === 'api' && settings.api && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">API Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="api-version" className="block text-sm font-medium text-gray-700 mb-2">
                        API Version
                      </label>
                      <input
                        id="api-version"
                        type="text"
                        value={settings.api.apiVersion || ''}
                        onChange={(e) => updateSettings('api', 'apiVersion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="max-requests" className="block text-sm font-medium text-gray-700 mb-2">
                        Max Requests per Minute
                      </label>
                      <input
                        id="max-requests"
                        type="number"
                        min="10"
                        max="1000"
                        value={settings.api.maxRequestsPerMinute || 100}
                        onChange={(e) => updateSettings('api', 'maxRequestsPerMinute', parseInt(e.target.value) || 100)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="allowed-origins" className="block text-sm font-medium text-gray-700 mb-2">
                        Allowed Origins (comma-separated)
                      </label>
                      <textarea
                        id="allowed-origins"
                        value={settings.api.allowedOrigins ? settings.api.allowedOrigins.join(', ') : ''}
                        onChange={(e) => updateSettings('api', 'allowedOrigins', e.target.value.split(',').map(s => s.trim()))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourapp.com, http://localhost:3000"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Rate Limiting</h4>
                        <p className="text-sm text-gray-500">Enable API rate limiting</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle rate limiting">
                        <input
                          type="checkbox"
                          checked={settings.api.rateLimitEnabled || false}
                          onChange={(e) => updateSettings('api', 'rateLimitEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">CORS Enabled</h4>
                        <p className="text-sm text-gray-500">Enable Cross-Origin Resource Sharing</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle CORS">
                        <input
                          type="checkbox"
                          checked={settings.api.corsEnabled || false}
                          onChange={(e) => updateSettings('api', 'corsEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              )}

              {/* Backup Settings */}
              {activeTab === 'backup' && settings.backup && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Backup & Recovery</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="backup-frequency" className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Frequency
                      </label>
                      <select
                        id="backup-frequency"
                        value={settings.backup.backupFrequency || 'daily'}
                        onChange={(e) => updateSettings('backup', 'backupFrequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="retention-days" className="block text-sm font-medium text-gray-700 mb-2">
                        Retention Period (days)
                      </label>
                      <input
                        id="retention-days"
                        type="number"
                        min="1"
                        max="365"
                        value={settings.backup.retentionDays || 30}
                        onChange={(e) => updateSettings('backup', 'retentionDays', parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="backup-location" className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Location
                      </label>
                      <input
                        id="backup-location"
                        type="text"
                        value={settings.backup.backupLocation || ''}
                        onChange={(e) => updateSettings('backup', 'backupLocation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="/backups/database"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="last-backup" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Backup Date
                      </label>
                      <input
                        id="last-backup"
                        type="datetime-local"
                        value={settings.backup.lastBackupDate ? settings.backup.lastBackupDate.slice(0, 16) : ''}
                        onChange={(e) => updateSettings('backup', 'lastBackupDate', e.target.value + ':00Z')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Automatic Backups</h4>
                        <p className="text-sm text-gray-500">Enable scheduled automatic backups</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle auto backup">
                        <input
                          type="checkbox"
                          checked={settings.backup.autoBackupEnabled || false}
                          onChange={(e) => updateSettings('backup', 'autoBackupEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              )}

              {/* Monitoring Settings */}
              {activeTab === 'monitoring' && settings.monitoring && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Logs & Monitoring</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="log-retention" className="block text-sm font-medium text-gray-700 mb-2">
                        Log Retention (days)
                      </label>
                      <input
                        id="log-retention"
                        type="number"
                        min="7"
                        max="365"
                        value={settings.monitoring.logRetentionDays || 90}
                        onChange={(e) => updateSettings('monitoring', 'logRetentionDays', parseInt(e.target.value) || 90)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="alert-email" className="block text-sm font-medium text-gray-700 mb-2">
                        Alert Email
                      </label>
                      <input
                        id="alert-email"
                        type="email"
                        value={settings.monitoring.alertEmail || ''}
                        onChange={(e) => updateSettings('monitoring', 'alertEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="admin@yourcompany.com"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Error Logging</h4>
                        <p className="text-sm text-gray-500">Log application errors and exceptions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle error logging">
                        <input
                          type="checkbox"
                          checked={settings.monitoring.errorLoggingEnabled || false}
                          onChange={(e) => updateSettings('monitoring', 'errorLoggingEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Performance Monitoring</h4>
                        <p className="text-sm text-gray-500">Monitor application performance metrics</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle performance monitoring">
                        <input
                          type="checkbox"
                          checked={settings.monitoring.performanceMonitoring || false}
                          onChange={(e) => updateSettings('monitoring', 'performanceMonitoring', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">User Activity Tracking</h4>
                        <p className="text-sm text-gray-500">Track user actions and behavior</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle activity tracking">
                        <input
                          type="checkbox"
                          checked={settings.monitoring.userActivityTracking || false}
                          onChange={(e) => updateSettings('monitoring', 'userActivityTracking', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;