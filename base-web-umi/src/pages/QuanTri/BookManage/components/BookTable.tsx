import React from 'react';
import { Table, Button, Space, Popconfirm, Tooltip, Typography, Tag, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface BookTableProps {
  books: any[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onEdit: (record: any) => void;
  onDelete: (id: string, title: string) => void;
  onDetail: (id: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
}

const BookTable: React.FC<BookTableProps> = ({
  books,
  loading,
  total,
  page,
  pageSize,
  onEdit,
  onDelete,
  onDetail,
  onPageChange,
}) => {
  const columns = [
    {
      title: 'Đầu sách',
      key: 'book',
      className: 'full-width-mobile-cell',
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar shape="square" size={60} src={record.image} />
          <div>
            <div style={{ fontWeight: 700, color: '#111' }}>{record.title}</div>
            <Text type='secondary' style={{ fontSize: 13 }}>{record.author}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'ISBN',
      dataIndex: 'isbn',
      key: 'isbn',
      render: (v: string) => <Text style={{ fontSize: 13 }}>{v || '—'}</Text>,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      render: (_: any, record: any) => (
        <Text style={{ fontSize: 13 }}>
          <strong style={{ color: '#1890ff' }}>{record.availableCount}</strong> / {record.totalCount}
        </Text>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title='Xem chi tiết / Quản lý bản sao'>
            <Button
              type='text'
              icon={<EyeOutlined />}
              onClick={() => onDetail(record.id)}
              style={{ color: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title='Xoá đầu sách'>
            <Popconfirm
              title={`Xoá đầu sách "${record.title}"? Hành động này không thể hoàn tác.`}
              onConfirm={() => onDelete(record.id, record.title)}
              okText='Xoá'
              cancelText='Huỷ'
              okButtonProps={{ danger: true }}
            >
              <Button type='text' icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const responsiveColumns = columns.map(col => ({
    ...col,
    onCell: (record: any) => ({
      'data-label': col.title,
      ...(col.onCell ? col.onCell(record) : {})
    })
  }));

  return (
    <Table
      className="library-responsive-table"
      dataSource={books}
      columns={responsiveColumns}
      loading={loading}
      rowKey={(r: any) => String(r.id)}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        onChange: onPageChange,
      }}
      size='middle'
    />
  );
};

export default BookTable;
