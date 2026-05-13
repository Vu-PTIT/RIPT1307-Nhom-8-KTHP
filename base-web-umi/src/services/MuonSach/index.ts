import axios from '@/utils/axios';
import { ipLibrary } from '@/utils/ip';

// Wishlist
export async function getMyWishlist() {
  return axios.get(`${ipLibrary}/wishlist`);
}

export async function addToWishlist(document_id: string) {
  return axios.post(`${ipLibrary}/wishlist`, { document_id });
}

export async function removeFromWishlist(id: string) {
  return axios.delete(`${ipLibrary}/wishlist/${id}`);
}

// Cart
export async function getMyCart() {
  return axios.get(`${ipLibrary}/cart`);
}

export async function addToCart(document_id: string) {
  return axios.post(`${ipLibrary}/cart`, { document_id });
}

export async function removeFromCart(id: string) {
  return axios.delete(`${ipLibrary}/cart/${id}`);
}

export async function clearCart() {
  return axios.delete(`${ipLibrary}/cart`);
}

// Borrows
export async function getMyBorrows(status?: string) {
  return axios.get(`${ipLibrary}/borrows`, { params: { status } });
}

export async function getBorrowDetail(id: string) {
  return axios.get(`${ipLibrary}/borrows/${id}`);
}

// Renewals
export async function requestRenewal(data: { borrow_record_item_id: string; new_due_date: string }) {
  return axios.post(`${ipLibrary}/renewals`, data);
}

export async function getMyRenewals() {
  return axios.get(`${ipLibrary}/renewals`);
}

// Checkin
export async function selfCheckin(data: { check_type: string; method: string }) {
  return axios.post(`${ipLibrary}/checkin`, data);
}

export async function getCheckinHistory(params: { page?: number; page_size?: number }) {
  return axios.get(`${ipLibrary}/checkin/history`, { params });
}
