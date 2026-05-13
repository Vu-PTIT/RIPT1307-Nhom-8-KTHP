export enum EBorrowStatus {
  REQUESTED = 'requested',
  BORROWED = 'borrowed',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum ERenewalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ECheckType {
  CHECKIN = 'checkin',
  CHECKOUT = 'checkout',
}

export enum ECheckMethod {
  SELF = 'self',
  QR_CODE = 'qr_code',
  MANUAL = 'manual',
}
