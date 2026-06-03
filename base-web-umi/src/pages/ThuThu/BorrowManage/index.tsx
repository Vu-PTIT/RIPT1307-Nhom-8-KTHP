import React, { useState } from 'react';
import { Card } from 'antd';
import PageSkeleton from '@/components/PageSkeleton';
import Checkout from './components/Checkout';
import ReturnTab from './components/ReturnTab';
import ReserveTab from './components/ReserveTab';
import TabSwitcher from './components/TabSwitcher';

type TabKey = 'borrow' | 'reserve';

const TAB_CONTENT: Record<TabKey, React.ReactNode> = {
  borrow: <Checkout />,
  reserve: <ReserveTab />,
};

const BorrowManage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('borrow');

  return (
    <PageSkeleton title='Xử lý mượn sách' subtitle='Khu vực nghiệp vụ thư viện cho mượn sách.'>
      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />
      <div className='library-panel'>
        {TAB_CONTENT[activeTab]}
      </div>
    </PageSkeleton>
  );
};

export default BorrowManage;
