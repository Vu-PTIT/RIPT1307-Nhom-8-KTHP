import React, { useState } from 'react';
import { message, Spin, Empty } from 'antd';
import { useRequest } from 'umi';
import dayjs from 'dayjs';
import PageSkeleton from '@/components/PageSkeleton';
import PendingList, { PendingRenewalItem } from './components/PendingList';
import HistoryList, { HistoryRenewalItem } from './components/HistoryList';
import { getPendingRenewals, reviewRenewal } from '@/services/ThuThu';
import { getApiError } from '@/utils/getApiError';

function mapToPending(item: any): PendingRenewalItem {
  const dueDate = dayjs(item.old_due_date);
  const now = dayjs();
  const overdueDays = now.diff(dueDate, 'day');
  const isOverdue = overdueDays > 0;
  return {
    id: String(item.id),
    bookTitle: item.document_title || 'Không rõ tên sách',
    bookImage: item.cover_image,
    readerName: item.reader_name || item.reader_username || 'Độc giả',
    borrowDate: item.borrow_date ? dayjs(item.borrow_date).format('DD/MM/YYYY') : '—',
    currentDueDate: dueDate.format('DD/MM/YYYY'),
    renewalCount: item.renewal_count != null ? `${item.renewal_count}/2` : '0/2',
    requestTime: dayjs(item.request_date).format('DD/MM/YYYY HH:mm'),
    isOverdue,
    overdueDays: isOverdue ? overdueDays : undefined,
  };
}

function mapToHistory(item: any, status: 'APPROVED' | 'REJECTED'): HistoryRenewalItem {
  return {
    id: String(item.id),
    bookTitle: item.document_title || 'Không rõ tên sách',
    readerName: item.reader_name || item.reader_username || 'Độc giả',
    requestTime: dayjs(item.request_date).format('DD/MM/YYYY HH:mm'),
    handleTime: item.reviewed_at
      ? dayjs(item.reviewed_at).format('DD/MM/YYYY HH:mm')
      : dayjs().format('DD/MM/YYYY HH:mm'),
    status,
  };
}

const RenewalReview: React.FC = () => {
  const [historyData, setHistoryData] = useState<HistoryRenewalItem[]>([]);

  const { data: pendingApiData, loading, mutate: mutatePending } = useRequest(
    () => getPendingRenewals('pending'),
    { formatResult: (res) => res.data },
  );

  useRequest(() => getPendingRenewals('approved'), {
    formatResult: (res) => res.data as any[],
    onSuccess: (data) => {
      const approved = (data || []).map((item: any) => mapToHistory(item, 'APPROVED'));
      setHistoryData((prev) => {
        const existingIds = new Set(prev.map((h) => h.id));
        return [...prev, ...approved.filter((h: HistoryRenewalItem) => !existingIds.has(h.id))];
      });
    },
  });

  const pendingData: PendingRenewalItem[] = (pendingApiData || []).map(mapToPending);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    const target = pendingApiData?.find((item: any) => String(item.id) === id);
    try {
      await reviewRenewal(id, { status });
      if (status === 'approved') {
        message.success(`✅ Đã phê duyệt gia hạn: ${target?.document_title}`);
      } else {
        message.info(`Đã từ chối yêu cầu của: ${target?.reader_name || target?.reader_username}`);
      }
      mutatePending((prev: any[]) => prev?.filter((item: any) => String(item.id) !== id) ?? []);
      if (target) {
        setHistoryData((prev) => [
          mapToHistory({ ...target, reviewed_at: new Date().toISOString() }, status === 'approved' ? 'APPROVED' : 'REJECTED'),
          ...prev,
        ]);
      }
    } catch (err: any) {
      message.error(`❌ ${getApiError(err, 'Có lỗi xảy ra!')}`);
    }
  };

  return (
    <PageSkeleton
      title='Phê duyệt gia hạn'
      subtitle='Xem xét và xử lý yêu cầu gia hạn từ độc giả'
    >
      <div className='library-panel'>
        <Spin spinning={loading}>
          {pendingData.length === 0 && !loading ? (
            <div className='tt-empty-card'>
              <Empty description='Không có yêu cầu gia hạn đang chờ duyệt' />
            </div>
          ) : (
            <PendingList
              data={pendingData}
              onAccept={(id) => handleReview(id, 'approved')}
              onReject={(id) => handleReview(id, 'rejected')}
            />
          )}
          <HistoryList data={historyData} />
        </Spin>
      </div>
    </PageSkeleton>
  );
};

export default RenewalReview;
