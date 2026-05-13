import axios from '@/utils/axios';
import { ipLibrary } from '@/utils/ip';

// Dashboard
export async function getDashboardSummary() {
  return axios.get(`${ipLibrary}/admin/dashboard/summary`);
}

export async function getCheckinTraffic(period: string = 'daily') {
  return axios.get(`${ipLibrary}/admin/dashboard/checkin-traffic`, { params: { period } });
}

export async function getTopBooks(limit: number = 5) {
  return axios.get(`${ipLibrary}/admin/dashboard/top-books`, { params: { limit } });
}

export async function getOverdueStats() {
  return axios.get(`${ipLibrary}/admin/dashboard/overdue`);
}

export async function getBorrowStatusStats() {
  return axios.get(`${ipLibrary}/admin/dashboard/borrow-stats`);
}

// User Management
export async function listUsers(params: { role_id?: string; is_active?: boolean; keyword?: string; page?: number; page_size?: number }) {
  return axios.get(`${ipLibrary}/admin/users`, { params });
}

export async function getUserDetail(id: string) {
  return axios.get(`${ipLibrary}/admin/users/${id}`);
}

export async function createUser(data: any) {
  return axios.post(`${ipLibrary}/admin/users`, data);
}

export async function updateUser(id: string, data: any) {
  return axios.put(`${ipLibrary}/admin/users/${id}`, data);
}

export async function toggleUserActive(id: string) {
  return axios.patch(`${ipLibrary}/admin/users/${id}/toggle-active`);
}

export async function deleteUser(id: string) {
  return axios.delete(`${ipLibrary}/admin/users/${id}`);
}

// Settings
export async function getLibrarySettings() {
  return axios.get(`${ipLibrary}/settings`);
}

export async function updateLibrarySetting(key: string, data: { setting_value?: string; description?: string }) {
  return axios.patch(`${ipLibrary}/settings/${key}`, data);
}
