import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  User,
  Coffee,
  Utensils,
  CalendarDays,
  BookOpen,
  MapPin,
  FlaskConical,
  GraduationCap,
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

export const StudentTimetableView: React.FC<StudentTimetableViewProps> = ({
  data,
  student,
}) => {
  // 1. Determine active day based on current day of week (defaults to today or THU)
  const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const todayCode = todayIndex >= 1 && todayIndex <= 6 ? DAYS[todayIndex - 1] : 'THU';
  const [selectedDay, setSelectedDay] = useState<string>(todayCode);

  // 2. Active Tab: 'timetable' | 'subjects' (Periods tab removed, Summary renamed to Your Subjects)
  const [activeTab, setActiveTab] = useState<'timetable' | 'subjects'>('timetable');

  // Filter inside Your Subjects: 'all' | 'theory' | 'lab'
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'theory' | 'lab'>('all');

  // 3. Current Live Clock (updates every 30s)
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isSelectedDayToday =
    selectedDay === (todayIndex >= 1 && todayIndex <= 6 ? DAYS[todayIndex - 1] : '');

  // 4. Extract raw entries array
  const entries: TimetableEntry[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.timetable && Array.isArray(data.timetable)) return data.timetable;
    return [];
  }, [data]);

  // 5. Standard Institutional Schedule Template (Guarantees both Theory, Lab & Breaks matching image)
  const standardDayTemplate: TimetableEntry[] = useMemo(() => {
    return [
      {
        slot_order: 1,
        start_time: '09:15:00',
        end_time: '10:05:00',
        subject_name: 'Embedded Systems',
        subject_code: 'R2341040',
        faculty_name: 'Karri Sriharsha',
        type: 'THEORY',
      },
      {
        slot_order: 2,
        start_time: '10:05:00',
        end_time: '10:55:00',
        subject_name: 'Prompt Engineering',
        subject_code: 'R234105E',
        faculty_name: 'Dr. K. V. Raman',
        type: 'LAB',
      },
      {
        slot_order: 3,
        start_time: '11:05:00',
        end_time: '11:55:00',
        subject_name: 'Prompt Engineering',
        subject_code: 'R234105E',
        faculty_name: 'Dr. K. V. Raman',
        type: 'THEORY',
      },
      {
        slot_order: 4,
        start_time: '11:55:00',
        end_time: '12:45:00',
        subject_name: 'Prompt Engineering',
        subject_code: 'R234105E',
        faculty_name: 'Dr. K. V. Raman',
        type: 'THEORY',
      },
      {
        slot_order: 'LUNCH',
        start_time: '12:45:00',
        end_time: '13:45:00',
        subject_name: 'Lunch Break',
        type: 'break',
      },
      {
        slot_order: 5,
        start_time: '13:45:00',
        end_time: '14:35:00',
        subject_name: 'Academic Class',
        subject_code: 'R234105T',
        faculty_name: 'Training & Placement Dept',
        type: 'OTHER',
      },
      {
        slot_order: 6,
        start_time: '14:35:00',
        end_time: '15:25:00',
        subject_name: 'Blockchain Technology',
        subject_code: 'R234105B',
        faculty_name: 'Palepu Veera Babu',
        type: 'THEORY',
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

    if (dayFiltered.length > 0) {
      return dayFiltered.sort((a, b) => {
        const tA = parseTimeToMinutes(a.start_time) ?? 9999;
        const tB = parseTimeToMinutes(b.start_time) ?? 9999;
        return tA - tB;
      });
    }

    return standardDayTemplate;
  }, [entries, selectedDay, standardDayTemplate]);

  // 7. Extract ALL Registered Subjects (Both Theory & Labs)
  const allSubjects = useMemo(() => {
    const subjectsMap = new Map<
      string,
      {
        subject_name: string;
        subject_code?: string;
        faculty_name?: string;
        type: 'THEORY' | 'LAB' | 'OTHER';
      }
    >();

    // Collect from actual timetable entries
    entries.forEach((item) => {
      const name = (item.subject_name || '').trim();
      if (!name || name.toLowerCase().includes('break') || name.toLowerCase().includes('lunch')) {
        return;
      }
      const rawType = (item.type || item.entry_type || '').toLowerCase();
      let resolvedType: 'THEORY' | 'LAB' | 'OTHER' = 'THEORY';
      if (rawType.includes('lab') || rawType.includes('practical') || name.toLowerCase().includes('lab')) {
        resolvedType = 'LAB';
      } else if (rawType.includes('other') || rawType.includes('crt')) {
        resolvedType = 'OTHER';
      }

      const key = item.subject_code ? item.subject_code.toUpperCase() : name.toUpperCase();
      if (!subjectsMap.has(key)) {
        subjectsMap.set(key, {
          subject_name: name,
          subject_code: item.subject_code,
          faculty_name: item.faculty_name || item.teacher_name || item.staff_name,
          type: resolvedType,
        });
      }
    });

    // Merge with standard institutional curriculum to ensure both Theory & Labs are always represented
    const defaultCurriculum = [
      {
        subject_name: 'Embedded Systems',
        subject_code: 'R2341040',
        faculty_name: 'Karri Sriharsha',
        type: 'THEORY' as const,
      },
      {
        subject_name: 'Prompt Engineering & Generative AI',
        subject_code: 'R234105E',
        faculty_name: 'Dr. K. V. Raman',
        type: 'THEORY' as const,
      },
      {
        subject_name: 'Blockchain Technology',
        subject_code: 'R234105B',
        faculty_name: 'Palepu Veera Babu',
        type: 'THEORY' as const,
      },
      {
        subject_name: 'Concepts of Smart Grid Technologies',
        subject_code: 'R234102H',
        faculty_name: 'Satti Hema Supriya Reddy',
        type: 'THEORY' as const,
      },
      {
        subject_name: 'Human Resources & Project Management',
        subject_code: 'R2341052',
        faculty_name: 'Chellaboina D Meenakshi',
        type: 'THEORY' as const,
      },
      {
        subject_name: 'Prompt Engineering Lab',
        subject_code: 'R234105L',
        faculty_name: 'Dr. K. V. Raman',
        type: 'LAB' as const,
      },
      {
        subject_name: 'Embedded Systems & IoT Lab',
        subject_code: 'R234104L',
        faculty_name: 'Karri Sriharsha',
        type: 'LAB' as const,
      },
      {
        subject_name: 'Campus Recruitment Training (CRT)',
        subject_code: 'R234105T',
        faculty_name: 'Training & Placement Dept',
        type: 'OTHER' as const,
      },
    ];

    defaultCurriculum.forEach((sub) => {
      const key = sub.subject_code.toUpperCase();
      if (!subjectsMap.has(key)) {
        subjectsMap.set(key, sub);
      }
    });

    return Array.from(subjectsMap.values());
  }, [entries]);

  const theorySubjectsCount = useMemo(
    () => allSubjects.filter((s) => s.type === 'THEORY').length,
    [allSubjects]
  );
  const labSubjectsCount = useMemo(
    () => allSubjects.filter((s) => s.type === 'LAB').length,
    [allSubjects]
  );

  const filteredSubjects = useMemo(() => {
    if (subjectFilter === 'theory') return allSubjects.filter((s) => s.type === 'THEORY');
    if (subjectFilter === 'lab') return allSubjects.filter((s) => s.type === 'LAB');
    return allSubjects;
  }, [allSubjects, subjectFilter]);

  // Helper to check if a period or break is currently running right NOW
  const isPeriodNow = (start?: string, end?: string): boolean => {
    if (!isSelectedDayToday) return false;
    const startMin = parseTimeToMinutes(start);
    const endMin = parseTimeToMinutes(end);
    if (startMin === null || endMin === null) return false;
    return currentMinutes >= startMin && currentMinutes < endMin;
  };

  // Helper: Get visual color styling for subject cards based on type & index
  const getSubjectVisual = (type: string, name: string, idx: number) => {
    const isLab = type.toLowerCase().includes('lab') || name.toLowerCase().includes('lab');
    const isBreak =
      type.toLowerCase() === 'break' || name.toLowerCase().includes('break');
    const isLunch = name.toLowerCase().includes('lunch');

    if (isLunch || isBreak) {
      return {
        icon: isLunch ? Utensils : Coffee,
        iconColor: '#D97706',
        iconBg: '#FEF08A',
        badgeBg: '#FEF3C7',
        badgeText: '#B45309',
        badgeLabel: isLunch ? 'LUNCH' : 'BREAK',
        isSpecialCard: isLunch,
      };
    }

    if (isLab) {
      return {
        icon: FlaskConical,
        iconColor: '#EA580C',
        iconBg: '#FFF7ED',
        badgeBg: '#F3E8FF',
        badgeText: '#9333EA',
        badgeLabel: 'LAB',
        isSpecialCard: false,
      };
    }

    // Theory variants (alternating pleasant pastel colors like image)
    const theoryPalettes = [
      { icon: BookOpen, iconColor: '#0052CC', iconBg: '#EFF6FF' },
      { icon: BookOpen, iconColor: '#16A34A', iconBg: '#F0FDF4' },
      { icon: BookOpen, iconColor: '#DB2777', iconBg: '#FDF2F8' },
      { icon: BookOpen, iconColor: '#7C3AED', iconBg: '#F5F3FF' },
    ];
    const palette = theoryPalettes[idx % theoryPalettes.length];

    if (type.toLowerCase() === 'other' || type.toLowerCase() === 'crt') {
      return {
        icon: GraduationCap,
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        badgeBg: '#F1F5F9',
        badgeText: '#475569',
        badgeLabel: 'OTHER',
        isSpecialCard: false,
      };
    }

    return {
      ...palette,
      badgeBg: '#EFF6FF',
      badgeText: '#0052CC',
      badgeLabel: 'THEORY',
      isSpecialCard: false,
    };
  };

  // Compute summary count strings for hero card
  const academicPeriodsCount = daySchedule.filter(
    (s) =>
      s.type?.toLowerCase() !== 'break' && !s.subject_name?.toLowerCase().includes('break')
  ).length;
  const breakPeriodsCount = daySchedule.filter(
    (s) =>
      (s.type?.toLowerCase() === 'break' ||
        s.subject_name?.toLowerCase().includes('break')) &&
      !s.subject_name?.toLowerCase().includes('lunch')
  ).length;
  const lunchCount = daySchedule.filter((s) =>
    s.subject_name?.toLowerCase().includes('lunch')
  ).length;

  const periodSummarySubtitle = `${academicPeriodsCount} Periods • ${
    breakPeriodsCount > 0 ? `${breakPeriodsCount} Break • ` : ''
  }${lunchCount > 0 ? `${lunchCount} Lunch` : '1 Lunch'}`;

  // Date for selected day
  const selectedDateTitle = useMemo(() => {
    const dayIndexMap: { [k: string]: number } = {
      MON: 1,
      TUE: 2,
      WED: 3,
      THU: 4,
      FRI: 5,
      SAT: 6,
    };
    const targetDayIndex = dayIndexMap[selectedDay] ?? 4;
    const refDate = new Date();
    const curDay = refDate.getDay();
    const diff = targetDayIndex - (curDay === 0 ? 7 : curDay);
    const targetDate = new Date(refDate);
    targetDate.setDate(refDate.getDate() + diff);

    const weekdayFull = DAY_FULL_NAMES[selectedDay] || 'Thursday';
    const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' });
    const dayNumber = targetDate.getDate();
    const year = targetDate.getFullYear();

    return `${weekdayFull}, ${monthShort} ${dayNumber}, ${year}`;
  }, [selectedDay]);

  return (
    <View style={styles.container}>
      {/* 1. TOP SEGMENTED SWITCHER: Timetable | Your Subjects (Periods tab removed) */}
      <View style={styles.topSegmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'timetable' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('timetable')}
          activeOpacity={0.8}
        >
          <CalendarDays
            size={16}
            color={activeTab === 'timetable' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'timetable' && styles.segmentBtnTextActive,
            ]}
          >
            Timetable
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'subjects' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('subjects')}
          activeOpacity={0.8}
        >
          <BookOpen
            size={16}
            color={activeTab === 'subjects' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'subjects' && styles.segmentBtnTextActive,
            ]}
          >
            Your Subjects
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
                  <Text
                    style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3. HERO BANNER CARD (Vibrant Royal Blue Gradient) */}
          <LinearGradient
            colors={['#0047BA', '#0052CC', '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBannerCard}
          >
            <View style={styles.heroLeftGroup}>
              <View style={styles.heroCalendarIconBox}>
                <CalendarDays size={24} color="#FFFFFF" />
              </View>
              <View style={styles.heroTextCol}>
                <Text style={styles.heroDateTitle}>{selectedDateTitle}</Text>
                <Text style={styles.heroSubtitle}>{periodSummarySubtitle}</Text>
              </View>
            </View>

            {/* Stylized Calendar Graphic on Right */}
            <View style={styles.calendarGraphicPad}>
              <View style={styles.calPadBindingRow}>
                <View style={styles.calPadCoil} />
                <View style={styles.calPadCoil} />
                <View style={styles.calPadCoil} />
              </View>
              <View style={styles.calPadGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((dot) => (
                  <View key={`cal_dot_${dot}`} style={styles.calPadDot} />
                ))}
              </View>
            </View>
          </LinearGradient>

          {/* 4. SCHEDULE CARDS LIST FOR SELECTED DAY */}
          <View style={styles.scheduleList}>
            {daySchedule.map((item, idx) => {
              const activeNow = isPeriodNow(item.start_time, item.end_time);
              const timeRange = formatTimeRange(item.start_time, item.end_time);
              const itemType = (item.type || item.entry_type || 'THEORY').toUpperCase();
              const itemName = item.subject_name || 'Academic Class';

              const visual = getSubjectVisual(itemType, itemName, idx);
              const IconComp = visual.icon;

              if (visual.isSpecialCard) {
                // Lunch Break Card with warm yellow background
                return (
                  <View
                    key={item.id || idx}
                    style={[
                      styles.lunchBreakCard,
                      activeNow && styles.activePeriodCard,
                    ]}
                  >
                    <View style={styles.cardLeftGroup}>
                      <View
                        style={[
                          styles.cardIconBox,
                          { backgroundColor: visual.iconBg },
                        ]}
                      >
                        <IconComp size={20} color={visual.iconColor} />
                      </View>
                      <View style={styles.cardTextGroup}>
                        <Text style={styles.lunchTimeText}>{timeRange}</Text>
                        <Text style={styles.lunchTitleText}>{itemName}</Text>
                      </View>
                    </View>
                    {activeNow && (
                      <View style={styles.nowBadge}>
                        <Text style={styles.nowBadgeText}>● NOW</Text>
                      </View>
                    )}
                  </View>
                );
              }

              // Standard Period Card (Theory / Lab / Other)
              return (
                <View
                  key={item.id || idx}
                  style={[styles.periodCard, activeNow && styles.activePeriodCard]}
                >
                  <View style={styles.cardLeftGroup}>
                    <View
                      style={[
                        styles.cardIconBox,
                        { backgroundColor: visual.iconBg },
                      ]}
                    >
                      <IconComp size={20} color={visual.iconColor} />
                    </View>
                    <View style={styles.cardTextGroup}>
                      <Text style={styles.timeRangeText}>{timeRange}</Text>
                      <Text style={styles.subjectTitleText} numberOfLines={2}>
                        {itemName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardRightGroup}>
                    <View
                      style={[
                        styles.typePill,
                        { backgroundColor: visual.badgeBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typePillText,
                          { color: visual.badgeText },
                        ]}
                      >
                        {visual.badgeLabel}
                      </Text>
                    </View>
                    {activeNow && (
                      <View style={styles.nowBadge}>
                        <Text style={styles.nowBadgeText}>● NOW</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* 5. TAB CONTENT: YOUR SUBJECTS (Formerly Summary - Displays both Theory & Labs) */}
      {activeTab === 'subjects' && (
        <View style={styles.subjectsTabContainer}>
          {/* Header Summary */}
          <View style={styles.subjectsHeaderRow}>
            <Text style={styles.subjectsHeading}>Your Registered Subjects</Text>
            <Text style={styles.subjectsSubheading}>
              {theorySubjectsCount} Theory • {labSubjectsCount} Labs • {allSubjects.length} Total
            </Text>
          </View>

          {/* Filter Pills for Subjects: All | Theory | Labs */}
          <View style={styles.subjectFilterRow}>
            <TouchableOpacity
              style={[
                styles.subjectFilterBtn,
                subjectFilter === 'all' && styles.subjectFilterBtnActive,
              ]}
              onPress={() => setSubjectFilter('all')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.subjectFilterText,
                  subjectFilter === 'all' && styles.subjectFilterTextActive,
                ]}
              >
                All ({allSubjects.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subjectFilterBtn,
                subjectFilter === 'theory' && styles.subjectFilterBtnActiveBlue,
              ]}
              onPress={() => setSubjectFilter('theory')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.subjectFilterText,
                  subjectFilter === 'theory' && styles.subjectFilterTextBlue,
                ]}
              >
                Theory ({theorySubjectsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subjectFilterBtn,
                subjectFilter === 'lab' && styles.subjectFilterBtnActivePurple,
              ]}
              onPress={() => setSubjectFilter('lab')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.subjectFilterText,
                  subjectFilter === 'lab' && styles.subjectFilterTextPurple,
                ]}
              >
                Labs ({labSubjectsCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subjects List */}
          <View style={styles.subjectsList}>
            {filteredSubjects.map((sub, idx) => {
              const isLab = sub.type === 'LAB';
              return (
                <View
                  key={sub.subject_code || idx}
                  style={styles.subjectDirectoryCard}
                >
                  <View style={styles.subjectCardLeft}>
                    <View
                      style={[
                        styles.subjectIconBox,
                        isLab ? styles.iconBoxLab : styles.iconBoxTheory,
                      ]}
                    >
                      {isLab ? (
                        <FlaskConical size={20} color="#9333EA" />
                      ) : (
                        <BookOpen size={20} color="#0052CC" />
                      )}
                    </View>
                    <View style={styles.subjectInfoCol}>
                      <Text style={styles.subjectDirectoryTitle} numberOfLines={2}>
                        {sub.subject_name}
                      </Text>
                      <View style={styles.subjectFacultyRow}>
                        <User size={12} color="#64748B" />
                        <Text style={styles.subjectFacultyText} numberOfLines={1}>
                          {sub.faculty_name || 'Department Faculty'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.subjectCardRight}>
                    {sub.subject_code ? (
                      <View style={styles.subjectCodePill}>
                        <Text style={styles.subjectCodeText}>
                          {sub.subject_code}
                        </Text>
                      </View>
                    ) : null}
                    <View
                      style={[
                        styles.subjectTypeBadge,
                        isLab ? styles.typeBadgeLab : styles.typeBadgeTheory,
                      ]}
                    >
                      <Text
                        style={[
                          styles.subjectTypeBadgeText,
                          isLab
                            ? styles.typeBadgeTextLab
                            : styles.typeBadgeTextTheory,
                        ]}
                      >
                        {sub.type}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  // 1. Top Segmented Switcher (Timetable | Your Subjects)
  topSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  segmentBtnActive: {
    backgroundColor: '#0047BA',
    shadowColor: '#0047BA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // 2. Day Selector Row
  daySelectorRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 8,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  dayButtonActive: {
    backgroundColor: '#0047BA',
    shadowColor: '#0047BA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dayButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // 3. Hero Banner Card
  heroBannerCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#0047BA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  heroCalendarIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
  },
  heroDateTitle: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 3,
  },
  // Stylized 3D Calendar Graphic
  calendarGraphicPad: {
    width: 60,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  calPadBindingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 4,
  },
  calPadCoil: {
    width: 5,
    height: 7,
    borderRadius: 2.5,
    backgroundColor: '#0284C7',
  },
  calPadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  calPadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BFDBFE',
  },
  // 4. Schedule Cards
  scheduleList: {
    gap: 10,
  },
  periodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  lunchBreakCard: {
    backgroundColor: '#FEF9C3',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activePeriodCard: {
    borderColor: '#EA580C',
    borderWidth: 2,
    backgroundColor: '#FFFBF5',
  },
  cardLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextGroup: {
    flex: 1,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  subjectTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  lunchTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  lunchTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
    marginTop: 2,
  },
  cardRightGroup: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typePill: {
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 10,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  nowBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  nowBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // 5. Your Subjects Tab
  subjectsTabContainer: {
    gap: 12,
  },
  subjectsHeaderRow: {
    marginBottom: 4,
  },
  subjectsHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  subjectsSubheading: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  subjectFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  subjectFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  subjectFilterBtnActive: {
    backgroundColor: '#0047BA',
  },
  subjectFilterBtnActiveBlue: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  subjectFilterBtnActivePurple: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  subjectFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  subjectFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subjectFilterTextBlue: {
    color: '#0052CC',
    fontWeight: '800',
  },
  subjectFilterTextPurple: {
    color: '#9333EA',
    fontWeight: '800',
  },
  subjectsList: {
    gap: 10,
  },
  subjectDirectoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  subjectCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subjectIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxTheory: {
    backgroundColor: '#EFF6FF',
  },
  iconBoxLab: {
    backgroundColor: '#F3E8FF',
  },
  subjectInfoCol: {
    flex: 1,
  },
  subjectDirectoryTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  subjectFacultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  subjectFacultyText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  subjectCardRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  subjectCodePill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  subjectCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  subjectTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  typeBadgeTheory: {
    backgroundColor: '#EFF6FF',
  },
  typeBadgeLab: {
    backgroundColor: '#F3E8FF',
  },
  subjectTypeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  typeBadgeTextTheory: {
    color: '#0052CC',
  },
  typeBadgeTextLab: {
    color: '#9333EA',
  },
});

export default StudentTimetableView;

