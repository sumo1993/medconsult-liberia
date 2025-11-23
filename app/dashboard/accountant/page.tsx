'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, Plus, Download, Check, ArrowLeft, X, Save, Edit2, Trash2, Eye, Upload, EyeOff, FileText, Lock, Bell, MessageSquare, User, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ProfileAvatar from '@/components/ProfileAvatar';

export default function AccountantDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [consultantSummary, setConsultantSummary] = useState<any[]>([]);
  const [totalTeamFee, setTotalTeamFee] = useState(0);
  const [totalWebsiteFee, setTotalWebsiteFee] = useState(0);
  const [myEarnings, setMyEarnings] = useState<any>(null);
  const [showMyEarnings, setShowMyEarnings] = useState(true);
  const [showFinancialBreakdown, setShowFinancialBreakdown] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordChangeRequest, setPasswordChangeRequest] = useState({ reason: '', newPassword: '', confirmPassword: '' });
  const [myPasswordRequests, setMyPasswordRequests] = useState<any[]>([]);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>({ consultants: [], team: [] });
  const [stats, setStats] = useState({ totalRevenue: 0, totalExpenses: 0, pendingEarnings: 0, monthlyRevenue: 0, totalPayments: 0, completedPayments: 0, pendingPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [showDeleteTransactionConfirm, setShowDeleteTransactionConfirm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [selectedPayee, setSelectedPayee] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    payment_reference: '',
    notes: ''
  });
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [transactionForm, setTransactionForm] = useState({
    transaction_type: 'consultation_fee',
    amount: '',
    description: '',
    consultant_id: '',
    payment_method: 'bank_transfer',
    transaction_date: new Date().toISOString().split('T')[0],
    receipt_photo: null as string | null,
    distribute_to_team: false
  });
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Run migration first, then fetch data
    runMigration();
  }, []);
  
  const runMigration = async () => {
    try {
      const response = await fetch('/api/migrate-consultant-earnings');
      const data = await response.json();
      console.log('Migration result:', data);
      // After migration, fetch data
      fetchData();
    } catch (error) {
      console.error('Migration error:', error);
      // Still try to fetch data even if migration fails
      fetchData();
    }
  };

  const fetchData = async () => {
    try {
      if (typeof window === 'undefined') return; // Skip on server-side
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Fetch my earnings
      try {
        const earningsRes = await fetch('/api/my-earnings', { headers });
        if (earningsRes.ok) {
          const data = await earningsRes.json();
          setMyEarnings(data);
        }
      } catch (err) {
        console.error('Error fetching my earnings:', err);
      }

      // Fetch my password requests
      try {
        const pwdRes = await fetch('/api/my-password-requests', { headers });
        if (pwdRes.ok) {
          const data = await pwdRes.json();
          setMyPasswordRequests(data);
        }
      } catch (err) {
        console.error('Error fetching password requests:', err);
      }

      // Fetch transactions
      try {
        const transRes = await fetch('/api/transactions', { headers });
        if (transRes.ok) {
          const data = await transRes.json();
          setTransactions(data || []);
          const totalRevenue = (data || []).filter((t: any) => t.payment_status === 'completed').reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
          setStats(prev => ({ ...prev, totalRevenue }));
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      }

      // Fetch earnings
      try {
        const earningsRes = await fetch('/api/consultant-earnings', { headers });
        if (earningsRes.ok) {
          const data = await earningsRes.json();
          setEarnings(data || []);
          const pendingEarnings = (data || []).filter((e: any) => e.payment_status === 'pending').reduce((sum: number, e: any) => sum + parseFloat(e.net_earning || 0), 0);
          setStats(prev => ({ ...prev, pendingEarnings }));
        }
      } catch (err) {
        console.error('Error fetching earnings:', err);
      }

      // Fetch expenses
      try {
        const expensesRes = await fetch('/api/expenses', { headers });
        console.log('Expenses response status:', expensesRes.status);
        if (expensesRes.ok) {
          const data = await expensesRes.json();
          console.log('Expenses data received:', data);
          setExpenses(data || []);
          const totalExpenses = (data || []).filter((e: any) => e.status === 'approved').reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
          setStats(prev => ({ ...prev, totalExpenses }));
        } else {
          console.error('Expenses fetch failed:', await expensesRes.text());
        }
      } catch (err) {
        console.error('Error fetching expenses:', err);
      }

      // Fetch consultants
      try {
        const consultantsRes = await fetch('/api/users?role=consultant', { headers });
        if (consultantsRes.ok) {
          const data = await consultantsRes.json();
          setConsultants(data || []);
        }
      } catch (err) {
        console.error('Error fetching consultants:', err);
      }

      // Fetch consultant summary from assignments
      try {
        const summaryRes = await fetch('/api/accountant/consultant-summary', { headers });
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setConsultantSummary(data.consultants || []);
          setTotalTeamFee(parseFloat(data.totalTeamFee || 0));
          setTotalWebsiteFee(parseFloat(data.totalWebsiteFee || 0));
        }
      } catch (err) {
        console.error('Error fetching consultant summary:', err);
      }

      // Fetch payment status
      try {
        console.log('Fetching payment status...');
        const statusRes = await fetch('/api/accountant/payment-status', { headers });
        if (statusRes.ok) {
          const data = await statusRes.json();
          console.log('Payment status received:', data);
          setPaymentStatus(data);
        } else {
          console.error('Failed to fetch payment status:', statusRes.status);
        }
      } catch (err) {
        console.error('Error fetching payment status:', err);
      }

      // Fetch all payments from all sources
      try {
        const paymentsRes = await fetch('/api/accountant/all-payments', { headers });
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setAllPayments(data.payments || []);
          setStats(prev => ({ 
            ...prev, 
            totalPayments: data.summary.totalPayments || 0,
            completedPayments: data.summary.completedPayments || 0,
            pendingPayments: data.summary.pendingPayments || 0
          }));
        }
      } catch (err) {
        console.error('Error fetching all payments:', err);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    const csv = [
      'Date,Type,Amount,Status,Consultant,Description',
      ...transactions.map(t => `${formatDate(t.transaction_date)},${t.transaction_type},${t.amount},${t.payment_status},${t.consultant_name || '-'},${t.description || '-'}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const markAsPaid = async (earningId: number) => {
    const token = localStorage.getItem('auth-token');
    await fetch('/api/consultant-earnings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ id: earningId, payment_status: 'paid' })
    });
    fetchData();
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const generatePDFReport = () => {
    const reportDate = new Date().toLocaleDateString();
    const consultantTotal = consultantSummary.reduce((sum, c) => sum + parseFloat(c.consultant_share || 0), 0);
    const netProfit = stats.totalRevenue - stats.totalExpenses - consultantTotal - totalTeamFee;
    
    // Prepare report data with payment status
    const data = {
      reportDate,
      consultantTotal,
      netProfit,
      stats,
      consultantSummary,
      totalTeamFee,
      totalWebsiteFee,
      paymentStatus, // Include payment status for consultants and team
      allPayments // Include all payment records
    };
    
    setReportData(data);
    setShowReportPreview(true);
  };

  const downloadPDFReport = async () => {
    if (!reportData) return;
    
    setShowReportPreview(false);
    showToast('Generating PDF... Please wait', 'success');
    
    // Create a temporary container for PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    container.style.padding = '20px';
    container.style.background = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    
    // Create HTML content for PDF (without the instruction box)
    const htmlContent = `
<style>
  body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
  .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #059669; margin: 0; font-size: 28px; }
  .header p { color: #666; margin: 5px 0; }
  .logo-container { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px; }
  .logo { height: 60px; width: auto; }
  .section { margin: 30px 0; page-break-inside: avoid; }
  .section-title { background: #059669; color: white; padding: 10px 15px; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
  .table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
  .table th { background: white; padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db; font-weight: bold; }
  .table td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; background: white; }
  
  /* Status Badge Styling - Text only, no background */
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: bold;
    text-align: center;
    min-width: 60px;
  }
  .status-paid { color: #059669; }
  .status-partial { color: #f59e0b; }
  .status-unpaid { color: #dc2626; }
  
  /* Page break control - for html2canvas we need actual spacing */
  .page-break-before { 
    margin-top: 150px !important;
    padding-top: 20px;
  }
  
  /* Page numbers */
  .page-number {
    text-align: center;
    color: #666;
    font-size: 10px;
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
  }
  
  .footer { 
    text-align: center; 
    margin-top: 50px; 
    padding: 30px 20px; 
    border-top: 3px solid #059669; 
    color: #666; 
    font-size: 12px;
  }
  .footer strong {
    color: #059669;
    font-size: 14px;
    display: block;
    margin-bottom: 5px;
  }
</style>

<div class="header">
    <div class="logo-container">
      <svg class="logo" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <!-- Circle with speech bubble -->
        <circle cx="256" cy="220" r="140" fill="none" stroke="#117864" stroke-width="20"/>
        
        <!-- Medical cross -->
        <rect x="236" y="150" width="40" height="100" fill="#117864" rx="4"/>
        <rect x="206" y="180" width="100" height="40" fill="#117864" rx="4"/>
        
        <!-- Two people silhouettes -->
        <circle cx="210" cy="240" r="18" fill="#117864"/>
        <path d="M 190 265 Q 210 255 230 265 L 230 280 L 190 280 Z" fill="#117864"/>
        
        <circle cx="302" cy="240" r="18" fill="#117864"/>
        <path d="M 282 265 Q 302 255 322 265 L 322 280 L 282 280 Z" fill="#117864"/>
        
        <!-- Speech bubble tail -->
        <path d="M 340 300 L 380 340 L 360 300 Z" fill="#117864"/>
      </svg>
      <h1 style="margin: 0;">MEDCONSULT LIBERIA</h1>
    </div>
    <p style="font-size: 20px; margin-top: 10px;">Financial Report</p>
    <p>Generated: ${reportData.reportDate}</p>
  </div>

  <div class="section">
    <div class="section-title">FINANCIAL SUMMARY</div>
    <table class="table summary-table">
      <thead>
        <tr>
          <th>Category</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Total Revenue</strong></td>
          <td style="text-align: right; color: #059669; font-weight: bold; font-size: 16px;">${formatCurrency(reportData.stats.totalRevenue)}</td>
        </tr>
        <tr>
          <td><strong>Total Expenses</strong></td>
          <td style="text-align: right; color: #dc2626; font-weight: bold; font-size: 16px;">${formatCurrency(reportData.stats.totalExpenses)}</td>
        </tr>
        <tr>
          <td><strong>Consultant Shares</strong></td>
          <td style="text-align: right; color: #2563eb; font-weight: bold; font-size: 16px;">${formatCurrency(reportData.consultantTotal)}</td>
        </tr>
        <tr>
          <td><strong>Team Shares</strong></td>
          <td style="text-align: right; color: #9333ea; font-weight: bold; font-size: 16px;">${formatCurrency(reportData.totalTeamFee)}</td>
        </tr>
        <tr style="background: #f0fdf4;">
          <td><strong>Website Share</strong></td>
          <td style="text-align: right; color: #059669; font-weight: bold; font-size: 16px;">${formatCurrency(reportData.totalWebsiteFee)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">NET PROFIT CALCULATION</div>
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total Revenue</td>
          <td style="text-align: right; color: #059669; font-weight: bold;">${formatCurrency(reportData.stats.totalRevenue)}</td>
        </tr>
        <tr>
          <td>Less: Total Expenses</td>
          <td style="text-align: right; color: #dc2626; font-weight: bold;">(${formatCurrency(reportData.stats.totalExpenses)})</td>
        </tr>
        <tr>
          <td>Less: Consultant Shares</td>
          <td style="text-align: right; color: #2563eb; font-weight: bold;">(${formatCurrency(reportData.consultantTotal)})</td>
        </tr>
        <tr>
          <td>Less: Team Shares</td>
          <td style="text-align: right; color: #9333ea; font-weight: bold;">(${formatCurrency(reportData.totalTeamFee)})</td>
        </tr>
        <tr style="background: #f0fdf4; border-top: 3px solid #059669;">
          <td><strong>Net Profit (Website)</strong></td>
          <td style="text-align: right; color: #059669; font-weight: bold; font-size: 18px;">${formatCurrency(reportData.netProfit)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">CONSULTANT BREAKDOWN</div>
    <table class="table">
      <thead>
        <tr>
          <th>Consultant Name</th>
          <th>Assignments</th>
          <th>Total Earnings</th>
          <th>Paid</th>
          <th>Unpaid</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${reportData.consultantSummary.map((c: any) => {
          const status = reportData.paymentStatus?.consultants?.find((p: any) => p.consultant_id === c.consultant_id);
          const totalPaid = parseFloat(status?.total_paid || 0);
          const unpaid = parseFloat(c.consultant_share) - totalPaid;
          const paymentStatus = unpaid <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');
          const statusClass = unpaid <= 0 ? 'status-paid' : (totalPaid > 0 ? 'status-partial' : 'status-unpaid');
          return `
          <tr>
            <td>${c.consultant_name}</td>
            <td>${c.total_assignments}</td>
            <td><strong>${formatCurrency(c.consultant_share)}</strong></td>
            <td style="color: #059669;"><strong>${formatCurrency(totalPaid)}</strong></td>
            <td style="color: #dc2626;"><strong>${formatCurrency(unpaid)}</strong></td>
            <td><span class="status-badge ${statusClass}">${paymentStatus}</span></td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>
    <div class="page-number">Page 1 of 2</div>
  </div>

  <div class="section page-break-before">
    <div class="section-title">TEAM SHARE DISTRIBUTION</div>
    <div style="margin-bottom: 15px;"><strong>Total Team Share: ${formatCurrency(reportData.totalTeamFee)}</strong></div>
    <table class="table">
      <thead>
        <tr>
          <th>Team Member</th>
          <th>Percentage</th>
          <th>Total Earned</th>
          <th>Paid</th>
          <th>Unpaid</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${[
          { name: 'CEO', type: 'ceo', percent: 40/95 },
          { name: 'IT Specialist', type: 'it_specialist', percent: 25/95 },
          { name: 'Accountant', type: 'accountant', percent: 15/95 },
          { name: 'Other Members', type: 'other_team', percent: 15/95 }
        ].map(member => {
          const earned = reportData.totalTeamFee * member.percent;
          const status = reportData.paymentStatus?.team?.find((t: any) => t.payment_type === member.type);
          const totalPaid = parseFloat(status?.total_paid || 0);
          const unpaid = earned - totalPaid;
          const paymentStatus = unpaid <= 0 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');
          const statusClass = unpaid <= 0 ? 'status-paid' : (totalPaid > 0 ? 'status-partial' : 'status-unpaid');
          return `
          <tr>
            <td>${member.name}</td>
            <td>${Math.round(member.percent * 95)}%</td>
            <td><strong>${formatCurrency(earned)}</strong></td>
            <td style="color: #059669;"><strong>${formatCurrency(totalPaid)}</strong></td>
            <td style="color: #dc2626;"><strong>${formatCurrency(unpaid)}</strong></td>
            <td><span class="status-badge ${statusClass}">${paymentStatus}</span></td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>
    <div class="page-number">Page 2 of 2</div>
  </div>

  <div class="footer">
    <p><strong>MEDCONSULT LIBERIA</strong></p>
    <p>Report generated by Accountant Dashboard</p>
    <p>Date: ${reportData.reportDate}</p>
  </div>
    `;
    
    // Set container content
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
    
    try {
      // Generate canvas from HTML
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794, // A4 width in pixels at 96 DPI
        windowWidth: 794
      });
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      // Download PDF
      pdf.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Clean up
      document.body.removeChild(container);
      showToast('PDF downloaded successfully! 📄', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      document.body.removeChild(container);
      showToast('Error generating PDF. Please try again.', 'error');
    }
  };

  const handlePasswordChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordChangeRequest.newPassword !== passwordChangeRequest.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    if (passwordChangeRequest.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/password-change-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reason: passwordChangeRequest.reason,
          newPassword: passwordChangeRequest.newPassword
        })
      });
      
      if (response.ok) {
        setShowPasswordChangeModal(false);
        setPasswordChangeRequest({ reason: '', newPassword: '', confirmPassword: '' });
        showToast('Password change request submitted! Waiting for admin approval. 🔐');
      } else {
        showToast('Failed to submit request', 'error');
      }
    } catch (error) {
      showToast('Failed to submit request', 'error');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth-token');
      
      // Prepare transaction data - remove consultant_id if not consultation_fee
      const transactionData = {
        ...transactionForm,
        consultant_id: transactionForm.transaction_type === 'consultation_fee' ? transactionForm.consultant_id : undefined
      };
      
      console.log('Submitting transaction:', transactionData);
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(transactionData)
      });
      const data = await response.json();
      console.log('Response:', data);
      if (response.ok) {
        setShowAddTransaction(false);
        setTransactionForm({ transaction_type: 'consultation_fee', amount: '', description: '', consultant_id: '', payment_method: 'cash', transaction_date: new Date().toISOString().split('T')[0], receipt_photo: null, distribute_to_team: false });
        fetchData();
        showToast('Transaction added successfully! 💰');
      } else {
        console.error('Error response:', data);
        showToast(data.error || 'Failed to add transaction', 'error');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      showToast('Failed to add transaction', 'error');
    }
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionForm({
      transaction_type: transaction.transaction_type,
      amount: transaction.amount,
      description: transaction.description || '',
      consultant_id: transaction.consultant_id || '',
      payment_method: transaction.payment_method,
      transaction_date: transaction.transaction_date.split('T')[0],
      receipt_photo: '',
      distribute_to_team: transaction.distribute_to_team || false
    });
    setShowEditTransaction(true);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth-token');
    const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(transactionForm)
    });
    if (response.ok) {
      setShowEditTransaction(false);
      setSelectedTransaction(null);
      setTransactionForm({ transaction_type: 'consultation_fee', amount: '', description: '', consultant_id: '', payment_method: 'cash', transaction_date: new Date().toISOString().split('T')[0], receipt_photo: '', distribute_to_team: false });
      fetchData();
      showToast('Transaction updated successfully! ✏️');
    } else {
      showToast('Failed to update transaction', 'error');
    }
  };

  const handleDeleteTransaction = async () => {
    const token = localStorage.getItem('auth-token');
    const response = await fetch(`/api/transactions/${selectedTransaction.id}`, {
      method: 'DELETE',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    if (response.ok) {
      setShowDeleteTransactionConfirm(false);
      setSelectedTransaction(null);
      fetchData();
      showToast('Transaction deleted successfully! 🗑️');
    } else {
      showToast('Failed to delete transaction', 'error');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth-token');
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(expenseForm)
    });
    if (response.ok) {
      setShowAddExpense(false);
      setExpenseForm({ category: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
      fetchData();
      showToast('Expense added successfully! 📝');
    } else {
      showToast('Failed to add expense', 'error');
    }
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setExpenseForm({
      category: expense.category,
      amount: expense.amount,
      description: expense.description || '',
      expense_date: expense.expense_date.split('T')[0]
    });
    setShowEditExpense(true);
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth-token');
    const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ ...expenseForm, status: selectedExpense.status })
    });
    if (response.ok) {
      setShowEditExpense(false);
      setSelectedExpense(null);
      setExpenseForm({ category: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
      fetchData();
      showToast('Expense updated successfully! ✏️');
    } else {
      showToast('Failed to update expense', 'error');
    }
  };

  const handleDeleteExpense = async () => {
    const token = localStorage.getItem('auth-token');
    const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
      method: 'DELETE',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    if (response.ok) {
      setShowDeleteConfirm(false);
      setSelectedExpense(null);
      fetchData();
      showToast('Expense deleted successfully! 🗑️');
    } else {
      showToast('Failed to delete expense', 'error');
    }
  };

  const handlePayNow = (payee: any, type: 'consultant' | 'accountant' | 'it_specialist' | 'other_team') => {
    setSelectedPayee({ ...payee, payment_type: type });
    setPaymentForm({
      amount: type === 'consultant' ? payee.consultant_share : 
              type === 'accountant' ? (consultantSummary.reduce((sum, c) => sum + parseFloat(c.team_fee || 0), 0) * 0.40).toFixed(2) :
              type === 'it_specialist' ? (consultantSummary.reduce((sum, c) => sum + parseFloat(c.team_fee || 0), 0) * 0.40).toFixed(2) :
              (consultantSummary.reduce((sum, c) => sum + parseFloat(c.team_fee || 0), 0) * 0.20).toFixed(2),
      payment_method: 'bank_transfer',
      payment_reference: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth-token');
      
      const paymentData = {
        payment_type: selectedPayee.payment_type,
        recipient_id: selectedPayee.consultant_id || null,
        recipient_name: selectedPayee.consultant_name || selectedPayee.payment_type,
        recipient_email: selectedPayee.consultant_email || '',
        amount: parseFloat(paymentForm.amount),
        period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        total_assignments: selectedPayee.total_assignments || 0,
        payment_method: paymentForm.payment_method,
        payment_reference: paymentForm.payment_reference,
        notes: paymentForm.notes
      };

      console.log('Making payment:', paymentData);

      const response = await fetch('/api/accountant/make-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      console.log('Payment response:', data);

      if (response.ok) {
        setShowPaymentModal(false);
        setSelectedPayee(null);
        setPaymentForm({ amount: '', payment_method: 'bank_transfer', payment_reference: '', notes: '' });
        
        // Refresh all data including payment status
        console.log('Refreshing data after payment...');
        await fetchData();
        console.log('Data refreshed');
        
        showToast('Payment recorded successfully! 💰');
      } else {
        console.error('Payment failed:', data);
        showToast(data.error || 'Failed to record payment', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showToast('Failed to record payment', 'error');
    }
  };

  const handleViewHistory = async (payee: any, type: string) => {
    const token = localStorage.getItem('auth-token');
    const params = new URLSearchParams({
      payment_type: type,
      ...(payee.consultant_id && { recipient_id: payee.consultant_id.toString() })
    });
    
    const response = await fetch(`/api/accountant/make-payment?${params}`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });

    if (response.ok) {
      const data = await response.json();
      setPaymentHistory(data);
      setSelectedPayee({ ...payee, payment_type: type });
      setShowPaymentHistory(true);
    } else {
      showToast('Failed to load payment history', 'error');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Accountant Portal</p>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Notification Bell */}
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell size={24} className="text-gray-600" />
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
              
              {/* Profile Avatar */}
              <ProfileAvatar 
                onClick={() => router.push('/dashboard/accountant/profile')}
                className="w-10 h-10 cursor-pointer"
              />
              
              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            <button
              onClick={generatePDFReport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm shadow-md"
            >
              <FileText size={18} /> <span className="hidden sm:inline">Generate Report</span><span className="sm:hidden">Report</span>
            </button>
            <button
              onClick={() => setShowPasswordChangeModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm shadow-md"
            >
              <Lock size={18} /> <span className="hidden sm:inline">Change Password</span><span className="sm:hidden">Password</span>
            </button>
          </div>
        </div>

        {/* Password Request Status Notifications */}
        {myPasswordRequests.filter(r => r.status !== 'pending').slice(0, 1).map(request => (
          <div 
            key={request.id}
            className={`rounded-xl shadow-lg p-6 mb-6 border-2 ${
              request.status === 'approved' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  request.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Lock className={request.status === 'approved' ? 'text-green-600' : 'text-red-600'} size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {request.status === 'approved' ? '✓ Password Change Approved!' : '✕ Password Change Rejected'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {request.status === 'approved' 
                      ? 'Your password has been successfully changed by the administrator.'
                      : 'Your password change request was rejected by the administrator.'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Reviewed by: {request.reviewer_name} • {new Date(request.reviewed_at).toLocaleString()}
                  </p>
                  {request.admin_notes && (
                    <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700">Admin Notes:</p>
                      <p className="text-sm text-gray-600 mt-1">{request.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMyPasswordRequests(myPasswordRequests.filter(r => r.id !== request.id))}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ))}

        {/* Pending Password Request Alert */}
        {myPasswordRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Lock className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">⏳ Password Change Pending</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your password change request is waiting for admin approval.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Requested: {new Date(myPasswordRequests.find(r => r.status === 'pending')?.requested_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Earnings Card */}
        {myEarnings && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">My Earnings (Accountant)</h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowMyEarnings(!showMyEarnings)}
                  className="p-1.5 sm:p-2 hover:bg-purple-100 rounded-lg transition-colors"
                  title={showMyEarnings ? "Hide earnings" : "Show earnings"}
                >
                  {showMyEarnings ? <Eye className="text-purple-600" size={20} /> : <EyeOff className="text-gray-400" size={20} />}
                </button>
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Earned</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {showMyEarnings ? `$${myEarnings.totalEarned?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                <p className="text-xs text-gray-500 mt-1">15% of team share</p>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Paid</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {showMyEarnings ? `$${myEarnings.totalPaid?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                {myEarnings.lastPaymentDate && (
                  <p className="text-xs text-gray-500 mt-1">Last: {new Date(myEarnings.lastPaymentDate).toLocaleDateString()}</p>
                )}
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow col-span-2 md:col-span-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Unpaid</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">
                  {showMyEarnings ? `$${myEarnings.unpaid?.toFixed(2) || '0.00'}` : '••••••'}
                </p>
                <div className="mt-2">
                  {myEarnings.paymentStatus === 'paid' && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Paid</span>}
                  {myEarnings.paymentStatus === 'partial' && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Partial</span>}
                  {myEarnings.paymentStatus === 'unpaid' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Unpaid</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2 sm:mb-3">Total Revenue</h3>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-emerald-100 rounded-full">
                <DollarSign className="text-emerald-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2 sm:mb-3">All Payments</h3>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{stats.totalPayments}</p>
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">{stats.completedPayments} completed</p>
              </div>
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-blue-100 rounded-full">
                <Calendar className="text-blue-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2 sm:mb-3">Total Expenses</h3>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalExpenses)}</p>
              </div>
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-red-100 rounded-full">
                <TrendingDown className="text-red-600" size={20} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2 sm:mb-3">Pending Earnings</h3>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 truncate">{formatCurrency(stats.pendingEarnings)}</p>
              </div>
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-purple-100 rounded-full">
                <Users className="text-purple-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Card */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Financial Breakdown</h2>
            <button
              onClick={() => setShowFinancialBreakdown(!showFinancialBreakdown)}
              className="flex-shrink-0 p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-sm border border-gray-200"
              title={showFinancialBreakdown ? "Minimize" : "Maximize"}
              aria-label={showFinancialBreakdown ? "Minimize Financial Breakdown" : "Maximize Financial Breakdown"}
            >
              {showFinancialBreakdown ? (
                <ChevronUp size={20} className="sm:w-6 sm:h-6 text-gray-700" />
              ) : (
                <ChevronDown size={20} className="sm:w-6 sm:h-6 text-gray-700" />
              )}
            </button>
          </div>
          
          {showFinancialBreakdown && (
            <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Revenue */}
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">All income</p>
            </div>
            
            {/* Total Expenses */}
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Expenses</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">Operating costs</p>
            </div>
            
            {/* Consultant Shares */}
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Consultant Shares</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                {formatCurrency(consultantSummary.reduce((sum, c) => sum + parseFloat(c.consultant_share || 0), 0))}
              </p>
              <p className="text-xs text-gray-500 mt-1">75% paid out</p>
            </div>
            
            {/* Team Shares */}
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Team Shares</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{formatCurrency(totalTeamFee)}</p>
              <p className="text-xs text-gray-500 mt-1">CEO, IT, Accountant, Others</p>
            </div>
            
            {/* Website Share (Net Profit) */}
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow border-2 border-emerald-300 col-span-2 lg:col-span-1">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Website Share</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600">{formatCurrency(totalWebsiteFee)}</p>
              <p className="text-xs text-gray-500 mt-1">Platform revenue</p>
            </div>
          </div>
          
          {/* Net Calculation */}
          <div className="mt-4 sm:mt-6 bg-white rounded-lg p-4 sm:p-6 shadow-lg border-2 border-emerald-400">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Net Revenue Calculation</h3>
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <p className="text-gray-600">Total Revenue: <span className="font-semibold text-emerald-600">{formatCurrency(stats.totalRevenue)}</span></p>
                  <p className="text-gray-600">- Total Expenses: <span className="font-semibold text-red-600">{formatCurrency(stats.totalExpenses)}</span></p>
                  <p className="text-gray-600">- Consultant Shares: <span className="font-semibold text-blue-600">
                    {formatCurrency(consultantSummary.reduce((sum, c) => sum + parseFloat(c.consultant_share || 0), 0))}
                  </span></p>
                  <p className="text-gray-600">- Team Shares: <span className="font-semibold text-purple-600">{formatCurrency(totalTeamFee)}</span></p>
                </div>
                
                <div className="border-t-2 border-gray-300 my-3 pt-3">
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    Net Profit (Website): <span className="text-emerald-600">
                      {formatCurrency(
                        stats.totalRevenue - 
                        stats.totalExpenses - 
                        consultantSummary.reduce((sum, c) => sum + parseFloat(c.consultant_share || 0), 0) - 
                        totalTeamFee
                      )}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Should equal Website Share: {formatCurrency(totalWebsiteFee)}
                    {Math.abs((stats.totalRevenue - stats.totalExpenses - consultantSummary.reduce((sum, c) => sum + parseFloat(c.consultant_share || 0), 0) - totalTeamFee) - totalWebsiteFee) < 1 
                      ? ' ✓ Matches!' 
                      : ' ⚠️ Discrepancy detected'}
                  </p>
                </div>
              </div>
              
              <div className="text-center sm:text-right bg-emerald-50 rounded-lg p-4 sm:min-w-[180px]">
                <div className="text-3xl sm:text-4xl font-bold text-emerald-600">
                  {formatCurrency(totalWebsiteFee)}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">Website Earnings</p>
              </div>
            </div>
          </div>
          </>
          )}
        </div>

        <div id="tabs-section" className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max sm:min-w-0">
              {['overview', 'all payments', 'transactions', 'earnings', 'expenses'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap ${activeTab === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'}`}>
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Transactions */}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4">Recent Transactions</h2>
                  
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-4">
                    {transactions.slice(0, 10).map((t) => (
                      <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                              {t.transaction_type.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            t.payment_status === 'completed' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${t.payment_status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            {t.payment_status}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-500 mb-1">Client/Consultant</p>
                          <p className="text-base font-semibold text-gray-900">{t.consultant_name || t.client_name || '-'}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Amount</p>
                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(parseFloat(t.amount))}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Date</p>
                            <p className="text-sm font-medium text-gray-700">{formatDate(t.transaction_date)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client/Consultant</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {transactions.slice(0, 10).map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{formatDate(t.transaction_date)}</td>
                            <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{t.transaction_type.replace('_', ' ')}</span></td>
                            <td className="px-4 py-3 text-sm">{t.consultant_name || t.client_name || '-'}</td>
                            <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(parseFloat(t.amount))}</td>
                            <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${t.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{t.payment_status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* All Consultant Earnings from Assignments */}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold mb-4">All Consultant Earnings (From Assignments)</h2>
                  
                  {/* Mobile Card View */}
                  <div className="lg:hidden grid grid-cols-2 gap-4">
                    {consultantSummary.map((c) => (
                      <div key={c.consultant_id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900">{c.consultant_name}</h3>
                            <p className="text-xs text-gray-500">{c.consultant_email}</p>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {c.total_assignments} assignments
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Total Amount</p>
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(parseFloat(c.total_amount))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Consultant (75%)</p>
                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(parseFloat(c.consultant_share))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Website (10%)</p>
                            <p className="text-sm font-semibold text-blue-600">{formatCurrency(parseFloat(c.website_fee))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Team (15%)</p>
                            <p className="text-sm font-semibold text-purple-600">{formatCurrency(parseFloat(c.team_fee))}</p>
                          </div>
                        </div>
                        {c.last_completed && (
                          <p className="text-xs text-gray-500 mt-2">Last: {formatDate(c.last_completed)}</p>
                        )}
                      </div>
                    ))}
                    {consultantSummary.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-base">No consultant earnings found</p>
                        <p className="text-sm mt-2">Completed assignments will appear here</p>
                      </div>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignments</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant (75%)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website (10%)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team (15%)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Completed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {consultantSummary.map((c) => (
                          <tr key={c.consultant_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{c.consultant_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{c.consultant_email}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                                {c.total_assignments} assignments
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(parseFloat(c.total_amount))}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatCurrency(parseFloat(c.consultant_share))}</td>
                            <td className="px-4 py-3 text-sm text-blue-600">{formatCurrency(parseFloat(c.website_fee))}</td>
                            <td className="px-4 py-3 text-sm text-purple-600">{formatCurrency(parseFloat(c.team_fee))}</td>
                            <td className="px-4 py-3 text-sm">{c.last_completed ? formatDate(c.last_completed) : '-'}</td>
                          </tr>
                        ))}
                        {consultantSummary.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                              <p className="text-lg">No consultant earnings found</p>
                              <p className="text-sm mt-2">Completed assignments will appear here</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'all payments' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">All Payments from All Sources</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Client payments, transactions, and all financial activities</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 sm:text-right">
                    <div className="text-xs sm:text-sm text-gray-600">Total Payments</div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.totalPayments}</div>
                    <div className="text-xs text-gray-500">{stats.completedPayments} completed, {stats.pendingPayments} pending</div>
                  </div>
                </div>
                
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3">
                  {allPayments.map((p) => (
                    <div key={`${p.payment_type}-${p.id}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-500">{p.transaction_id}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          p.payment_status === 'completed' || p.payment_status === 'verified' ? 'bg-green-100 text-green-800' : 
                          p.payment_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {p.payment_status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${p.payment_type === 'assignment_payment' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {p.payment_type === 'assignment_payment' ? 'Assignment' : 'Transaction'}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(p.payment_date)}</span>
                      </div>
                      {p.client_name && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">Client</p>
                          <p className="text-sm font-medium">{p.client_name}</p>
                        </div>
                      )}
                      {p.consultant_name && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">Consultant</p>
                          <p className="text-sm font-medium">{p.consultant_name}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-bold">{formatCurrency(p.amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Consultant (75%)</p>
                          <p className="text-sm font-semibold text-emerald-600">{formatCurrency(p.consultant_share || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Website (10%)</p>
                          <p className="text-sm text-blue-600">{formatCurrency(p.website_fee || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Team (15%)</p>
                          <p className="text-sm text-purple-600">{formatCurrency(p.team_fee || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {allPayments.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-base">No payments found</p>
                      <p className="text-sm mt-2">Payments from clients and transactions will appear here</p>
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant (75%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website (10%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team (15%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allPayments.map((p) => (
                        <tr key={`${p.payment_type}-${p.id}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.transaction_id}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(p.payment_date)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${p.payment_type === 'assignment_payment' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {p.payment_type === 'assignment_payment' ? 'Assignment' : 'Transaction'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {p.client_name ? (
                              <div>
                                <div className="font-medium">{p.client_name}</div>
                                <div className="text-xs text-gray-500">{p.client_email}</div>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {p.consultant_name ? (
                              <div>
                                <div className="font-medium">{p.consultant_name}</div>
                                <div className="text-xs text-gray-500">{p.consultant_email}</div>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatCurrency(p.consultant_share || 0)}</td>
                          <td className="px-4 py-3 text-sm text-blue-600">{formatCurrency(p.website_fee || 0)}</td>
                          <td className="px-4 py-3 text-sm text-purple-600">{formatCurrency(p.team_fee || 0)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              p.payment_status === 'completed' || p.payment_status === 'verified' ? 'bg-green-100 text-green-800' : 
                              p.payment_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {p.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allPayments.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No payments found</p>
                      <p className="text-sm mt-2">Payments from clients and transactions will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold">All Transactions</h2>
                  <div className="flex gap-2 sm:gap-3">
                    <button onClick={() => setShowAddTransaction(true)} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                      <Plus size={18} /> <span className="hidden sm:inline">Add Transaction</span><span className="sm:hidden">Add</span>
                    </button>
                    <button onClick={exportToCSV} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
                      <Download size={18} /> <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">Export</span>
                    </button>
                  </div>
                </div>
                
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {t.transaction_type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${t.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {t.payment_status}
                        </span>
                      </div>
                      <div className="mb-2">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(parseFloat(t.amount))}</p>
                        <p className="text-xs text-gray-500">{formatDate(t.transaction_date)}</p>
                      </div>
                      {t.consultant_name && (
                        <p className="text-sm text-gray-600 mb-3">Consultant: {t.consultant_name}</p>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                        <button 
                          onClick={() => handleEditTransaction(t)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => { setSelectedTransaction(t); setShowDeleteTransactionConfirm(true); }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                        {t.receipt_photo && (
                          <a 
                            href={t.receipt_photo} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <Eye size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{formatDate(t.transaction_date)}</td>
                          <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{t.transaction_type.replace('_', ' ')}</span></td>
                          <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(parseFloat(t.amount))}</td>
                          <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${t.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{t.payment_status}</span></td>
                          <td className="px-4 py-3 text-sm">{t.consultant_name || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditTransaction(t)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit transaction"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => { setSelectedTransaction(t); setShowDeleteTransactionConfirm(true); }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete transaction"
                              >
                                <Trash2 size={16} />
                              </button>
                              {t.receipt_photo && (
                                <a 
                                  href={t.receipt_photo} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="View receipt"
                                >
                                  <Eye size={16} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold">Consultant Earnings (From Assignments)</h2>
                  <button 
                    onClick={() => {
                      setLoading(true);
                      fetchData().finally(() => setLoading(false));
                    }}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">Refreshing...</span><span className="sm:hidden">Loading...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                        </svg>
                        <span className="hidden sm:inline">Refresh Status</span><span className="sm:hidden">Refresh</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Payment Summary */}
                {paymentStatus.consultants.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-3 sm:p-4 border border-emerald-200">
                      <p className="text-xs sm:text-sm text-emerald-700 font-medium mb-1">Total Paid</p>
                      <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                        {formatCurrency(paymentStatus.consultants.reduce((sum: number, s: any) => sum + parseFloat(s.total_paid || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 sm:p-4 border border-yellow-200">
                      <p className="text-xs sm:text-sm text-yellow-700 font-medium mb-1">Total Unpaid</p>
                      <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                        {formatCurrency(paymentStatus.consultants.reduce((sum: number, s: any) => sum + parseFloat(s.unpaid_amount || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200 col-span-2 lg:col-span-1">
                      <p className="text-xs sm:text-sm text-blue-700 font-medium mb-1">Consultants</p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-600">
                        {paymentStatus.consultants.filter((s: any) => s.payment_status === 'paid').length} / {paymentStatus.consultants.length} Paid
                      </p>
                    </div>
                  </div>
                )}

                {/* Earnings List Format */}
                <div className="space-y-4 mb-8">
                  {consultantSummary.map((c) => {
                    const status = paymentStatus.consultants.find((s: any) => s.consultant_id === c.consultant_id);
                    const unpaidAmount = status?.unpaid_amount || c.consultant_share;
                    const totalPaid = status?.total_paid || 0;
                    const paymentStatusBadge = status?.payment_status || 'unpaid';
                    const lastPayment = status?.last_payment_date;

                    return (
                    <div key={c.consultant_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900">{c.consultant_name}</h3>
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                              paymentStatusBadge === 'paid' ? 'bg-green-100 text-green-800' :
                              paymentStatusBadge === 'partial' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {paymentStatusBadge === 'paid' ? '✓ Paid' :
                               paymentStatusBadge === 'partial' ? 'Partial' :
                               'Unpaid'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">{c.consultant_email}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {c.total_assignments} assignments
                            </span>
                            {lastPayment && (
                              <span className="text-xs text-gray-500">
                                Last paid: {formatDate(lastPayment)}
                              </span>
                            )}
                          </div>
                          {unpaidAmount > 0 && (
                            <div className="mt-2 px-2 sm:px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs sm:text-sm font-semibold text-yellow-800">
                                Unpaid: {formatCurrency(parseFloat(unpaidAmount.toString()))}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex sm:flex-col gap-2">
                          {unpaidAmount > 0 && (
                            <button 
                              onClick={() => handlePayNow(c, 'consultant')}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-xs sm:text-sm whitespace-nowrap"
                            >
                              <DollarSign size={14} /> Pay Now
                            </button>
                          )}
                          <button 
                            onClick={() => handleViewHistory(c, 'consultant')}
                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-xs sm:text-sm"
                          >
                            History
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                          <p className="text-base sm:text-xl font-bold text-gray-900">{formatCurrency(parseFloat(c.total_amount))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Consultant gets (75%)</p>
                          <p className="text-base sm:text-xl font-bold text-emerald-600">{formatCurrency(parseFloat(c.consultant_share))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Website fee (10%)</p>
                          <p className="text-base sm:text-xl font-bold text-blue-600">{formatCurrency(parseFloat(c.website_fee))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Team share (15%)</p>
                          <p className="text-base sm:text-xl font-bold text-purple-600">{formatCurrency(parseFloat(c.team_fee))}</p>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                  
                  {consultantSummary.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No earnings found</p>
                      <p className="text-sm mt-2">Completed assignments will appear here</p>
                    </div>
                  )}
                </div>

                {/* Team Members Share Breakdown */}
                {(consultantSummary.length > 0 || totalTeamFee > 0) && (
                  <div className="mt-8">
                    <h2 className="text-xl font-bold mb-6">Team Members Share (15% Distribution)</h2>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6">
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">Total Team Share Available</h3>
                          <p className="text-3xl font-bold text-purple-600">
                            {formatCurrency(totalTeamFee)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>Universal Distribution:</strong> CEO 40%, IT 25%, Accountant 15%, Others 15%, Website 5%<br/>
                          <span className="text-xs">(Consultations: 75% consultant + 25% team | Partnerships: 95% team + 5% website)</span>
                        </p>
                      </div>

                      <div className="grid md:grid-cols-4 gap-6">
                        {/* CEO Share (Isaac B Zeah) */}
                        <div className="bg-white rounded-lg p-5 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-emerald-100 rounded-full">
                              <Users size={24} className="text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">CEO (Isaac B Zeah)</h4>
                              <p className="text-xs text-gray-500">40% of team share</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(totalTeamFee * (40/95))}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">40% of team share</p>
                          {(() => {
                            const teamStatus = paymentStatus.team?.find((t: any) => t.payment_type === 'ceo');
                            const unpaidAmount = teamStatus?.unpaid_amount || totalTeamFee * (40/95);
                            const isPaid = teamStatus?.payment_status === 'paid';
                            const isPartial = teamStatus?.payment_status === 'partial';
                            
                            return (
                              <div className="mt-3">
                                {teamStatus && (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      {isPaid && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Paid</span>}
                                      {isPartial && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Partial</span>}
                                      {!isPaid && !isPartial && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Unpaid</span>}
                                      {teamStatus.last_payment_date && <span className="text-xs text-gray-500">{formatDate(teamStatus.last_payment_date)}</span>}
                                    </div>
                                    {teamStatus.total_paid > 0 && <p className="text-sm text-emerald-600 font-semibold">Paid: {formatCurrency(parseFloat(teamStatus.total_paid))}</p>}
                                  </div>
                                )}
                                
                                {unpaidAmount > 0 && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm font-semibold text-yellow-800">⚠️ Unpaid: {formatCurrency(unpaidAmount)}</p>
                                  </div>
                                )}
                                
                                {unpaidAmount > 0 && (
                                  <button 
                                    onClick={() => handlePayNow({}, 'other_team')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm mb-2"
                                  >
                                    <DollarSign size={16} /> Pay CEO
                                  </button>
                                )}
                                
                                <button 
                                  onClick={() => handleViewHistory({ payment_type: 'ceo' }, 'ceo')}
                                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm"
                                >
                                  View History
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Accountant Share */}
                        <div className="bg-white rounded-lg p-5 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-purple-100 rounded-full">
                              <Users size={24} className="text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Accountant</h4>
                              <p className="text-xs text-gray-500">15% of team share</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(totalTeamFee * (15/95))}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">15% of team share</p>
                          {(() => {
                            const teamStatus = paymentStatus.team?.find((t: any) => t.payment_type === 'accountant');
                            const unpaidAmount = teamStatus?.unpaid_amount || totalTeamFee * (15/95);
                            const isPaid = teamStatus?.payment_status === 'paid';
                            const isPartial = teamStatus?.payment_status === 'partial';
                            
                            return (
                              <div className="mt-3">
                                {/* Status Badge */}
                                {teamStatus && (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      {isPaid && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Paid</span>}
                                      {isPartial && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Partial</span>}
                                      {!isPaid && !isPartial && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Unpaid</span>}
                                      {teamStatus.last_payment_date && <span className="text-xs text-gray-500">{formatDate(teamStatus.last_payment_date)}</span>}
                                    </div>
                                    {teamStatus.total_paid > 0 && <p className="text-sm text-emerald-600 font-semibold">Paid: {formatCurrency(parseFloat(teamStatus.total_paid))}</p>}
                                  </div>
                                )}
                                
                                {/* Unpaid Amount Warning */}
                                {unpaidAmount > 0 && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm font-semibold text-yellow-800">⚠️ Unpaid: {formatCurrency(unpaidAmount)}</p>
                                  </div>
                                )}
                                
                                {/* Pay Button - Only show if unpaid */}
                                {unpaidAmount > 0 && (
                                  <button 
                                    onClick={() => handlePayNow({}, 'accountant')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm mb-2"
                                  >
                                    <DollarSign size={16} /> Pay Accountant
                                  </button>
                                )}
                                
                                <button 
                                  onClick={() => handleViewHistory({ payment_type: 'accountant' }, 'accountant')}
                                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm"
                                >
                                  View History
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* IT Specialist Share */}
                        <div className="bg-white rounded-lg p-5 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                              <Users size={24} className="text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">IT Specialist</h4>
                              <p className="text-xs text-gray-500">25% of team share</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(totalTeamFee * (25/95))}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">25% of team share</p>
                          {(() => {
                            const teamStatus = paymentStatus.team?.find((t: any) => t.payment_type === 'it_specialist');
                            const unpaidAmount = teamStatus?.unpaid_amount || totalTeamFee * (25/95);
                            const isPaid = teamStatus?.payment_status === 'paid';
                            const isPartial = teamStatus?.payment_status === 'partial';
                            
                            return (
                              <div className="mt-3">
                                {teamStatus && (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      {isPaid && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Paid</span>}
                                      {isPartial && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Partial</span>}
                                      {!isPaid && !isPartial && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Unpaid</span>}
                                      {teamStatus.last_payment_date && <span className="text-xs text-gray-500">{formatDate(teamStatus.last_payment_date)}</span>}
                                    </div>
                                    {teamStatus.total_paid > 0 && <p className="text-sm text-emerald-600 font-semibold">Paid: {formatCurrency(parseFloat(teamStatus.total_paid))}</p>}
                                  </div>
                                )}
                                
                                {unpaidAmount > 0 && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm font-semibold text-yellow-800">⚠️ Unpaid: {formatCurrency(unpaidAmount)}</p>
                                  </div>
                                )}
                                
                                {unpaidAmount > 0 && (
                                  <button 
                                    onClick={() => handlePayNow({}, 'it_specialist')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm mb-2"
                                  >
                                    <DollarSign size={16} /> Pay IT Specialist
                                  </button>
                                )}
                                
                                <button 
                                  onClick={() => handleViewHistory({ payment_type: 'it_specialist' }, 'it_specialist')}
                                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm"
                                >
                                  View History
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Other Team Members Share */}
                        <div className="bg-white rounded-lg p-5 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 bg-pink-100 rounded-full">
                              <Users size={24} className="text-pink-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Other Members</h4>
                              <p className="text-xs text-gray-500">15% of team share</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-pink-600">
                            {formatCurrency(totalTeamFee * (15/95))}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">15% of team share</p>
                          {(() => {
                            const teamStatus = paymentStatus.team?.find((t: any) => t.payment_type === 'other_team');
                            const unpaidAmount = teamStatus?.unpaid_amount || totalTeamFee * (15/95);
                            const isPaid = teamStatus?.payment_status === 'paid';
                            const isPartial = teamStatus?.payment_status === 'partial';
                            
                            return (
                              <div className="mt-3">
                                {teamStatus && (
                                  <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      {isPaid && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Paid</span>}
                                      {isPartial && <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Partial</span>}
                                      {!isPaid && !isPartial && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Unpaid</span>}
                                      {teamStatus.last_payment_date && <span className="text-xs text-gray-500">{formatDate(teamStatus.last_payment_date)}</span>}
                                    </div>
                                    {teamStatus.total_paid > 0 && <p className="text-sm text-emerald-600 font-semibold">Paid: {formatCurrency(parseFloat(teamStatus.total_paid))}</p>}
                                  </div>
                                )}
                                
                                {unpaidAmount > 0 && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm font-semibold text-yellow-800">⚠️ Unpaid: {formatCurrency(unpaidAmount)}</p>
                                  </div>
                                )}
                                
                                {unpaidAmount > 0 && (
                                  <button 
                                    onClick={() => handlePayNow({}, 'other_team')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-semibold text-sm mb-2"
                                  >
                                    <DollarSign size={16} /> Pay Other Members
                                  </button>
                                )}
                                
                                <button 
                                  onClick={() => handleViewHistory({ payment_type: 'other_team' }, 'other_team')}
                                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm"
                                >
                                  View History
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-white rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Distribution Breakdown:</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accountant (40%):</span>
                            <span className="font-semibold text-purple-600">6% of total</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">IT Specialist (40%):</span>
                            <span className="font-semibold text-blue-600">6% of total</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Other Members (20%):</span>
                            <span className="font-semibold text-pink-600">3% of total</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Team Share:</span>
                            <span className="font-semibold text-gray-900">15% of total</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Original Table (Hidden by default, can be shown if needed) */}
                <div className="overflow-x-auto hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consultant (75%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website (10%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team (15%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {earnings.map((e) => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{e.consultant_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{e.consultant_email}</td>
                          <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(parseFloat(e.amount))}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatCurrency(parseFloat(e.net_earning))}</td>
                          <td className="px-4 py-3 text-sm text-blue-600">{e.website_fee ? formatCurrency(parseFloat(e.website_fee)) : '-'}</td>
                          <td className="px-4 py-3 text-sm text-purple-600">{e.team_fee ? formatCurrency(parseFloat(e.team_fee)) : '-'}</td>
                          <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${e.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{e.payment_status}</span></td>
                          <td className="px-4 py-3 text-sm">
                            {e.payment_status === 'pending' && (
                              <button onClick={() => markAsPaid(e.id)} className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                                <Check size={16} /> Pay
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold">Expenses</h2>
                  <button onClick={() => setShowAddExpense(true)} className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    <Plus size={18} /> Add Expense
                  </button>
                </div>
                
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-3">
                  {expenses.length > 0 ? (
                    expenses.map((e) => (
                      <div key={e.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            {e.category}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${e.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {e.status}
                          </span>
                        </div>
                        <div className="mb-2">
                          <p className="text-lg font-bold text-red-600">{formatCurrency(parseFloat(e.amount))}</p>
                          <p className="text-xs text-gray-500">{formatDate(e.expense_date)}</p>
                        </div>
                        {e.description && (
                          <p className="text-sm text-gray-600 mb-3">{e.description}</p>
                        )}
                        <div className="flex gap-2 pt-2 border-t">
                          <button 
                            onClick={() => handleEditExpense(e)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button 
                            onClick={() => { setSelectedExpense(e); setShowDeleteConfirm(true); }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-base">No expenses found</p>
                      <p className="text-sm mt-2">Click "Add Expense" to create your first expense</p>
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {expenses.length > 0 ? (
                        expenses.map((e) => (
                          <tr key={e.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{formatDate(e.expense_date)}</td>
                            <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{e.category}</span></td>
                            <td className="px-4 py-3 text-sm text-gray-600">{e.description || '-'}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatCurrency(parseFloat(e.amount))}</td>
                            <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${e.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{e.status}</span></td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEditExpense(e)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit expense"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedExpense(e); setShowDeleteConfirm(true); }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete expense"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                            <p className="text-lg">No expenses found</p>
                            <p className="text-sm mt-2">Click "Add Expense" to create your first expense</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Add Transaction Modal */}
        {showAddTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white sm:rounded-2xl shadow-2xl sm:max-w-2xl w-full h-full sm:h-auto p-4 sm:p-6 md:p-8 sm:my-8">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Add Transaction</h3>
                <button onClick={() => setShowAddTransaction(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <form onSubmit={handleAddTransaction} className="space-y-3 sm:space-y-4">
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Type</label>
                    <select value={transactionForm.transaction_type} onChange={(e) => setTransactionForm({...transactionForm, transaction_type: e.target.value})} className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base" required>
                      <option value="consultation_fee">Consultation Fee</option>
                      <option value="partnership_payment">Partnership Payment (International)</option>
                      <option value="grant">Grant/Donation</option>
                      <option value="other">Other Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Amount ($)</label>
                    <input type="number" step="0.01" value={transactionForm.amount} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base" required />
                  </div>
                  {transactionForm.transaction_type === 'consultation_fee' && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Consultant</label>
                      <select value={transactionForm.consultant_id} onChange={(e) => setTransactionForm({...transactionForm, consultant_id: e.target.value})} className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base" required>
                        <option value="">Select Consultant</option>
                        {consultants.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Payment Method</label>
                    <select value={transactionForm.payment_method} onChange={(e) => setTransactionForm({...transactionForm, payment_method: e.target.value})} className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base">
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Date</label>
                    <input type="date" value={transactionForm.transaction_date} onChange={(e) => setTransactionForm({...transactionForm, transaction_date: e.target.value})} className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Description</label>
                  <textarea value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base" rows={3} />
                </div>
                
                {/* Team Distribution Checkbox - Only show for non-consultation transactions */}
                {transactionForm.transaction_type !== 'consultation_fee' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <label className="flex items-start sm:items-center gap-2 sm:gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={transactionForm.distribute_to_team}
                        onChange={(e) => setTransactionForm({...transactionForm, distribute_to_team: e.target.checked})}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5 sm:mt-0"
                      />
                      <div>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">Distribute to Team Members</span>
                        <p className="text-xs sm:text-sm text-gray-600">Check this to give 15% team share (Accountant 6%, IT 6%, Others 3%)</p>
                      </div>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Receipt Photo (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setTransactionForm({...transactionForm, receipt_photo: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm"
                  />
                  {transactionForm.receipt_photo && (
                    <p className="text-xs sm:text-sm text-green-600 flex items-center gap-1 mt-2">
                      <Upload size={14} /> Photo selected
                    </p>
                  )}
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <button type="button" onClick={() => setShowAddTransaction(false)} className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-200 rounded-lg hover:bg-gray-300 text-xs sm:text-base font-medium">Cancel</button>
                  <button type="submit" className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-base font-medium"><Save size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Add Transaction</span><span className="sm:hidden">Add</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showEditTransaction && selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white sm:rounded-2xl shadow-2xl sm:max-w-2xl w-full h-full sm:h-auto p-4 sm:p-8 sm:my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Edit Transaction</h3>
                <button onClick={() => { setShowEditTransaction(false); setSelectedTransaction(null); }}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <form onSubmit={handleUpdateTransaction} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select value={transactionForm.transaction_type} onChange={(e) => setTransactionForm({...transactionForm, transaction_type: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required>
                      <option value="consultation_fee">Consultation Fee</option>
                      <option value="partnership_payment">Partnership Payment (International)</option>
                      <option value="grant">Grant/Donation</option>
                      <option value="other">Other Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount ($)</label>
                    <input type="number" step="0.01" value={transactionForm.amount} onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  {transactionForm.transaction_type === 'consultation_fee' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Consultant</label>
                      <select value={transactionForm.consultant_id} onChange={(e) => setTransactionForm({...transactionForm, consultant_id: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required>
                        <option value="">Select Consultant</option>
                        {consultants.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <select value={transactionForm.payment_method} onChange={(e) => setTransactionForm({...transactionForm, payment_method: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input type="date" value={transactionForm.transaction_date} onChange={(e) => setTransactionForm({...transactionForm, transaction_date: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea value={transactionForm.description} onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Receipt Photo (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setTransactionForm({...transactionForm, receipt_photo: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  {(transactionForm.receipt_photo || selectedTransaction.receipt_photo) && (
                    <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
                      <Upload size={16} /> {transactionForm.receipt_photo ? 'New photo selected' : 'Has receipt'}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <button type="button" onClick={() => { setShowEditTransaction(false); setSelectedTransaction(null); }} className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors shadow-sm text-xs sm:text-base">Cancel</button>
                  <button type="submit" className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold transition-all shadow-md hover:shadow-lg text-xs sm:text-base"><Save size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Update Transaction</span><span className="sm:hidden">Update</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Transaction Confirmation */}
        {showDeleteTransactionConfirm && selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white sm:rounded-2xl shadow-2xl sm:max-w-md w-full h-full sm:h-auto p-4 sm:p-8 sm:my-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Transaction</h3>
                  <p className="text-sm text-gray-600 mt-1">This will also delete associated earnings</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this transaction?
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm"><span className="font-medium">Type:</span> {selectedTransaction.transaction_type.replace('_', ' ')}</p>
                  <p className="text-sm"><span className="font-medium">Amount:</span> {formatCurrency(parseFloat(selectedTransaction.amount))}</p>
                  <p className="text-sm"><span className="font-medium">Date:</span> {formatDate(selectedTransaction.transaction_date)}</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button 
                  onClick={() => { setShowDeleteTransactionConfirm(false); setSelectedTransaction(null); }}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors shadow-sm text-xs sm:text-base"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteTransaction}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg text-xs sm:text-base"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white sm:rounded-2xl shadow-2xl sm:max-w-2xl w-full h-full sm:h-auto p-4 sm:p-8 sm:my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Add Expense</h3>
                <button onClick={() => setShowAddExpense(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <input type="text" value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Office Supplies" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount ($)</label>
                    <input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors shadow-sm text-xs sm:text-base">Cancel</button>
                  <button type="submit" className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold transition-all shadow-md hover:shadow-lg text-xs sm:text-base"><Save size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Add Expense</span><span className="sm:hidden">Add</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Expense Modal */}
        {showEditExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white sm:rounded-2xl shadow-2xl sm:max-w-2xl w-full h-full sm:h-auto p-4 sm:p-8 sm:my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Edit Expense</h3>
                <button onClick={() => { setShowEditExpense(false); setSelectedExpense(null); }}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              <form onSubmit={handleUpdateExpense} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <input type="text" value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Office Supplies" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount ($)</label>
                    <input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" rows={3} />
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <button type="button" onClick={() => { setShowEditExpense(false); setSelectedExpense(null); }} className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors shadow-sm text-xs sm:text-base">Cancel</button>
                  <button type="submit" className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold transition-all shadow-md hover:shadow-lg text-xs sm:text-base"><Save size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Update Expense</span><span className="sm:hidden">Update</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white sm:rounded-2xl shadow-2xl sm:max-w-md w-full h-full sm:h-auto p-4 sm:p-8 sm:my-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Expense</h3>
                  <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete this expense?
                </p>
                {selectedExpense && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm"><span className="font-medium">Category:</span> {selectedExpense.category}</p>
                    <p className="text-sm"><span className="font-medium">Amount:</span> {formatCurrency(parseFloat(selectedExpense.amount))}</p>
                    <p className="text-sm"><span className="font-medium">Date:</span> {formatDate(selectedExpense.expense_date)}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button 
                  onClick={() => { setShowDeleteConfirm(false); setSelectedExpense(null); }}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors shadow-sm text-xs sm:text-base"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteExpense}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-md hover:shadow-lg text-xs sm:text-base"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPayee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white sm:rounded-2xl shadow-2xl sm:max-w-2xl w-full h-full sm:h-auto p-4 sm:p-8 sm:my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Make Payment</h3>
                <button onClick={() => { setShowPaymentModal(false); setSelectedPayee(null); }}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Payment To:</h4>
                <p className="text-lg font-bold text-gray-900">{selectedPayee.consultant_name || selectedPayee.payment_type}</p>
                {selectedPayee.consultant_email && <p className="text-sm text-gray-600">{selectedPayee.consultant_email}</p>}
                {selectedPayee.total_assignments && (
                  <p className="text-sm text-gray-600 mt-1">{selectedPayee.total_assignments} assignments completed</p>
                )}
              </div>

              <form onSubmit={handleMakePayment} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={paymentForm.amount} 
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} 
                      className="w-full px-4 py-2 border rounded-lg" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <select 
                      value={paymentForm.payment_method} 
                      onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})} 
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Reference / Transaction ID</label>
                  <input 
                    type="text" 
                    value={paymentForm.payment_reference} 
                    onChange={(e) => setPaymentForm({...paymentForm, payment_reference: e.target.value})} 
                    className="w-full px-4 py-2 border rounded-lg" 
                    placeholder="TX-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                  <textarea 
                    value={paymentForm.notes} 
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} 
                    className="w-full px-4 py-2 border rounded-lg" 
                    rows={3}
                    placeholder="Add any notes about this payment..."
                  />
                </div>
                <div className="flex gap-3 sm:gap-4">
                  <button type="button" onClick={() => { setShowPaymentModal(false); setSelectedPayee(null); }} className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors shadow-sm text-xs sm:text-base">Cancel</button>
                  <button type="submit" className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:bg-emerald-800 flex items-center justify-center gap-1.5 sm:gap-2 font-semibold transition-all shadow-md hover:shadow-lg text-xs sm:text-base"><DollarSign size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Confirm Payment</span><span className="sm:hidden">Confirm</span></button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment History Modal */}
        {showPaymentHistory && selectedPayee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white sm:rounded-2xl shadow-2xl sm:max-w-4xl w-full h-full sm:h-auto p-4 sm:p-8 sm:my-8 sm:max-h-[90vh] sm:overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold">Payment History</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedPayee.consultant_name || selectedPayee.payment_type}</p>
                </div>
                <button onClick={() => { setShowPaymentHistory(false); setSelectedPayee(null); }}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
              </div>
              
              {paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {paymentHistory.map((payment: any) => (
                    <div key={payment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(payment.amount))}</p>
                          <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Paid</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-gray-500">Method:</span>
                          <span className="ml-2 font-medium">{payment.payment_method}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reference:</span>
                          <span className="ml-2 font-medium">{payment.payment_reference || '-'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Period:</span>
                          <span className="ml-2 font-medium">{formatDate(payment.period_start)} - {formatDate(payment.period_end)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Paid by:</span>
                          <span className="ml-2 font-medium">{payment.paid_by_name}</span>
                        </div>
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 mt-6">
                    <p className="font-semibold text-gray-900">Total Paid: {formatCurrency(paymentHistory.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0))}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No payment history</p>
                  <p className="text-sm mt-2">Payments will appear here once made</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Preview Modal */}
        {showReportPreview && reportData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📄 Report Preview</h2>
                <button onClick={() => setShowReportPreview(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {/* Preview Content */}
              <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                {/* Header */}
                <div className="text-center border-b-4 border-emerald-600 pb-6 mb-6">
                  <div className="flex items-center justify-center gap-5 mb-4">
                    <svg className="h-16 w-auto" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="256" cy="220" r="140" fill="none" stroke="#117864" strokeWidth="20"/>
                      <rect x="236" y="150" width="40" height="100" fill="#117864" rx="4"/>
                      <rect x="206" y="180" width="100" height="40" fill="#117864" rx="4"/>
                      <circle cx="210" cy="240" r="18" fill="#117864"/>
                      <path d="M 190 265 Q 210 255 230 265 L 230 280 L 190 280 Z" fill="#117864"/>
                      <circle cx="302" cy="240" r="18" fill="#117864"/>
                      <path d="M 282 265 Q 302 255 322 265 L 322 280 L 282 280 Z" fill="#117864"/>
                      <path d="M 340 300 L 380 340 L 360 300 Z" fill="#117864"/>
                    </svg>
                    <h1 className="text-3xl font-bold text-emerald-600">MEDCONSULT LIBERIA</h1>
                  </div>
                  <p className="text-xl mt-2 font-semibold">Financial Report</p>
                  <p className="text-gray-600 mt-2">Generated: {reportData.reportDate}</p>
                </div>

                {/* Financial Summary */}
                <div className="mb-6">
                  <div className="bg-emerald-600 text-white px-4 py-2 font-bold text-lg mb-4">FINANCIAL SUMMARY</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.stats.totalRevenue)}</p>
                    </div>
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.stats.totalExpenses)}</p>
                    </div>
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Consultant Shares</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.consultantTotal)}</p>
                    </div>
                    <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Team Shares</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(reportData.totalTeamFee)}</p>
                    </div>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="mb-6">
                  <div className="bg-emerald-600 text-white px-4 py-2 font-bold text-lg mb-4">NET PROFIT CALCULATION</div>
                  <div className="bg-emerald-50 border-2 border-emerald-600 rounded-lg p-6">
                    <div className="space-y-2">
                      <p>Total Revenue: <strong>{formatCurrency(reportData.stats.totalRevenue)}</strong></p>
                      <p>- Total Expenses: <strong className="text-red-600">{formatCurrency(reportData.stats.totalExpenses)}</strong></p>
                      <p>- Consultant Shares: <strong className="text-blue-600">{formatCurrency(reportData.consultantTotal)}</strong></p>
                      <p>- Team Shares: <strong className="text-purple-600">{formatCurrency(reportData.totalTeamFee)}</strong></p>
                      <div className="border-t-2 border-emerald-600 mt-4 pt-4">
                        <p className="text-xl font-bold text-emerald-600">Net Profit (Website): {formatCurrency(reportData.netProfit)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consultant Breakdown */}
                <div className="mb-6">
                  <div className="bg-emerald-600 text-white px-4 py-2 font-bold text-lg mb-4">CONSULTANT BREAKDOWN</div>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Consultant Name</th>
                          <th className="px-3 py-2 text-left">Assignments</th>
                          <th className="px-3 py-2 text-left">Total Earnings</th>
                          <th className="px-3 py-2 text-left">Paid</th>
                          <th className="px-3 py-2 text-left">Unpaid</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.consultantSummary.map((c: any, i: number) => {
                          const status = reportData.paymentStatus?.consultants?.find((p: any) => p.consultant_id === c.consultant_id);
                          const totalPaid = parseFloat(status?.total_paid || 0);
                          const unpaid = parseFloat(c.consultant_share) - totalPaid;
                          const paymentStatus = unpaid <= 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
                          return (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2">{c.consultant_name}</td>
                              <td className="px-3 py-2">{c.total_assignments}</td>
                              <td className="px-3 py-2 font-bold">{formatCurrency(c.consultant_share)}</td>
                              <td className="px-3 py-2 font-bold text-green-600">{formatCurrency(totalPaid)}</td>
                              <td className="px-3 py-2 font-bold text-red-600">{formatCurrency(unpaid)}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  paymentStatus === 'partial' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {paymentStatus === 'paid' ? '✓ Paid' : paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Team Distribution */}
                <div className="mb-6">
                  <div className="bg-emerald-600 text-white px-4 py-2 font-bold text-lg mb-4">TEAM SHARE DISTRIBUTION</div>
                  <p className="mb-3 font-semibold">Total Team Share: {formatCurrency(reportData.totalTeamFee)}</p>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Team Member</th>
                          <th className="px-3 py-2 text-left">Percentage</th>
                          <th className="px-3 py-2 text-left">Total Earned</th>
                          <th className="px-3 py-2 text-left">Paid</th>
                          <th className="px-3 py-2 text-left">Unpaid</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'CEO', type: 'ceo', percent: 40/95 },
                          { name: 'IT Specialist', type: 'it_specialist', percent: 25/95 },
                          { name: 'Accountant', type: 'accountant', percent: 15/95 },
                          { name: 'Other Members', type: 'other_team', percent: 15/95 }
                        ].map((member, i) => {
                          const earned = reportData.totalTeamFee * member.percent;
                          const status = reportData.paymentStatus?.team?.find((t: any) => t.payment_type === member.type);
                          const totalPaid = parseFloat(status?.total_paid || 0);
                          const unpaid = earned - totalPaid;
                          const paymentStatus = unpaid <= 0 ? 'paid' : (totalPaid > 0 ? 'partial' : 'unpaid');
                          return (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2">{member.name}</td>
                              <td className="px-3 py-2">{Math.round(member.percent * 95)}%</td>
                              <td className="px-3 py-2 font-bold">{formatCurrency(earned)}</td>
                              <td className="px-3 py-2 font-bold text-green-600">{formatCurrency(totalPaid)}</td>
                              <td className="px-3 py-2 font-bold text-red-600">{formatCurrency(unpaid)}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  paymentStatus === 'partial' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {paymentStatus === 'paid' ? '✓ Paid' : paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center border-t-2 border-gray-300 pt-6 mt-6 text-gray-600 text-sm">
                  <p className="font-bold">MEDCONSULT LIBERIA</p>
                  <p>Report generated by Accountant Dashboard</p>
                  <p>Date: {reportData.reportDate}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowReportPreview(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={downloadPDFReport}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-lg"
                >
                  📥 Download Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Request Modal */}
        {showPasswordChangeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Request Password Change</h2>
                <button onClick={() => setShowPasswordChangeModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>🔐 Security Notice:</strong> Password changes require admin approval. 
                  Your request will be reviewed by the administrator before being processed.
                </p>
              </div>

              <form onSubmit={handlePasswordChangeRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for Change</label>
                  <textarea
                    value={passwordChangeRequest.reason}
                    onChange={(e) => setPasswordChangeRequest({...passwordChangeRequest, reason: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Please explain why you need to change your password..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordChangeRequest.newPassword}
                    onChange={(e) => setPasswordChangeRequest({...passwordChangeRequest, newPassword: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Enter new password (min 6 characters)"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordChangeRequest.confirmPassword}
                    onChange={(e) => setPasswordChangeRequest({...passwordChangeRequest, confirmPassword: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPasswordChangeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modern Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-24 sm:bottom-8 right-8 z-50 animate-slide-up">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
              toast.type === 'success' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-red-600'
            } text-white min-w-[300px]`}>
              <div className="text-2xl">
                {toast.type === 'success' ? '✓' : '✕'}
              </div>
              <div className="flex-1 font-medium">{toast.message}</div>
              <button 
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-40">
          <div className="flex items-center justify-around px-1 py-2">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${activeTab === 'overview' ? 'text-emerald-600' : 'text-gray-600'}`}
            >
              <BarChart3 size={22} />
              <span className="text-[10px] font-medium">Dashboard</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('earnings')}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${activeTab === 'earnings' ? 'text-emerald-600' : 'text-gray-600'}`}
            >
              <FileText size={22} />
              <span className="text-[10px] font-medium">Earnings</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('transactions')}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${activeTab === 'transactions' ? 'text-emerald-600' : 'text-gray-600'}`}
            >
              <MessageSquare size={22} />
              <span className="text-[10px] font-medium">Transactions</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('all payments')}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${activeTab === 'all payments' ? 'text-emerald-600' : 'text-gray-600'}`}
            >
              <Bell size={22} />
              <span className="text-[10px] font-medium">Payments</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('expenses')}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${activeTab === 'expenses' ? 'text-emerald-600' : 'text-gray-600'}`}
            >
              <TrendingDown size={22} />
              <span className="text-[10px] font-medium">Expenses</span>
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <X size={32} className="text-red-600" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2">
                Logout Confirmation
              </h3>
              
              <p className="text-gray-600 text-center mb-6 sm:mb-8">
                Are you sure you want to logout? You will need to login again to access your dashboard.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    router.push('/login');
                  }}
                  className="flex-1 px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors shadow-lg text-sm sm:text-base"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
