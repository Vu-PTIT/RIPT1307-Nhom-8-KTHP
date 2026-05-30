/**
 * Trích xuất thông báo lỗi từ API response.
 * Dùng chung cho tất cả các page thay vì duplicate logic ở mỗi nơi.
 */
export const getApiError = (err: any, fallback = 'Có lỗi xảy ra'): string => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && typeof detail.message === 'string') return detail.message;
  return err?.message || fallback;
};
