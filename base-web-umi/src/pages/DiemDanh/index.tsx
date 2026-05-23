import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Table, Button, Space, message, Empty } from 'antd';
import { selfCheckin, getCheckinHistory } from '@/services/MuonSach';

const DiemDanhPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.warning('Vui lòng đăng nhập để xem lịch sử điểm danh');
        setData([]);
        return;
      }

      const response = await getCheckinHistory({ page: 1, page_size: 20 });
      setData(response?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
  }, []);

  const handleCheck = async (type: 'checkin' | 'checkout') => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.warning('Vui lòng đăng nhập để thực hiện thao tác');
        setSubmitting(false);
        return;
      }

      await selfCheckin({ check_type: type, method: 'self' });
      message.success(type === 'checkin' ? 'Check-in thành công' : 'Check-out thành công');
      await fetchHistory();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: 'Loại', dataIndex: 'check_type', key: 'check_type' },
    { title: 'Phương thức', dataIndex: 'method', key: 'method' },
    { title: 'Thời gian', dataIndex: 'check_time', key: 'check_time' },
  ];

  return (
    <PageContainer title="Check-in / Check-out" extra={
      <Space>
        <Button type="primary" loading={submitting} onClick={() => void handleCheck('checkin')}>
          Check-in
        </Button>
        <Button loading={submitting} onClick={() => void handleCheck('checkout')}>
          Check-out
        </Button>
      </Space>
    }>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        locale={{ emptyText: <Empty description="Chưa có lịch sử điểm danh" /> }}
      />
    </PageContainer>
  );
};

export default DiemDanhPage;
