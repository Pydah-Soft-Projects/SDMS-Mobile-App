import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CreditCard, CheckCircle, Clock, ShieldCheck, Download } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import CustomButton from '../../src/components/CustomButton';
import feeService from '../../src/services/feeService';
import { FeeSummary, FeeTransaction } from '../../src/types';

export default function FeesScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);

  const [summary, setSummary] = useState<FeeSummary>({
    totalFee: 75000,
    paidFee: 50000,
    dueFee: 25000,
    dueDate: '2026-11-30',
    concession: 5000,
  });

  const [transactions, setTransactions] = useState<FeeTransaction[]>([
    {
      id: 'tx_101',
      receiptNumber: 'REC-2026-8812',
      amount: 25000,
      date: '2026-08-15',
      paymentMode: 'PPG Online (UPI)',
      status: 'SUCCESS',
      semester: 1,
    },
    {
      id: 'tx_102',
      receiptNumber: 'REC-2026-9430',
      amount: 25000,
      date: '2026-09-20',
      paymentMode: 'PPG Netbanking',
      status: 'SUCCESS',
      semester: 1,
    },
  ]);

  const loadFeeData = async () => {
    if (user?.id) {
      try {
        const res = await feeService.getStudentFeeDetails(user.id);
        if (res?.summary) setSummary(res.summary);
        if (res?.transactions?.length) setTransactions(res.transactions);
      } catch (e) {
        console.warn('Could not load fee data from backend', e);
      }
    }
  };

  useEffect(() => {
    loadFeeData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeData();
    setRefreshing(false);
  };

  const handlePayNow = async () => {
    if (summary.dueFee <= 0) {
      Alert.alert('No Dues', 'All fees for the current term have been cleared.');
      return;
    }

    setPaying(true);
    try {
      const order = await feeService.createPaymentOrder({
        amount: summary.dueFee,
        studentId: user?.id || 0,
        notes: `Mobile App Term Fee Payment for ${user?.name || 'Student'}`,
      });

      if (order?.checkoutUrl) {
        Alert.alert(
          'PPG Payment Gateway',
          `Order created #${order.paymentId || order.orderId}. Initiating checkout: ${order.checkoutUrl}`
        );
      } else {
        Alert.alert('Payment Order Initiated', 'Order generated successfully.');
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.response?.data?.message || 'Failed to initialize payment gateway.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Fee Management" subtitle="Dues & Payment Ledger" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Due Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.dueHeader}>
            <View>
              <Text style={styles.dueLabel}>Current Pending Due</Text>
              <Text style={styles.dueAmount}>₹{summary.dueFee.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.dueBadge}>
              <Clock size={16} color="#B45309" />
              <Text style={styles.dueBadgeText}>Due by {summary.dueDate || 'End of Term'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.feeBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Total Fee</Text>
              <Text style={styles.breakdownVal}>₹{summary.totalFee.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Paid</Text>
              <Text style={[styles.breakdownVal, { color: '#059669' }]}>
                ₹{summary.paidFee.toLocaleString('en-IN')}
              </Text>
            </View>
            {summary.concession ? (
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Concession</Text>
                <Text style={[styles.breakdownVal, { color: '#2563EB' }]}>
                  ₹{summary.concession.toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}
          </View>

          <CustomButton
            title={`Pay ₹${summary.dueFee.toLocaleString('en-IN')} via PPG`}
            onPress={handlePayNow}
            isLoading={paying}
            disabled={summary.dueFee <= 0}
            icon={<CreditCard size={18} color="#FFFFFF" />}
            style={{ marginTop: 16 }}
          />

          <View style={styles.secureTag}>
            <ShieldCheck size={14} color="#059669" />
            <Text style={styles.secureTagText}>
              Secured by Pydah Payment Gateway (PPG)
            </Text>
          </View>
        </View>

        {/* Transactions / Receipts List */}
        <Text style={styles.sectionTitle}>Payment Receipts</Text>

        {transactions.map((tx) => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txIcon}>
              <CheckCircle size={22} color="#059669" />
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txNumber}>{tx.receiptNumber}</Text>
              <Text style={styles.txSub}>
                {tx.date.substring(0, 10)} • {tx.paymentMode}
              </Text>
            </View>
            <View style={styles.txAmountCol}>
              <Text style={styles.txAmount}>₹{tx.amount.toLocaleString('en-IN')}</Text>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() =>
                  Alert.alert('Receipt Download', `Receipt ${tx.receiptNumber} will be generated.`)
                }
              >
                <Download size={14} color="#1E3A8A" />
                <Text style={styles.downloadText}>Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dueLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  dueAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 4,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  feeBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  breakdownVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  secureTagText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txIcon: {
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  downloadText: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600',
  },
});

