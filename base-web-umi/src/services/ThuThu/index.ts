import axios from '@/utils/axios';
import { ipLibrary } from '@/utils/ip';

// Document Management
export async function createDocument(data: any) {
  return axios.post(`${ipLibrary}/documents`, data);
}

export async function updateDocument(id: string, data: any) {
  return axios.put(`${ipLibrary}/documents/${id}`, data);
}

export async function deleteDocument(id: string) {
  return axios.delete(`${ipLibrary}/documents/${id}`);
}

export async function addDocumentCopy(docId: string, data: any) {
  return axios.post(`${ipLibrary}/documents/${docId}/copies`, data);
}

export async function getDocumentCopies(docId: string) {
  return axios.get(`${ipLibrary}/documents/${docId}/copies`);
}

export async function updateDocumentCopy(copyId: string, data: any) {
  return axios.put(`${ipLibrary}/documents/copies/${copyId}`, data);
}

export async function deleteDocumentCopy(copyId: string) {
  return axios.delete(`${ipLibrary}/documents/copies/${copyId}`);
}

// Category Management
export async function createCategory(data: any) {
  return axios.post(`${ipLibrary}/categories`, data);
}

export async function updateCategory(id: string, data: any) {
  return axios.put(`${ipLibrary}/categories/${id}`, data);
}

export async function deleteCategory(id: string) {
  return axios.delete(`${ipLibrary}/categories/${id}`);
}

// Borrow Management
export async function createBorrowLibrarian(data: { reader_id: string; copy_codes: string[]; notes?: string }) {
  return axios.post(`${ipLibrary}/borrows/librarian`, data);
}

export async function getAllBorrowsLibrarian(params: { status?: string; reader_id?: string; page?: number; page_size?: number }) {
  return axios.get(`${ipLibrary}/borrows/librarian/all`, { params });
}

export async function processReturn(data: { copy_code: string; condition_on_return: string }) {
  return axios.post(`${ipLibrary}/borrows/librarian/return`, data);
}

// Renewal Management
export async function getPendingRenewals(status?: string) {
  return axios.get(`${ipLibrary}/renewals/librarian/pending`, { params: { status } });
}

export async function reviewRenewal(id: string, data: { status: string; reject_reason?: string }) {
  return axios.put(`${ipLibrary}/renewals/librarian/${id}`, data);
}

// Checkin Logs
export async function getAllCheckinLogs(params: { user_id?: string; check_type?: string; page?: number; page_size?: number }) {
  return axios.get(`${ipLibrary}/checkin/librarian/all`, { params });
}

export async function manualCheckin(data: { user_id: string; check_type: string }) {
  return axios.post(`${ipLibrary}/checkin/librarian/manual`, data);
}
