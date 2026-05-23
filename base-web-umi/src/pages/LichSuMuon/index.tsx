import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Table, Button, Modal, Input, Select, Popconfirm, Space, message, Empty } from 'antd';
import { getMyBorrows, getBorrowDetail, updateBorrowRecord, deleteBorrowRecord } from '@/services/MuonSach';

const { Search } = Input;

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

  const columns = [
    {
      title: 'Mã phiếu',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Ngày mượn',
      dataIndex: 'borrow_date',
      key: 'borrow_date',
    },
    {
      title: 'Hạn trả',
      dataIndex: 'due_date',
      key: 'due_date',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (value: any) => value || '-',
    },
    {
      title: 'Số lượng',
      key: 'count',
      render: (_: any, record: any) => record?.items?.length || 0,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
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
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Lịch sử mượn">
      <Space style={{ marginBottom: 16 }}>
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
            { label: 'Overdue', value: 'overdue' },
            { label: 'Đã trả', value: 'returned' },
          ]}
          style={{ width: 180 }}
        />
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        expandable={{
          expandedRowRender: (record: any) => (
            <Table
              rowKey="id"
              columns={[
                { title: 'Bản sao', dataIndex: 'copy_code', key: 'copy_code' },
                { title: 'Tài liệu', dataIndex: 'document_title', key: 'document_title' },
                { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
                { title: 'Ngày trả', dataIndex: 'return_date', key: 'return_date' },
              ]}
              dataSource={record.items || []}
              pagination={false}
              size="small"
            />
          ),
        }}
        locale={{ emptyText: <Empty description="Không có lịch sử mượn" /> }}
      />
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
