'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, 
  Download, Filter, CreditCard, Clock, CheckCircle, Wallet
} from 'lucide-react';

interface EarningsSummary {
  thisMonth: number;
  lastMonth: number;
  total: number;
  pending: number;
}

interface PaymentHistory {
  id: number;
  assignment_id: number;
  assignment_title: string;
  client_name: string;
  amount: number;
  status: string;
  payment_date: string;
  payment_method: string;
}

export default function EarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningsSummary>({
    thisMonth: 0,
    lastMonth: 0,
    total: 0,
    pending: 0,
  });
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  useEffect(() => {
    fetchEarnings();
    fetchPaymentHistory();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/management/earnings', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/management/payment-history', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getGrowthPercentage = () => {
    if (earnings.lastMonth === 0) return 0;
    return ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(1);
  };

  const isGrowthPositive = () => {
    return earnings.thisMonth >= earnings.lastMonth;
  };

  const filteredPayments = paymentHistory.filter(payment => {
    if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
    if (filterMonth !== 'all') {
      const paymentMonth = new Date(payment.payment_date).getMonth();
      const currentMonth = new Date().getMonth();
      if (filterMonth === 'thisMonth' && paymentMonth !== currentMonth) return false;
      if (filterMonth === 'lastMonth' && paymentMonth !== currentMonth - 1) return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      default:
        return <CreditCard size={16} className="text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Earnings & Payments</h1>
              <p className="text-sm text-gray-600">Track your income and payment history</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Earnings Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Wallet size={24} />
              <div className={`flex items-center gap-1 text-sm ${isGrowthPositive() ? 'text-emerald-100' : 'text-red-200'}`}>
                {isGrowthPositive() ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{getGrowthPercentage()}%</span>
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(earnings.thisMonth)}</div>
            <div className="text-emerald-100 text-sm">This Month</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-gray-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(earnings.lastMonth)}</div>
            <div className="text-gray-600 text-sm">Last Month</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(earnings.pending)}</div>
            <div className="text-gray-600 text-sm">Pending</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign size={24} />
            </div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(earnings.total)}</div>
            <div className="text-blue-100 text-sm">Total Earned</div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="text-emerald-600" size={24} />
              Payment History
            </h2>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download size={18} />
              Export
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            <div>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
              </select>
            </div>
          </div>

          {/* Payment Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payment history...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No payments yet</h3>
              <p className="text-gray-600">Your payment history will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr 
                      key={payment.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/management/assignment-requests/${payment.assignment_id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <p className="font-medium">{payment.assignment_title}</p>
                          <p className="text-xs text-gray-500">ID: {payment.assignment_id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {payment.payment_method || 'Mobile Money'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {payment.status.replace('_', ' ').charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
