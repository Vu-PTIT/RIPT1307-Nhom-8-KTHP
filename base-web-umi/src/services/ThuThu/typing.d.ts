import type { TaiLieu } from '../TaiLieu/typing';
import type { MuonSach } from '../MuonSach/typing';

declare module ThuThu {
  export interface IManageDocument extends TaiLieu.IDocument {
    // Add librarian specific fields if any
  }

  export interface IPendingRenewal extends MuonSach.IRenewalRequest {
    reader_name: string;
    reader_code: string;
  }

  export interface ICheckinLogFull extends MuonSach.ICheckinLog {
    fullname: string;
    username: string;
  }
}
