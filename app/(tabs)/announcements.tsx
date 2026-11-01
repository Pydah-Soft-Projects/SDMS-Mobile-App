import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Bell, AlertCircle, Calendar } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import announcementService from '../../src/services/announcementService';
import { Announcement } from '../../src/types';

export default function AnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const { userType } = useAuth();
  const isStaff = userType === 'staff' || userType === 'admin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const loadNotices = async () => {
    try {
      const data = isStaff
        ? await announcementService.getAdminAnnouncements()
        : await announcementService.getStudentAnnouncements();
      setAnnouncements(data);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, [userType]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotices();
    setRefreshing(false);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#FEE2E2', text: '#B91C1C' };
      case 'high':
        return { bg: '#FFEDD5', text: '#C2410C' };
      default:
        return { bg: '#EFF6FF', text: '#1D4ED8' };
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isStaff ? 'Campus Circulars' : 'Circulars & Notices'}
        subtitle={isStaff ? 'SDMS Institutional Announcements' : 'Official Student Announcements'}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Loading announcements...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {announcements.length > 0 ? (
            announcements.map((item) => {
              const pStyle = getPriorityStyle(item.priority);
              const formattedDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
                      <AlertCircle size={12} color={pStyle.text} />
                      <Text style={[styles.priorityText, { color: pStyle.text }]}>
                        {item.priority.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.dateRow}>
                      <Calendar size={12} color="#94A3B8" />
                      <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>
                  </View>

                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body}>{item.content}</Text>

                  {item.category && (
                    <View style={styles.footerRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryText}>#{item.category}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Bell size={32} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Announcements</Text>
              <Text style={styles.emptyText}>
                There are no active circulars posted in SDMS at this time.
              </Text>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 22,
  },
  body: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
