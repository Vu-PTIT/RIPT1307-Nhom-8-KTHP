import axios from '@/utils/axios';
import { ipLibrary } from '@/utils/ip';

export async function searchDocuments(params: {
  keyword?: string;
  category_id?: string;
  page?: number;
  page_size?: number;
}) {
  return axios.get(`${ipLibrary}/documents`, { params });
}

export async function getDocumentDetail(id: string) {
  return axios.get(`${ipLibrary}/documents/${id}`);
}

export async function getCategories() {
  return axios.get(`${ipLibrary}/categories`);
}
