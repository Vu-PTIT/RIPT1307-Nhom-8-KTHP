import React from 'react';
import PageSkeleton from '@/components/PageSkeleton';
import ReturnTab from '../BorrowManage/components/ReturnTab';

const ReturnManage: React.FC = () => {
  return (
    <PageSkeleton title='Xử lý trả sách' subtitle='Khu vực nghiệp vụ thư viện thu hồi sách.'>
      <div className='library-panel'>
        <ReturnTab />
      </div>
    </PageSkeleton>
  );
};

export default ReturnManage;
