import api, { getStaticFileUrl } from '../config/api';
import { Announcement } from '../types';
import logger from '../utils/logger';
import { isExamRelated } from '../utils/filterUtils';

export const announcementService = {
  /**
   * Fetch announcements tailored for student (filtered by branch/course/college)
   * Endpoint: GET /api/announcements/student
   */
  async getStudentAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await api.get('/announcements/student');
      const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      return (list || [])
        .filter((item: any) => !isExamRelated(item))
        .map((item: any) => {
          const rawImg =
            item.image_url ||
            item.imageUrl ||
            (item.has_image ? `/api/announcements/${item.id}/image` : null) ||
            item.attachment_url;
          return {
            id: item.id,
            title: item.title,
            content: item.content || item.description || '',
            priority: item.priority || 'medium',
            createdAt: item.created_at || item.createdAt || new Date().toISOString(),
            category: item.category || 'General',
            imageUrl: rawImg ? getStaticFileUrl(rawImg) : undefined,
            attachmentUrl: item.attachment_url ? getStaticFileUrl(item.attachment_url) : undefined,
          };
        });
    } catch (e: any) {
      logger.error('ANNOUNCEMENTS', 'Failed to fetch student circulars', e.message);
      return [];
    }
  },

  /**
   * Fetch all institutional circulars for admin/staff
   * Endpoint: GET /api/announcements/admin
   */
  async getAdminAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await api.get('/announcements/admin');
      const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      return (list || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content || item.description || '',
        priority: item.priority || 'medium',
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        category: item.category || 'Administrative',
        attachmentUrl: item.attachment_url || item.image_url,
      }));
    } catch (e: any) {
      logger.warn('ANNOUNCEMENTS', 'Falling back to student announcements for staff', e.message);
      return this.getStudentAnnouncements();
    }
  },

  /**
   * Fetch active campus polls for the student
   * Endpoint: GET /api/polls/student
   */
  async getStudentPolls(): Promise<any[]> {
    try {
      const response = await api.get('/polls/student');
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch (e: any) {
      logger.error('POLLS', 'Failed to fetch student polls', e.message);
      return [];
    }
  },

  /**
   * Fetch active polls for admin/staff
   * Endpoint: GET /api/polls/admin
   */
  async getAdminPolls(): Promise<any[]> {
    try {
      const response = await api.get('/polls/admin');
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      return this.getStudentPolls();
    }
  },

  /**
   * Cast a vote for a poll option
   * Endpoint: POST /api/polls/:id/vote
   */
  async votePoll(pollId: number | string, optionIndex: number): Promise<boolean> {
    try {
      const response = await api.post(`/polls/${pollId}/vote`, { option_index: optionIndex });
      return response.data?.success || false;
    } catch (e: any) {
      logger.error('POLLS', 'Failed to cast vote on poll', e.message);
      throw e;
    }
  },
};

export default announcementService;
