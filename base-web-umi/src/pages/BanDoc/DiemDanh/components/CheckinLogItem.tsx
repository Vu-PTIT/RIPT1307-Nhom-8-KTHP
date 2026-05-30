import React from 'react';
import { List, Tag } from 'antd';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';

interface CheckinLog {
  id?: string;
  check_type?: string;
  check_time?: string;
  method?: string;
}

const CheckinLogItem: React.FC<{ item: CheckinLog }> = ({ item }) => {
  const isIn = item.check_type === 'in';
  return (
    <List.Item className='library-list-card-item'>
      <List.Item.Meta
        avatar={
          <div
            className='library-stat-icon'
            style={{
              background: isIn ? '#f6ffed' : '#fff1f0',
              color: isIn ? '#52c41a' : '#ff4d4f',
              width: 40,
              height: 40,
              fontSize: 18,
            }}
          >
            {isIn ? <LoginOutlined /> : <LogoutOutlined />}
          </div>
        }
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>
              {isIn ? 'Check-in' : 'Check-out'}
            </span>
            <Tag className={`library-status-tag ${isIn ? 'success' : 'danger'}`}>
              {item.method === 'self' ? 'Tự phục vụ' : 'Thủ thư thao tác'}
            </Tag>
          </div>
        }
        description={
          <div style={{ marginTop: 4, color: '#8c8c8c' }}>
            {item.check_time
              ? new Date(item.check_time).toLocaleString('vi-VN')
              : 'Không rõ thời gian'}
          </div>
        }
      />
    </List.Item>
  );
};

export default CheckinLogItem;
