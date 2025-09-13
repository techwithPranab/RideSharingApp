/**
 * Admin Rides Management Page
 * Provides comprehensive ride monitoring and management interface
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Clock,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import axios from 'axios';

enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  DRIVER_ARRIVED = 'driver_arrived',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface Ride {
  _id: string;
  rideId: string;
  status: RideStatus;
  driverId: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  vehicleId: {
    make: string;
    model: string;
    licensePlate: string;
  };
  passengers: Array<{
    userId: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
    };
    fare: number;
    rating?: number;
  }>;
  pickupLocation: {
    address: string;
  };
  dropoffLocation: {
    address: string;
  };
  totalFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  actualDistance?: number;
  actualDuration?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  passengerCount: number;
  totalPassengerFare: number;
  averageRating?: number;
  timeElapsed?: number;
  estimatedTimeRemaining?: number;
}

interface RideStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  completionRate: string;
  totalRevenue: number;
  averageRideDuration: number;
  averageFare: string;
}

const RidesPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [stats, setStats] = useState<RideStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showRideModal, setShowRideModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RideStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadRides();
    loadActiveRides();
    loadStats();
  }, [currentPage, statusFilter]);

  const loadRides = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await axios.get(`/api/admin/rides?${params}`);
      setRides(response.data.data.rides);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const loadActiveRides = async () => {
    try {
      const response = await axios.get('/api/admin/rides/active');
      setActiveRides(response.data.data.rides);
    } catch (error) {
      console.error('Error loading active rides:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/admin/rides/statistics/overview');
      setStats(response.data.data.overview);
    } catch (error) {
      console.error('Error loading ride statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (rideId: string, newStatus: RideStatus, reason?: string) => {
    try {
      await axios.put(`/api/admin/rides/${rideId}/status`, {
        status: newStatus,
        ...(reason && { cancellationReason: reason })
      });
      loadRides();
      loadActiveRides();
      loadStats();
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  };

  const getStatusColor = (status: RideStatus) => {
    switch (status) {
      case RideStatus.REQUESTED: return 'bg-yellow-100 text-yellow-800';
      case RideStatus.ACCEPTED: return 'bg-blue-100 text-blue-800';
      case RideStatus.DRIVER_ARRIVED: return 'bg-purple-100 text-purple-800';
      case RideStatus.STARTED: return 'bg-green-100 text-green-800';
      case RideStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800';
      case RideStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Ride Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Rides
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active Rides ({activeRides.length})
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Rides</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRides}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.averageRideDuration)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by ride ID or user names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadRides()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RideStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value={RideStatus.REQUESTED}>Requested</option>
              <option value={RideStatus.ACCEPTED}>Accepted</option>
              <option value={RideStatus.DRIVER_ARRIVED}>Driver Arrived</option>
              <option value={RideStatus.STARTED}>Started</option>
              <option value={RideStatus.COMPLETED}>Completed</option>
              <option value={RideStatus.CANCELLED}>Cancelled</option>
            </select>

            <button
              onClick={loadRides}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Rides Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ride Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passengers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'all' ? rides : activeRides).map((ride) => (
                <tr key={ride._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ride.rideId}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(ride.createdAt).toLocaleDateString()}
                      </div>
                      {ride.timeElapsed && (
                        <div className="text-xs text-blue-600">
                          {formatDuration(ride.timeElapsed)} elapsed
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ride.driverId.firstName} {ride.driverId.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{ride.driverId.phoneNumber}</div>
                    <div className="text-xs text-gray-500">
                      {ride.vehicleId.make} {ride.vehicleId.model}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ride.passengerCount} passenger{ride.passengerCount !== 1 ? 's' : ''}
                    </div>
                    {ride.averageRating && (
                      <div className="text-sm text-gray-500">
                        ⭐ {ride.averageRating.toFixed(1)}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        {ride.pickupLocation.address}
                      </div>
                      <div className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        {ride.dropoffLocation.address}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ride.status)}`}>
                      {ride.status.replace('_', ' ')}
                    </span>
                    {ride.estimatedTimeRemaining && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDuration(ride.estimatedTimeRemaining)} remaining
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(ride.totalFare)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedRide(ride);
                        setShowRideModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="h-5 w-5" />
                    </button>

                    {ride.status !== RideStatus.COMPLETED && ride.status !== RideStatus.CANCELLED && (
                      <button
                        onClick={() => handleStatusUpdate(ride._id, RideStatus.CANCELLED, 'Cancelled by admin')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <AlertCircle className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {activeTab === 'all' && totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ride Detail Modal */}
      {showRideModal && selectedRide && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Ride Details - {selectedRide.rideId}
                </h3>
                <button
                  onClick={() => setShowRideModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Status</div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRide.status)}`}>
                      {selectedRide.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Total Fare</div>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedRide.totalFare)}
                    </span>
                  </div>
                </div>

                {/* Driver Info */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Driver</div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">{selectedRide.driverId.firstName} {selectedRide.driverId.lastName}</div>
                    <div className="text-sm text-gray-600">{selectedRide.driverId.phoneNumber}</div>
                    <div className="text-sm text-gray-600">
                      {selectedRide.vehicleId.make} {selectedRide.vehicleId.model} - {selectedRide.vehicleId.licensePlate}
                    </div>
                  </div>
                </div>

                {/* Passengers */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Passengers</div>
                  <div className="space-y-2">
                    {selectedRide.passengers.map((passenger, index) => (
                      <div key={`${selectedRide._id}-passenger-${index}`} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">
                          {passenger.userId.firstName} {passenger.userId.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{passenger.userId.phoneNumber}</div>
                        <div className="text-sm text-gray-600">
                          Fare: {formatCurrency(passenger.fare)}
                          {passenger.rating && ` • Rating: ⭐ ${passenger.rating}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Route */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Route</div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                      <div>
                        <div className="text-sm font-medium">Pickup</div>
                        <div className="text-sm text-gray-600">{selectedRide.pickupLocation.address}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                      <div>
                        <div className="text-sm font-medium">Dropoff</div>
                        <div className="text-sm text-gray-600">{selectedRide.dropoffLocation.address}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ride Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Distance</div>
                    <span className="text-sm text-gray-900">
                      {(selectedRide.actualDistance || selectedRide.estimatedDistance).toFixed(1)} km
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Duration</div>
                    <span className="text-sm text-gray-900">
                      {formatDuration(selectedRide.actualDuration || selectedRide.estimatedDuration)}
                    </span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Created</div>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedRide.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedRide.startedAt && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Started</div>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedRide.startedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedRide.completedAt && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Completed</div>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedRide.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setShowRideModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
                {selectedRide.status !== RideStatus.COMPLETED && selectedRide.status !== RideStatus.CANCELLED && (
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRide._id, RideStatus.CANCELLED, 'Cancelled by admin');
                      setShowRideModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cancel Ride
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidesPage;
