import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Button, Card, Space, Tag, Typography, message, Empty } from 'antd';
import { selfCheckin, getCheckinHistory } from '@/services/MuonSach';

const { Title, Text } = Typography;

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

  const renderCheckTag = (type: string) => {
    const lower = type?.toString().toLowerCase();
    const map: Record<string, { text: string; color: string }> = {
      checkin: { text: 'Check-in', color: 'green' },
      checkout: { text: 'Check-out', color: 'blue' },
    };
    const item = map[lower] || { text: type || '-', color: 'default' };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const renderLogCard = (record: any) => (
    <Card
      key={record.id}
      bodyStyle={{ padding: 18 }}
      style={{ borderRadius: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.06)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <Title level={5} style={{ marginBottom: 6 }} ellipsis>
            {record.check_type === 'checkout' ? 'Check-out' : 'Check-in'}
          </Title>
          <Text type="secondary">Phương thức: {record.method || '-'}</Text>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {renderCheckTag(record.check_type)}
          <Text type="secondary">{record.check_time || '-'}</Text>
        </div>
      </div>
    </Card>
  );

  return (
    <PageContainer
      title="Check-in / Check-out"
      extra={
        <Space>
          <Button type="primary" loading={submitting} onClick={() => void handleCheck('checkin')}>
            Check-in
          </Button>
          <Button loading={submitting} onClick={() => void handleCheck('checkout')}>
            Check-out
          </Button>
        </Space>
      }
    >
      <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
        {loading ? (
          <Card style={{ borderRadius: 20, minHeight: 200 }} loading />
        ) : data.length > 0 ? (
          data.map(renderLogCard)
        ) : (
          <Empty description="Chưa có lịch sử điểm danh" />
        )}
      </div>
    </PageContainer>
  );
};

export default DiemDanhPage;
