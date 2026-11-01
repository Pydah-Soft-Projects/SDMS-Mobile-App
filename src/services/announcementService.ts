import api from '../config/api';
import { Announcement } from '../types';

export const announcementService = {
  /**
   * Fetch announcements tailored for student (filtered by branch/course/college)
   * Endpoint: GET /api/announcements/student
   */
  async getStudentAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await api.get('/announcements/student');
      const list = Array.isArray(response.data) ? response.data : response.data.announcements || [];
      return list.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content || item.description || '',
        priority: item.priority || 'medium',
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        category: item.category || 'General',
        attachmentUrl: item.attachment_url || item.image_url,
      }));
    } catch (e) {
      console.warn('Failed to fetch announcements', e);
      return [];
    }
  },
};

export default announcementService;

