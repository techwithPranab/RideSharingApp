import React from 'react';
import { BarChart3, TrendingUp, Activity, Users, DollarSign } from 'lucide-react';
import { Card, StatCard, LoadingSpinner, ErrorState } from '../ui';

interface ChartProps {
  data: any[];
  loading?: boolean;
  error?: string;
  height?: number;
}

export const SimpleBarChart: React.FC<ChartProps> = ({ 
  data, 
  loading = false, 
  error,
  height = 200 
}) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 mt-2">No data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className="space-y-2" style={{ height }}>
      {data.map((item, index) => (
        <div key={item.label || index} className="flex items-center space-x-2">
          <div className="w-16 text-xs text-gray-600 truncate">{item.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
            <div
              className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-2"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            >
              <span className="text-xs text-white font-medium">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SimpleLineChart: React.FC<ChartProps> = ({ 
  data, 
  loading = false, 
  error,
  height = 200 
}) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <p className="text-gray-500 mt-2">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(percent => (
          <line
            key={percent}
            x1="0"
            y1={height * percent}
            x2="100%"
            y2={height * percent}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        {/* Data points and line */}
        {data.length > 1 && (
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={data.map((item, index) => 
              `${(index / (data.length - 1)) * 100}%,${height - (item.value / Math.max(...data.map(d => d.value))) * height}`
            ).join(' ')}
          />
        )}
        
        {/* Data points */}
        {data.map((item, index) => (
          <circle
            key={item.label || index}
            cx={`${(index / (data.length - 1)) * 100}%`}
            cy={height - (item.value / Math.max(...data.map(d => d.value))) * height}
            r="4"
            fill="#3b82f6"
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.map((item, index) => (
          <span key={item.label || index}>{item.label}</span>
        ))}
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  period?: string;
  icon?: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  period = 'vs last period',
  icon: Icon = Activity,
  color = 'blue'
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  
  let changeDisplay: string | undefined;
  if (change !== undefined) {
    const prefix = change > 0 ? '+' : '';
    changeDisplay = `${prefix}${change}% ${period}`;
  } else {
    changeDisplay = undefined;
  }
  
  let changeTypeValue: 'increase' | 'decrease' | 'neutral';
  if (isPositive) {
    changeTypeValue = 'increase';
  } else if (isNegative) {
    changeTypeValue = 'decrease';
  } else {
    changeTypeValue = 'neutral';
  }

  return (
    <StatCard
      title={title}
      value={value}
      change={changeDisplay}
      changeType={changeTypeValue}
      icon={<Icon className="h-6 w-6" />}
      color={color}
    />
  );
};

interface DashboardStatsProps {
  stats: {
    totalUsers?: number;
    activeUsers?: number;
    totalDrivers?: number;
    activeDrivers?: number;
    totalRides?: number;
    completedRides?: number;
    totalRevenue?: number;
    averageRating?: number;
    userGrowth?: number;
    revenueGrowth?: number;
    rideGrowth?: number;
  };
  loading?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Users"
        value={stats.totalUsers?.toLocaleString() || '0'}
        change={stats.userGrowth}
        icon={Users}
        color="blue"
      />
      
      <MetricCard
        title="Active Drivers"
        value={`${stats.activeDrivers || 0}/${stats.totalDrivers || 0}`}
        icon={Users}
        color="green"
      />
      
      <MetricCard
        title="Completed Rides"
        value={stats.completedRides?.toLocaleString() || '0'}
        change={stats.rideGrowth}
        icon={TrendingUp}
        color="purple"
      />
      
      <MetricCard
        title="Total Revenue"
        value={`$${(stats.totalRevenue || 0).toLocaleString()}`}
        change={stats.revenueGrowth}
        icon={DollarSign}
        color="green"
      />
    </div>
  );
};

interface RecentActivityItem {
  id: string;
  type: 'ride' | 'user' | 'payment' | 'driver';
  message: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}

interface RecentActivityProps {
  activities: RecentActivityItem[];
  loading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, loading }) => {
  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const getActivityIcon = (type: string, status?: string) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case 'ride':
        return <TrendingUp className={iconClass} />;
      case 'user':
        return <Users className={iconClass} />;
      case 'payment':
        return <DollarSign className={iconClass} />;
      case 'driver':
        return <Activity className={iconClass} />;
      default:
        return <Activity className={iconClass} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
              {getActivityIcon(activity.type, activity.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
