/**
 * Admin Payments Management Page
 * Provides comprehensive payment monitoring and management interface
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import axios from 'axios';

enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  WALLET = 'wallet',
  NET_BANKING = 'net_banking'
}

interface Payment {
  _id: string;
  paymentId: string;
  type: string;
  status: PaymentStatus;
  payerId: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  rideId: {
    rideId: string;
    status: string;
    totalFare: number;
  };
  amount: number;
  currency: string;
  method: PaymentMethod;
  gatewayTransactionId?: string;
  initiatedAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  description?: string;
  failureReason?: string;
}

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  successRate: string;
  totalRevenue: number;
  averagePayment: string;
  refundRate: string;
}

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [currentPage, statusFilter, methodFilter]);

  const loadPayments = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(methodFilter !== 'all' && { method: methodFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await axios.get(`/api/admin/payments?${params}`);
      setPayments(response.data.data.payments);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/admin/payments/statistics/overview');
      setStats(response.data.data.overview);
    } catch (error) {
      console.error('Error loading payment statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (paymentId: string) => {
    try {
      const amount = refundAmount ? parseFloat(refundAmount) : undefined;
      await axios.put(`/api/admin/payments/${paymentId}/refund`, {
        amount,
        reason: refundReason
      });
      loadPayments();
      loadStats();
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const handleRetryPayment = async (paymentId: string) => {
    try {
      await axios.put(`/api/admin/payments/${paymentId}/retry`);
      loadPayments();
      loadStats();
    } catch (error) {
      console.error('Error retrying payment:', error);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.PROCESSING: return 'bg-blue-100 text-blue-800';
      case PaymentStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case PaymentStatus.FAILED: return 'bg-red-100 text-red-800';
      case PaymentStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      case PaymentStatus.REFUNDED: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CARD: return <CreditCard className="h-4 w-4" />;
      case PaymentMethod.UPI: return <DollarSign className="h-4 w-4" />;
      case PaymentMethod.WALLET: return <DollarSign className="h-4 w-4" />;
      case PaymentMethod.NET_BANKING: return <DollarSign className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <button
          onClick={() => {
            loadPayments();
            loadStats();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Refresh
        </button>
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
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failedPayments}</p>
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
                placeholder="Search by payment ID, ride ID, or user details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPayments()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value={PaymentStatus.PENDING}>Pending</option>
              <option value={PaymentStatus.PROCESSING}>Processing</option>
              <option value={PaymentStatus.COMPLETED}>Completed</option>
              <option value={PaymentStatus.FAILED}>Failed</option>
              <option value={PaymentStatus.CANCELLED}>Cancelled</option>
              <option value={PaymentStatus.REFUNDED}>Refunded</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value={PaymentMethod.CARD}>Card</option>
              <option value={PaymentMethod.UPI}>UPI</option>
              <option value={PaymentMethod.WALLET}>Wallet</option>
              <option value={PaymentMethod.NET_BANKING}>Net Banking</option>
              <option value={PaymentMethod.CASH}>Cash</option>
            </select>

            <button
              onClick={loadPayments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ride
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.paymentId}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(payment.initiatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">{payment.type}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.payerId.firstName} {payment.payerId.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{payment.payerId.email}</div>
                    <div className="text-xs text-gray-500">{payment.payerId.phoneNumber}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.rideId?.rideId || 'N/A'}</div>
                    <div className="text-sm text-gray-500">
                      {payment.rideId ? formatCurrency(payment.rideId.totalFare) : ''}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getMethodIcon(payment.method)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {payment.method.replace('_', ' ')}
                      </span>
                    </div>
                    {payment.gatewayTransactionId && (
                      <div className="text-xs text-gray-500 mt-1">
                        {payment.gatewayTransactionId}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                    {payment.failureReason && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                        {payment.failureReason}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowPaymentModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="h-5 w-5" />
                    </button>

                    {payment.status === PaymentStatus.COMPLETED && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRefundModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-900 mr-3"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                    )}

                    {payment.status === PaymentStatus.FAILED && (
                      <button
                        onClick={() => handleRetryPayment(payment._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </button>
                    )}
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

      {/* Payment Detail Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Payment Details - {selectedPayment.paymentId}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Amount</div>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedPayment.amount)}
                    </span>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Payment Method</div>
                    <div className="flex items-center mt-1">
                      {getMethodIcon(selectedPayment.method)}
                      <span className="ml-2 capitalize">
                        {selectedPayment.method.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Type</div>
                    <span className="text-sm text-gray-900 capitalize">
                      {selectedPayment.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Customer</div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium">
                      {selectedPayment.payerId.firstName} {selectedPayment.payerId.lastName}
                    </div>
                    <div className="text-sm text-gray-600">{selectedPayment.payerId.email}</div>
                    <div className="text-sm text-gray-600">{selectedPayment.payerId.phoneNumber}</div>
                  </div>
                </div>

                {/* Ride Info */}
                {selectedPayment.rideId && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Related Ride</div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">Ride ID: {selectedPayment.rideId.rideId}</div>
                      <div className="text-sm text-gray-600">
                        Total Fare: {formatCurrency(selectedPayment.rideId.totalFare)}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        Status: {selectedPayment.rideId.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gateway Info */}
                {selectedPayment.gatewayTransactionId && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Gateway Information</div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium">Transaction ID:</span> {selectedPayment.gatewayTransactionId}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Initiated</div>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedPayment.initiatedAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedPayment.processedAt && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Processed</div>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedPayment.processedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedPayment.completedAt && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Completed</div>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedPayment.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedPayment.failedAt && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Failed</div>
                      <span className="text-sm text-gray-900">
                        {new Date(selectedPayment.failedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Failure Reason */}
                {selectedPayment.failureReason && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Failure Reason</div>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="text-sm text-red-800">{selectedPayment.failureReason}</div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedPayment.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-900">{selectedPayment.description}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
                {selectedPayment.status === PaymentStatus.COMPLETED && (
                  <button
                    onClick={() => {
                      setShowRefundModal(true);
                      setShowPaymentModal(false);
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Process Refund
                  </button>
                )}
                {selectedPayment.status === PaymentStatus.FAILED && (
                  <button
                    onClick={() => {
                      handleRetryPayment(selectedPayment._id);
                      setShowPaymentModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Retry Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Process Refund</h3>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount (leave empty for full refund)
                  </div>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`Max: ${selectedPayment.amount}`}
                    max={selectedPayment.amount}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Reason
                  </div>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Enter reason for refund..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Payment:</strong> {selectedPayment.paymentId}<br />
                    <strong>Original Amount:</strong> {formatCurrency(selectedPayment.amount)}<br />
                    <strong>Refund Amount:</strong> {refundAmount ? formatCurrency(parseFloat(refundAmount)) : formatCurrency(selectedPayment.amount)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRefund(selectedPayment._id)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
