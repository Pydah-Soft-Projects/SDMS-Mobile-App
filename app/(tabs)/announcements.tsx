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
import { Bell, AlertCircle, FileText, Calendar } from 'lucide-react-native';
import Header from '../../src/components/Header';
import announcementService from '../../src/services/announcementService';
import { Announcement } from '../../src/types';

export default function AnnouncementsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: 'Mid-Term Examination Schedule Announced',
      content:
        'The Mid-Term theory examinations for all B.Tech branches will commence from next Monday. Please download the timetable from your portal.',
      priority: 'high',
      createdAt: '2026-10-28T09:30:00Z',
      category: 'Exams',
    },
    {
      id: 2,
      title: 'Annual Campus Hackathon & Tech Fest 2026',
      content:
        'Registrations are now open for the campus Hackathon. Form teams of up to 4 members and register before Friday evening.',
      priority: 'medium',
      createdAt: '2026-10-26T14:15:00Z',
      category: 'Events',
    },
    {
      id: 3,
      title: 'Fee Payment Deadline Extension',
      content:
        'The last date for semester tuition fee payment has been extended till 30th November 2026 without late fee charges.',
      priority: 'urgent',
      createdAt: '2026-10-24T11:00:00Z',
      category: 'Accounts',
    },
  ]);

  const loadNotices = async () => {
    try {
      const data = await announcementService.getStudentAnnouncements();
      if (data && data.length > 0) {
        setAnnouncements(data);
      }
    } catch (e) {
      console.warn('Using default notices', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

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
      <Header title="Circulars & Notices" subtitle="Official Campus Announcements" />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {announcements.map((item) => {
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
          })}
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
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    marginBottom: 12,
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
});

