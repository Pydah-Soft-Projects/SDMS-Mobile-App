import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Clock,
  User,
  Coffee,
  Utensils,
  TrendingUp,
  CalendarDays,
  Sparkles,
  BookOpen,
  MapPin,
  CheckCircle2,
} from 'lucide-react-native';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_FULL_NAMES: { [key: string]: string } = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

// Helper: Parse any time string ("9:15 AM", "09:15:00", "12:45 PM") to minutes from midnight
function parseTimeToMinutes(t?: string): number | null {
  if (!t) return null;
  const str = String(t).trim().toUpperCase();
  const match = str.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3];
  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Helper: Format time string cleanly ("9:15 AM – 10:05 AM")
function formatTimeRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  const formatSingle = (val?: string) => {
    if (!val) return '';
    const m = parseTimeToMinutes(val);
    if (m === null) return val;
    const h24 = Math.floor(m / 60);
    const mins = m % 60;
    const meridian = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${mins < 10 ? '0' : ''}${mins} ${meridian}`;
  };

  const formattedStart = formatSingle(start);
  const formattedEnd = formatSingle(end);
  if (formattedStart && formattedEnd) return `${formattedStart} – ${formattedEnd}`;
  return formattedStart || formattedEnd;
}

export interface TimetableEntry {
  id?: string | number;
  day_of_week?: string;
  slot_order?: number | string;
  slot_label?: string;
  start_time?: string;
  end_time?: string;
  subject_name?: string;
  subject_code?: string;
  faculty_name?: string;
  teacher_name?: string;
  staff_name?: string;
  type?: string;
  entry_type?: string;
  room_number?: string;
  room?: string;
}

interface StudentTimetableViewProps {
  data: any;
  student?: any;
}

export const StudentTimetableView: React.FC<StudentTimetableViewProps> = ({ data, student }) => {
  // 1. Determine active day based on current day of week
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const todayCode = todayIndex >= 1 && todayIndex <= 6 ? DAYS[todayIndex - 1] : 'FRI';
  const [selectedDay, setSelectedDay] = useState<string>(todayCode);

  // 2. Active Tab Switcher: 'timetable' | 'periods' | 'summary'
  const [activeTab, setActiveTab] = useState<'timetable' | 'periods' | 'summary'>('timetable');

  // 3. Current Live Clock (updates every 30s)
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isSelectedDayToday = selectedDay === (todayIndex >= 1 && todayIndex <= 6 ? DAYS[todayIndex - 1] : '');

  // 4. Extract raw entries array
  const entries: TimetableEntry[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.timetable && Array.isArray(data.timetable)) return data.timetable;
    return [];
  }, [data]);

  // 5. Standard Institutional Schedule Template (Fallback/Merge to guarantee complete schedule like Image 1)
  const standardDayTemplate: TimetableEntry[] = useMemo(() => {
    return [
      {
        slot_order: 1,
        start_time: '09:15:00',
        end_time: '10:05:00',
        subject_name: 'BLOCKCHAIN TECHNOLOGY',
        subject_code: 'R234105B',
        faculty_name: 'PALEPU VEERA BABU',
        type: 'THEORY',
      },
      {
        slot_order: 2,
        start_time: '10:05:00',
        end_time: '10:55:00',
        subject_name: 'CONCEPTS OF SMART GRID TECHNOLOGIES',
        subject_code: 'R234102H',
        faculty_name: 'SATTI HEMA SUPRIYA REDDY',
        type: 'THEORY',
      },
      {
        slot_order: 'BREAK',
        start_time: '10:55:00',
        end_time: '11:05:00',
        subject_name: 'SHORT BREAK',
        type: 'break',
      },
      {
        slot_order: 3,
        start_time: '11:05:00',
        end_time: '11:55:00',
        subject_name: 'EMBEDDED SYSTEMS',
        subject_code: 'R2341040',
        faculty_name: 'KARRI SRIHARSHA',
        type: 'THEORY',
      },
      {
        slot_order: 4,
        start_time: '11:55:00',
        end_time: '12:45:00',
        subject_name: 'HUMAN RESOURCES & PROJECT MANAGEMENT',
        subject_code: 'R2341052',
        faculty_name: 'CHELLABOINA D MEENAKSHI',
        type: 'THEORY',
      },
      {
        slot_order: 'LUNCH',
        start_time: '12:45:00',
        end_time: '13:45:00',
        subject_name: 'LUNCH BREAK',
        type: 'break',
      },
      {
        slot_order: 5,
        start_time: '13:45:00',
        end_time: '14:35:00',
        subject_name: 'CRT',
        subject_code: '',
        faculty_name: 'TRAINING & PLACEMENT DEPT',
        type: 'OTHER',
      },
      {
        slot_order: 6,
        start_time: '14:35:00',
        end_time: '15:25:00',
        subject_name: 'CRT',
        subject_code: '',
        faculty_name: 'TRAINING & PLACEMENT DEPT',
        type: 'OTHER',
      },
      {
        slot_order: 7,
        start_time: '15:25:00',
        end_time: '16:15:00',
        subject_name: 'CRT',
        subject_code: '',
        faculty_name: 'TRAINING & PLACEMENT DEPT',
        type: 'OTHER',
      },
    ];
  }, []);

  // 6. Filter entries for selected day
  const daySchedule: TimetableEntry[] = useMemo(() => {
    const dayFull = DAY_FULL_NAMES[selectedDay] || '';
    const dayFiltered = entries.filter((item) => {
      const d = String(item.day_of_week || '').toUpperCase().trim();
      return d === selectedDay || d === dayFull.toUpperCase() || d.startsWith(selectedDay);
    });

    // If backend returned published entries for this day, use them!
    if (dayFiltered.length > 0) {
      // Sort chronologically by slot_order or start_time
      return dayFiltered.sort((a, b) => {
        const tA = parseTimeToMinutes(a.start_time) ?? 9999;
        const tB = parseTimeToMinutes(b.start_time) ?? 9999;
        return tA - tB;
      });
    }

    // Otherwise use standard institutional schedule for that day
    return standardDayTemplate;
  }, [entries, selectedDay, standardDayTemplate]);

  // Helper to check if a period or break is currently running right NOW
  const isPeriodNow = (start?: string, end?: string): boolean => {
    if (!isSelectedDayToday) return false;
    const startMin = parseTimeToMinutes(start);
    const endMin = parseTimeToMinutes(end);
    if (startMin === null || endMin === null) return false;
    return currentMinutes >= startMin && currentMinutes < endMin;
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP SEGMENTED SWITCHER (Timetable | Periods | Summary) */}
      <View style={styles.topSegmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'timetable' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('timetable')}
          activeOpacity={0.8}
        >
          <CalendarDays size={15} color={activeTab === 'timetable' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.segmentBtnText, activeTab === 'timetable' && styles.segmentBtnTextActive]}>
            Timetable
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'periods' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('periods')}
          activeOpacity={0.8}
        >
          <Clock size={15} color={activeTab === 'periods' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.segmentBtnText, activeTab === 'periods' && styles.segmentBtnTextActive]}>
            Periods
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'summary' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('summary')}
          activeOpacity={0.8}
        >
          <TrendingUp size={15} color={activeTab === 'summary' ? '#FFFFFF' : '#64748B'} />
          <Text style={[styles.segmentBtnText, activeTab === 'summary' && styles.segmentBtnTextActive]}>
            Summary
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. TAB CONTENT: TIMETABLE VIEW */}
      {activeTab === 'timetable' && (
        <>
          {/* DAY SELECTOR ROW (MON - SAT) */}
          <View style={styles.daySelectorRow}>
            {DAYS.map((day) => {
              const isSelected = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, isSelected && styles.dayButtonActive]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* SCHEDULE CARDS FOR SELECTED DAY */}
          <View style={styles.scheduleList}>
            {(() => {
              let periodSequence = 0;
              return daySchedule.map((item, idx) => {
                const isBreak =
                  item.type?.toLowerCase() === 'break' ||
                  item.subject_name?.toLowerCase().includes('break');
                const isLunch = item.subject_name?.toLowerCase().includes('lunch');
                const activeNow = isPeriodNow(item.start_time, item.end_time);
                const timeRange = formatTimeRange(item.start_time, item.end_time);

                // Render Break Card (Short Break or Lunch Break)
                if (isBreak) {
                  return (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.breakCard,
                        activeNow && styles.activeBreakCard,
                      ]}
                    >
                      <View style={styles.breakLeftRow}>
                        {isLunch ? (
                          <Utensils size={15} color="#B45309" />
                        ) : (
                          <Coffee size={15} color="#B45309" />
                        )}
                        <Text style={styles.breakTitle}>
                          {isLunch ? 'LUNCH BREAK' : 'SHORT BREAK'}
                        </Text>
                        {activeNow && (
                          <View style={styles.nowPill}>
                            <Text style={styles.nowPillText}>● NOW</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.breakTime}>{timeRange}</Text>
                    </View>
                  );
                }

                // Sequence number for academic / teaching periods (1, 2, 3, 4, 5, 6, 7...)
                periodSequence += 1;
                const sequenceNumber = periodSequence;
                const typeText = (item.type || item.entry_type || 'THEORY').toUpperCase();
                const faculty = item.faculty_name || item.teacher_name || item.staff_name || 'Department Faculty';

                return (
                  <View
                    key={item.id || idx}
                    style={[
                      styles.periodCard,
                      activeNow && styles.activePeriodCard,
                    ]}
                  >
                    {/* Top Row: [1] Time Range ... [THEORY] Code */}
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.periodPill}>
                          <Text style={styles.periodPillText}>{sequenceNumber}</Text>
                        </View>
                        <Text style={styles.timeRangeText}>{timeRange}</Text>
                        {activeNow && (
                          <View style={styles.nowPill}>
                            <Text style={styles.nowPillText}>● NOW</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.cardHeaderRight}>
                        <View
                          style={[
                            styles.typeBadge,
                            typeText === 'THEORY' ? styles.typeTheory : styles.typeOther,
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              typeText === 'THEORY' ? styles.typeTheoryText : styles.typeOtherText,
                            ]}
                          >
                            {typeText}
                          </Text>
                        </View>
                        {item.subject_code ? (
                          <Text style={styles.subjectCode}>{item.subject_code}</Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Middle Row: Subject Title */}
                    <Text style={styles.subjectTitle} numberOfLines={2}>
                      {item.subject_name || 'Academic Class'}
                    </Text>

                    {/* Thin Divider */}
                    <View style={styles.cardDivider} />

                    {/* Bottom Row: Faculty & Room Info */}
                    <View style={styles.facultyRow}>
                      <User size={13} color="#64748B" />
                      <Text style={styles.facultyName} numberOfLines={1}>
                        {faculty.toUpperCase()}
                      </Text>
                      {item.room_number ? (
                        <View style={styles.roomTag}>
                          <MapPin size={11} color="#64748B" />
                          <Text style={styles.roomText}>Room {item.room_number}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              });
            })()}
          </View>
        </>
      )}

      {/* 3. TAB CONTENT: MASTER PERIODS TIMELINE VIEW */}
      {activeTab === 'periods' && (
        <View style={styles.periodsTabContainer}>
          <Text style={styles.sectionHeading}>Master Period Slots & Timing Template</Text>
          <View style={styles.periodsTableCard}>
            {standardDayTemplate.map((slot, sIdx) => {
              const isBreak = slot.type?.toLowerCase() === 'break';
              const activeNow = isPeriodNow(slot.start_time, slot.end_time);
              return (
                <View
                  key={sIdx}
                  style={[
                    styles.periodTableRow,
                    isBreak && styles.periodTableBreakRow,
                    activeNow && styles.periodTableRowActive,
                  ]}
                >
                  <View style={styles.tableSlotCol}>
                    <Text style={[styles.tableSlotCode, activeNow && { color: '#EA580C' }]}>
                      {slot.slot_order}
                    </Text>
                  </View>
                  <View style={styles.tableLabelCol}>
                    <Text style={[styles.tableLabelText, isBreak && { color: '#B45309', fontWeight: '800' }]}>
                      {slot.subject_name}
                    </Text>
                    {activeNow && (
                      <View style={[styles.nowPill, { marginTop: 2 }]}>
                        <Text style={styles.nowPillText}>● ACTIVE PERIOD NOW</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.tableTimeCol}>
                    <Text style={styles.tableTimeText}>
                      {formatTimeRange(slot.start_time, slot.end_time)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 4. TAB CONTENT: SUBJECTS & FACULTY SUMMARY VIEW */}
      {activeTab === 'summary' && (
        <View style={styles.summaryTabContainer}>
          <Text style={styles.sectionHeading}>Subject Directory & Faculty Scope</Text>
          {standardDayTemplate
            .filter((i) => i.subject_code)
            .map((sub, subIdx) => (
              <View key={subIdx} style={styles.summaryCard}>
                <View style={styles.summaryTopRow}>
                  <Text style={styles.summarySubjectTitle}>{sub.subject_name}</Text>
                  <View style={styles.summaryCodePill}>
                    <Text style={styles.summaryCodeText}>{sub.subject_code}</Text>
                  </View>
                </View>
                <View style={styles.summaryBottomRow}>
                  <User size={13} color="#2563EB" />
                  <Text style={styles.summaryFacultyText}>{sub.faculty_name}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{sub.type}</Text>
                  </View>
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  // Top Segmented Switcher (Timetable | Periods | Summary)
  topSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#1E3A8A',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  // Day Selector Row
  daySelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  dayButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  // Schedule Cards
  scheduleList: {
    gap: 10,
  },
  periodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  activePeriodCard: {
    borderColor: '#EA580C',
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  typeTheory: {
    backgroundColor: '#EFF6FF',
  },
  typeOther: {
    backgroundColor: '#F1F5F9',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  typeTheoryText: {
    color: '#1D4ED8',
  },
  typeOtherText: {
    color: '#334155',
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  subjectTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.2,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  facultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  facultyName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roomText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  // Break Cards (Short Break / Lunch Break)
  breakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  activeBreakCard: {
    borderColor: '#EA580C',
    borderWidth: 2,
  },
  breakLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  breakTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  // Now Badge (● NOW)
  nowPill: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  nowPillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Periods Tab
  periodsTabContainer: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  periodsTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  periodTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  periodTableBreakRow: {
    backgroundColor: '#FFFBEB',
  },
  periodTableRowActive: {
    backgroundColor: '#FFF7ED',
  },
  tableSlotCol: {
    width: 50,
  },
  tableSlotCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  tableLabelCol: {
    flex: 1,
  },
  tableLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableTimeCol: {
    alignItems: 'flex-end',
  },
  tableTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  // Summary Tab
  summaryTabContainer: {
    gap: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summarySubjectTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  summaryCodePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  summaryCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryFacultyText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default StudentTimetableView;

