import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Button, Card, Input, Modal, Popconfirm, Select, Space, Tag, Typography, message, Empty } from 'antd';
import { getMyBorrows, getBorrowDetail, updateBorrowRecord, deleteBorrowRecord } from '@/services/MuonSach';

const { Search } = Input;
const { Title, Text } = Typography;

const LichSuMuonPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editNote, setEditNote] = useState<string>('');

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.warning('Vui lòng đăng nhập để xem lịch sử mượn');
        setData([]);
        return;
      }

      const response = await getMyBorrows();
      const records = response?.data || [];
      const details = await Promise.all(
        records.map(async (record: any) => {
          try {
            const detailRes = await getBorrowDetail(record.id);
            return { ...(detailRes?.data || record), note: record.notes ?? record.note ?? '' };
          } catch (e) {
            console.error('Failed to load borrow detail', e);
            return { ...record, note: record.notes ?? record.note ?? '' };
          }
        }),
      );
      setData(details);
    } catch (error) {
      message.error('Không thể tải lịch sử mượn');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBorrows();
  }, []);

  const filteredData = data.filter((record) => {
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesSearch = record.items?.some((item: any) => item.document_title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.items?.some((item: any) => item.copy_code?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && (!searchTerm || matchesSearch);
  });

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setEditNote(record.note || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      const response = await updateBorrowRecord(editingRecord.id, { notes: editNote });
      const updatedRecord = response?.data;
      setData((prev) => prev.map((item) => item.id === editingRecord.id ? { ...item, note: updatedRecord?.notes ?? editNote } : item));
      setEditModalVisible(false);
      message.success('Đã lưu ghi chú');
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.detail || 'Cập nhật ghi chú thất bại');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteBorrowRecord(id);
      setData((prev) => prev.filter((item) => item.id !== id));
      message.success('Đã xóa lịch sử mượn');
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.detail || 'Xóa lịch sử mượn thất bại');
    }
  };

  const renderStatusTag = (status: string) => {
    const lower = status?.toString().toLowerCase();
    const statusMap: Record<string, { text: string; color: string }> = {
      borrowed: { text: 'Đang mượn', color: 'geekblue' },
      overdue: { text: 'Quá hạn', color: 'volcano' },
      returned: { text: 'Đã trả', color: 'green' },
    };
    const item = statusMap[lower] || { text: status || 'Không xác định', color: 'default' };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const renderBorrowCard = (record: any) => (
    <Card
      key={record.id}
      bodyStyle={{ padding: 22 }}
      style={{ borderRadius: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.06)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <Title level={5} style={{ marginBottom: 6 }} ellipsis>
            Phiếu mượn {record.id}
          </Title>
          <Text type="secondary">Ngày mượn: {record.borrow_date || '-'}</Text>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {renderStatusTag(record.status)}
          <Tag color="default">{record.items?.length || 0} tài liệu</Tag>
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Text strong>Hạn trả:</Text>
          <Text>{record.due_date || '-'}</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Text strong>Ghi chú:</Text>
          <Text>{record.note || '-'}</Text>
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {record.items?.map((item: any) => (
          <Card
            key={item.id || item.copy_code}
            type="inner"
            bodyStyle={{ padding: 16 }}
            style={{ background: '#fafafa', borderRadius: 16 }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {item.cover_image ? (
                <div style={{ width: 96, minWidth: 96, height: 136, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', background: '#fff' }}>
                  <img
                    src={item.cover_image}
                    alt={item.document_title || 'Bìa sách'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ width: 96, minWidth: 96, height: 136, borderRadius: 16, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12, textAlign: 'center', padding: 8 }}>
                  Không có ảnh
                </div>
              )}
              <div style={{ minWidth: 220, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>{item.document_title || 'Tài liệu không rõ'}</Text>
                  <Text type="secondary" style={{ display: 'block' }}>Mã bản sao: {item.copy_code || '-'}</Text>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Tag color="blue">{item.status || '-'}</Tag>
                  <Text type="secondary">Ngày trả: {item.return_date || '-'}</Text>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <Button size="small" onClick={() => openEditModal(record)}>
          Sửa
        </Button>
        <Popconfirm
          title="Bạn có chắc muốn xóa lịch sử này?"
          onConfirm={() => handleDeleteRecord(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button danger size="small" disabled={record.status !== 'returned'}>
            Xóa
          </Button>
        </Popconfirm>
      </div>
    </Card>
  );

  return (
    <PageContainer title="Lịch sử mượn">
      <Space style={{ marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <Search
          placeholder="Tìm tài liệu hoặc mã bản sao"
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 320 }}
        />
        <Select
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          options={[
            { label: 'Tất cả', value: 'all' },
            { label: 'Đang mượn', value: 'borrowed' },
            { label: 'Quá hạn', value: 'overdue' },
            { label: 'Đã trả', value: 'returned' },
          ]}
          style={{ width: 180 }}
        />
      </Space>
      <div style={{ display: 'grid', gap: 16 }}>
        {filteredData.length > 0 ? filteredData.map(renderBorrowCard) : (
          <Empty description="Không có lịch sử mượn" />
        )}
      </div>
      <Modal
        title="Sửa ghi chú"
        visible={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
      >
        <Input.TextArea
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          rows={4}
          placeholder="Nhập ghi chú cho phiếu mượn"
        />
      </Modal>
    </PageContainer>
  );
};

export default LichSuMuonPage;
