import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import {
  Bell,
  AlertCircle,
  Calendar,
  ExternalLink,
  Sparkles,
  Clock,
  MapPin,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Header from '../../src/components/Header';
import announcementService from '../../src/services/announcementService';
import studentService from '../../src/services/studentService';
import notificationService from '../../src/services/notificationService';
import { isExamRelated } from '../../src/utils/filterUtils';
import { Announcement } from '../../src/types';
import api, { getStaticFileUrl } from '../../src/config/api';
import DefaultEventPoster from '../../src/components/DefaultEventPoster';

const SafeAnnouncementImage: React.FC<{ uri?: string | null; style: any }> = ({ uri, style }) => {
  const [loadError, setLoadError] = useState(false);

  if (!uri || loadError) {
    return <DefaultEventPoster style={style} />;
  }

  return (
    <Image
      source={{ uri: getStaticFileUrl(uri) }}
      style={style}
      resizeMode="cover"
      onError={() => setLoadError(true)}
    />
  );
};

export default function AnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const { userType } = useAuth();
  const isStaff = userType === 'staff' || userType === 'admin';

  // Active Tab: 'announcements' | 'events'
  const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [registeringEventId, setRegisteringEventId] = useState<number | string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  const sortEventsNewestFirst = (list: any[]) => {
    return (list || []).slice().sort((a, b) => {
      const timeA = new Date(a.event_date || a.createdAt || 0).getTime();
      const timeB = new Date(b.event_date || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  };

  const loadData = async () => {
    try {
      const [announcesData, eventsData, permissionStatus] = await Promise.all([
        isStaff
          ? announcementService.getAdminAnnouncements()
          : announcementService.getStudentAnnouncements(),
        studentService.getEvents(),
        notificationService.checkHasPermission(),
      ]);

      const filteredAnnouncements = (announcesData || []).filter((item: any) => !isExamRelated(item));
      const filteredEvents = sortEventsNewestFirst((eventsData || []).filter((item: any) => !isExamRelated(item)));

      setAnnouncements(filteredAnnouncements);
      setEvents(filteredEvents);
      setHasPermission(permissionStatus);

      // Mark all notices as seen when the screen loads
      await notificationService.markAllAsSeen();
    } catch {
      setAnnouncements([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Clear notification counts immediately every time the user visits this screen
      notificationService.markAllAsSeen();
      loadData();
    }, [userType])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openAttachment = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert('Unable to open attachment', error.message || 'Please try again later.');
    }
  };

  const handleEventRegistration = async (event: any) => {
    const eventId = event.id;
    const isRegistered = event.is_registered || event.registered;
    setRegisteringEventId(eventId);

    try {
      if (isRegistered) {
        await api.delete(`/events/${eventId}/register`);
        Alert.alert('Registration Cancelled', 'Your registration has been cancelled.');
      } else {
        await api.post(`/events/${eventId}/register`);
        Alert.alert('Registered Successfully!', 'You are registered for this event.');
      }
      // Refresh event list
      const updatedEvents = await studentService.getEvents();
      setEvents(sortEventsNewestFirst((updatedEvents || []).filter((item: any) => !isExamRelated(item))));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Action failed. Please try again.';
      Alert.alert('Event Action', msg);
    } finally {
      setRegisteringEventId(null);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority?.toLowerCase()) {
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
        title={isStaff ? 'Campus Circulars' : 'Circulars & Events'}
        subtitle={isStaff ? 'SDMS Institutional Announcements' : 'Official Student Notices & Events'}
      />

      {/* Segmented Tab Switcher */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'announcements' && styles.tabButtonActive]}
            onPress={() => setActiveTab('announcements')}
            activeOpacity={0.8}
          >
            <Bell size={15} color={activeTab === 'announcements' ? '#1E3A8A' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'announcements' && styles.tabTextActive]}>
              Circulars & Notices
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'events' && styles.tabButtonActive]}
            onPress={() => setActiveTab('events')}
            activeOpacity={0.8}
          >
            <CalendarDays size={15} color={activeTab === 'events' ? '#1E3A8A' : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
              Campus Events
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>Loading updates & notifications...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 84 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
          scrollEventThrottle={16}
          overScrollMode="never"
        >
          {/* Permission Notice Banner if disabled */}
          {!hasPermission && (
            <View style={styles.permissionCard}>
              <View style={styles.permissionCardLeft}>
                <View style={styles.permissionIconBadge}>
                  <Bell size={15} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.permissionCardTitle}>Notifications Disabled</Text>
                  <Text style={styles.permissionCardSubtitle}>
                    Enable notifications to get instant alerts for circulars and events
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.permissionCardBtn}
                onPress={async () => {
                  const granted = await notificationService.requestPermissionWithPrompt();
                  if (granted) {
                    setHasPermission(true);
                    Alert.alert(
                      'Notifications Enabled',
                      'You are now set up to receive instant alerts for important college circulars and events.'
                    );
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.permissionCardBtnText}>Enable</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 1: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <>
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
                            {String(item.priority || 'NORMAL').toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.dateRow}>
                          <Calendar size={12} color="#94A3B8" />
                          <Text style={styles.dateText}>{formattedDate}</Text>
                        </View>
                      </View>

                      <Text style={styles.title}>{item.title}</Text>

                      <View style={styles.cardImageWrapper}>
                        <SafeAnnouncementImage uri={item.imageUrl} style={styles.cardImage} />
                      </View>

                      {item.content ? (
                        <View style={styles.bodyContainer}>
                          <Text style={styles.body}>{item.content}</Text>
                        </View>
                      ) : null}

                      {item.attachmentUrl ? (
                        <TouchableOpacity
                          style={styles.attachmentButton}
                          onPress={() => openAttachment(item.attachmentUrl!)}
                          activeOpacity={0.8}
                        >
                          <ExternalLink size={15} color="#FFFFFF" />
                          <Text style={styles.attachmentButtonText}>Open Attachment</Text>
                        </TouchableOpacity>
                      ) : null}

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
                  <Bell size={36} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Circulars Available</Text>
                  <Text style={styles.emptyText}>
                    There are no active announcements posted in SDMS at this time.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* TAB 2: CAMPUS EVENTS */}
          {activeTab === 'events' && (
            <>
              {events.length > 0 ? (
                events.map((event: any, idx: number) => {
                  const formattedDate = event.event_date
                    ? new Date(event.event_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Scheduled';

                  const isRegistered = event.is_registered || event.registered;
                  const isProcessing = registeringEventId === event.id;

                  return (
                    <View key={event.id || idx} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={[styles.priorityBadge, { backgroundColor: '#EFF6FF' }]}>
                          <Sparkles size={12} color="#2563EB" />
                          <Text style={[styles.priorityText, { color: '#1D4ED8' }]}>
                            {String(event.event_type || 'CAMPUS EVENT').toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.dateRow}>
                          <Calendar size={12} color="#94A3B8" />
                          <Text style={styles.dateText}>{formattedDate}</Text>
                        </View>
                      </View>

                      <Text style={styles.title}>{event.title}</Text>

                      {/* Event Poster */}
                      <View style={styles.cardImageWrapper}>
                        <SafeAnnouncementImage
                          uri={event.image_url || event.poster_url}
                          style={styles.cardImage}
                        />
                      </View>

                      {/* Event Meta Row (Time & Venue) */}
                      <View style={styles.eventMetaRow}>
                        {event.start_time ? (
                          <View style={styles.metaItem}>
                            <Clock size={13} color="#64748B" />
                            <Text style={styles.metaItemText}>
                              {event.start_time} {event.end_time ? `- ${event.end_time}` : ''}
                            </Text>
                          </View>
                        ) : null}

                        {event.location || event.venue ? (
                          <View style={styles.metaItem}>
                            <MapPin size={13} color="#64748B" />
                            <Text style={styles.metaItemText}>
                              {event.location || event.venue}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {event.description ? (
                        <View style={styles.bodyContainer}>
                          <Text style={styles.body}>{event.description}</Text>
                        </View>
                      ) : null}

                      {/* Event Registration Action */}
                      <TouchableOpacity
                        style={[
                          styles.eventActionBtn,
                          isRegistered && styles.eventActionBtnRegistered,
                        ]}
                        onPress={() => handleEventRegistration(event)}
                        disabled={isProcessing}
                        activeOpacity={0.8}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : isRegistered ? (
                          <>
                            <CheckCircle2 size={16} color="#FFFFFF" />
                            <Text style={styles.eventActionBtnText}>Registered • Tap to Cancel</Text>
                          </>
                        ) : (
                          <>
                            <CalendarDays size={16} color="#FFFFFF" />
                            <Text style={styles.eventActionBtnText}>Register for Event</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Calendar size={36} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Upcoming Events</Text>
                  <Text style={styles.emptyText}>
                    There are no scheduled campus events at this moment. Check back soon!
                  </Text>
                </View>
              )}
            </>
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
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#EFF6FF',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBadgeTextActive: {
    color: '#1D4ED8',
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
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  permissionCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  permissionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#92400E',
  },
  permissionCardSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  permissionCardBtn: {
    backgroundColor: '#92400E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  permissionCardBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
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
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardImageWrapper: {
    width: '100%',
    height: 165,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#0F172A',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  eventMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaItemText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
  },
  bodyContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  body: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '400',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingVertical: 11,
    marginBottom: 10,
  },
  attachmentButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  eventActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 4,
  },
  eventActionBtnRegistered: {
    backgroundColor: '#059669',
  },
  eventActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 2,
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
    padding: 44,
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
    lineHeight: 18,
  },
});
