import { ERole, EUserStatus } from './constant';

declare module QuanTri {
  export interface IUser {
    id: string;
    username: string;
    fullname: string;
    email: string;
    role: ERole;
    is_active: boolean;
    status: EUserStatus;
    created_at: string;
    last_login?: string;
  }

  export interface IDashboardSummary {
    total_users: number;
    total_documents: number;
    active_borrows: number;
    total_checkins_today: number;
  }

  export interface ITrafficData {
    timestamp: string;
    count: number;
  }

  export interface ITopBook {
    document_id: string;
    title: string;
    borrow_count: number;
  }

  export interface ILibrarySetting {
    key: string;
    value: string;
    description?: string;
    updated_at: string;
  }
}
