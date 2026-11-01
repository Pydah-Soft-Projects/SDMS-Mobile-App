import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CreditCard, CheckCircle2, Clock, ShieldCheck, Download, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import CustomButton from '../../src/components/CustomButton';
import studentService from '../../src/services/studentService';
import feeService from '../../src/services/feeService';
import { StudentFeeDetails } from '../../src/types';
import logger from '../../src/utils/logger';

export default function FeesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [feeDetails, setFeeDetails] = useState<StudentFeeDetails | null>(null);

  const admissionNo = (user as any)?.admission_number || (user as any)?.pin_no;

  const loadFeeData = async () => {
    if (!admissionNo) {
      setLoading(false);
      return;
    }
    logger.info('FEES_SCREEN', `Fetching fee records for: ${admissionNo}`);
    try {
      const data = await studentService.getFeeDetails(admissionNo);
      setFeeDetails(data);
    } catch (e: any) {
      logger.error('FEES_SCREEN', 'Failed to load fee details', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeData();
    setRefreshing(false);
  };

  const dueAmount = feeDetails?.dueAmount || 0;
  const paidAmount = feeDetails?.paidAmount || 0;
  const totalAmount = feeDetails?.totalAmount || 0;
  const feeHeaders = feeDetails?.feeHeaders || [];
  const transactions = feeDetails?.transactions || [];

  const handlePayNow = async () => {
    if (dueAmount <= 0) {
      Alert.alert('No Dues', 'All fees have been cleared for this academic term.');
      return;
    }

    setPaying(true);
    try {
      const order = await feeService.createPaymentOrder({
        amount: dueAmount,
        studentId: user?.id || 0,
        notes: `Mobile App Term Fee Payment for ${user?.name || admissionNo}`,
      });

      if (order?.checkoutUrl) {
        Alert.alert(
          'PPG Payment Gateway',
          `Order #${order.paymentId || order.orderId} generated.\n\nOpening Checkout:\n${order.checkoutUrl}`
        );
      } else {
        Alert.alert('Payment Order', 'Payment gateway order initiated.');
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.response?.data?.message || 'Failed to initialize payment gateway.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Fee Management" subtitle="SDMS Financial Records & Dues" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Syncing fee details from SDMS...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Main Due Card */}
          <View style={styles.summaryCard}>
            <View style={styles.dueHeader}>
              <View>
                <Text style={styles.dueLabel}>Current Outstanding Due</Text>
                <Text
                  style={[
                    styles.dueAmount,
                    { color: dueAmount > 0 ? '#DC2626' : '#059669' },
                  ]}
                >
                  ₹{dueAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View
                style={[
                  styles.dueBadge,
                  { backgroundColor: dueAmount > 0 ? '#FEF3C7' : '#DCFCE7' },
                ]}
              >
                <Clock size={14} color={dueAmount > 0 ? '#B45309' : '#15803D'} />
                <Text
                  style={[
                    styles.dueBadgeText,
                    { color: dueAmount > 0 ? '#B45309' : '#15803D' },
                  ]}
                >
                  {dueAmount > 0 ? 'Payment Due' : 'All Cleared'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.feeBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Total Assessment</Text>
                <Text style={styles.breakdownVal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Total Paid</Text>
                <Text style={[styles.breakdownVal, { color: '#059669' }]}>
                  ₹{paidAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {dueAmount > 0 && (
              <CustomButton
                title={`Pay ₹${dueAmount.toLocaleString('en-IN')} via PPG`}
                onPress={handlePayNow}
                isLoading={paying}
                icon={<CreditCard size={18} color="#FFFFFF" />}
                style={{ marginTop: 16 }}
              />
            )}

            <View style={styles.secureTag}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.secureTagText}>
                Official Pydah Payment Gateway (PPG) Integration
              </Text>
            </View>
          </View>

          {/* Fee Heads Breakdown */}
          {feeHeaders.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Fee Breakdown by Head</Text>
              <View style={styles.headersList}>
                {feeHeaders.map((head, i) => (
                  <View key={head.id || i} style={styles.headCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.headTitle}>{head.name}</Text>
                      {head.year && (
                        <Text style={styles.headYear}>Academic Year {head.year}</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.headTotal}>₹{head.amount.toLocaleString('en-IN')}</Text>
                      {head.dueAmount !== undefined && head.dueAmount > 0 ? (
                        <Text style={styles.headDue}>Due: ₹{head.dueAmount.toLocaleString('en-IN')}</Text>
                      ) : (
                        <Text style={styles.headPaid}>Paid in full</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Payment Receipts History */}
          <Text style={styles.sectionTitle}>Payment Receipts ({transactions.length})</Text>

          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txIcon}>
                  <CheckCircle2 size={22} color="#059669" />
                </View>
                <View style={styles.txDetails}>
                  <Text style={styles.txNumber}>{tx.receiptNumber}</Text>
                  <Text style={styles.txSub}>
                    {new Date(tx.date).toLocaleDateString('en-IN')} • {tx.paymentMode}
                  </Text>
                </View>
                <View style={styles.txAmountCol}>
                  <Text style={styles.txAmount}>₹{tx.amount.toLocaleString('en-IN')}</Text>
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() =>
                      Alert.alert('Official Receipt', `Receipt No: ${tx.receiptNumber}\nAmount: ₹${tx.amount}\nStatus: ${tx.status}`)
                    }
                  >
                    <Download size={12} color="#1E3A8A" />
                    <Text style={styles.downloadText}>Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No payment transactions recorded yet.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
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
    marginTop: 4,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  feeBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    fontSize: 16,
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
    marginTop: 8,
  },
  headersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  headCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 8,
  },
  headTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  headYear: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  headTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  headDue: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  headPaid: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
