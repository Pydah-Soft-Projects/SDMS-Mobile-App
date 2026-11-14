/**
 * Utility functions for filtering content across the mobile application.
 */

/**
 * Determine if an announcement, circular, event, or notification is exam-related.
 * Exam items must not be shown in general events, notifications, circulars, or alert popups.
 */
export const isExamRelated = (item: any): boolean => {
  if (!item) return false;

  // 1. Check category, event_type, announcement_type, and tag fields
  const category = String(item.category || '').toLowerCase();
  const eventType = String(item.event_type || item.eventType || item.type || '').toLowerCase();
  const announcementType = String(item.announcement_type || item.announcementType || '').toLowerCase();

  if (
    category.includes('exam') ||
    category.includes('examination') ||
    eventType.includes('exam') ||
    eventType.includes('examination') ||
    announcementType.includes('exam') ||
    announcementType.includes('examination')
  ) {
    return true;
  }

  // 2. Keyword check on title
  const title = String(item.title || '').toLowerCase();
  const examKeywordsRegex =
    /\b(exam|exams|examination|examinations|midterm|mid-term|mid[-_\s]?[12]|mid[-_\s]?[iI]{1,2}|end[-_\s]?sem|endsem|hall[-_\s]?tickets?|cie|see)\b/i;
  if (examKeywordsRegex.test(title)) {
    return true;
  }

  // 3. Timetable / schedule with semester or mid
  if (
    (title.includes('timetable') || title.includes('time table') || title.includes('schedule')) &&
    (title.includes('sem') || title.includes('mid') || title.includes('supple') || title.includes('regular') || title.includes('jntu'))
  ) {
    return true;
  }

  // 4. Content / description check for explicit exam notices
  const content = String(item.content || item.description || item.message || item.body || '').toLowerCase();
  if (
    content.startsWith('exam') ||
    content.startsWith('examination') ||
    content.startsWith('mid-term') ||
    content.startsWith('mid term') ||
    content.startsWith('mid-1') ||
    content.startsWith('mid-2') ||
    content.startsWith('hall ticket') ||
    /\b(examination timetable|exam timetable|hall tickets released|exam fee notification)\b/i.test(content)
  ) {
    return true;
  }

  return false;
};

export default {
  isExamRelated,
};

