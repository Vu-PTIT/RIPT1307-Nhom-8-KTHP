import React from 'react';
import { Table, Tag, Typography, Avatar } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LoginOutlined, LogoutOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

export interface LogItem {
  id: string;
  username: string;
  email: string;
  check_type: string;
  method: string;
  check_time: string;
  handled_by_name?: string;
  name?: string;
  status?: 'IN' | 'OUT';
  checkInTime?: string;
  checkOutTime?: string;
  checkout_time?: string;
  duration?: string;
}

interface LogListProps {
  data: LogItem[];
  loading?: boolean;
  pagination?: any;
}

const LogList: React.FC<LogListProps> = ({ data, loading, pagination }) => {
  const columns: ColumnsType<LogItem> = [
    {
      title: 'Người dùng',
      key: 'user',
      className: 'full-width-mobile-cell',
      render: (_, item) => {
        const displayName = item.name || item.username || '';
        const isTypeIn = item.check_type?.toLowerCase() === 'in' || item.check_type?.toLowerCase() === 'check_in';
        const isToday = item.check_time ? dayjs(item.check_time + (item.check_time.endsWith('Z') ? '' : 'Z')).isSame(dayjs(), 'day') : true;
        const isIn = ((isTypeIn && !item.checkout_time) || item.status === 'IN') && isToday;

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={36}
              style={{ backgroundColor: isIn ? '#f6ffed' : '#f0f0f0', color: isIn ? '#52c41a' : '#595959', fontWeight: 600 }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>{displayName}</div>
              {item.email && <Text type='secondary' style={{ fontSize: 13 }}>{item.email}</Text>}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Thời gian Check-in',
      key: 'checkin',
      render: (_, item) => {
        const isTypeIn = item.check_type?.toLowerCase() === 'in' || item.check_type?.toLowerCase() === 'check_in';
        let checkInTime = '';
        if (isTypeIn) {
          checkInTime = item.checkInTime || (item.check_time ? dayjs(item.check_time + (item.check_time.endsWith('Z') ? '' : 'Z')).format('DD/MM/YYYY HH:mm') : '');
        }
        
        if (!checkInTime) return <span style={{ color: '#bfbfbf' }}>-</span>;
        
        return (
          <div>
            <LoginOutlined style={{ marginRight: 4, color: '#52c41a' }} />
            {checkInTime}
          </div>
        );
      },
    },
    {
      title: 'Thời gian Check-out',
      key: 'checkout',
      render: (_, item) => {
        const isTypeIn = item.check_type?.toLowerCase() === 'in' || item.check_type?.toLowerCase() === 'check_in';
        let checkOutTime = '';
        if (isTypeIn) {
          checkOutTime = item.checkOutTime || (item.checkout_time ? dayjs(item.checkout_time + (item.checkout_time.endsWith('Z') ? '' : 'Z')).format('DD/MM/YYYY HH:mm') : '');
        } else {
          // Đối với log ra về (standalone out log)
          checkOutTime = item.checkOutTime || (item.check_time ? dayjs(item.check_time + (item.check_time.endsWith('Z') ? '' : 'Z')).format('DD/MM/YYYY HH:mm') : '');
        }
        
        if (!checkOutTime) return <span style={{ color: '#bfbfbf' }}>-</span>;
        
        return (
          <div>
            <LogoutOutlined style={{ marginRight: 4, color: '#f5222d' }} />
            {checkOutTime}
            {item.duration && (
              <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} /> {item.duration}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Tình trạng',
      key: 'status',
      render: (_, item) => {
        const isTypeIn = item.check_type?.toLowerCase() === 'in' || item.check_type?.toLowerCase() === 'check_in';
        const isToday = item.check_time ? dayjs(item.check_time + (item.check_time.endsWith('Z') ? '' : 'Z')).isSame(dayjs(), 'day') : true;
        const isIn = ((isTypeIn && !item.checkout_time) || item.status === 'IN') && isToday;
        return isIn ? (
          <Tag color='success' style={{ borderRadius: 10, padding: '2px 10px', fontWeight: 500 }}>
            Trong thư viện
          </Tag>
        ) : (
          <Tag color='default' style={{ borderRadius: 10, padding: '2px 10px', fontWeight: 500 }}>
            Đã ra về
          </Tag>
        );
      },
    },

  ];

  const responsiveColumns = columns.map(col => ({
    ...col,
    onCell: (record: LogItem) => ({
      'data-label': col.title,
      ...(col.onCell ? col.onCell(record) : {})
    })
  }));

  return (
    <Table
      className="library-responsive-table"
      columns={responsiveColumns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={pagination}
      scroll={{ x: 800 }}
    />
  );
};

export default LogList;
