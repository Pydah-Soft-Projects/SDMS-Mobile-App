import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CreditCard, Search, Receipt, CheckCircle, Clock, ChevronRight, User } from 'lucide-react-native';
import Header from './Header';
import CustomInput from './CustomInput';
import CustomButton from './CustomButton';
import api from '../config/api';
import logger from '../utils/logger';

interface FeeHeaderInfo {
  id: string | number;
  name: string;
  code?: string;
  category?: string;
  amount?: number;
  _id?: string;
}

export const StaffFeesView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchPin, setSearchPin] = useState('');
  const [searching, setSearching] = useState(false);
  const [headers, setHeaders] = useState<FeeHeaderInfo[]>([]);
  const [searchedStudentFee, setSearchedStudentFee] = useState<any | null>(null);

  const loadFeeHeaders = async () => {
    try {
      const response = await api.get('/fees/headers');
      const list = response.data?.headers || response.data?.data || response.data || [];
      if (Array.isArray(list)) {
        setHeaders(
          list
            .filter(Boolean)
            .map((h: any, idx: number) => ({
              id: h?._id || h?.id || idx,
              name: typeof h === 'string' ? h : (h?.name || h?.fee_head || 'Fee Head'),
              code: typeof h === 'object' && h ? h.code : undefined,
              category: typeof h === 'object' && h ? h.category : undefined,
              amount:
                typeof h === 'object' && h && h.amount != null && !isNaN(Number(h.amount))
                  ? Number(h.amount)
                  : undefined,
            }))
        );
      } else {
        setHeaders([]);
      }
    } catch (e: any) {
      logger.error('STAFF_FEES', 'Failed to load fee headers', e.message);
      setHeaders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeHeaders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeHeaders();
    setRefreshing(false);
  };

  const handleStudentSearch = async () => {
    const pin = searchPin.trim();
    if (!pin) {
      Alert.alert('Required', 'Please enter a student PIN or Admission Number.');
      return;
    }

    setSearching(true);
    try {
      const res = await api.get(`/fees/students/${pin}/details`);
      if (res.data) {
        setSearchedStudentFee(res.data);
      } else {
        Alert.alert('Not Found', `No fee ledger found for student: ${pin}`);
      }
    } catch (err: any) {
      logger.error('STAFF_FEES', `Failed to lookup fees for ${pin}`, err.message);
      Alert.alert('Search Error', err.response?.data?.message || 'Could not find student fee records.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Accounts & Fee Ledgers" subtitle="SDMS Financial Oversight" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Student Fee Lookup Card */}
        <View style={styles.lookupCard}>
          <Text style={styles.cardTitle}>Student Fee Status Lookup</Text>
          <Text style={styles.cardSubtitle}>
            Search any student by PIN or Admission Number to review fee dues:
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              placeholder="e.g. 21A91A0501"
              value={searchPin}
              onChangeText={setSearchPin}
              autoCapitalize="none"
              style={styles.searchInput}
            />
            <TouchableOpacity
              onPress={handleStudentSearch}
              style={styles.searchBtn}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.searchBtnText}>Lookup</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Fee Details Result */}
        {searchedStudentFee && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.studentAvatar}>
                <User size={20} color="#1E3A8A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>
                  {searchedStudentFee.studentDetails?.name ||
                    searchedStudentFee.studentDetails?.student_name ||
                    'Student Record'}
                </Text>
                <Text style={styles.studentPin}>
                  PIN: {searchedStudentFee.studentDetails?.pinNumber || searchPin} • Year{' '}
                  {searchedStudentFee.studentDetails?.currentYear || 1}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSearchedStudentFee(null)}>
                <Text style={styles.closeBtn}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.dueSummaryRow}>
              <View style={styles.dueCol}>
                <Text style={styles.dueColLabel}>Total Assessment</Text>
                <Text style={styles.dueColVal}>
                  ₹{Number(searchedStudentFee.totalAmount ?? searchedStudentFee.total_amount ?? 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.dueCol}>
                <Text style={styles.dueColLabel}>Paid</Text>
                <Text style={[styles.dueColVal, { color: '#059669' }]}>
                  ₹{Number(searchedStudentFee.paidAmount ?? searchedStudentFee.paid_amount ?? 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.dueCol}>
                <Text style={styles.dueColLabel}>Due</Text>
                <Text style={[styles.dueColVal, { color: '#DC2626' }]}>
                  ₹{Number(searchedStudentFee.dueAmount ?? searchedStudentFee.due_amount ?? 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Fee Heads in SDMS */}
        <Text style={styles.sectionTitle}>Institutional Fee Heads ({headers.length})</Text>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color="#1E3A8A" />
          </View>
        ) : headers && headers.length > 0 ? (
          headers.map((head, index) => {
            if (!head) return null;
            const headKey = head.id ? `fee-head-${head.id}` : `fee-head-idx-${index}`;
            const headName = head.name || 'Fee Head';
            const headCode = head.code;
            const amountVal = typeof head.amount === 'number' && !isNaN(head.amount) ? head.amount : null;

            return (
              <View key={headKey} style={styles.headCard}>
                <View style={styles.headIcon}>
                  <Receipt size={18} color="#1E3A8A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headName}>{String(headName)}</Text>
                  {headCode ? <Text style={styles.headCode}>Code: {String(headCode)}</Text> : null}
                </View>
                {amountVal !== null ? (
                  <Text style={styles.headAmount}>₹{amountVal.toLocaleString('en-IN')}</Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No fee headers configured in SDMS.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  lookupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
  },
  searchBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentPin: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  dueSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dueCol: {
    alignItems: 'center',
  },
  dueColLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  dueColVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  loader: {
    padding: 20,
    alignItems: 'center',
  },
  headCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  headCode: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  headAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
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

export default StaffFeesView;

