import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Table, Button, Space, message, Empty } from 'antd';
import { getMyWishlist, removeFromWishlist, addToCart } from '@/services/MuonSach';

const YeuThichPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.warning('Vui lòng đăng nhập để xem danh sách yêu thích');
        setData([]);
        return;
      }

      const response = await getMyWishlist();
      setData(response?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWishlist();
  }, []);

  const handleRemove = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để thực hiện thao tác');
      return;
    }
    try {
      await removeFromWishlist(id);
      message.success('Đã xóa khỏi yêu thích');
      void fetchWishlist();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMoveToCart = async (documentId: string, wishlistId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để thực hiện thao tác');
      return;
    }
    try {
      await addToCart(documentId);
      message.success('Đã thêm vào giỏ mượn');
      await removeFromWishlist(wishlistId);
      void fetchWishlist();
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
        <Space>
            <Button type="primary" size="small" onClick={() => void handleMoveToCart(record.document_id, record.id)}>
            Chuyển giỏ mượn
          </Button>
          <Button danger size="small" onClick={() => void handleRemove(record.id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Danh sách yêu thích">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: <Empty description="Không có yêu thích nào" /> }}
      />
    </PageContainer>
  );
};

export default YeuThichPage;
