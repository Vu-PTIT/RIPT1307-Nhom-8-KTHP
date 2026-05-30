import React from 'react';
import { message } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';
import BorrowHistoryList from './components/BorrowHistoryList';

export default function BorrowHistoryPage() {
  const { data: items = [], loading } = useRequest(MuonSach.getMyBorrows, {
    formatResult: (res) => res.data || [],
    onError: () => message.error('Không tải được lịch sử mượn'),
  });

  return (
    <PageSkeleton title='Lịch sử mượn'>
      <div className='library-panel'>
        <div className='library-action-bar'>
          <div className='library-action-left'>
            <div className='library-stat'>
              <HistoryOutlined />
              <div>
                <span>Phiếu mượn của bạn</span>
                <strong>{items.length}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className='library-list-card'>
          <BorrowHistoryList items={items} loading={loading} />
        </div>
      </div>
    </PageSkeleton>
  );
}
