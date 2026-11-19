import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  DimensionValue,
  useWindowDimensions,
  ScrollView,
} from 'react-native';

/* ── 1. Base Skeleton Box with Pulsing Shimmer ───────────────────────── */
interface SkeletonBoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

/* ── 2. Full Dashboard Skeleton (Matches app/(tabs)/index.tsx) ────────── */
interface DashboardSkeletonProps {
  paddingHorizontal?: number;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  paddingHorizontal = 16,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(screenWidth * 0.72, 280);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.dashboardContainer,
        { paddingHorizontal, maxWidth: 720, alignSelf: 'center', width: '100%' },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      {/* 1. Academic Info Banner Skeleton */}
      <View style={styles.bannerSkeleton}>
        <View style={styles.bannerLeftCol}>
          <View style={styles.bannerPhotoRow}>
            <SkeletonBox width={48} height={48} borderRadius={24} style={styles.bannerAvatar} />
            <View style={styles.bannerTitleCol}>
              <SkeletonBox width="75%" height={17} borderRadius={6} style={styles.mb6} />
              <SkeletonBox width="55%" height={12} borderRadius={4} />
            </View>
          </View>
          <View style={styles.bannerPillRow}>
            <SkeletonBox width={85} height={22} borderRadius={11} />
            <SkeletonBox width={95} height={22} borderRadius={11} />
          </View>
        </View>
        <View style={styles.bannerRightSilhouette}>
          <SkeletonBox width={80} height={90} borderRadius={16} />
        </View>
      </View>

      {/* 2. Side-By-Side Metrics (Today's Attendance & Overall Progress) */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCardSkeleton}>
          <SkeletonBox width="70%" height={11} borderRadius={4} style={styles.mb8} />
          <View style={styles.metricCardBody}>
            <View style={styles.metricTextCol}>
              <SkeletonBox width="80%" height={20} borderRadius={6} style={styles.mb6} />
              <SkeletonBox width="50%" height={10} borderRadius={4} />
            </View>
            <SkeletonBox width={28} height={28} borderRadius={14} />
          </View>
        </View>

        <View style={styles.metricCardSkeleton}>
          <SkeletonBox width="70%" height={11} borderRadius={4} style={styles.mb8} />
          <View style={styles.metricCardBody}>
            <View style={styles.metricTextCol}>
              <SkeletonBox width="60%" height={20} borderRadius={6} style={styles.mb6} />
              <SkeletonBox width="55%" height={10} borderRadius={4} />
            </View>
            <SkeletonBox width={28} height={28} borderRadius={14} />
          </View>
        </View>
      </View>

      {/* 3. Portals & Services Section Skeleton */}
      <View style={styles.sectionHeaderRow}>
        <SkeletonBox width={140} height={16} borderRadius={6} />
      </View>
      <View style={styles.servicesScrollSkeleton}>
        {[1, 2, 3, 4, 5].map((key) => (
          <View key={`service_skel_${key}`} style={styles.serviceItemSkeleton}>
            <SkeletonBox width={56} height={56} borderRadius={18} style={styles.mb6} />
            <SkeletonBox width={46} height={10} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* 4. Campus Events Section Skeleton */}
      <View style={styles.sectionHeaderRow}>
        <SkeletonBox width={120} height={16} borderRadius={6} />
        <SkeletonBox width={65} height={14} borderRadius={6} />
      </View>
      <View style={styles.eventsScrollSkeleton}>
        {[1, 2].map((key) => (
          <View key={`event_skel_${key}`} style={[styles.eventCardSkeleton, { width: cardWidth }]}>
            <SkeletonBox width="100%" height={115} borderRadius={12} style={styles.mb8} />
            <SkeletonBox width="85%" height={14} borderRadius={4} style={styles.mb6} />
            <SkeletonBox width="50%" height={11} borderRadius={4} style={styles.mb8} />
            <View style={styles.eventCardFooterSkeleton}>
              <SkeletonBox width={70} height={12} borderRadius={4} />
              <SkeletonBox width={16} height={12} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>

      {/* 5. Explore Learn Build Banner Skeleton */}
      <View style={styles.exploreBannerSkeleton}>
        <View style={styles.exploreLeft}>
          <SkeletonBox width="80%" height={18} borderRadius={6} style={styles.mb6} />
          <SkeletonBox width="60%" height={12} borderRadius={4} style={styles.mb4} />
          <SkeletonBox width="45%" height={12} borderRadius={4} />
        </View>
        <SkeletonBox width={120} height={75} borderRadius={14} />
      </View>
    </ScrollView>
  );
};

/* ── 3. Attendance Page Skeleton (Matches app/(tabs)/attendance.tsx) ─── */
export const AttendanceSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.fullWidth} contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false} scrollEnabled={false}>
      {/* Overview Percentage Card */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.flex1}>
            <SkeletonBox width="55%" height={17} borderRadius={6} style={styles.mb6} />
            <SkeletonBox width="40%" height={12} borderRadius={4} />
          </View>
          <SkeletonBox width={70} height={24} borderRadius={12} />
        </View>

        <View style={styles.attendanceCircleRow}>
          <SkeletonBox width={100} height={100} borderRadius={50} />
          <View style={styles.attendanceStatsCol}>
            <View style={styles.statLine}>
              <SkeletonBox width={70} height={12} borderRadius={4} />
              <SkeletonBox width={36} height={14} borderRadius={4} />
            </View>
            <View style={styles.statLine}>
              <SkeletonBox width={70} height={12} borderRadius={4} />
              <SkeletonBox width={36} height={14} borderRadius={4} />
            </View>
            <View style={styles.statLine}>
              <SkeletonBox width={70} height={12} borderRadius={4} />
              <SkeletonBox width={36} height={14} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>

      {/* Daily Breakdown / Periods Header */}
      <View style={styles.sectionHeaderRow}>
        <SkeletonBox width={130} height={16} borderRadius={6} />
        <SkeletonBox width={80} height={14} borderRadius={6} />
      </View>

      {/* Period Cards */}
      {[1, 2, 3, 4].map((idx) => (
        <View key={`att_item_${idx}`} style={styles.periodCardSkeleton}>
          <View style={styles.flex1}>
            <SkeletonBox width="65%" height={15} borderRadius={6} style={styles.mb6} />
            <SkeletonBox width="45%" height={12} borderRadius={4} style={styles.mb4} />
            <SkeletonBox width="30%" height={10} borderRadius={4} />
          </View>
          <SkeletonBox width={65} height={26} borderRadius={13} />
        </View>
      ))}
    </ScrollView>
  );
};

/* ── 4. Fees Page Skeleton (Matches src/components/StudentFeesView.tsx) ─ */
export const FeesSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.fullWidth} contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false} scrollEnabled={false}>
      {/* Fee Total Summary Card */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <SkeletonBox width={120} height={16} borderRadius={6} />
          <SkeletonBox width={80} height={22} borderRadius={11} />
        </View>
        <View style={styles.feesSummaryRow}>
          <View style={styles.feesSummaryCol}>
            <SkeletonBox width={60} height={10} borderRadius={4} style={styles.mb4} />
            <SkeletonBox width={85} height={20} borderRadius={6} />
          </View>
          <View style={styles.dividerV} />
          <View style={styles.feesSummaryCol}>
            <SkeletonBox width={60} height={10} borderRadius={4} style={styles.mb4} />
            <SkeletonBox width={85} height={20} borderRadius={6} />
          </View>
          <View style={styles.dividerV} />
          <View style={styles.feesSummaryCol}>
            <SkeletonBox width={60} height={10} borderRadius={4} style={styles.mb4} />
            <SkeletonBox width={85} height={20} borderRadius={6} />
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <SkeletonBox width={75} height={30} borderRadius={8} />
        <SkeletonBox width={75} height={30} borderRadius={8} />
        <SkeletonBox width={75} height={30} borderRadius={8} />
      </View>

      {/* Invoice List Items */}
      {[1, 2, 3].map((idx) => (
        <View key={`fee_item_${idx}`} style={styles.feeInvoiceCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.flex1}>
              <SkeletonBox width="60%" height={16} borderRadius={6} style={styles.mb6} />
              <SkeletonBox width="35%" height={11} borderRadius={4} />
            </View>
            <SkeletonBox width={65} height={22} borderRadius={11} />
          </View>
          <View style={styles.invoiceDetailsGrid}>
            <SkeletonBox width="28%" height={12} borderRadius={4} />
            <SkeletonBox width="28%" height={12} borderRadius={4} />
            <SkeletonBox width="28%" height={12} borderRadius={4} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

/* ── 5. Announcements & Events Skeleton ──────────────────────────────── */
export const AnnouncementsSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.fullWidth} contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false} scrollEnabled={false}>
      {/* 3 Full Event / Announcement Cards */}
      {[1, 2, 3].map((idx) => (
        <View key={`ann_item_${idx}`} style={styles.cardContainer}>
          <SkeletonBox width="100%" height={135} borderRadius={14} style={styles.mb12} />
          <View style={styles.cardHeaderRow}>
            <SkeletonBox width={80} height={20} borderRadius={6} />
            <SkeletonBox width={90} height={12} borderRadius={4} />
          </View>
          <SkeletonBox width="85%" height={17} borderRadius={6} style={styles.mb8} />
          <SkeletonBox width="95%" height={12} borderRadius={4} style={styles.mb6} />
          <SkeletonBox width="60%" height={12} borderRadius={4} style={styles.mb12} />
          <View style={styles.cardFooterRow}>
            <SkeletonBox width={90} height={14} borderRadius={4} />
            <SkeletonBox width={14} height={14} borderRadius={4} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

/* ── 6. Profile Page Skeleton (Matches app/(tabs)/profile.tsx) ────────── */
export const ProfileSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.fullWidth} contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false} scrollEnabled={false}>
      {/* Hero Profile Card */}
      <View style={styles.profileHeroCard}>
        <SkeletonBox width={76} height={76} borderRadius={38} style={styles.mb12} />
        <SkeletonBox width="50%" height={20} borderRadius={6} style={styles.mb6} />
        <SkeletonBox width="35%" height={13} borderRadius={4} style={styles.mb12} />
        <SkeletonBox width={110} height={24} borderRadius={12} />
      </View>

      {/* Academic Details Card */}
      <View style={styles.cardContainer}>
        <SkeletonBox width={140} height={16} borderRadius={6} style={styles.mb12} />
        {[1, 2, 3, 4, 5].map((row) => (
          <View key={`prof_acad_${row}`} style={styles.profileRow}>
            <SkeletonBox width="35%" height={13} borderRadius={4} />
            <SkeletonBox width="45%" height={13} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Personal Info Card */}
      <View style={styles.cardContainer}>
        <SkeletonBox width={150} height={16} borderRadius={6} style={styles.mb12} />
        {[1, 2, 3, 4].map((row) => (
          <View key={`prof_pers_${row}`} style={styles.profileRow}>
            <SkeletonBox width="30%" height={13} borderRadius={4} />
            <SkeletonBox width="50%" height={13} borderRadius={4} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

/* ── 7. Feedback Page Skeleton (Matches StudentFeedbackView.tsx) ─────── */
export const FeedbackSkeleton: React.FC = () => {
  return (
    <View style={styles.moduleSkeletonContainer}>
      <View style={styles.cardContainer}>
        <SkeletonBox width="60%" height={17} borderRadius={6} style={styles.mb6} />
        <SkeletonBox width="85%" height={12} borderRadius={4} />
      </View>

      {[1, 2, 3].map((idx) => (
        <View key={`fb_item_${idx}`} style={styles.cardContainer}>
          <View style={styles.bannerPhotoRow}>
            <SkeletonBox width={44} height={44} borderRadius={22} />
            <View style={styles.flex1}>
              <SkeletonBox width="70%" height={15} borderRadius={6} style={styles.mb4} />
              <SkeletonBox width="50%" height={11} borderRadius={4} />
            </View>
          </View>
          <SkeletonBox width="100%" height={38} borderRadius={10} style={styles.mt8} />
        </View>
      ))}
    </View>
  );
};

/* ── 8. Operations & Generic Module Skeleton ─────────────────────────── */
export const OperationsSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.fullWidth} contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false} scrollEnabled={false}>
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <SkeletonBox width={130} height={16} borderRadius={6} />
          <SkeletonBox width={60} height={16} borderRadius={6} />
        </View>
      </View>
      {[1, 2, 3, 4, 5].map((idx) => (
        <View key={`op_item_${idx}`} style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <SkeletonBox width="50%" height={16} borderRadius={6} />
            <SkeletonBox width={70} height={20} borderRadius={6} />
          </View>
          <SkeletonBox width="75%" height={12} borderRadius={4} style={styles.mb6} />
          <SkeletonBox width="40%" height={11} borderRadius={4} />
        </View>
      ))}
    </ScrollView>
  );
};

export const ModuleContentSkeleton: React.FC = () => {
  return (
    <View style={styles.moduleSkeletonContainer}>
      <SkeletonBox width="100%" height={110} borderRadius={16} style={styles.mb12} />
      <View style={styles.metricsRow}>
        <SkeletonBox width="48%" height={85} borderRadius={14} />
        <SkeletonBox width="48%" height={85} borderRadius={14} />
      </View>
      <SkeletonBox width="100%" height={260} borderRadius={18} style={styles.mb12} />
      <SkeletonBox width="100%" height={64} borderRadius={14} />
    </View>
  );
};

export const QuestionFormSkeleton: React.FC = () => {
  return (
    <View style={styles.moduleSkeletonContainer}>
      {[1, 2, 3].map((idx) => (
        <View key={`q_skel_${idx}`} style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <SkeletonBox width={100} height={12} borderRadius={4} />
            <SkeletonBox width={60} height={16} borderRadius={8} />
          </View>
          <SkeletonBox width="90%" height={15} borderRadius={4} style={styles.mb6} />
          <SkeletonBox width="60%" height={13} borderRadius={4} style={styles.mb12} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <SkeletonBox key={`s_${s}`} width={32} height={32} borderRadius={16} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

/* ── Stylesheet ──────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  skeletonBox: {
    backgroundColor: '#E2E8F0',
  },
  dashboardContainer: {
    paddingTop: 10,
    paddingBottom: 40,
    gap: 14,
  },
  pageContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  moduleSkeletonContainer: {
    width: '100%',
    gap: 12,
    paddingVertical: 4,
  },
  flex1: {
    flex: 1,
  },
  mb4: {
    marginBottom: 4,
  },
  mb6: {
    marginBottom: 6,
  },
  mb8: {
    marginBottom: 8,
  },
  mb12: {
    marginBottom: 12,
  },
  mt8: {
    marginTop: 8,
  },

  /* Card Containers */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  /* Banner Skeleton */
  bannerSkeleton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bannerLeftCol: {
    flex: 1,
    maxWidth: '70%',
  },
  bannerPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  bannerAvatar: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bannerTitleCol: {
    flex: 1,
  },
  bannerPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerRightSilhouette: {
    opacity: 0.6,
  },

  /* Metrics Row Skeleton */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  metricCardSkeleton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricCardBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  metricTextCol: {
    flex: 1,
  },

  /* Services Carousel Skeleton */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  servicesScrollSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
  },
  serviceItemSkeleton: {
    alignItems: 'center',
  },

  /* Events Carousel Skeleton */
  eventsScrollSkeleton: {
    flexDirection: 'row',
    gap: 12,
  },
  eventCardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventCardFooterSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  /* Explore Learn Build Banner Skeleton */
  exploreBannerSkeleton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  exploreLeft: {
    flex: 1,
  },

  /* Attendance Circle Row */
  attendanceCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  attendanceStatsCol: {
    flex: 1,
    gap: 8,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodCardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  /* Fees Summary */
  feesSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  feesSummaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerV: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feeInvoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  invoiceDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  /* Profile Hero */
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
});

export default SkeletonBox;
