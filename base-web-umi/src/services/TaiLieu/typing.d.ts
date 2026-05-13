import { EDocumentStatus, ECopyCondition } from './constant';

declare module TaiLieu {
  export interface ICategory {
    id: string;
    name: string;
    description?: string;
    document_count?: number;
  }

  export interface IDocument {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    description?: string;
    cover_image?: string;
    category_id: string;
    category_name?: string;
    total_copies: number;
    available_copies: number;
    status: EDocumentStatus;
    published_year?: number;
    publisher?: string;
  }

  export interface IDocumentCopy {
    id: string;
    document_id: string;
    copy_code: string;
    condition: ECopyCondition;
    is_available: boolean;
    location?: string;
  }
}
