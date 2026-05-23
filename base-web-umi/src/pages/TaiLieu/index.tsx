import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Table, Input, Button, Space, message, Badge } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { searchDocuments } from '@/services/TaiLieu';
import { addToWishlist, addToCart } from '@/services/MuonSach';

const PAGE_SIZE = 10;

const TaiLieuPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const fetchDocuments = async (nextPage: number = 1) => {
    setLoading(true);
    try {
      const response = await searchDocuments({ keyword, page: nextPage, page_size: PAGE_SIZE });
      setData(response?.data?.items || []);
      setTotal(response?.data?.total || 0);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDocuments(1);
  }, []);

  const handleSearch = () => {
    void fetchDocuments(1);
  };

  const handleAddToWishlist = async (id: string) => {
    try {
      await addToWishlist(id);
      message.success('Đã thêm vào yêu thích');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddToCart = async (id: string) => {
    try {
      await addToCart(id);
      message.success('Đã thêm vào giỏ mượn');
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => history.push(`/tai-lieu/${record.id}`)}>
          {record.title}
        </Button>
      ),
    },
    {
      title: 'Tác giả',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Thể loại',
      dataIndex: 'category_name',
      key: 'category_name',
    },
    {
      title: 'Còn lại',
      dataIndex: 'available_copies',
      key: 'available_copies',
      render: (value: number) => (
        <Badge count={value} showZero />
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" size="small" onClick={() => void handleAddToWishlist(record.id)}>
            Yêu thích
          </Button>
          <Button size="small" onClick={() => void handleAddToCart(record.id)}>
            Giỏ mượn
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Danh sách tài liệu">
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm tài liệu"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 320 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        <Button type="primary" onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: (pageNumber) => void fetchDocuments(pageNumber),
          showSizeChanger: false,
        }}
      />
    </PageContainer>
  );
};

export default TaiLieuPage;
