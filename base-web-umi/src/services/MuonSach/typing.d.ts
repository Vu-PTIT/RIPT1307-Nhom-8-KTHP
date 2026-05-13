import { EBorrowStatus, ERenewalStatus, ECheckType, ECheckMethod } from './constant';

declare module MuonSach {
  export interface IWishlistItem {
    id: string;
    document_id: string;
    document_title: string;
    author: string;
    cover_image?: string;
    added_at: string;
  }

  export interface ICartItem {
    id: string;
    document_id: string;
    document_title: string;
    author: string;
    cover_image?: string;
    added_at: string;
  }

  export interface IBorrowRecord {
    id: string;
    reader_id: string;
    borrow_date: string;
    due_date: string;
    actual_return_date?: string;
    status: EBorrowStatus;
    items: IBorrowItem[];
    notes?: string;
  }

  export interface IBorrowItem {
    id: string;
    document_id: string;
    document_title: string;
    copy_code: string;
    status: EBorrowStatus;
  }

  export interface IRenewalRequest {
    id: string;
    borrow_record_item_id: string;
    document_title: string;
    requested_at: string;
    old_due_date: string;
    new_due_date: string;
    status: ERenewalStatus;
    reject_reason?: string;
  }

  export interface ICheckinLog {
    id: string;
    user_id: string;
    timestamp: string;
    check_type: ECheckType;
    method: ECheckMethod;
  }
}
