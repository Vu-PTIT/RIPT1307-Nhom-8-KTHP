import React from 'react';
import { Card } from 'antd';
import { BookOutlined, BankOutlined } from '@ant-design/icons';

interface BorrowStatsCardProps {
  current: number;
  returned: number;
}

const BorrowStatsCard: React.FC<BorrowStatsCardProps> = ({ current, returned }) => (
  <div style={{ display: 'flex', gap: 16 }}>
    <Card
      size='small'
      style={{ minWidth: 120, backgroundColor: '#f0f5ff', borderColor: '#d6e4ff', borderRadius: 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#595959', marginBottom: 4 }}>
        <BookOutlined style={{ color: '#1890ff' }} />
        <span style={{ fontSize: 13 }}>Đang mượn</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{current}</div>
    </Card>
    <Card
      size='small'
      style={{ minWidth: 120, backgroundColor: '#f6ffed', borderColor: '#d9f7be', borderRadius: 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#595959', marginBottom: 4 }}>
        <BankOutlined style={{ color: '#52c41a' }} />
        <span style={{ fontSize: 13 }}>Thư viện</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>{returned}</div>
    </Card>
  </div>
);

export default BorrowStatsCard;
