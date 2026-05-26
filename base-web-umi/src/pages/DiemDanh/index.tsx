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
      bodyStyle={{ padding: 16 }}
      style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <Title level={5} style={{ marginBottom: 4, marginTop: 0 }}>
              {record.check_type === 'checkout' ? 'Check-out' : 'Check-in'}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Phương thức: {record.method || '-'}
            </Text>
          </div>
          <div>
            {renderCheckTag(record.check_type)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.check_time || '-'}
          </Text>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 12 }}>
        {loading ? (
          <>
            <Card style={{ borderRadius: 20, minHeight: 120 }} loading />
            <Card style={{ borderRadius: 20, minHeight: 120 }} loading />
          </>
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
