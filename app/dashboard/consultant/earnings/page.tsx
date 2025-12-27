'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, TrendingUp, Wallet, CreditCard, Eye, EyeOff, Download, Calendar } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

export default function ConsultantEarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(true);
  const [myEarnings, setMyEarnings] = useState<any>(null);
  const [earnings, setEarnings] = useState({
    thisMonth: 0,
    lastMonth: 0,
    total: 0,
    pending: 0,
  });
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      
      // Fetch my earnings
      const earningsRes = await fetch('/api/my-earnings', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (earningsRes.ok) {
        const data = await earningsRes.json();
        setMyEarnings(data);
      }

      // Fetch detailed earnings
      const detailedRes = await fetch('/api/management/earnings', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (detailedRes.ok) {
        const data = await detailedRes.json();
        setEarnings({
          thisMonth: data.thisMonth || 0,
          lastMonth: data.lastMonth || 0,
          total: data.total || 0,
          pending: data.pending || 0,
        });
      }

      // Fetch payment history
      const historyRes = await fetch('/api/management/payment-history', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (historyRes.ok) {
        const data = await historyRes.json();
        setPaymentHistory(data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return showAmounts ? `$${amount.toFixed(2)}` : '••••••';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/dashboard/consultant')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Earnings</h1>
                <p className="text-sm text-gray-600">Track your income and payments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAmounts(!showAmounts)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {showAmounts ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              <ProfileAvatar onClick={() => router.push('/dashboard/consultant/profile')} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Earnings Overview */}
        {myEarnings && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Total Earnings Overview</h2>
              <DollarSign size={32} />
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-sm text-emerald-100 mb-1">Total Earned</p>
                <p className="text-2xl font-bold">{formatCurrency(myEarnings.totalEarned || 0)}</p>
                <p className="text-xs text-emerald-200 mt-1">From {myEarnings.breakdown?.totalAssignments || 0} assignments</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-sm text-emerald-100 mb-1">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(myEarnings.totalPaid || 0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-sm text-emerald-100 mb-1">Unpaid Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(myEarnings.unpaid || 0)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-sm text-emerald-100 mb-1">Status</p>
                <div className="mt-2">
                  {myEarnings.paymentStatus === 'paid' && <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">✓ Fully Paid</span>}
                  {myEarnings.paymentStatus === 'partial' && <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">Partial</span>}
                  {myEarnings.paymentStatus === 'unpaid' && <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">Unpaid</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="text-emerald-600" size={20} />
              This Month
            </h3>
            <p className="text-3xl font-bold text-emerald-600 mb-2">{formatCurrency(earnings.thisMonth)}</p>
            {earnings.lastMonth > 0 && (
              <div className={`flex items-center gap-1 text-sm ${earnings.thisMonth >= earnings.lastMonth ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp size={16} />
                {((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(0)}% vs last month
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="text-blue-600" size={20} />
              Last Month
            </h3>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(earnings.lastMonth)}</p>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="text-purple-600" size={20} />
              Payment History
            </h3>
          </div>
          
          {paymentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="mx-auto mb-2 text-gray-300" size={48} />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paymentHistory.map((payment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(payment.payment_date || payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.payment_method?.replace('_', ' ') || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {payment.payment_reference || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Completed
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


