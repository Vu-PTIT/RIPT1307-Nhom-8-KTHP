import { ECopyCondition } from './constant';

declare module TaiLieu {
  export interface ICategory {
    id: string;
    name: string;
    slug?: string;
    parent_id?: string | null;
    description?: string;
    document_count?: number;
  }

  /** Dùng cho API list: GET /documents (DocumentSummary schema) */
  export interface IDocumentSummary {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    description?: string;
    cover_image?: string;
    total_copies: number;
    available_copies: number;
    category_name: string;
  }

  /** Dùng cho API detail: GET /documents/:id (Document schema) */
  export interface IDocument extends IDocumentSummary {
    category: ICategory;
    created_by: {
      id: string;
      username: string;
      full_name?: string;
      email: string;
    };
    created_at: string;
  }

  export interface IDocumentCopy {
    id: string;
    document_id: string;
    copy_code: string;
    condition: ECopyCondition;
    status: string;
    created_at: string;
    location?: string;
  }
}
