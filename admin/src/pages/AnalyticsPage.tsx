import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  Activity,
  MapPin,
  Clock,
  Star
} from 'lucide-react';
import api from '../services/api';
import { Card, LoadingSpinner, ErrorState, Badge } from '../components/ui';
import { SimpleBarChart, SimpleLineChart, MetricCard } from '../components/charts';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalDrivers: number;
    activeDrivers: number;
    totalRides: number;
    completedRides: number;
    totalRevenue: number;
    averageRating: number;
    growthMetrics: {
      userGrowth: number;
      rideGrowth: number;
      revenueGrowth: number;
    };
  };
  charts: {
    revenueByMonth: Array<{ month: string; revenue: number }>;
    ridesByHour: Array<{ hour: string; rides: number }>;
    usersByCity: Array<{ city: string; users: number }>;
    driverStatus: Array<{ status: string; count: number }>;
    paymentMethods: Array<{ method: string; amount: number; percentage: number }>;
  };
  topPerformers: {
    drivers: Array<{
      id: string;
      name: string;
      rating: number;
      rides: number;
      earnings: number;
    }>;
    cities: Array<{
      name: string;
      rides: number;
      revenue: number;
      growth: number;
    }>;
  };
}

const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics?range=${timeRange}`);
      setData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics data');
      // Mock data for demonstration
      setData({
        overview: {
          totalUsers: 15420,
          activeUsers: 8934,
          totalDrivers: 2156,
          activeDrivers: 1543,
          totalRides: 45678,
          completedRides: 43211,
          totalRevenue: 234567,
          averageRating: 4.6,
          growthMetrics: {
            userGrowth: 12.5,
            rideGrowth: 8.3,
            revenueGrowth: 15.7
          }
        },
        charts: {
          revenueByMonth: [
            { month: 'Jan', revenue: 18500 },
            { month: 'Feb', revenue: 22300 },
            { month: 'Mar', revenue: 19800 },
            { month: 'Apr', revenue: 25600 },
            { month: 'May', revenue: 28900 },
            { month: 'Jun', revenue: 31200 }
          ],
          ridesByHour: [
            { hour: '6AM', rides: 245 },
            { hour: '8AM', rides: 567 },
            { hour: '10AM', rides: 432 },
            { hour: '12PM', rides: 678 },
            { hour: '2PM', rides: 543 },
            { hour: '4PM', rides: 789 },
            { hour: '6PM', rides: 891 },
            { hour: '8PM', rides: 634 },
            { hour: '10PM', rides: 423 }
          ],
          usersByCity: [
            { city: 'Bangalore', users: 4567 },
            { city: 'Delhi', users: 3890 },
            { city: 'Mumbai', users: 3245 },
            { city: 'Hyderabad', users: 2134 },
            { city: 'Chennai', users: 1584 }
          ],
          driverStatus: [
            { status: 'Active', count: 1543 },
            { status: 'Offline', count: 432 },
            { status: 'Busy', count: 181 }
          ],
          paymentMethods: [
            { method: 'UPI', amount: 125600, percentage: 53.6 },
            { method: 'Card', amount: 78900, percentage: 33.7 },
            { method: 'Cash', amount: 29067, percentage: 12.4 },
            { method: 'Wallet', amount: 1000, percentage: 0.3 }
          ]
        },
        topPerformers: {
          drivers: [
            { id: '1', name: 'Rajesh Kumar', rating: 4.9, rides: 156, earnings: 12450 },
            { id: '2', name: 'Priya Sharma', rating: 4.8, rides: 203, earnings: 15670 },
            { id: '3', name: 'Arun Patel', rating: 4.7, rides: 134, earnings: 10890 },
            { id: '4', name: 'Meera Singh', rating: 4.6, rides: 178, earnings: 13250 },
            { id: '5', name: 'Vikas Gupta', rating: 4.5, rides: 145, earnings: 11200 }
          ],
          cities: [
            { name: 'Bangalore', rides: 12450, revenue: 89500, growth: 15.3 },
            { name: 'Delhi', rides: 10890, revenue: 76200, growth: 12.7 },
            { name: 'Mumbai', rides: 9870, revenue: 69800, growth: 8.9 },
            { name: 'Hyderabad', rides: 7650, revenue: 54300, growth: 18.5 },
            { name: 'Chennai', rides: 5430, revenue: 38900, growth: 22.1 }
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={fetchAnalytics} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex space-x-2">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Users"
            value={data.overview.totalUsers.toLocaleString()}
            change={data.overview.growthMetrics.userGrowth}
            icon={Users}
            color="blue"
          />
          
          <MetricCard
            title="Active Drivers"
            value={`${data.overview.activeDrivers}/${data.overview.totalDrivers}`}
            icon={Car}
            color="green"
          />
          
          <MetricCard
            title="Completed Rides"
            value={data.overview.completedRides.toLocaleString()}
            change={data.overview.growthMetrics.rideGrowth}
            icon={TrendingUp}
            color="purple"
          />
          
          <MetricCard
            title="Total Revenue"
            value={`$${data.overview.totalRevenue.toLocaleString()}`}
            change={data.overview.growthMetrics.revenueGrowth}
            icon={DollarSign}
            color="green"
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Trend</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          {data && (
            <SimpleLineChart 
              data={data.charts.revenueByMonth.map(item => ({ 
                label: item.month, 
                value: item.revenue 
              }))}
              height={250}
            />
          )}
        </Card>

        {/* Rides by Hour */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Rides by Hour</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          {data && (
            <SimpleBarChart 
              data={data.charts.ridesByHour.map(item => ({ 
                label: item.hour, 
                value: item.rides 
              }))}
              height={250}
            />
          )}
        </Card>

        {/* Users by City */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Users by City</h3>
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          {data && (
            <SimpleBarChart 
              data={data.charts.usersByCity.map(item => ({ 
                label: item.city, 
                value: item.users 
              }))}
              height={250}
            />
          )}
        </Card>

        {/* Payment Methods */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          {data && (
            <div className="space-y-4">
              {data.charts.paymentMethods.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" 
                         style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}></div>
                    <span className="text-sm font-medium text-gray-900">{method.method}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      ${method.amount.toLocaleString()}
                    </span>
                    <Badge variant="info" size="sm">
                      {method.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Drivers</h3>
          {data && (
            <div className="space-y-4">
              {data.topPerformers.drivers.map((driver, index) => (
                <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        <span>{driver.rating}</span>
                        <span>•</span>
                        <span>{driver.rides} rides</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${driver.earnings.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">earnings</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Cities */}
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Cities</h3>
          {data && (
            <div className="space-y-4">
              {data.topPerformers.cities.map((city, index) => (
                <div key={city.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{city.name}</p>
                      <p className="text-xs text-gray-500">{city.rides.toLocaleString()} rides</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${city.revenue.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">+{city.growth}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Driver Status Distribution */}
      {data && (
        <Card>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Status Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.charts.driverStatus.map((status, index) => {
              const colors = ['bg-green-500', 'bg-gray-500', 'bg-yellow-500'];
              const textColors = ['text-green-600', 'text-gray-600', 'text-yellow-600'];
              return (
                <div key={status.status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`w-12 h-12 ${colors[index]} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{status.count.toLocaleString()}</p>
                  <p className={`text-sm font-medium ${textColors[index]}`}>{status.status}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsPage;
