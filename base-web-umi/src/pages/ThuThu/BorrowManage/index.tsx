import React, { useState } from 'react';
import { Card } from 'antd';
import PageSkeleton from '@/components/PageSkeleton';
import Checkout from './components/Checkout';
import ReturnTab from './components/ReturnTab';
import ReserveTab from './components/ReserveTab';
import TabSwitcher from './components/TabSwitcher';

type TabKey = 'borrow' | 'return' | 'reserve';

const TAB_CONTENT: Record<TabKey, React.ReactNode> = {
  borrow: <Checkout />,
  return: <ReturnTab />,
  reserve: <ReserveTab />,
};

const BorrowManage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('borrow');

  return (
    <PageSkeleton title='Xử lý mượn trả'>
      <div className='library-panel'>
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />
          {TAB_CONTENT[activeTab]}
        </Card>
      </div>
    </PageSkeleton>
  );
};

export default BorrowManage;
