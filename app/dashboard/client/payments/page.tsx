'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, CreditCard, Clock, CheckCircle, XCircle, ArrowLeft, FileText, Download, Eye } from 'lucide-react';

interface Payment {
  id: number;
  assignment_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
  assignment_title: string;
  receipt_filename?: string;
  receipt_data?: any;
  transaction_id?: string;
  notes?: string;
}

export default function ClientPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/client/payments', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const viewReceipt = async (payment: Payment) => {
    setSelectedPayment(payment);
    
    if (payment.receipt_filename) {
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch(`/api/client/payments/${payment.id}/receipt`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setReceiptImage(imageUrl);
          setShowReceiptModal(true);
        }
      } catch (error) {
        console.error('Error loading receipt:', error);
      }
    }
  };

  const downloadReceipt = async (payment: Payment) => {
    if (!payment.receipt_filename) return;

    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/client/payments/${payment.id}/receipt`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = payment.receipt_filename || 'receipt.jpg';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
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
              <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
              <p className="text-sm text-gray-600">View your payment transactions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Payments Yet</h3>
            <p className="text-gray-600 mb-6">
              Your payment history will appear here once you make a payment for an assignment.
            </p>
            <button
              onClick={() => router.push('/dashboard/client')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Paid</span>
                  <DollarSign className="text-green-600" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Pending</span>
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Transactions</span>
                  <CreditCard className="text-blue-600" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{payment.assignment_title || `Assignment #${payment.assignment_id}`}</p>
                            {payment.transaction_id && (
                              <p className="text-xs text-gray-500">ID: {payment.transaction_id}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {payment.payment_method || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payment.receipt_filename ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewReceipt(payment)}
                                className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                title="View Receipt"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => downloadReceipt(payment)}
                                className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors"
                                title="Download Receipt"
                              >
                                <Download size={18} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No receipt</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment Receipt</h3>
                <p className="text-sm text-gray-600">
                  {selectedPayment.assignment_title || `Assignment #${selectedPayment.assignment_id}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceiptImage(null);
                  setSelectedPayment(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.transaction_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="font-semibold text-gray-900">${selectedPayment.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(selectedPayment.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                    <p className="font-semibold text-gray-900">{selectedPayment.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                      {getStatusIcon(selectedPayment.status)}
                      {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Assignment</p>
                    <p className="font-semibold text-gray-900">
                      {selectedPayment.assignment_title || `#${selectedPayment.assignment_id}`}
                    </p>
                  </div>
                </div>
                {selectedPayment.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              {/* Receipt Image */}
              {receiptImage && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Receipt Image</span>
                    <button
                      onClick={() => downloadReceipt(selectedPayment)}
                      className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm font-medium"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                  <div className="p-4 bg-white">
                    <img
                      src={receiptImage}
                      alt="Payment Receipt"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => downloadReceipt(selectedPayment)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Download Receipt
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceiptImage(null);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
