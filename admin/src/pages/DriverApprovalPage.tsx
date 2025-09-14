import React, { useState, useEffect } from 'react';
import {
  User,
  Car,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Phone,
  MapPin,
  Star,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { Card, LoadingSpinner } from '../components/ui';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseExpiry: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    registrationNumber: string;
  };
  documents: {
    license: string;
    registration: string;
    insurance: string;
    profilePhoto: string;
    vehiclePhoto: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submissionDate: string;
  reviewDate?: string;
  reviewedBy?: string;
  notes?: string;
  rating?: number;
  completedRides?: number;
  backgroundCheckStatus: 'pending' | 'cleared' | 'failed';
}

const DriverApprovalPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/drivers/approval?status=${filter === 'all' ? '' : filter}`);
      setDrivers(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load drivers');
      // Mock data for demonstration
      setDrivers([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@email.com',
          phone: '+1-234-567-8901',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          dateOfBirth: '1990-05-15',
          licenseNumber: 'D1234567',
          licenseExpiry: '2026-05-15',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            color: 'Black',
            plateNumber: 'ABC-123',
            registrationNumber: 'REG123456'
          },
          documents: {
            license: '/uploads/license_1.jpg',
            registration: '/uploads/registration_1.jpg',
            insurance: '/uploads/insurance_1.jpg',
            profilePhoto: '/uploads/profile_1.jpg',
            vehiclePhoto: '/uploads/vehicle_1.jpg'
          },
          status: 'pending',
          submissionDate: '2025-01-10T09:30:00Z',
          backgroundCheckStatus: 'pending'
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+1-234-567-8902',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          dateOfBirth: '1985-08-22',
          licenseNumber: 'D9876543',
          licenseExpiry: '2025-12-30',
          vehicleInfo: {
            make: 'Honda',
            model: 'Accord',
            year: 2019,
            color: 'Silver',
            plateNumber: 'XYZ-789',
            registrationNumber: 'REG789123'
          },
          documents: {
            license: '/uploads/license_2.jpg',
            registration: '/uploads/registration_2.jpg',
            insurance: '/uploads/insurance_2.jpg',
            profilePhoto: '/uploads/profile_2.jpg',
            vehiclePhoto: '/uploads/vehicle_2.jpg'
          },
          status: 'approved',
          submissionDate: '2025-01-08T14:15:00Z',
          reviewDate: '2025-01-09T10:20:00Z',
          reviewedBy: 'Admin User',
          rating: 4.8,
          completedRides: 45,
          backgroundCheckStatus: 'cleared'
        },
        {
          id: '3',
          firstName: 'Mike',
          lastName: 'Wilson',
          email: 'mike.wilson@email.com',
          phone: '+1-234-567-8903',
          address: '789 Pine Rd',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          dateOfBirth: '1992-12-03',
          licenseNumber: 'D5555555',
          licenseExpiry: '2024-03-10',
          vehicleInfo: {
            make: 'Ford',
            model: 'Fusion',
            year: 2018,
            color: 'Blue',
            plateNumber: 'DEF-456',
            registrationNumber: 'REG456789'
          },
          documents: {
            license: '/uploads/license_3.jpg',
            registration: '/uploads/registration_3.jpg',
            insurance: '/uploads/insurance_3.jpg',
            profilePhoto: '/uploads/profile_3.jpg',
            vehiclePhoto: '/uploads/vehicle_3.jpg'
          },
          status: 'rejected',
          submissionDate: '2025-01-05T11:45:00Z',
          reviewDate: '2025-01-06T16:30:00Z',
          reviewedBy: 'Admin User',
          notes: 'Expired license. Please resubmit with valid license.',
          backgroundCheckStatus: 'failed'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (driverId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      setProcessing(driverId);
      await api.put(`/admin/drivers/${driverId}/approval`, {
        action,
        notes
      });
      
      setDrivers(drivers.map(driver => 
        driver.id === driverId 
          ? { 
              ...driver, 
              status: action === 'approve' ? 'approved' : 'rejected',
              reviewDate: new Date().toISOString(),
              reviewedBy: 'Current Admin',
              notes
            }
          : driver
      ));
      
      if (selectedDriver?.id === driverId) {
        setSelectedDriver(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} driver`);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBackgroundCheckColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cleared': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Approval</h1>
          <p className="text-gray-600">Review and approve driver applications</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'pending', label: 'Pending', count: drivers.filter(d => d.status === 'pending').length },
            { key: 'approved', label: 'Approved', count: drivers.filter(d => d.status === 'approved').length },
            { key: 'rejected', label: 'Rejected', count: drivers.filter(d => d.status === 'rejected').length },
            { key: 'all', label: 'All', count: drivers.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{driver.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                  {driver.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{driver.city}, {driver.state}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Car className="h-4 w-4" />
                  <span>{driver.vehicleInfo.year} {driver.vehicleInfo.make} {driver.vehicleInfo.model}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-gray-500">
                  Applied: {new Date(driver.submissionDate).toLocaleDateString()}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBackgroundCheckColor(driver.backgroundCheckStatus)}`}>
                  {driver.backgroundCheckStatus}
                </span>
              </div>

              {driver.status === 'approved' && driver.rating && (
                <div className="flex items-center space-x-1 mb-4">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{driver.rating}</span>
                  <span className="text-sm text-gray-500">
                    ({driver.completedRides} rides)
                  </span>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedDriver(driver)}
                  className="flex-1 flex items-center justify-center space-x-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>Review</span>
                </button>
                
                {driver.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApproval(driver.id, 'approve')}
                      disabled={processing === driver.id}
                      className="flex items-center space-x-1 text-sm bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApproval(driver.id, 'reject', 'Needs further review')}
                      disabled={processing === driver.id}
                      className="flex items-center space-x-1 text-sm bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {drivers.length === 0 && (
        <Card className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
          <p className="text-gray-600">No driver applications match the current filter.</p>
        </Card>
      )}

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Driver Application Details
              </h2>
              <button
                onClick={() => setSelectedDriver(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Full Name</div>
                    <p className="text-gray-900">{selectedDriver.firstName} {selectedDriver.lastName}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Email</div>
                    <p className="text-gray-900">{selectedDriver.email}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Phone</div>
                    <p className="text-gray-900">{selectedDriver.phone}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Date of Birth</div>
                    <p className="text-gray-900">{new Date(selectedDriver.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Address</div>
                    <p className="text-gray-900">
                      {selectedDriver.address}, {selectedDriver.city}, {selectedDriver.state} {selectedDriver.zipCode}
                    </p>
                  </div>
                </div>
              </Card>

              {/* License Information */}
              <Card>
                <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">License Number</div>
                    <p className="text-gray-900">{selectedDriver.licenseNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Expiry Date</div>
                    <p className="text-gray-900">{new Date(selectedDriver.licenseExpiry).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Background Check</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBackgroundCheckColor(selectedDriver.backgroundCheckStatus)}`}>
                      {selectedDriver.backgroundCheckStatus}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Make & Model</div>
                    <p className="text-gray-900">
                      {selectedDriver.vehicleInfo.year} {selectedDriver.vehicleInfo.make} {selectedDriver.vehicleInfo.model}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Color</div>
                    <p className="text-gray-900">{selectedDriver.vehicleInfo.color}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Plate Number</div>
                    <p className="text-gray-900">{selectedDriver.vehicleInfo.plateNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Registration</div>
                    <p className="text-gray-900">{selectedDriver.vehicleInfo.registrationNumber}</p>
                  </div>
                </div>
              </Card>

              {/* Documents */}
              <Card>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                <div className="space-y-3">
                  {Object.entries(selectedDriver.documents).map(([type, url]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {type.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {selectedDriver.notes && (
              <Card className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Review Notes</h3>
                <p className="text-gray-600">{selectedDriver.notes}</p>
                {selectedDriver.reviewDate && (
                  <p className="text-sm text-gray-500 mt-2">
                    Reviewed on {new Date(selectedDriver.reviewDate).toLocaleDateString()} by {selectedDriver.reviewedBy}
                  </p>
                )}
              </Card>
            )}

            {selectedDriver.status === 'pending' && (
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => handleApproval(selectedDriver.id, 'reject', 'Needs further review')}
                  disabled={processing === selectedDriver.id}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApproval(selectedDriver.id, 'approve')}
                  disabled={processing === selectedDriver.id}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverApprovalPage;
