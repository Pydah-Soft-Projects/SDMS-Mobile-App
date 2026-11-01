import api from '../config/api';
import { FeeSummary, FeeTransaction } from '../types';

export const feeService = {
  /**
   * Fetch detailed fee structure for student
   * Endpoint: GET /api/fees/students/:studentId/details
   */
  async getStudentFeeDetails(studentId: number): Promise<{
    summary: FeeSummary;
    headers: any[];
    transactions: FeeTransaction[];
  }> {
    const response = await api.get(`/fees/students/${studentId}/details`);
    const data = response.data;
    return {
      summary: {
        totalFee: Number(data.totalFee || data.total_amount || 0),
        paidFee: Number(data.paidFee || data.paid_amount || 0),
        dueFee: Number(data.dueFee || data.due_amount || (data.totalFee - data.paidFee) || 0),
        dueDate: data.dueDate,
        scholarship: Number(data.scholarship || 0),
        concession: Number(data.concession || 0),
      },
      headers: data.headers || [],
      transactions: (data.transactions || []).map((t: any) => ({
        id: t.id || t.payment_id,
        receiptNumber: t.receipt_number || t.receiptNo || `REC-${t.id}`,
        amount: Number(t.amount || 0),
        date: t.created_at || t.payment_date || new Date().toISOString(),
        paymentMode: t.payment_mode || t.method || 'ONLINE',
        status: t.status === 'success' || t.status === 'captured' ? 'SUCCESS' : t.status || 'SUCCESS',
        semester: t.semester,
      })),
    };
  },

  /**
   * Create fee payment order with Pydah Payment Gateway (PPG)
   * Endpoint: POST /api/payments/create-order
   */
  async createPaymentOrder(payload: {
    amount: number;
    feeHeaderId?: number;
    studentId: number;
    notes?: string;
  }) {
    const response = await api.post('/payments/create-order', payload);
    return response.data; // contains paymentId, checkoutUrl, orderId, razorpayKey
  },

  /**
   * Check payment status
   * Endpoint: GET /api/payments/status/:paymentId
   */
  async getPaymentStatus(paymentId: string) {
    const response = await api.get(`/payments/status/${paymentId}`);
    return response.data;
  },
};

export default feeService;

