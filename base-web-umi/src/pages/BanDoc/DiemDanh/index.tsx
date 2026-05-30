import React, { useState } from 'react';
import { Alert, List, message, Empty } from 'antd';
import { useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';
import CheckinLogItem from './components/CheckinLogItem';

export default function CheckinPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, loading, error } = useRequest(
    () => MuonSach.getCheckinHistory({ page, page_size: pageSize }),
    {
      refreshDeps: [page, pageSize],
      formatResult: (res) => ({
        items: Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [],
        total: res.data?.total || 0,
      }),
    },
  );

  const logs = data?.items || [];
  const total = data?.total || 0;

  return (
    <PageSkeleton title='Lịch sử điểm danh' subtitle='Theo dõi lịch sử vào/ra thư viện của bạn.'>
      <div className='library-panel'>
        {error && <Alert type='warning' showIcon message='Không tải được lịch sử Check-in' style={{ marginBottom: 16 }} />}
        <div className='library-list-card'>
          {logs.length === 0 && !loading ? (
            <div className='library-empty-state'>
              <Empty description='Chưa có lịch sử check-in/out' />
            </div>
          ) : (
            <List
              loading={loading}
              dataSource={logs}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (p, s) => { setPage(p); setPageSize(s); },
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (t) => `Tổng số ${t} lượt check-in/out`,
              }}
              renderItem={(it: any) => <CheckinLogItem item={it} />}
            />
          )}
        </div>
      </div>
    </PageSkeleton>
  );
}
