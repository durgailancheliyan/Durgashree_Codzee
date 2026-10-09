import axios from 'axios';

const api = axios.create({ baseURL: '/api/notifications' });
api.interceptors.request.use((c) => {
  const token = localStorage.getItem('token');
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});

export interface NotificationItem {
  id: string;
  type: 'reminder' | 'alert' | 'announcement';
  title: string;
  body?: string;
  linkPath?: string;
  readAt?: string | null;
  createdAt: string;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await api.get<NotificationItem[]>('/');
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/read-all');
}

export async function postAnnouncement(title: string, body: string): Promise<void> {
  await api.post('/announcement', { title, body });
}
