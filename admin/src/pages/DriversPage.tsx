import React, { useState, useEffect } from 'react';
import {
  Search,
  UserCheck,
  UserX,
  Eye,
  ChevronLeft,
  ChevronRight,
  Car,
  Star,
  TrendingUp,
  DollarSign,
  X
} from 'lucide-react';
import axios from 'axios';

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  totalRides?: number;
  completedRides?: number;
  cancelledRides?: number;
  totalEarnings?: number;
  rating?: number;
  todayRides?: number;
  weeklyRides?: number;
  monthlyRides?: number;
  completionRate?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
}

const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const driversPerPage = 10;

  useEffect(() => {
    fetchDrivers();
  }, [currentPage, statusFilter]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: driversPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await axios.get(`/api/admin/drivers?${params}`);
      setDrivers(response.data.data.drivers);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDrivers();
  };

  const handleStatusChange = async (driverId: string, action: 'approve' | 'suspend') => {
    try {
      if (action === 'approve') {
        await axios.put(`/api/admin/drivers/${driverId}/approve`);
      } else {
        await axios.put(`/api/admin/drivers/${driverId}/suspend`);
      }
      fetchDrivers(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} driver`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_verification': return 'Pending';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
          <p className="text-gray-600">Manage and monitor driver applications and performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-blue-50 px-3 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {drivers.length} Drivers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search drivers by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rides
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivers.map((driver) => (
                    <tr key={driver._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {driver.firstName[0]}{driver.lastName[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {driver.firstName} {driver.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{driver.email}</div>
                            {driver.phone && (
                              <div className="text-sm text-gray-500">{driver.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                          {getStatusText(driver.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          {driver.rating ? driver.rating.toFixed(1) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{driver.completedRides || 0} completed</div>
                          <div className="text-gray-500 text-xs">{driver.totalRides || 0} total</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          ${driver.totalEarnings ? driver.totalEarnings.toLocaleString() : '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                          {driver.completionRate || '0.0'}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowDriverModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {driver.status === 'pending_verification' && (
                            <button
                              onClick={() => handleStatusChange(driver._id, 'approve')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve Driver"
                            >
                              <UserCheck className="h-5 w-5" />
                            </button>
                          )}
                          {driver.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(driver._id, 'suspend')}
                              className="text-red-600 hover:text-red-900"
                              title="Suspend Driver"
                            >
                              <UserX className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
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
          </>
        )}
      </div>

      {/* Driver Details Modal */}
      {showDriverModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Driver Details</h2>
                <button
                  onClick={() => setShowDriverModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xl font-medium text-gray-700">
                      {selectedDriver.firstName[0]}{selectedDriver.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {selectedDriver.firstName} {selectedDriver.lastName}
                    </h3>
                    <p className="text-gray-600">{selectedDriver.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDriver.status)}`}>
                        {getStatusText(selectedDriver.status)}
                      </span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm">{selectedDriver.rating ? selectedDriver.rating.toFixed(1) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Car className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Total Rides</p>
                        <p className="text-2xl font-bold text-blue-900">{selectedDriver.totalRides || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-green-900">{selectedDriver.completionRate || '0.0'}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-yellow-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-600">Total Earnings</p>
                        <p className="text-2xl font-bold text-yellow-900">${selectedDriver.totalEarnings ? selectedDriver.totalEarnings.toLocaleString() : '0'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className="h-8 w-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Average Rating</p>
                        <p className="text-2xl font-bold text-purple-900">{selectedDriver.rating ? selectedDriver.rating.toFixed(1) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Email:</strong> {selectedDriver.email}</p>
                      <p><strong>Phone:</strong> {selectedDriver.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Account Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Status:</strong> {getStatusText(selectedDriver.status)}</p>
                      <p><strong>Joined:</strong> {new Date(selectedDriver.createdAt).toLocaleDateString()}</p>
                      <p><strong>Last Updated:</strong> {new Date(selectedDriver.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {selectedDriver.vehicleInfo && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Vehicle Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <p><strong>Make:</strong> {selectedDriver.vehicleInfo.make}</p>
                        <p><strong>Model:</strong> {selectedDriver.vehicleInfo.model}</p>
                        <p><strong>Year:</strong> {selectedDriver.vehicleInfo.year}</p>
                        <p><strong>License Plate:</strong> {selectedDriver.vehicleInfo.licensePlate}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Performance */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedDriver.todayRides || 0}</p>
                      <p className="text-xs text-gray-600">Rides Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedDriver.weeklyRides || 0}</p>
                      <p className="text-xs text-gray-600">Rides This Week</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{selectedDriver.monthlyRides || 0}</p>
                      <p className="text-xs text-gray-600">Rides This Month</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
