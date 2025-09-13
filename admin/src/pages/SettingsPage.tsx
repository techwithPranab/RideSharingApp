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
  Check
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
      setSettings(response.data.data);
    } catch (err: any) {
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
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      setError('');
      await api.put('/admin/settings', settings);
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
    { id: 'geolocation', label: 'Location', icon: MapPin }
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
      
      {error && (
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
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
              {activeTab === 'app' && (
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
                        value={settings.app.name}
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
                        value={settings.app.version}
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
                        value={settings.app.description}
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
                        value={settings.app.supportEmail}
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
                        value={settings.app.supportPhone}
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
                          checked={settings.app.maintenanceMode}
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
                          checked={settings.app.registrationEnabled}
                          onChange={(e) => updateSettings('app', 'registrationEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </Card>
              )}

              {/* Other sections */}
              {activeTab !== 'app' && (
                <Card>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    {tabs.find(t => t.id === activeTab)?.label} Settings
                  </h3>
                  <p className="text-gray-600">Configuration for {activeTab} settings coming soon...</p>
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