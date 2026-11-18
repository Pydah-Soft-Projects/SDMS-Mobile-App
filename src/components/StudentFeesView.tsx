import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  X,
  FileText,
  ShieldCheck,
  Receipt,
  RotateCw,
} from 'lucide-react-native';
import api from '../config/api';
import feeService from '../services/feeService';
import logger from '../utils/logger';

interface StudentFeesViewProps {
  admissionNo?: string;
  user?: any;
  nested?: boolean; // if true, does not wrap in its own ScrollView
}

const isClubFeeInvoice = (invoice: any) => {
  const feeHeadName = String(
    typeof invoice?.feeHead === 'object' ? invoice.feeHead?.name || '' : ''
  )
    .trim()
    .toLowerCase();
  const remarks = String(invoice?.remarks || '').trim().toLowerCase();
  return (
    String(invoice?.feeHead?.code || '').toUpperCase() === 'CF' ||
    feeHeadName.startsWith('club fee') ||
    /^club\s*fee\s*[:\-–]/i.test(remarks)
  );
};

const getClubNameFromRemarks = (remarks: any) =>
  String(remarks || '')
    .replace(/^\s*(?:club\s*fee\s*[:\-–]\s*)+/i, '')
    .trim();

const getClubNameFromInvoice = (invoice: any) =>
  getClubNameFromRemarks(invoice?.remarks) ||
  String(invoice?.feeHead?.name || '')
    .replace(/^\s*club\s*fee\s*[:\-–]\s*/i, '')
    .trim() ||
  'Club';

const calculateInvoicePaid = (
  invoice: any,
  transactions: any[] = [],
  allInvoices: any[] = []
) => {
  if (isClubFeeInvoice(invoice) && invoice.status === 'cancelled') return 0;

  let paid = 0;
  const isServiceFee =
    invoice.feeHead?.code === 'SSF' ||
    invoice.feeHead?.name === 'Student Services FEE';
  const isClubFee = isClubFeeInvoice(invoice);
  const clubName = isClubFee ? getClubNameFromRemarks(invoice.remarks) : '';

  const invoiceHeadId = invoice.feeHead?._id || invoice.feeHead;
  const invoiceHeadName = invoice.feeHead?.name?.toLowerCase() || '';

  const sameHeadInvoicesInYear = allInvoices.filter((inv) => {
    const invHeadId = inv.feeHead?._id || inv.feeHead;
    const invHeadName = inv.feeHead?.name?.toLowerCase() || '';
    const sameHead =
      (invoiceHeadId &&
        invHeadId &&
        String(invoiceHeadId) === String(invHeadId)) ||
      (invoiceHeadName && invHeadName && invoiceHeadName === invHeadName);
    return (
      sameHead &&
      inv.studentYear?.toString() === invoice.studentYear?.toString()
    );
  });
  const hasMultipleSemInvoices = sameHeadInvoicesInYear.length > 1;

  transactions.forEach((transaction) => {
    if (transaction.status && transaction.status !== 'active') return;
    let isServiceMatch = false;
    if (isServiceFee && invoice.remarks) {
      const refMatch = invoice.remarks.match(/\(Ref: (\d+)\)/);
      if (refMatch && transaction.remarks) {
        isServiceMatch =
          transaction.remarks.includes(`Ref: ${refMatch[1]}`) ||
          transaction.remarks.includes(`SR-${refMatch[1]}`);
      }
    }

    const transactionHeadId = transaction.feeHead?._id || transaction.feeHead;
    const transactionHeadName = transaction.feeHead?.name?.toLowerCase() || '';

    const sameFeeHead =
      (invoiceHeadId &&
        transactionHeadId &&
        String(invoiceHeadId) === String(transactionHeadId)) ||
      (invoiceHeadName &&
        transactionHeadName &&
        invoiceHeadName === transactionHeadName) ||
      (invoice.feeHead?.code &&
        transaction.feeHead?.code &&
        invoice.feeHead.code.toUpperCase() ===
          transaction.feeHead.code.toUpperCase());

    const sameYear =
      !transaction.studentYear ||
      !invoice.studentYear ||
      transaction.studentYear?.toString() === invoice.studentYear?.toString();

    let sameSemester = true;
    if (hasMultipleSemInvoices && transaction.semester && invoice.semester) {
      sameSemester = transaction.semester.toString() === invoice.semester.toString();
    }

    if (!(sameFeeHead && sameYear && sameSemester) && !isServiceMatch) return;

    if (
      isClubFee &&
      clubName &&
      (!transaction.remarks ||
        !transaction.remarks.toLowerCase().includes(clubName.toLowerCase()))
    )
      return;

    if (isServiceFee && !isServiceMatch && invoice.remarks) {
      const refMatch = invoice.remarks.match(/\(Ref: (\d+)\)/);
      if (
        refMatch &&
        !transaction.remarks?.includes(`Ref: ${refMatch[1]}`) &&
        !transaction.remarks?.includes(`SR-${refMatch[1]}`)
      )
        return;
    }

    paid += Number(transaction.amount) || 0;
  });

  return paid;
};

const isCredit = (tx: any) => {
  const mode = tx.paymentMode?.toLowerCase() || '';
  const remark = tx.remarks?.toLowerCase() || '';
  return (
    mode.includes('waiver') ||
    mode.includes('adjustment') ||
    mode.includes('concession') ||
    mode.includes('credit') ||
    remark.includes('concession') ||
    remark.includes('scholarship') ||
    remark.includes('credit')
  );
};

const formatNumber = (amount: any) => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN').format(val);
};

export default function StudentFeesView({
  admissionNo,
  user,
  nested = false,
}: StudentFeesViewProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feeData, setFeeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters matching web
  const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'Active Fees' | 'All Fees' | 'Cancelled Fees'>('Active Fees');
  const [txModeFilter, setTxModeFilter] = useState('All');
  const [txHeadFilter, setTxHeadFilter] = useState('All');

  // Accordion state (all open by default)
  const [expandedYears, setExpandedYears] = useState<{ [yr: number]: boolean }>({});

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<any>(null);
  const [payAmountInput, setPayAmountInput] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const targetAdmissionNo =
    admissionNo ||
    (user as any)?.admission_number ||
    (user as any)?.pin_no ||
    (user as any)?.admissionNumber ||
    (user as any)?.studentId ||
    (user as any)?.id;

  const fetchFeeDetails = useCallback(async () => {
    if (!targetAdmissionNo) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      logger.info('STUDENT_FEES_VIEW', `Fetching fee records for: ${targetAdmissionNo}`);
      const response = await api.get(`/fees/students/${targetAdmissionNo}/details`);

      if (response?.data?.success) {
        setFeeData(response.data);
        const currYear = response.data.studentDetails?.currentYear;
        if (currYear && selectedYear === 'All') {
          setSelectedYear(Number(currYear));
        }
      } else {
        setError(response?.data?.message || 'Failed to load fee details');
      }
    } catch (err: any) {
      logger.error('STUDENT_FEES_VIEW', 'Error fetching fee details', err.message);
      setError('Unable to fetch fee information. Please pull to refresh or retry.');
    } finally {
      setLoading(false);
    }
  }, [targetAdmissionNo]);

  useEffect(() => {
    fetchFeeDetails();
  }, [fetchFeeDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeeDetails();
    setRefreshing(false);
  };

  const toggleExpandYear = (yr: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [yr]: prev[yr] === undefined ? false : !prev[yr],
    }));
  };

  const { fees = [], transactions = [], studentDetails } = feeData || {};

  // Determine available academic years
  const availableYears = useMemo(() => {
    const set = new Set<number>([1, 2, 3, 4]);
    (fees || []).forEach((f: any) => {
      if (f.studentYear) set.add(Number(f.studentYear));
    });
    (transactions || []).forEach((t: any) => {
      if (t.studentYear) set.add(Number(t.studentYear));
    });
    if (studentDetails?.currentYear) {
      set.add(Number(studentDetails.currentYear));
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [fees, transactions, studentDetails]);

  // Year Stats Map
  const yearStatsMap = useMemo(() => {
    const map: { [yr: number]: any } = {};
    availableYears.forEach((yr) => {
      let total = 0;
      let paid = 0;
      let concession = 0;

      (fees || []).forEach((f: any) => {
        if (Number(f.studentYear) === Number(yr)) {
          if (f.status !== 'cancelled') {
            total += Number(f.amount) || 0;
          }
        }
      });

      (transactions || []).forEach((tx: any) => {
        if (tx.status && tx.status !== 'active') return;
        const txYr = Number(tx.studentYear);
        if (txYr && txYr !== Number(yr)) return;

        const amt = Number(tx.amount) || 0;
        if (tx.transactionType === 'CREDIT' || isCredit(tx)) {
          concession += amt;
        } else {
          paid += amt;
        }
      });

      const balance = Math.max(0, total - paid - concession);
      map[yr] = {
        total,
        paid,
        concession,
        balance,
        isPaid: balance <= 0,
      };
    });
    return map;
  }, [availableYears, fees, transactions]);

  // Overall totals across all active fees
  const overallStats = useMemo(() => {
    let total = 0;
    let paid = 0;
    let balance = 0;
    availableYears.forEach((yr) => {
      const stats = yearStatsMap[yr];
      if (stats) {
        total += stats.total;
        paid += stats.paid;
        balance += stats.balance;
      }
    });
    return { total, paid, balance };
  }, [availableYears, yearStatsMap]);

  // Filter invoices for a given year
  const getInvoicesForYear = (yr: number) => {
    let list = (fees || []).filter((f: any) => Number(f.studentYear) === Number(yr));

    if (feeStatusFilter === 'Active Fees') {
      list = list.filter((f: any) => f.status !== 'cancelled');
    } else if (feeStatusFilter === 'Cancelled Fees') {
      list = list.filter((f: any) => f.status === 'cancelled');
    }

    return list.map((inv: any, index: number) => {
      const paid = calculateInvoicePaid(inv, transactions, fees || []);
      const concession = 0;
      const totalFee = Number(inv.amount) || 0;
      const balance = Math.max(0, totalFee - paid - concession);

      let status = 'Unpaid';
      if (balance <= 0) {
        status = 'Paid';
      } else if (paid > 0) {
        status = 'Partial';
      }

      const isInstallmentBased =
        (inv.feeHead?.name || '').toLowerCase().includes('transport') ||
        (inv.feeHead?.name || '').toLowerCase().includes('bus') ||
        totalFee >= 10000;

      let t1Due = '—';
      let t2Due = '- - -';

      if (isInstallmentBased && totalFee > 0) {
        const term1Target = Math.round(totalFee / 2);
        const term2Target = totalFee - term1Target;

        const t1Bal = Math.max(0, term1Target - paid);
        const paidForT2 = Math.max(0, paid - term1Target);
        const t2Bal = Math.max(0, term2Target - paidForT2);

        t1Due = t1Bal > 0 ? formatNumber(t1Bal) : '—';
        t2Due = t2Bal > 0 ? formatNumber(t2Bal) : '—';
      } else {
        if (totalFee === 0) {
          t1Due = '—';
          t2Due = '- - -';
        } else {
          t1Due = balance > 0 ? formatNumber(balance) : '—';
          t2Due = '- - -';
        }
      }

      let headTitle = inv.feeHead?.name || 'Academic Fee';
      if (isClubFeeInvoice(inv)) {
        const clubName = getClubNameFromInvoice(inv);
        headTitle = `Club Fee - ${clubName}`;
      } else if (
        inv.feeHead?.code === 'SSF' ||
        inv.feeHead?.name === 'Student Services FEE'
      ) {
        if (inv.remarks) {
          headTitle = `Student Services FEE - ${inv.remarks.replace(/^Service Request:\s*/i, '')}`;
        } else {
          headTitle = 'Student Services FEE';
        }
      }

      const rowKey = inv._id || `inv-${yr}-${index}`;

      return {
        ...inv,
        rowKey,
        headTitle,
        yearSemLabel: `Year ${inv.studentYear} • Sem ${inv.semester || 1}`,
        totalFee,
        t1Due,
        t2Due,
        t1DueNum:
          t1Due !== '—' && t1Due !== '- - -'
            ? Number(String(t1Due).replace(/,/g, ''))
            : 0,
        t2DueNum:
          t2Due !== '—' && t2Due !== '- - -'
            ? Number(String(t2Due).replace(/,/g, ''))
            : 0,
        paid,
        concession,
        balance,
        status,
      };
    });
  };

  // Calculate totals for a given array of invoices
  const getYearTotals = (invoices: any[]) => {
    let totalFee = 0;
    let paid = 0;
    let concession = 0;
    let balance = 0;

    invoices.forEach((row) => {
      totalFee += row.totalFee || 0;
      paid += row.paid || 0;
      concession += row.concession || 0;
      balance += row.balance || 0;
    });

    const term1Target = Math.round(totalFee / 2);
    const term2Target = totalFee - term1Target;
    const t1Bal = Math.max(0, term1Target - paid);
    const paidForT2 = Math.max(0, paid - term1Target);
    const t2Bal = Math.max(0, term2Target - paidForT2);

    return {
      totalFee,
      paid,
      concession,
      balance,
      t1Due: t1Bal > 0 ? formatNumber(t1Bal) : '—',
      t2Due: t2Bal > 0 ? formatNumber(t2Bal) : '—',
    };
  };

  // Open Payment Modal for single invoice
  const openPaymentModal = (row: any) => {
    const parsedServiceId =
      row.feeHead?.code === 'SSF' && row.remarks
        ? row.remarks.match(/\(Ref:\s*(\d+)\)/)?.[1] ||
          row.remarks.match(/SR-(\d+)/)?.[1] ||
          null
        : null;

    setPaymentTarget({
      title: row.headTitle,
      feeHeadId: row.feeHead?._id || row.feeHead,
      studentYear: row.studentYear,
      semester: row.semester || 1,
      totalFee: row.totalFee,
      paid: row.paid,
      balance: row.balance,
      t1DueNum: row.t1DueNum || 0,
      t2DueNum: row.t2DueNum || 0,
      remarks: row.remarks || row.headTitle,
      serviceRequestId: parsedServiceId,
    });
    setPayAmountInput(String(row.balance));
    setPaymentModalOpen(true);
  };

  // Open Payment Modal for whole Year
  const openYearPaymentModal = (yr: number, yrTotals: any, yrInvoices: any[]) => {
    const pendingInvoices = yrInvoices.filter((i: any) => i.balance > 0);
    const firstPending = pendingInvoices[0];

    setPaymentTarget({
      title: `Year ${yr} Dues (${
        pendingInvoices.map((i: any) => i.headTitle).join(', ') || 'Academic Fees'
      })`,
      feeHeadId: firstPending?.feeHead?._id || firstPending?.feeHead,
      studentYear: yr,
      semester: firstPending?.semester || 1,
      totalFee: yrTotals.totalFee,
      paid: yrTotals.paid,
      balance: yrTotals.balance,
      t1DueNum: 0,
      t2DueNum: 0,
      remarks: `Year ${yr} Fee Payment`,
      serviceRequestId: null,
    });
    setPayAmountInput(String(yrTotals.balance));
    setPaymentModalOpen(true);
  };

  // Payment checkout trigger
  const handleConfirmPayment = async () => {
    const num = Number(payAmountInput);
    if (!num || isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    if (paymentTarget?.balance && num > paymentTarget.balance) {
      Alert.alert(
        'Amount Exceeded',
        `Payment amount cannot exceed the balance due of ₹${formatNumber(
          paymentTarget.balance
        )}.`
      );
      return;
    }

    try {
      setIsProcessingPayment(true);
      const studentIdNum =
        Number((user as any)?.id) ||
        Number(studentDetails?.id) ||
        0;

      const order = await feeService.createPaymentOrder({
        amount: num,
        studentId: studentIdNum,
        feeHeaderId: paymentTarget.feeHeadId,
        notes: `${paymentTarget.title} - Year ${paymentTarget.studentYear}`,
      });

      if (order?.checkoutUrl) {
        setPaymentModalOpen(false);
        await Linking.openURL(order.checkoutUrl);
      } else {
        Alert.alert(
          'Payment Order Created',
          `Order ID: ${order?.orderId || order?.paymentId || 'Active'}\nPlease complete payment in the portal.`
        );
        setPaymentModalOpen(false);
      }
      fetchFeeDetails();
    } catch (err: any) {
      logger.error('PAYMENT_CHECKOUT', 'Payment initiation error', err.message);
      Alert.alert(
        'Payment Gateway Notice',
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to initialize checkout gateway.'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let list = (transactions || []).filter((tx: any) => {
      if (selectedYear !== 'All') {
        if (!tx.studentYear) return Number(selectedYear) === 4;
        return Number(tx.studentYear) === Number(selectedYear);
      }
      return true;
    });

    if (txModeFilter !== 'All') {
      list = list.filter(
        (tx: any) =>
          (tx.paymentMode || '').toLowerCase() === txModeFilter.toLowerCase()
      );
    }

    if (txHeadFilter !== 'All') {
      list = list.filter(
        (tx: any) =>
          (tx.feeHead?.name || '').toLowerCase() === txHeadFilter.toLowerCase()
      );
    }

    return list;
  }, [transactions, selectedYear, txModeFilter, txHeadFilter]);

  const transactionFeeHeads = useMemo(() => {
    const heads = new Set<string>();
    (transactions || []).forEach((tx: any) => {
      if (tx.feeHead?.name) heads.add(tx.feeHead.name);
    });
    return Array.from(heads);
  }, [transactions]);

  // Loading indicator
  if (loading && !feeData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loaderText}>Syncing fee structure & records...</Text>
      </View>
    );
  }

  // Error state
  if (error && !feeData) {
    return (
      <View style={styles.errorBox}>
        <AlertCircle size={28} color="#DC2626" />
        <Text style={styles.errorTitle}>Fee Data Notice</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchFeeDetails}>
          <RotateCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.retryBtnText}>Retry Fetch</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderContent = () => (
    <View style={styles.innerContainer}>
      {/* Top Total Dues Quick Card */}
      <View style={styles.topSummaryCard}>
        <View style={styles.topSummaryRow}>
          <View>
            <Text style={styles.topSummaryLabel}>Current Outstanding Dues</Text>
            <Text
              style={[
                styles.topSummaryAmount,
                { color: overallStats.balance > 0 ? '#DC2626' : '#059669' },
              ]}
            >
              ₹{formatNumber(overallStats.balance)}
            </Text>
          </View>
          <View
            style={[
              styles.overallBadge,
              {
                backgroundColor:
                  overallStats.balance > 0 ? '#FEE2E2' : '#DCFCE7',
              },
            ]}
          >
            <Text
              style={[
                styles.overallBadgeText,
                { color: overallStats.balance > 0 ? '#DC2626' : '#15803D' },
              ]}
            >
              {overallStats.balance > 0 ? 'PAYMENT DUE' : 'ALL CLEARED'}
            </Text>
          </View>
        </View>

        <View style={styles.summarySplit}>
          <View style={styles.summarySplitCol}>
            <Text style={styles.summarySplitLabel}>Total Fee Demand</Text>
            <Text style={styles.summarySplitVal}>
              ₹{formatNumber(overallStats.total)}
            </Text>
          </View>
          <View style={styles.summarySplitDivider} />
          <View style={styles.summarySplitCol}>
            <Text style={styles.summarySplitLabel}>Total Fee Paid</Text>
            <Text style={[styles.summarySplitVal, { color: '#059669' }]}>
              ₹{formatNumber(overallStats.paid)}
            </Text>
          </View>
        </View>

        <View style={styles.cpgTag}>
          <ShieldCheck size={13} color="#059669" />
          <Text style={styles.cpgTagText}>
            Official Pydah Payment Gateway (PPG) Integrated Checkout
          </Text>
        </View>
      </View>

      {/* SECTION 1: FEE DUES BREAKDOWN */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithIcon}>
          <FileText size={17} color="#1E3A8A" />
          <Text style={styles.sectionTitle}>Fee Dues Breakdown</Text>
        </View>

        {/* Status Filter Segmented Control */}
        <View style={styles.filterPillGroup}>
          {(['Active Fees', 'All Fees', 'Cancelled Fees'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                feeStatusFilter === filter && styles.filterPillActive,
              ]}
              onPress={() => setFeeStatusFilter(filter)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  feeStatusFilter === filter && styles.filterPillTextActive,
                ]}
              >
                {filter === 'Active Fees' ? 'Active' : filter === 'All Fees' ? 'All' : 'Cancelled'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Accordions Container */}
      <View style={styles.accordionsCard}>
        {[...availableYears]
          .sort((a, b) => b - a)
          .map((yr, idx) => {
            const yrInvoices = getInvoicesForYear(yr);
            const yrTotals = getYearTotals(yrInvoices);
            const yrStats = yearStatsMap[yr] || {
              total: 0,
              paid: 0,
              balance: 0,
              isPaid: true,
            };
            const isExpanded =
              expandedYears[yr] === undefined ? true : expandedYears[yr];
            const isPaid = yrStats.balance <= 0;

            return (
              <View
                key={yr}
                style={[
                  styles.accordionItem,
                  idx > 0 && styles.accordionItemBorder,
                ]}
              >
                {/* Accordion Header */}
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleExpandYear(yr)}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionHeaderLeft}>
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearBadgeText}>Y{yr}</Text>
                    </View>

                    {isPaid ? (
                      <View style={styles.paidTag}>
                        <Text style={styles.paidTagText}>PAID</Text>
                      </View>
                    ) : (
                      <View style={styles.dueTag}>
                        <Text style={styles.dueTagText}>DUE</Text>
                      </View>
                    )}

                    <Text style={styles.accordionSummaryText}>
                      Total: ₹{formatNumber(yrStats.total)} • Paid: ₹{formatNumber(yrStats.paid)}
                    </Text>
                  </View>

                  <View style={styles.accordionHeaderRight}>
                    {isExpanded ? (
                      <ChevronUp size={18} color="#64748B" />
                    ) : (
                      <ChevronDown size={18} color="#64748B" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Accordion Body */}
                {isExpanded && (
                  <View style={styles.accordionBody}>
                    {yrInvoices.length > 0 ? (
                      yrInvoices.map((row: any) => (
                        <View key={row.rowKey} style={styles.invoiceCard}>
                          {/* Invoice Card Top Row */}
                          <View style={styles.invoiceTopRow}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={styles.invoiceHeadTitle}>
                                {row.headTitle}
                              </Text>
                              <Text style={styles.invoiceYearSem}>
                                {row.yearSemLabel}
                              </Text>
                            </View>

                            <View>
                              {row.status === 'Paid' && (
                                <View style={styles.statusPaidBadge}>
                                  <Text style={styles.statusPaidText}>Paid</Text>
                                </View>
                              )}
                              {row.status === 'Unpaid' && (
                                <View style={styles.statusUnpaidBadge}>
                                  <Text style={styles.statusUnpaidText}>Unpaid</Text>
                                </View>
                              )}
                              {row.status === 'Partial' && (
                                <View style={styles.statusPartialBadge}>
                                  <Text style={styles.statusPartialText}>Partial</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* 6-Grid Breakdown Box */}
                          <View style={styles.metricGrid}>
                            <View style={styles.gridCell}>
                              <Text style={styles.gridCellLabel}>Total Fee</Text>
                              <Text style={styles.gridCellVal}>
                                ₹{formatNumber(row.totalFee)}
                              </Text>
                            </View>
                            <View style={styles.gridCell}>
                              <Text style={styles.gridCellLabel}>Paid</Text>
                              <Text style={[styles.gridCellVal, { color: '#059669' }]}>
                                ₹{formatNumber(row.paid)}
                              </Text>
                            </View>
                            <View style={styles.gridCell}>
                              <Text style={styles.gridCellLabel}>Concession</Text>
                              <Text style={[styles.gridCellVal, { color: '#7C3AED' }]}>
                                ₹{formatNumber(row.concession)}
                              </Text>
                            </View>
                            <View style={[styles.gridCell, styles.gridCellSecondRow]}>
                              <Text style={styles.gridCellLabel}>T1 Due</Text>
                              <Text
                                style={[
                                  styles.gridCellVal,
                                  row.t1Due !== '—' && row.t1Due !== '- - -'
                                    ? { color: '#DC2626' }
                                    : { color: '#64748B' },
                                ]}
                              >
                                {row.t1Due}
                              </Text>
                            </View>
                            <View style={[styles.gridCell, styles.gridCellSecondRow]}>
                              <Text style={styles.gridCellLabel}>T2 Due</Text>
                              <Text
                                style={[
                                  styles.gridCellVal,
                                  row.t2Due !== '—' && row.t2Due !== '- - -'
                                    ? { color: '#DC2626' }
                                    : { color: '#64748B' },
                                ]}
                              >
                                {row.t2Due}
                              </Text>
                            </View>
                            <View style={[styles.gridCell, styles.gridCellSecondRow]}>
                              <Text style={styles.gridCellLabel}>Balance</Text>
                              <Text
                                style={[
                                  styles.gridCellVal,
                                  { color: '#DC2626', fontWeight: '800' },
                                ]}
                              >
                                ₹{formatNumber(row.balance)}
                              </Text>
                            </View>
                          </View>

                          {/* Pay Now Button */}
                          {row.balance > 0 ? (
                            <TouchableOpacity
                              style={styles.payNowBtn}
                              onPress={() => openPaymentModal(row)}
                              activeOpacity={0.8}
                            >
                              <CreditCard size={14} color="#FFFFFF" />
                              <Text style={styles.payNowBtnText}>
                                Pay Now (₹{formatNumber(row.balance)})
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.clearedRow}>
                              <CheckCircle2 size={13} color="#059669" />
                              <Text style={styles.clearedText}>Cleared in Full</Text>
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyAccordion}>
                        <Text style={styles.emptyAccordionText}>
                          No fee records found for Year {yr}.
                        </Text>
                      </View>
                    )}

                    {/* Year Total Summary Bar */}
                    {yrInvoices.length > 0 && (
                      <View style={styles.yearTotalsBar}>
                        <View style={styles.yearTotalsInfo}>
                          <Text style={styles.yearTotalsTitle}>
                            TOTAL (Y{yr})
                          </Text>
                          <Text style={styles.yearTotalsSub}>
                            Fee: ₹{formatNumber(yrTotals.totalFee)} • Paid: ₹{formatNumber(yrTotals.paid)}
                          </Text>
                          <Text style={styles.yearTotalsBal}>
                            Due: ₹{formatNumber(yrTotals.balance)}
                          </Text>
                        </View>

                        {yrTotals.balance > 0 && (
                          <TouchableOpacity
                            style={styles.payAllDueBtn}
                            onPress={() =>
                              openYearPaymentModal(yr, yrTotals, yrInvoices)
                            }
                            activeOpacity={0.85}
                          >
                            <CreditCard size={13} color="#FFFFFF" />
                            <Text style={styles.payAllDueBtnText}>Pay All Due</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
      </View>

      {/* SECTION 2: TRANSACTION HISTORY */}
      <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
        <View style={styles.sectionTitleWithIcon}>
          <Clock size={17} color="#059669" />
          <Text style={styles.sectionTitle}>Transaction History</Text>
        </View>

        <View style={styles.txYearBadge}>
          <Text style={styles.txYearBadgeText}>
            {selectedYear === 'All' ? 'All Years' : `Year ${selectedYear}`}
          </Text>
        </View>
      </View>

      {/* Transactions Container */}
      <View style={styles.txCardContainer}>
        {/* Year Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.txTab,
              selectedYear === 'All' && styles.txTabActive,
            ]}
            onPress={() => setSelectedYear('All')}
          >
            <Text
              style={[
                styles.txTabText,
                selectedYear === 'All' && styles.txTabTextActive,
              ]}
            >
              All Years
            </Text>
          </TouchableOpacity>
          {[...availableYears]
            .sort((a, b) => b - a)
            .map((yr) => (
              <TouchableOpacity
                key={yr}
                style={[
                  styles.txTab,
                  selectedYear === yr && styles.txTabActive,
                ]}
                onPress={() => setSelectedYear(yr)}
              >
                <Text
                  style={[
                    styles.txTabText,
                    selectedYear === yr && styles.txTabTextActive,
                  ]}
                >
                  Year {yr}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Mode Filter Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterScroll, { paddingTop: 4 }]}
        >
          {['All', 'Cash', 'UPI', 'Net Banking', 'Online', 'Cheque'].map(
            (mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeFilterPill,
                  txModeFilter === mode && styles.modeFilterPillActive,
                ]}
                onPress={() => setTxModeFilter(mode)}
              >
                <Text
                  style={[
                    styles.modeFilterPillText,
                    txModeFilter === mode && styles.modeFilterPillTextActive,
                  ]}
                >
                  {mode === 'All' ? 'All Modes' : mode}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* Transactions List */}
        <View style={styles.txList}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx: any, idx: number) => {
              const txDate = tx.paymentDate || tx.date ? new Date(tx.paymentDate || tx.date) : null;
              const dateStr = txDate
                ? txDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—';
              const timeStr = txDate
                ? txDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : '';
              const isCon = tx.transactionType === 'CREDIT' || isCredit(tx);

              return (
                <View
                  key={tx._id || tx.id || idx}
                  style={[
                    styles.txItem,
                    idx > 0 && styles.txItemBorder,
                  ]}
                >
                  {/* Top line: Fee Head title & Amount */}
                  <View style={styles.txItemTop}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.txHeadName}>
                        {tx.feeHead?.name ||
                          (isCon
                            ? 'Scholarship / Concession'
                            : 'Fee Payment')}
                      </Text>
                      <Text style={styles.txDateTime}>
                        {dateStr} {timeStr ? `• ${timeStr}` : ''}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.txAmountText,
                        { color: isCon ? '#7C3AED' : '#059669' },
                      ]}
                    >
                      ₹{formatNumber(tx.amount)}
                    </Text>
                  </View>

                  {/* Pills row */}
                  <View style={styles.txBadgeRow}>
                    <View style={styles.txModePill}>
                      <Text style={styles.txModePillText}>
                        {tx.paymentMode || 'Cash'}
                      </Text>
                    </View>

                    {tx.receiptNumber && (
                      <View style={styles.txReceiptPill}>
                        <Receipt size={11} color="#1E3A8A" style={{ marginRight: 3 }} />
                        <Text style={styles.txReceiptPillText}>
                          {tx.receiptNumber}
                        </Text>
                      </View>
                    )}

                    <View style={styles.txYearSemPill}>
                      <Text style={styles.txYearSemPillText}>
                        Y{tx.studentYear || selectedYear} • S{tx.semester || '1'}
                      </Text>
                    </View>
                  </View>

                  {/* Reference number if present */}
                  {(tx.referenceNo || tx.gatewayPaymentId) && (
                    <Text style={styles.txRefText}>
                      Ref: {tx.referenceNo || tx.gatewayPaymentId}
                    </Text>
                  )}

                  {/* Remarks note if present */}
                  {tx.remarks && (
                    <View style={styles.txRemarksBox}>
                      <Text style={styles.txRemarksText}>"{tx.remarks}"</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTxBox}>
              <Text style={styles.emptyTxText}>
                No transaction records found for the selected filter.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <>
      {nested ? (
        renderContent()
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          scrollEventThrottle={16}
        >
          {renderContent()}
        </ScrollView>
      )}

      {/* Online Payment Modal */}
      {paymentModalOpen && paymentTarget && (
        <Modal
          visible={paymentModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPaymentModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderIcon}>
                  <CreditCard size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Pay Fees Online</Text>
                  <Text style={styles.modalSub}>
                    Pydah Payment Gateway • Hosted Checkout
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPaymentModalOpen(false)}
                  disabled={isProcessingPayment}
                  style={styles.modalCloseBtn}
                >
                  <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <View style={styles.modalBody}>
                {/* Details Summary Box */}
                <View style={styles.targetSummaryBox}>
                  <View style={styles.targetSummaryTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.targetSummaryLabel}>Fee Description</Text>
                      <Text style={styles.targetSummaryTitle}>
                        {paymentTarget.title}
                      </Text>
                    </View>
                    <View style={styles.targetYearBadge}>
                      <Text style={styles.targetYearBadgeText}>
                        Year {paymentTarget.studentYear}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.targetSummarySplit}>
                    <View style={styles.targetSplitCol}>
                      <Text style={styles.targetSplitLabel}>Total</Text>
                      <Text style={styles.targetSplitVal}>
                        ₹{formatNumber(paymentTarget.totalFee)}
                      </Text>
                    </View>
                    <View style={styles.targetSplitCol}>
                      <Text style={styles.targetSplitLabel}>Paid</Text>
                      <Text style={[styles.targetSplitVal, { color: '#059669' }]}>
                        ₹{formatNumber(paymentTarget.paid)}
                      </Text>
                    </View>
                    <View style={styles.targetSplitCol}>
                      <Text style={styles.targetSplitLabel}>Balance Due</Text>
                      <Text
                        style={[
                          styles.targetSplitVal,
                          { color: '#DC2626', fontWeight: '800' },
                        ]}
                      >
                        ₹{formatNumber(paymentTarget.balance)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount to Pay (INR ₹)</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="numeric"
                      value={payAmountInput}
                      onChangeText={setPayAmountInput}
                      placeholder="Enter amount"
                      placeholderTextColor="#94A3B8"
                      editable={!isProcessingPayment}
                    />
                  </View>

                  {/* Quick Pills */}
                  <View style={styles.quickPillsRow}>
                    <TouchableOpacity
                      style={styles.quickPill}
                      onPress={() =>
                        setPayAmountInput(String(paymentTarget.balance))
                      }
                    >
                      <Text style={styles.quickPillText}>
                        Full (₹{formatNumber(paymentTarget.balance)})
                      </Text>
                    </TouchableOpacity>

                    {paymentTarget.t1DueNum > 0 &&
                      paymentTarget.t1DueNum < paymentTarget.balance && (
                        <TouchableOpacity
                          style={styles.quickPillSecondary}
                          onPress={() =>
                            setPayAmountInput(String(paymentTarget.t1DueNum))
                          }
                        >
                          <Text style={styles.quickPillSecondaryText}>
                            Term 1 (₹{formatNumber(paymentTarget.t1DueNum)})
                          </Text>
                        </TouchableOpacity>
                      )}

                    {paymentTarget.t2DueNum > 0 &&
                      paymentTarget.t2DueNum < paymentTarget.balance && (
                        <TouchableOpacity
                          style={styles.quickPillSecondary}
                          onPress={() =>
                            setPayAmountInput(String(paymentTarget.t2DueNum))
                          }
                        >
                          <Text style={styles.quickPillSecondaryText}>
                            Term 2 (₹{formatNumber(paymentTarget.t2DueNum)})
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
              </View>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setPaymentModalOpen(false)}
                  disabled={isProcessingPayment}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmPayBtn,
                    (!payAmountInput ||
                      Number(payAmountInput) <= 0 ||
                      isProcessingPayment) &&
                      styles.confirmPayBtnDisabled,
                  ]}
                  onPress={handleConfirmPayment}
                  disabled={
                    !payAmountInput ||
                    Number(payAmountInput) <= 0 ||
                    isProcessingPayment
                  }
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CreditCard size={15} color="#FFFFFF" />
                      <Text style={styles.confirmPayBtnText}>
                        Checkout (₹{formatNumber(payAmountInput || 0)})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  innerContainer: {
    width: '100%',
  },
  loaderContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginVertical: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginTop: 6,
  },
  errorSub: {
    fontSize: 12,
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Top Total Summary Card
  topSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topSummaryAmount: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  overallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overallBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summarySplit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summarySplitCol: {
    flex: 1,
    alignItems: 'center',
  },
  summarySplitDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#CBD5E1',
  },
  summarySplitLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  summarySplitVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  cpgTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cpgTagText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.2,
  },
  filterPillGroup: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 2,
  },
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },

  // Accordion Card
  accordionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  accordionItem: {
    overflow: 'hidden',
  },
  accordionItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    flexWrap: 'wrap',
  },
  yearBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  yearBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paidTag: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  paidTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },
  dueTag: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dueTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
  },
  accordionSummaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  accordionHeaderRight: {
    marginLeft: 6,
  },

  // Accordion Body
  accordionBody: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  emptyAccordion: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyAccordionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Invoice Card
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invoiceHeadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceYearSem: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  statusPaidBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPaidText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  statusUnpaidBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusUnpaidText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  statusPartialBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPartialText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    textTransform: 'uppercase',
  },

  // 6-Metric Grid
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
  },
  gridCell: {
    width: '33.33%',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  gridCellSecondRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
    paddingTop: 6,
  },
  gridCellLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  gridCellVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },

  // Pay Now Button
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    borderRadius: 9,
    paddingVertical: 8,
    marginTop: 10,
  },
  payNowBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  clearedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  // Year Totals Bar
  yearTotalsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  yearTotalsInfo: {
    flex: 1,
  },
  yearTotalsTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  yearTotalsSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  yearTotalsBal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 1,
  },
  payAllDueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  payAllDueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Transaction History Card
  txYearBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  txYearBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  txCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  txTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txTabActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  txTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  txTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeFilterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  modeFilterPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  modeFilterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  txList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  txItem: {
    paddingVertical: 10,
  },
  txItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  txItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txHeadName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  txDateTime: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  txBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  txModePill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  txModePillText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#475569',
  },
  txReceiptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  txReceiptPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1E3A8A',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  txYearSemPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  txYearSemPillText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  txRefText: {
    fontSize: 9.5,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  txRemarksBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
  },
  txRemarksText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyTxBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTxText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  modalHeaderIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 6,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 10,
    color: '#BFDBFE',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  targetSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  targetSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  targetSummaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  targetSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  targetYearBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  targetYearBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  targetSummarySplit: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  targetSplitCol: {
    flex: 1,
  },
  targetSplitLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  targetSplitVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  rupeePrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 10,
  },
  quickPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  quickPill: {
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  quickPillSecondary: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickPillSecondaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelModalBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  confirmPayBtnDisabled: {
    opacity: 0.5,
  },
  confirmPayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
