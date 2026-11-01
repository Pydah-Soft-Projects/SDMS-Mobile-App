import api from '../config/api';
import { Announcement } from '../types';
import logger from '../utils/logger';

export const announcementService = {
  /**
   * Fetch announcements tailored for student (filtered by branch/course/college)
   * Endpoint: GET /api/announcements/student
   */
  async getStudentAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await api.get('/announcements/student');
      const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      return (list || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content || item.description || '',
        priority: item.priority || 'medium',
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        category: item.category || 'General',
        attachmentUrl: item.attachment_url || item.image_url,
      }));
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
};

export default announcementService;
