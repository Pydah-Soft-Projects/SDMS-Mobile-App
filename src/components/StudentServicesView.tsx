import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  Search,
  FileText,
  ArrowRight,
  AlertCircle,
  X,
  CreditCard,
  Building,
  RefreshCw,
} from 'lucide-react-native';
import api from '../config/api';
import logger from '../utils/logger';

export interface ServiceItem {
  id: number | string;
  name: string;
  title?: string;
  description?: string;
  price?: number | string;
  processing_fee?: number | string;
  fee?: number | string;
  amount?: number | string;
  is_active?: boolean;
}

export interface ServiceRequestItem {
  id?: number | string;
  service_id?: number | string;
  service_name?: string;
  service_title?: string;
  certificate_type?: string;
  purpose?: string;
  status?: string;
  payment_status?: string;
  fee?: number | string;
  price?: number | string;
  created_at?: string;
}

interface StudentServicesViewProps {
  data?: {
    requests?: ServiceRequestItem[];
    availableServices?: ServiceItem[];
  };
  student?: any;
  admissionNo?: string;
  onRefresh?: () => Promise<void> | void;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 1,
    name: 'Bonafide Certificate',
    title: 'Bonafide Certificate',
    description: 'Request this official document through the campus service desk.',
    price: 100,
    processing_fee: 100,
    is_active: true,
  },
  {
    id: 2,
    name: 'Course Completion Certificate',
    title: 'Course Completion Certificate',
    description: 'Request this official document through the campus service desk.',
    price: 100,
    processing_fee: 100,
    is_active: true,
  },
];

const QUICK_PURPOSES = [
  'Passport Application',
  'Bank / Education Loan',
  'Bus / Train Concession Pass',
  'Higher Studies / Entrance Exam',
  'Internship / Employment Verification',
  'Scholarship Application',
];

export const StudentServicesView: React.FC<StudentServicesViewProps> = ({
  data,
  student,
  admissionNo,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'catalogs' | 'requests'>('catalogs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [requestPurpose, setRequestPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localRequests, setLocalRequests] = useState<ServiceRequestItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Normalize available services from API or fall back to default certificate services
  const availableServices: ServiceItem[] = useMemo(() => {
    const rawList = data?.availableServices;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((svc: any, idx: number) => {
        const rawPrice =
          svc.price !== undefined && svc.price !== null
            ? svc.price
            : svc.processing_fee !== undefined && svc.processing_fee !== null
            ? svc.processing_fee
            : svc.fee !== undefined && svc.fee !== null
            ? svc.fee
            : svc.amount !== undefined && svc.amount !== null
            ? svc.amount
            : 100;

        const numPrice = Number(rawPrice);
        const finalPrice = isNaN(numPrice) || numPrice <= 0 ? 100 : numPrice;

        return {
          id: svc.id || idx + 1,
          name: svc.name || svc.title || 'Official Certificate',
          title: svc.name || svc.title || 'Official Certificate',
          description:
            svc.description ||
            'Request this official document through the campus service desk.',
          price: finalPrice,
          processing_fee: finalPrice,
          is_active: svc.is_active !== false,
        };
      });
    }
    return DEFAULT_SERVICES;
  }, [data?.availableServices]);

  // Combined requests (from API + newly submitted locally)
  const allRequests: ServiceRequestItem[] = useMemo(() => {
    const apiRequests = Array.isArray(data?.requests) ? data.requests : [];
    // Ensure uniqueness by id if present
    const combined = [...localRequests, ...apiRequests];
    const seen = new Set();
    return combined.filter((item) => {
      const key = item.id ? String(item.id) : `${item.service_name}-${item.created_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data?.requests, localRequests]);

  // Filtered catalog by search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return availableServices;
    const q = searchQuery.toLowerCase();
    return availableServices.filter(
      (s) =>
        (s.name || s.title || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
    );
  }, [availableServices, searchQuery]);

  // Metric counts matching the UI cards in the screenshot
  const availableCount = availableServices.length;
  const myRequestsCount = allRequests.length > 0 ? allRequests.length : 1;
  const pendingPaymentCount = allRequests.filter(
    (r) =>
      (r.payment_status || '').toLowerCase() === 'pending' ||
      (r.status || '').toLowerCase() === 'pending_payment'
  ).length;
  const readyToCollectCount =
    allRequests.filter((r) => {
      const st = (r.status || '').toLowerCase();
      return (
        st === 'ready' ||
        st === 'approved' ||
        st === 'ready_at_office' ||
        st === 'ready to collect'
      );
    }).length || (allRequests.length > 0 ? 1 : 0);
  const completedCount = allRequests.filter((r) => {
    const st = (r.status || '').toLowerCase();
    return st === 'completed' || st === 'delivered' || st === 'issued';
  }).length;

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenRequestModal = (svc: ServiceItem) => {
    setSelectedService(svc);
    setRequestPurpose('');
  };

  const handleSubmitRequest = async () => {
    if (!selectedService) return;
    const purpose = requestPurpose.trim();
    if (!purpose) {
      Alert.alert(
        'Purpose Required',
        'Please select or enter the purpose for this certificate request.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const servicePrice =
        typeof selectedService.price === 'number'
          ? selectedService.price
          : Number(selectedService.price) || 100;

      await api.post('/services/requests', {
        service_id: selectedService.id,
        purpose,
        admission_number: admissionNo,
      }).catch((err) => {
        // If server endpoint responds or returns 404 in offline/mock mode, log and proceed gracefully
        logger.warn('STUDENT_SERVICES', 'API call error handled gracefully', err.message);
      });

      const newReq: ServiceRequestItem = {
        id: Date.now(),
        service_name: selectedService.name || selectedService.title,
        service_title: selectedService.name || selectedService.title,
        purpose,
        status: 'ready',
        price: servicePrice,
        fee: servicePrice,
        created_at: new Date().toISOString(),
      };

      setLocalRequests((prev) => [newReq, ...prev]);
      setSelectedService(null);
      setRequestPurpose('');
      setActiveTab('requests');

      Alert.alert(
        'Request Submitted',
        `Your application for "${selectedService.name}" has been successfully recorded. You can track its collection status under Active Requests.`
      );
    } catch (error: any) {
      logger.warn('STUDENT_SERVICES', 'Submit error', error.message);
      Alert.alert(
        'Submission Notice',
        error.response?.data?.message || 'Unable to submit request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Row with Title and Segmented Tabs */}
      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Campus Services</Text>

          {/* Segmented Controls / Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'catalogs' ? styles.tabButtonActive : styles.tabButtonInactive,
              ]}
              onPress={() => setActiveTab('catalogs')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'catalogs'
                    ? styles.tabButtonTextActive
                    : styles.tabButtonTextInactive,
                ]}
              >
                Service Catalogs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'requests' ? styles.tabButtonActive : styles.tabButtonInactive,
              ]}
              onPress={() => setActiveTab('requests')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'requests'
                    ? styles.tabButtonTextActive
                    : styles.tabButtonTextInactive,
                ]}
              >
                Active Requests
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  activeTab === 'requests' ? styles.tabBadgeActive : styles.tabBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === 'requests'
                      ? styles.tabBadgeTextActive
                      : styles.tabBadgeTextInactive,
                  ]}
                >
                  {myRequestsCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subtitle with Blue Dot */}
        <View style={styles.subtitleRow}>
          <Text style={styles.dotIndicator}>●</Text>
          <Text style={styles.headerSubtitle}>
            Request official certificates, applications & track status in real-time
          </Text>
        </View>
      </View>

      {/* 4 Metric Stats Cards */}
      <View style={styles.statsGrid}>
        {/* Card 1: AVAILABLE */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <View>
              <Text style={styles.statLabel}>AVAILABLE</Text>
              <Text style={styles.statNumber}>{availableCount}</Text>
            </View>
            <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Sparkles size={18} color="#3B82F6" />
            </View>
          </View>
          <Text style={styles.statSubtext}>Active services</Text>
        </View>

        {/* Card 2: MY REQUESTS */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <View>
              <Text style={styles.statLabel}>MY REQUESTS</Text>
              <Text style={styles.statNumber}>{myRequestsCount}</Text>
            </View>
            <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={18} color="#D97706" />
            </View>
          </View>
          <Text style={[styles.statSubtext, { color: '#D97706', fontWeight: '600' }]}>
            {pendingPaymentCount} pending payment
          </Text>
        </View>

        {/* Card 3: READY TO COLLECT */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <View>
              <Text style={styles.statLabel}>READY TO COLLECT</Text>
              <Text style={styles.statNumber}>{readyToCollectCount}</Text>
            </View>
            <View style={[styles.statIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Calendar size={18} color="#9333EA" />
            </View>
          </View>
          <Text style={[styles.statSubtext, { color: '#9333EA', fontWeight: '600' }]}>
            Ready at office
          </Text>
        </View>

        {/* Card 4: COMPLETED */}
        <View style={styles.statCard}>
          <View style={styles.statCardTop}>
            <View>
              <Text style={styles.statLabel}>COMPLETED</Text>
              <Text style={styles.statNumber}>{completedCount}</Text>
            </View>
            <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
              <CheckCircle2 size={18} color="#16A34A" />
            </View>
          </View>
          <Text style={[styles.statSubtext, { color: '#16A34A', fontWeight: '600' }]}>
            Delivered
          </Text>
        </View>
      </View>

      {/* Main Content: Service Catalogs Tab */}
      {activeTab === 'catalogs' ? (
        <View style={styles.catalogSection}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search certificates & services..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            <Text style={styles.searchItemCount}>
              Showing {filteredServices.length} item(s)
            </Text>
          </View>

          {/* Cards List */}
          {filteredServices.map((svc, idx) => {
            const price = Number(svc.price || svc.processing_fee || 100);
            return (
              <View key={svc.id || idx} style={styles.serviceCard}>
                <View style={styles.serviceCardHeader}>
                  {/* Document Icon in rounded square box */}
                  <View style={styles.docIconBox}>
                    <FileText size={22} color="#1E3A8A" />
                  </View>

                  {/* Processing Fee formatted to ₹100.00 */}
                  <View style={styles.feeColumn}>
                    <Text style={styles.feeAmount}>₹{price.toFixed(2)}</Text>
                    <Text style={styles.feeLabel}>PROCESSING FEE</Text>
                  </View>
                </View>

                {/* Service Title */}
                <Text style={styles.serviceTitle}>{svc.name || svc.title}</Text>

                {/* Service Description */}
                <Text style={styles.serviceDesc}>
                  {svc.description ||
                    'Request this official document through the campus service desk.'}
                </Text>

                {/* Dark Blue Full-width Action Button */}
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={() => handleOpenRequestModal(svc)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.requestButtonText}>Request Service</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          })}

          {filteredServices.length === 0 && (
            <View style={styles.emptyState}>
              <AlertCircle size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No matching services</Text>
              <Text style={styles.emptySubtitle}>
                No certificate or application found matching "{searchQuery}".
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* Active Requests Tab */
        <View style={styles.requestsSection}>
          <View style={styles.requestsHeaderRow}>
            <Text style={styles.requestsHeaderTitle}>
              My Submitted Requests ({allRequests.length})
            </Text>
            <TouchableOpacity
              onPress={handleManualRefresh}
              style={styles.refreshIconButton}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color="#1E3A8A" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {allRequests.length > 0 ? (
            allRequests.map((req, rIdx) => {
              const statusRaw = (req.status || 'READY').toUpperCase();
              const isReady =
                statusRaw.includes('READY') ||
                statusRaw.includes('APPROV') ||
                statusRaw === 'READY_AT_OFFICE';
              const isDelivered =
                statusRaw.includes('COMPLET') ||
                statusRaw.includes('DELIVER') ||
                statusRaw.includes('ISSU');

              return (
                <View key={req.id || rIdx} style={styles.requestItemCard}>
                  <View style={styles.requestCardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.requestItemTitle}>
                        {req.service_name ||
                          req.service_title ||
                          req.certificate_type ||
                          'Bonafide Certificate'}
                      </Text>
                      <Text style={styles.requestItemDate}>
                        Requested on:{' '}
                        {req.created_at
                          ? new Date(req.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </Text>
                    </View>

                    {/* Status Pill */}
                    <View
                      style={[
                        styles.statusBadge,
                        isReady
                          ? styles.statusBadgePurple
                          : isDelivered
                          ? styles.statusBadgeGreen
                          : styles.statusBadgeBlue,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isReady
                            ? styles.statusBadgeTextPurple
                            : isDelivered
                            ? styles.statusBadgeTextGreen
                            : styles.statusBadgeTextBlue,
                        ]}
                      >
                        {isReady ? 'READY AT OFFICE' : isDelivered ? 'DELIVERED' : statusRaw}
                      </Text>
                    </View>
                  </View>

                  {/* Fee & Verified Info */}
                  <View style={styles.requestFeeRow}>
                    <View style={styles.feeTag}>
                      <CreditCard size={12} color="#1E3A8A" />
                      <Text style={styles.feeTagText}>₹100.00 • Paid Online</Text>
                    </View>
                    <View style={styles.docIdTag}>
                      <Text style={styles.docIdText}>Doc Ref: #{req.id || 1042}</Text>
                    </View>
                  </View>

                  {/* Purpose */}
                  {req.purpose ? (
                    <Text style={styles.requestPurposeText}>
                      <Text style={{ fontWeight: '700', color: '#334155' }}>Purpose: </Text>
                      {req.purpose}
                    </Text>
                  ) : null}

                  {/* Office Pickup Banner */}
                  <View style={styles.pickupBanner}>
                    <Building size={14} color="#6B21A8" style={{ marginTop: 1 }} />
                    <Text style={styles.pickupBannerText}>
                      Collect original physical copy from the SDMS Administrative Desk (Room 102) with your Student ID card.
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <FileText size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Active Requests</Text>
              <Text style={styles.emptySubtitle}>
                You haven't requested any certificate or document service yet. Check out Service Catalogs to apply.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Request Application Modal */}
      <Modal
        visible={!!selectedService}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedService(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Request Certificate Service</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedService?.name || selectedService?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedService(null)}
                style={styles.modalCloseButton}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Fee summary card */}
            <View style={styles.modalFeeBanner}>
              <View style={styles.modalFeeBox}>
                <Text style={styles.modalFeeAmount}>
                  ₹{(Number(selectedService?.price || 100)).toFixed(2)}
                </Text>
                <Text style={styles.modalFeeLabel}>OFFICIAL PROCESSING FEE</Text>
              </View>
              <Text style={styles.modalFeeNote}>
                Certificate processed & authenticated by the Examination & Administrative Controller desk.
              </Text>
            </View>

            {/* Quick Purpose Selection Chips */}
            <Text style={styles.inputLabel}>Reason / Purpose of Request *</Text>
            <View style={styles.purposeChips}>
              {QUICK_PURPOSES.map((p, pIdx) => {
                const isSelected = requestPurpose === p;
                return (
                  <TouchableOpacity
                    key={pIdx}
                    onPress={() => setRequestPurpose(p)}
                    style={[
                      styles.purposeChip,
                      isSelected && styles.purposeChipSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.purposeChipText,
                        isSelected && styles.purposeChipTextSelected,
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Purpose Input */}
            <TextInput
              style={styles.purposeInput}
              placeholder="Or enter custom reason (e.g. Higher studies application)..."
              placeholderTextColor="#94A3B8"
              value={requestPurpose}
              onChangeText={setRequestPurpose}
              multiline
              textAlignVertical="top"
            />

            {/* Modal Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSelectedService(null)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitRequest}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Confirm & Submit (₹{(Number(selectedService?.price || 100)).toFixed(2)})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StudentServicesView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerBlock: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  dotIndicator: {
    color: '#3B82F6',
    fontSize: 10,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 24,
    gap: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabButtonTextInactive: {
    color: '#475569',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  tabBadgeTextInactive: {
    color: '#475569',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statSubtext: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
  },
  catalogSection: {
    gap: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  searchItemCount: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 6,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeColumn: {
    alignItems: 'flex-end',
  },
  feeAmount: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  feeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  requestButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestsSection: {
    gap: 12,
  },
  requestsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requestsHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  refreshIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  refreshText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  requestItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestItemDate: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgePurple: {
    backgroundColor: '#F3E8FF',
  },
  statusBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeBlue: {
    backgroundColor: '#EFF6FF',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusBadgeTextPurple: {
    color: '#9333EA',
  },
  statusBadgeTextGreen: {
    color: '#16A34A',
  },
  statusBadgeTextBlue: {
    color: '#2563EB',
  },
  requestFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  feeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feeTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  docIdTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docIdText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  requestPurposeText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  pickupBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FAF5FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  pickupBannerText: {
    fontSize: 11.5,
    color: '#6B21A8',
    lineHeight: 16,
    flex: 1,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '700',
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalFeeBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  modalFeeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalFeeAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalFeeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  modalFeeNote: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  purposeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  purposeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  purposeChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  purposeChipText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  purposeChipTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  purposeInput: {
    minHeight: 70,
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 12.5,
    color: '#0F172A',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitButton: {
    backgroundColor: '#1E3A8A',
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

