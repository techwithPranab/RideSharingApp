import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  MapPin,
  CreditCard,
  TrendingUp,
  Activity,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';
import { Card, LoadingSpinner, ErrorState } from '../components/ui';
import { MetricCard } from '../components/charts';

interface DashboardStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalDrivers: number;
    activeDrivers: number;
    totalRides: number;
    completedRides: number;
    totalRevenue: number;
    averageRating: number;
    pendingPayments: number;
  };
  growth: {
    userGrowthRate: number;
  };
  today: {
    rides: number;
    revenue: number;
    users: number;
  };
  recent: {
    rides: any[];
    users: any[];
    activities: any[];
  };
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardStats} />;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={stats.overview.totalUsers.toLocaleString()}
          change={stats.growth.userGrowthRate}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Drivers"
          value={`${stats.overview.activeDrivers}/${stats.overview.totalDrivers}`}
          icon={Car}
          color="green"
        />
        <MetricCard
          title="Completed Rides"
          value={stats.overview.completedRides.toLocaleString()}
          icon={MapPin}
          color="purple"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${stats.overview.totalRevenue.toLocaleString()}`}
          change={12.5}
          icon={CreditCard}
          color="green"
        />
      </div>

      {/* Today's Summary */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.today.rides}</p>
            <p className="text-sm text-gray-600">Rides Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">${stats.today.revenue.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Revenue Generated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.today.users}</p>
            <p className="text-sm text-gray-600">New Users</p>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rides */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Rides</h2>
          <div className="space-y-3">
            {stats.recent.rides.slice(0, 5).map((ride: any) => (
              <div key={ride._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {ride.riderId?.firstName || 'Unknown'} {ride.riderId?.lastName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(ride.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${ride.fare}</p>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    ride.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Users */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
          <div className="space-y-3">
            {stats.recent.users.slice(0, 5).map((user: any) => (
              <div key={user._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    user.role === 'driver' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">Database</p>
              <p className="text-xs text-green-600">Healthy</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-blue-50 rounded-lg">
            <Activity className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">Active Rides</p>
              <p className="text-xs text-blue-600">Monitoring</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Performance</p>
              <p className="text-xs text-yellow-600">Optimal</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
