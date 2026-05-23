import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Table, Button, Space, message, Empty, Popconfirm } from 'antd';
import { getMyCart, removeFromCart, clearCart } from '@/services/MuonSach';

const GioMuonPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.warning('Vui lòng đăng nhập để xem giỏ mượn');
        setData([]);
        return;
      }

      const response = await getMyCart();
      setData(response?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCart();
  }, []);

  const handleRemove = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để thực hiện thao tác');
      return;
    }
    try {
      await removeFromCart(id);
      message.success('Đã xóa khỏi giỏ mượn');
      void fetchCart();
    } catch (error) {
      console.error(error);
    }
  };

  const handleClear = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để thực hiện thao tác');
      return;
    }
    try {
      await clearCart();
      message.success('Đã xóa toàn bộ giỏ mượn');
      void fetchCart();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Tài liệu',
      dataIndex: 'document_title',
      key: 'document_title',
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Thời gian thêm',
      dataIndex: 'added_at',
      key: 'added_at',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm
          title="Xác nhận xóa item này khỏi giỏ mượn?"
          onConfirm={() => void handleRemove(record.id)}
        >
          <Button danger size="small">
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <PageContainer title="Giỏ mượn sách" extra={
      <Button danger onClick={() => void handleClear()} disabled={!data.length}>
        Xóa toàn bộ
      </Button>
    }>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: <Empty description="Giỏ mượn trống" /> }}
      />
    </PageContainer>
  );
};

export default GioMuonPage;
