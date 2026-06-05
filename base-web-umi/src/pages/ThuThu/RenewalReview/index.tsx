import React, { useState } from 'react';
import { message, Spin, Empty } from 'antd';
import { useRequest } from 'umi';
import dayjs from 'dayjs';
import LibraryPagination from '@/components/LibraryPagination';
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
    copyCode: item.copy_code,
    readerName: item.reader_name || item.reader_username || 'Độc giả',
    borrowDate: item.borrow_date ? dayjs(item.borrow_date).format('DD/MM/YYYY') : '—',
    currentDueDate: dueDate.format('DD/MM/YYYY'),
    newDueDate: item.new_due_date ? dayjs(item.new_due_date).format('DD/MM/YYYY') : '—',
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
    bookImage: item.cover_image,
    copyCode: item.copy_code,
    readerName: item.reader_name || item.reader_username || 'Độc giả',
    requestTime: dayjs(item.request_date).format('DD/MM/YYYY HH:mm'),
    newDueDate: item.new_due_date ? dayjs(item.new_due_date).format('DD/MM/YYYY') : undefined,
    handleTime: item.reviewed_at
      ? dayjs(item.reviewed_at).format('DD/MM/YYYY HH:mm')
      : dayjs().format('DD/MM/YYYY HH:mm'),
    status,
  };
}

const RenewalReview: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const { data: pendingApiData, loading, mutate: mutatePending } = useRequest(
    () => getPendingRenewals({ status: 'pending', page, page_size: pageSize }),
    { 
      refreshDeps: [page, pageSize],
      formatResult: (res) => res.data 
    },
  );

  const { data: historyApiData, loading: historyLoading, refresh: refreshHistory } = useRequest(
    () => getPendingRenewals({ status: 'all_history', page: historyPage, page_size: historyPageSize }),
    { 
      refreshDeps: [historyPage, historyPageSize],
      formatResult: (res) => res.data 
    },
  );

  const pendingItems = pendingApiData?.items || pendingApiData || [];
  const pendingTotal = pendingApiData?.total || 0;
  const pendingData: PendingRenewalItem[] = pendingItems.map(mapToPending);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    const target = pendingItems.find((item: any) => String(item.id) === id);
    try {
      await reviewRenewal(id, { status });
      if (status === 'approved') {
        message.success(`✅ Đã phê duyệt gia hạn: ${target?.document_title}`);
      } else {
        message.info(`Đã từ chối yêu cầu của: ${target?.reader_name || target?.reader_username}`);
      }
      mutatePending((prev: any) => {
        const items = prev?.items || prev || [];
        const newItems = items.filter((item: any) => String(item.id) !== id);
        if (prev?.items) {
          return { ...prev, items: newItems, total: Math.max(0, prev.total - 1) };
        }
        return newItems;
      });
      refreshHistory();
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
            <>
              <PendingList
                data={pendingData}
                onAccept={(id) => handleReview(id, 'approved')}
                onReject={(id) => handleReview(id, 'rejected')}
              />
              {pendingTotal > 0 && (
                <LibraryPagination
                  current={page}
                  pageSize={pageSize}
                  total={pendingTotal}
                  onChange={(p, s) => {
                    setPage(p);
                    setPageSize(s || 10);
                  }}
                  complex={true}
                />
              )}
            </>
          )}
          
          <Spin spinning={historyLoading}>
            <HistoryList 
              data={(historyApiData?.items || []).map((item: any) => mapToHistory(item, item.status === 'approved' ? 'APPROVED' : 'REJECTED'))}
              total={historyApiData?.total || 0}
              page={historyPage}
              pageSize={historyPageSize}
              onPageChange={(p, s) => {
                setHistoryPage(p);
                setHistoryPageSize(s || 10);
              }}
            />
          </Spin>
        </Spin>
      </div>
    </PageSkeleton>
  );
};

export default RenewalReview;
