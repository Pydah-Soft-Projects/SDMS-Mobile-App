import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Star,
  CheckCircle2,
  Clock,
  User,
  BookOpen,
  ArrowRight,
  AlertCircle,
  X,
  Search,
  Check,
  Lock,
  RotateCw,
} from 'lucide-react-native';
import api from '../config/api';
import { FeedbackSkeleton, QuestionFormSkeleton } from './SkeletonLoader';

/* ── Helper: Format Title Case ─────────────────────────────────────── */
const toTitleCase = (str?: string) => {
  if (!str) return '';
  if (str.length <= 4 && str === str.toUpperCase()) return str;

  const smallWords = new Set(['and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'a', 'an', 'the', 'by', '&']);
  return str
    .toLowerCase()
    .split(' ')
    .map((word, idx) => {
      if (!word) return '';
      if (idx !== 0 && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/* ── Helper: Extract Initials for Avatar ────────────────────────────── */
const getInitials = (name?: string) => {
  if (!name) return 'FC';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length === 0) return 'FC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ── Rating descriptions ───────────────────────────────────────────── */
const RATING_DESCRIPTIONS: { [key: number]: string } = {
  1: 'Poor — Needs significant improvement',
  2: 'Fair — Room for improvement',
  3: 'Good — Meets expectations',
  4: 'Very Good — Exceeds expectations',
  5: 'Excellent — Outstanding instruction',
};

/* ── Dynamic Field Type Resolver (Never drops fields or assumes hardcoded formats) ── */
type QuestionKind = 'rating' | 'boolean' | 'choice' | 'checkbox' | 'long_text' | 'short_text';

const getQuestionFieldKind = (q: any): QuestionKind => {
  const rawType = String(
    q.questionType ||
    q.question_type ||
    q.type ||
    q.fieldType ||
    q.field_type ||
    ''
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const text = String(q.questionText || q.question_text || q.label || '').trim().toLowerCase();
  const options = Array.isArray(q.options) ? q.options : [];

  // 1. Rating scale detection
  if (
    rawType.includes('rating') ||
    rawType.includes('scale') ||
    rawType.includes('star') ||
    (rawType === 'number' && Number(q.maxValue || q.max_value || 5) <= 10) ||
    ((text.includes('rate') || text.includes('rating') || text.includes('score')) && options.length === 0 && !rawType.includes('text'))
  ) {
    return 'rating';
  }

  // 2. Boolean / Yes-No detection
  if (
    rawType === 'yes_no' ||
    rawType === 'yesno' ||
    rawType === 'boolean' ||
    rawType === 'bool' ||
    (options.length === 2 && options.some((o: any) => /^yes$/i.test(String(o).trim())) && options.some((o: any) => /^no$/i.test(String(o).trim())))
  ) {
    return 'boolean';
  }

  // 3. Multi-Select / Checkbox
  if (
    rawType.includes('checkbox') ||
    rawType.includes('multi_select') ||
    rawType.includes('multiselect') ||
    rawType.includes('multiple_select')
  ) {
    return 'checkbox';
  }

  // 4. Single-Select / Radio / Dropdown / Option choices
  if (
    rawType === 'radio' ||
    rawType === 'multiple_choice' ||
    rawType === 'select' ||
    rawType === 'dropdown' ||
    rawType === 'single_select' ||
    rawType === 'choice' ||
    (options.length > 0 && !rawType.includes('text'))
  ) {
    return 'choice';
  }

  // 5. Long Text / Textarea / Essay / Paragraph / Open-Ended / Remarks / Comments / Suggestions
  if (
    rawType.includes('textarea') ||
    rawType.includes('text_area') ||
    rawType.includes('long') ||
    rawType.includes('paragraph') ||
    rawType.includes('open_ended') ||
    rawType.includes('open_text') ||
    rawType.includes('essay') ||
    rawType.includes('remark') ||
    rawType.includes('comment') ||
    rawType.includes('suggestion') ||
    rawType.includes('feedback') ||
    /\b(remarks?|suggestions?|comments?|describe|explain|feedback|elaborate|opinion|reasons?|why)\b/i.test(text)
  ) {
    return 'long_text';
  }

  // 6. Short Text / Text Input / Single Line
  // Dynamic fallback ensures an input box is ALWAYS rendered for typing!
  return 'short_text';
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(iso);
  }
};

interface StudentFeedbackViewProps {
  data?: any;
  student?: any;
  onRefresh?: () => void;
}

export const StudentFeedbackView: React.FC<StudentFeedbackViewProps> = ({
  data: initialData,
  student: initialStudent,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(!initialData);
  const [publications, setPublications] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(initialStudent || null);
  const [selectedPubId, setSelectedPubId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedMap, setSubmittedMap] = useState<{ [key: string]: boolean }>({});

  // Question Form Modal
  const [modalPub, setModalPub] = useState<any | null>(null);
  const [modalSubject, setModalSubject] = useState<any | null>(null);
  const [formQuestions, setFormQuestions] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [responses, setResponses] = useState<{ [key: string]: any }>({});
  const [submitting, setSubmitting] = useState(false);

  // Load and sync publications
  const loadPublications = useCallback(async () => {
    try {
      const res = await api.get('/student-feedback/publications');
      if (res.data?.success) {
        const pubs = res.data.data || [];
        setPublications(pubs);
        if (res.data.student) setStudentInfo(res.data.student);

        // Build submitted map from server response + AsyncStorage
        const subMap: { [key: string]: boolean } = {};
        for (const pub of pubs) {
          (pub.submittedSubjects || []).forEach((subjName: string) => {
            const key = `${pub.id}_${String(subjName).trim().toLowerCase()}`;
            subMap[key] = true;
          });

          // Check AsyncStorage local tokens
          for (const subj of pub.mappedStaffSubjects || []) {
            const key = `${pub.id}_${String(subj.subjectName).trim().toLowerCase()}`;
            try {
              const localVal = await AsyncStorage.getItem(`fb_sub_${pub.id}_${String(subj.subjectName).trim().toLowerCase()}`);
              if (localVal) subMap[key] = true;
            } catch {
              // ignore storage lookup error
            }
          }
        }
        setSubmittedMap(subMap);

        if (pubs.length > 0) {
          setSelectedPubId((prev) => (prev && pubs.some((p: any) => p.id === prev) ? prev : pubs[0].id));
        }
      }
    } catch (e: any) {
      console.warn('Feedback publications load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublications();
  }, [loadPublications]);

  const activePub = useMemo(() => {
    if (!publications.length) return null;
    return publications.find((p) => p.id === selectedPubId) || publications[0];
  }, [publications, selectedPubId]);

  const isSubmitted = useCallback(
    (pub: any, subject: any) => {
      if (!pub || !subject?.subjectName) return false;
      const key = `${pub.id}_${String(subject.subjectName).trim().toLowerCase()}`;
      return !!submittedMap[key];
    },
    [submittedMap]
  );

  const activeSubjects = useMemo(() => {
    if (!activePub?.mappedStaffSubjects) return [];
    return activePub.mappedStaffSubjects;
  }, [activePub]);

  const stats = useMemo(() => {
    const total = activeSubjects.length;
    const completed = activeSubjects.filter((s: any) => isSubmitted(activePub, s)).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [activeSubjects, activePub, isSubmitted]);

  // Filter subjects by activeTab ('all' | 'pending' | 'completed') and searchQuery
  const filteredSubjects = useMemo(() => {
    return activeSubjects.filter((subj: any) => {
      const done = isSubmitted(activePub, subj);
      if (activeTab === 'pending' && done) return false;
      if (activeTab === 'completed' && !done) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sName = String(subj.subjectName || '').toLowerCase();
        const sCode = String(subj.subjectCode || '').toLowerCase();
        const fName = String(subj.facultyName || '').toLowerCase();
        return sName.includes(q) || sCode.includes(q) || fName.includes(q);
      }
      return true;
    });
  }, [activeSubjects, activePub, activeTab, searchQuery, isSubmitted]);

  // Open Feedback Form Modal
  const handleOpenForm = async (subject: any) => {
    if (!activePub) return;
    if (isSubmitted(activePub, subject)) {
      Alert.alert('Feedback Submitted', 'You have already submitted feedback for this subject.');
      return;
    }

    setModalPub(activePub);
    setModalSubject(subject);
    setResponses({});
    setFormLoading(true);

    const formId = activePub.formId || activePub.form_id || (activePub.form && (activePub.form.id || activePub.form.form_id));

    try {
      const res = await api.get(`/student-feedback/forms/${formId}`);
      if (res.data?.success) {
        const rawQuestions =
          res.data.data?.questions ||
          res.data.data?.formFields ||
          res.data.data?.form_fields ||
          res.data.questions ||
          (Array.isArray(res.data.data) ? res.data.data : []);

        const parsedQuestions = (Array.isArray(rawQuestions) ? rawQuestions : []).map((q: any, idx: number) => {
          const id = q.id !== undefined && q.id !== null ? String(q.id) : (q._id !== undefined && q._id !== null ? String(q._id) : `q_${idx}`);
          const questionText = String(q.questionText || q.question_text || q.label || q.title || q.text || '').trim();
          const rawType = String(q.questionType || q.question_type || q.type || q.fieldType || q.field_type || '').trim();
          const isRequired = Boolean(q.isRequired || q.is_required || q.required);

          let options: string[] = [];
          const rawOpts = q.options ?? q.options_json ?? q.choices;
          if (Array.isArray(rawOpts)) {
            options = rawOpts.map((o) => (typeof o === 'object' && o !== null ? (o.label || o.value || o.text || String(o)) : String(o)));
          } else if (typeof rawOpts === 'string' && rawOpts.trim()) {
            try {
              const parsed = JSON.parse(rawOpts);
              if (Array.isArray(parsed)) {
                options = parsed.map((o) => (typeof o === 'object' && o !== null ? (o.label || o.value || o.text || String(o)) : String(o)));
              } else {
                options = rawOpts.split(',').map((s) => s.trim()).filter(Boolean);
              }
            } catch {
              options = rawOpts.split(',').map((s) => s.trim()).filter(Boolean);
            }
          }

          return {
            ...q,
            id,
            questionText,
            questionType: rawType,
            isRequired,
            options,
            minValue: q.minValue ?? q.min_value ?? 1,
            maxValue: q.maxValue ?? q.max_value ?? 5,
            placeholder: q.placeholder || '',
          };
        });

        setFormQuestions(parsedQuestions);
      } else {
        Alert.alert('Notice', 'Could not load the feedback form questions.');
        setModalPub(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to load feedback form questions.');
      setModalPub(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalPub(null);
    setModalSubject(null);
    setFormQuestions([]);
    setResponses({});
  };

  // Submit Feedback Form
  const handleSubmitFeedback = async () => {
    if (!modalPub || !modalSubject) return;

    // Check required questions
    const missing = formQuestions.filter((q, qIdx) => {
      const qId = q.id !== undefined && q.id !== null ? String(q.id) : `q_${qIdx}`;
      const isReq = Boolean(q.isRequired || q.is_required || q.required);
      if (!isReq) return false;
      const resp = responses[qId] ?? responses[q.id];
      return resp === undefined || resp === null || resp === '' || (Array.isArray(resp) && resp.length === 0);
    });

    if (missing.length > 0) {
      Alert.alert(
        'Required Questions',
        `Please complete all mandatory questions before submitting (${missing.length} unanswered).`
      );
      return;
    }

    // Build payload with standardized shortcut fields
    const answersPayload: { [key: string]: any } = {};
    Object.keys(responses).forEach((k) => {
      answersPayload[k] = responses[k];
    });
    formQuestions.forEach((q, qIdx) => {
      const qId = q.id !== undefined && q.id !== null ? String(q.id) : `q_${qIdx}`;
      const text = String(q.questionText || q.question_text || q.label || '').toLowerCase();
      const val = responses[qId] ?? responses[q.id];
      if (val === undefined || val === null) return;
      answersPayload[qId] = val;
      if (text.includes('units covered') || text.includes('unit')) answersPayload['unitsCovered'] = String(val);
      if (text.includes('rate') || text.includes('rating')) answersPayload['facultyRating'] = Number(val);
      if (text.includes('unit status') || text.includes('status')) answersPayload['unitStatus'] = String(val);
    });

    try {
      setSubmitting(true);
      const res = await api.post(`/student-feedback/publications/${modalPub.id}/submit`, {
        subjectName: modalSubject.subjectName,
        facultyName: modalSubject.facultyName,
        sectionName: modalSubject.sectionName || studentInfo?.section,
        answers: answersPayload,
      });

      if (res.data?.success) {
        const subKey = `${modalPub.id}_${String(modalSubject.subjectName).trim().toLowerCase()}`;
        try {
          await AsyncStorage.setItem(`fb_sub_${subKey}`, res.data.token || 'submitted');
        } catch {
          // ignore
        }
        setSubmittedMap((prev) => ({ ...prev, [subKey]: true }));
        Alert.alert('Feedback Submitted!', 'Thank you! Your feedback has been recorded anonymously.');
        handleCloseModal();
        if (onRefresh) onRefresh();
      } else {
        Alert.alert('Submission Error', res.data?.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      Alert.alert('Submission Failed', err.response?.data?.message || 'Unable to submit feedback right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <FeedbackSkeleton />;
  }

  if (!publications.length) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <CheckCircle2 size={32} color="#10B981" />
        </View>
        <Text style={styles.emptyTitle}>No Active Feedback Surveys</Text>
        <Text style={styles.emptySubtitle}>
          There are currently no active faculty evaluation surveys published for your class or section.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. SESSION PICKER (If multiple publications exist) */}
      {publications.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sessionPickerScroll}
        >
          {publications.map((pub) => {
            const isSelected = pub.id === selectedPubId;
            return (
              <TouchableOpacity
                key={pub.id}
                style={[styles.sessionPill, isSelected && styles.sessionPillActive]}
                onPress={() => setSelectedPubId(pub.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sessionPillText, isSelected && styles.sessionPillTextActive]}>
                  {pub.title || 'Feedback Session'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* 2. ACTIVE SESSION HEADER & PROGRESS CARD */}
      {activePub && (
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.sessionTitle}>{activePub.title || 'Faculty Feedback Evaluation'}</Text>
              <View style={styles.deadlineRow}>
                <Clock size={12} color="#64748B" />
                <Text style={styles.deadlineText}>Closes {formatDate(activePub.endDate)}</Text>
              </View>
            </View>
            <View style={styles.activeStatusPill}>
              <Text style={styles.activeStatusText}>ACTIVE</Text>
            </View>
          </View>

          {/* Progress Bar & Counter */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Evaluation Progress</Text>
              <Text style={styles.progressValue}>
                {stats.completed} of {stats.total} Completed ({stats.rate}%)
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${stats.rate}%` }]} />
            </View>
          </View>
        </View>
      )}

      {/* 3. FILTER TABS (All | Pending | Completed) */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'all' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'all' && styles.segmentBtnTextActive]}>
            All ({stats.total})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'pending' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'pending' && styles.segmentBtnTextActive]}>
            Pending ({stats.pending})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'completed' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'completed' && styles.segmentBtnTextActive]}>
            Completed ({stats.completed})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. SEARCH BAR */}
      <View style={styles.searchBarContainer}>
        <Search size={15} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search subjects or faculty..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={15} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 5. SUBJECT CARDS LIST */}
      <View style={styles.cardsList}>
        {filteredSubjects.length > 0 ? (
          filteredSubjects.map((subject: any, idx: number) => {
            const submitted = isSubmitted(activePub, subject);
            const initials = getInitials(subject.facultyName);
            const formattedSubject = toTitleCase(subject.subjectName);
            const formattedFaculty = toTitleCase(subject.facultyName);

            return (
              <View key={`${subject.subjectName}-${subject.facultyName || idx}`} style={styles.courseCard}>
                {/* Header Row: Subject Code + Status Pill */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.codeTagsRow}>
                    {subject.subjectCode ? (
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{subject.subjectCode}</Text>
                      </View>
                    ) : null}
                    {subject.sectionName ? (
                      <View style={styles.secBadge}>
                        <Text style={styles.secBadgeText}>Sec {subject.sectionName}</Text>
                      </View>
                    ) : null}
                  </View>

                  {submitted ? (
                    <View style={styles.submittedBadge}>
                      <CheckCircle2 size={12} color="#15803D" />
                      <Text style={styles.submittedBadgeText}>Completed</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <View style={styles.pendingDot} />
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  )}
                </View>

                {/* Subject Title */}
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {formattedSubject}
                </Text>

                {/* Faculty Cardlet */}
                <View style={styles.facultyRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.facultyRoleText}>FACULTY INSTRUCTOR</Text>
                    <Text style={styles.facultyNameText} numberOfLines={1}>
                      {formattedFaculty || 'Department Faculty'}
                    </Text>
                  </View>
                </View>

                {/* Action Button */}
                {submitted ? (
                  <View style={styles.completedBtn}>
                    <CheckCircle2 size={14} color="#15803D" />
                    <Text style={styles.completedBtnText}>Evaluation Completed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.giveFeedbackBtn}
                    onPress={() => handleOpenForm(subject)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.giveFeedbackBtnText}>Give Feedback</Text>
                    <ArrowRight size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyFiltered}>
            <AlertCircle size={28} color="#94A3B8" />
            <Text style={styles.emptyFilteredTitle}>No Subjects Found</Text>
            <Text style={styles.emptyFilteredText}>
              {searchQuery
                ? `No courses matching "${searchQuery}".`
                : `No subjects currently under "${activeTab}" status.`}
            </Text>
          </View>
        )}
      </View>

      {/* ── 6. QUESTIONNAIRE SURVEY MODAL ── */}
      <Modal
        visible={!!modalPub && !!modalSubject}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { maxHeight: Dimensions.get('window').height * 0.92 }]}>
            {/* Modal Handle Pill */}
            <View style={styles.modalHandlePill} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.modalSubjectCode}>{modalSubject?.subjectCode || 'COURSE EVALUATION'}</Text>
                <Text style={styles.modalSubjectTitle} numberOfLines={1}>
                  {toTitleCase(modalSubject?.subjectName)}
                </Text>
                <Text style={styles.modalFacultyName} numberOfLines={1}>
                  Instructor: {toTitleCase(modalSubject?.facultyName)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={handleCloseModal}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Questions Form Content */}
            {formLoading ? (
              <QuestionFormSkeleton />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.questionsScrollContent}
                overScrollMode="never"
              >
                {formQuestions.map((q: any, qIdx: number) => {
                  const qId = q.id !== undefined && q.id !== null ? String(q.id) : `q_${qIdx}`;
                  const qText = q.questionText || q.question_text || q.label || `Question ${qIdx + 1}`;
                  const isRequired = Boolean(q.isRequired || q.is_required || q.required);
                  const fieldKind = getQuestionFieldKind(q);
                  const currentVal = responses[qId] ?? responses[q.id];
                  const options: string[] = Array.isArray(q.options) && q.options.length > 0 ? q.options : ['1', '2', '3', '4', '5'];

                  return (
                    <View key={qId} style={styles.questionCard}>
                      {/* Question Index Badge */}
                      <View style={styles.questionMetaRow}>
                        <Text style={styles.questionIndexText}>
                          Question {qIdx + 1} of {formQuestions.length}
                        </Text>
                        {isRequired && (
                          <View style={styles.requiredPill}>
                            <Text style={styles.requiredPillText}>REQUIRED</Text>
                          </View>
                        )}
                      </View>

                      {/* Question Text */}
                      <Text style={styles.questionText}>{qText}</Text>

                      {/* 1. Star Rating (1 to 5) */}
                      {fieldKind === 'rating' && (
                        <View style={styles.starRatingContainer}>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => {
                              const isFilled = (Number(currentVal) || 0) >= star;
                              return (
                                <TouchableOpacity
                                  key={star}
                                  style={styles.starTouch}
                                  onPress={() => setResponses((prev) => ({ ...prev, [qId]: star }))}
                                  activeOpacity={0.7}
                                >
                                  <Star
                                    size={32}
                                    color={isFilled ? '#EAB308' : '#CBD5E1'}
                                    fill={isFilled ? '#EAB308' : 'none'}
                                  />
                                </TouchableOpacity>
                              );
                            })}
                            {currentVal ? (
                              <View style={styles.scoreBadge}>
                                <Text style={styles.scoreBadgeText}>{currentVal} / 5</Text>
                              </View>
                            ) : null}
                          </View>

                          {currentVal ? (
                            <Text style={styles.ratingDescText}>
                              {RATING_DESCRIPTIONS[Number(currentVal)] || `Score ${currentVal} of 5`}
                            </Text>
                          ) : (
                            <Text style={styles.ratingHintText}>Tap a star to rate</Text>
                          )}
                        </View>
                      )}

                      {/* 2. Multiple Choice / Radio / Dropdown Options */}
                      {fieldKind === 'choice' && (
                        <View style={styles.optionsWrap}>
                          {options.map((opt: string, oIdx: number) => {
                            const isSelected = String(currentVal) === String(opt);
                            const isUnits = qText.toLowerCase().includes('unit');
                            const label = isUnits && !isNaN(Number(opt)) ? `Unit ${opt}` : opt;

                            return (
                              <TouchableOpacity
                                key={oIdx}
                                style={[styles.optionPill, isSelected && styles.optionPillActive]}
                                onPress={() => setResponses((prev) => ({ ...prev, [qId]: opt }))}
                                activeOpacity={0.8}
                              >
                                {isSelected && <Check size={13} color="#FFFFFF" style={{ marginRight: 4 }} />}
                                <Text
                                  style={[
                                    styles.optionPillText,
                                    isSelected && styles.optionPillTextActive,
                                  ]}
                                >
                                  {label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* 3. Checkbox / Multi-Select */}
                      {fieldKind === 'checkbox' && (
                        <View style={styles.optionsWrap}>
                          {options.map((opt: string, oIdx: number) => {
                            const selectedList: string[] = Array.isArray(currentVal) ? currentVal : [];
                            const isSelected = selectedList.includes(String(opt));

                            return (
                              <TouchableOpacity
                                key={oIdx}
                                style={[styles.checkboxPill, isSelected && styles.checkboxPillActive]}
                                onPress={() => {
                                  const updated = isSelected
                                    ? selectedList.filter((s) => s !== String(opt))
                                    : [...selectedList, String(opt)];
                                  setResponses((prev) => ({ ...prev, [qId]: updated }));
                                }}
                                activeOpacity={0.8}
                              >
                                <View style={[styles.checkboxIndicator, isSelected && styles.checkboxIndicatorActive]}>
                                  {isSelected && <Check size={11} color="#FFFFFF" />}
                                </View>
                                <Text
                                  style={[
                                    styles.checkboxPillText,
                                    isSelected && styles.checkboxPillTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* 4. Yes / No */}
                      {fieldKind === 'boolean' && (
                        <View style={styles.yesNoRow}>
                          {['Yes', 'No'].map((choice) => {
                            const isSelected = String(currentVal) === choice;
                            return (
                              <TouchableOpacity
                                key={choice}
                                style={[styles.yesNoBtn, isSelected && styles.yesNoBtnActive]}
                                onPress={() => setResponses((prev) => ({ ...prev, [qId]: choice }))}
                                activeOpacity={0.8}
                              >
                                {isSelected && <Check size={14} color="#FFFFFF" style={{ marginRight: 6 }} />}
                                <Text
                                  style={[
                                    styles.yesNoBtnText,
                                    isSelected && styles.yesNoBtnTextActive,
                                  ]}
                                >
                                  {choice}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      {/* 5. Long Text / Textarea Remarks */}
                      {fieldKind === 'long_text' && (
                        <TextInput
                          style={styles.longTextInput}
                          placeholder={q.placeholder || "Enter your detailed response, feedback, or comments..."}
                          placeholderTextColor="#94A3B8"
                          multiline
                          numberOfLines={4}
                          value={typeof currentVal === 'string' ? currentVal : ''}
                          onChangeText={(txt) => setResponses((prev) => ({ ...prev, [qId]: txt }))}
                        />
                      )}

                      {/* 6. Short Text / Text Input */}
                      {fieldKind === 'short_text' && (
                        <TextInput
                          style={styles.shortTextInput}
                          placeholder={q.placeholder || "Enter your response..."}
                          placeholderTextColor="#94A3B8"
                          value={typeof currentVal === 'string' ? currentVal : (currentVal !== undefined && currentVal !== null ? String(currentVal) : '')}
                          onChangeText={(txt) => setResponses((prev) => ({ ...prev, [qId]: txt }))}
                          returnKeyType="done"
                        />
                      )}
                    </View>
                  );
                })}

                {/* Privacy Assurance Banner */}
                <View style={styles.privacyNoteBox}>
                  <AlertCircle size={14} color="#1E3A8A" />
                  <Text style={styles.privacyNoteText}>
                    Your submission is 100% anonymous. Feedback is aggregated securely without revealing student identity to faculty.
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Modal Bottom Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCloseModal}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitFeedback}
                disabled={submitting || formLoading}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Submit Evaluation</Text>
                    <ArrowRight size={15} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Session Picker Row
  sessionPickerScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sessionPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sessionPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  sessionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  sessionPillTextActive: {
    color: '#FFFFFF',
  },
  // Active Session Header Card
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  deadlineText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  activeStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeStatusText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  progressValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 4,
  },
  // Segmented Buttons (All | Pending | Completed)
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#1E3A8A',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  // Cards List
  cardsList: {
    gap: 10,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  codeBadgeText: {
    color: '#1D4ED8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  secBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  secBadgeText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '700',
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  submittedBadgeText: {
    color: '#15803D',
    fontSize: 10.5,
    fontWeight: '800',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  pendingBadgeText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '800',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 10,
  },
  facultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  facultyRoleText: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  facultyNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  completedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  completedBtnText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },
  giveFeedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingVertical: 11,
    borderRadius: 10,
  },
  giveFeedbackBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  emptyFiltered: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyFilteredTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  emptyFilteredText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  // Questionnaire Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  modalHandlePill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSubjectCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  modalSubjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  modalFacultyName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  modalLoadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  questionsScrollContent: {
    paddingVertical: 14,
    gap: 14,
  },
  questionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questionIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  requiredPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
    marginBottom: 12,
  },
  // Stars Rating
  starRatingContainer: {
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starTouch: {
    padding: 3,
  },
  scoreBadge: {
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  ratingDescText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  ratingHintText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  // Options Wrap (Units)
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  optionPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  optionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  optionPillTextActive: {
    color: '#FFFFFF',
  },
  // Yes / No Row
  yesNoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  yesNoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 10,
  },
  yesNoBtnActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  yesNoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  yesNoBtnTextActive: {
    color: '#FFFFFF',
  },
  // Text Input
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12.5,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  shortTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 46,
  },
  longTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  checkboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
    gap: 8,
  },
  checkboxPillActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  checkboxPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  checkboxPillTextActive: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
  checkboxIndicator: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxIndicatorActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#1E3A8A',
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StudentFeedbackView;
