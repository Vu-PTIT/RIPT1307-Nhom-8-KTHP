import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Table, Button, Modal, DatePicker, message, Space, Empty, Input, Select, Popconfirm } from 'antd';
import moment from 'moment';
import { getMyBorrows, getMyRenewals, requestRenewal, getBorrowDetail, updateRenewalRequest, cancelRenewalRequest } from '@/services/MuonSach';

const { Search } = Input;

const GiaHanPage: React.FC = () => {
  const [borrows, setBorrows] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newDueDate, setNewDueDate] = useState<moment.Moment | null>(null);
  const [renewalSearch, setRenewalSearch] = useState<string>('');
  const [renewalStatusFilter, setRenewalStatusFilter] = useState<string>('all');
  const [editRenewalModalVisible, setEditRenewalModalVisible] = useState<boolean>(false);
  const [editingRenewal, setEditingRenewal] = useState<any>(null);
  const [editingNewDueDate, setEditingNewDueDate] = useState<moment.Moment | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.warning('Vui lòng đăng nhập để xem danh sách gia hạn');
        setBorrows([]);
        setRenewals([]);
        return;
      }

      const [borrowsRes, renewalsRes] = await Promise.all([getMyBorrows(), getMyRenewals()]);
      const borrowRecords = borrowsRes?.data || [];
      const borrowDetails = await Promise.all(
        borrowRecords.map(async (record: any) => {
          try {
            const detailRes = await getBorrowDetail(record.id);
            return detailRes?.data;
          } catch (e) {
            console.error('Failed to load borrow detail', e);
            return record;
          }
        }),
      );

      setBorrows(borrowDetails.filter(Boolean));
      setRenewals(renewalsRes?.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openRenewalModal = (item: any) => {
    setSelectedItem(item);
    setNewDueDate(moment(item?.due_date || item?.borrow_date).add(7, 'days'));
    setModalVisible(true);
  };

  const submitRenewal = async () => {
    if (!selectedItem || !newDueDate) {
      message.warning('Vui lòng chọn ngày gia hạn');
      return;
    }

    try {
      await requestRenewal({ borrow_record_item_id: selectedItem.id, new_due_date: newDueDate.format('YYYY-MM-DD') });
      message.success('Yêu cầu gia hạn đã được gửi');
      setModalVisible(false);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.detail || 'Gửi yêu cầu gia hạn thất bại');
    }
  };

  const openEditRenewal = (renewal: any) => {
    setEditingRenewal(renewal);
    setEditingNewDueDate(moment(renewal.new_due_date));
    setEditRenewalModalVisible(true);
  };

  const saveRenewalEdit = async () => {
    if (!editingRenewal || !editingNewDueDate) return;
    try {
      await updateRenewalRequest(editingRenewal.id, { new_due_date: editingNewDueDate.format('YYYY-MM-DD') });
      message.success('Đã cập nhật yêu cầu gia hạn');
      setEditRenewalModalVisible(false);
      setEditingRenewal(null);
      await fetchData();
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.detail || 'Cập nhật yêu cầu gia hạn thất bại');
    }
  };

  const cancelRenewal = async (renewalId: string) => {
    try {
      await cancelRenewalRequest(renewalId);
      message.success('Yêu cầu gia hạn đã được hủy');
      await fetchData();
    } catch (error: any) {
      console.error(error);
      message.error(error?.response?.data?.detail || 'Hủy yêu cầu gia hạn thất bại');
    }
  };

  const pendingRenewalItemIds = new Set(
    renewals
      .filter((item: any) => item.status === 'pending')
      .map((item: any) => item.borrow_record_item_id ?? item.id)
  );

  const borrowItems = borrows.flatMap((record) =>
    (record.items || []).map((item: any) => ({
      ...item,
      borrow_record_id: record.id,
      borrow_date: record.borrow_date,
      due_date: record.due_date,
      canRenew: item.return_date == null && item.status === 'borrowed',
      hasPendingRenewal: pendingRenewalItemIds.has(item.id),
    })),
  );

  const filteredRenewals = renewals.filter((renewal) => {
    const matchesStatus = renewalStatusFilter === 'all' || renewal.status === renewalStatusFilter;
    const matchesSearch = renewal.document_title?.toLowerCase().includes(renewalSearch.toLowerCase()) ||
      renewal.old_due_date?.toString().includes(renewalSearch) ||
      renewal.new_due_date?.toString().includes(renewalSearch);
    return matchesStatus && (!renewalSearch || matchesSearch);
  });

  const borrowColumns = [
    { title: 'Phiếu mượn', dataIndex: 'borrow_record_id', key: 'borrow_record_id' },
    { title: 'Tài liệu', dataIndex: 'document_title', key: 'document_title' },
    { title: 'Mã bản sao', dataIndex: 'copy_code', key: 'copy_code' },
    { title: 'Hạn trả', dataIndex: 'due_date', key: 'due_date' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value: any, record: any) =>
        record.hasPendingRenewal ? 'Chờ gia hạn' : value === 'returned' ? 'Đã trả' : 'Đang mượn',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          type="primary"
          size="small"
          disabled={!record.canRenew || record.hasPendingRenewal}
          onClick={() => openRenewalModal(record)}
        >
          {record.hasPendingRenewal ? 'Đang chờ' : 'Gia hạn'}
        </Button>
      ),
    },
  ];

  const renewalColumns = [
    { title: 'Tài liệu', dataIndex: 'document_title', key: 'document_title' },
    { title: 'Hạn cũ', dataIndex: 'old_due_date', key: 'old_due_date' },
    { title: 'Hạn mới', dataIndex: 'new_due_date', key: 'new_due_date' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    {
      title: 'Ngày yêu cầu',
      dataIndex: 'request_date',
      key: 'request_date',
      render: (value: any) => value ? moment(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    { title: 'Lý do từ chối', dataIndex: 'reject_reason', key: 'reject_reason' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" disabled={record.status !== 'pending'} onClick={() => openEditRenewal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Hủy yêu cầu gia hạn này?"
            onConfirm={() => cancelRenewal(record.id)}
            okText="Hủy"
            cancelText="Không"
          >
            <Button danger size="small" disabled={record.status !== 'pending'}>
              Hủy
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Yêu cầu gia hạn">
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <h3>Danh sách tài liệu có thể gia hạn</h3>
          <Table
            rowKey="id"
            columns={borrowColumns}
            dataSource={borrowItems}
            loading={loading}
            locale={{ emptyText: <Empty description="Không có tài liệu để gia hạn" /> }}
          />
        </div>
        <div>
          <h3>Lịch sử yêu cầu gia hạn</h3>
          <Space style={{ marginBottom: 16 }}>
            <Search
              placeholder="Tìm theo tài liệu hoặc hạn"
              allowClear
              value={renewalSearch}
              onChange={(e) => setRenewalSearch(e.target.value)}
              style={{ width: 280 }}
            />
            <Select
              value={renewalStatusFilter}
              onChange={(value) => setRenewalStatusFilter(value)}
              options={[
                { label: 'Tất cả', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Cancelled', value: 'cancelled' },
              ]}
              style={{ width: 180 }}
            />
          </Space>
          <Table
            rowKey="id"
            columns={renewalColumns}
            dataSource={filteredRenewals}
            loading={loading}
            locale={{ emptyText: <Empty description="Chưa có yêu cầu gia hạn" /> }}
          />
        </div>
      </Space>
      <Modal
        title="Yêu cầu gia hạn"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={submitRenewal}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>Tài liệu:</strong> {selectedItem?.document_title}
          </div>
          <div>
            <strong>Mã bản sao:</strong> {selectedItem?.copy_code}
          </div>
          <div>
            <strong>Hạn trả hiện tại:</strong> {selectedItem?.due_date}
          </div>
          <DatePicker
            value={newDueDate}
            onChange={(date) => setNewDueDate(date)}
            style={{ width: '100%' }}
          />
        </Space>
      </Modal>
      <Modal
        title="Chỉnh sửa yêu cầu gia hạn"
        visible={editRenewalModalVisible}
        onCancel={() => setEditRenewalModalVisible(false)}
        onOk={saveRenewalEdit}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <strong>Tài liệu:</strong> {editingRenewal?.document_title}
          </div>
          <div>
            <strong>Hạn cũ:</strong> {editingRenewal?.old_due_date}
          </div>
          <DatePicker
            value={editingNewDueDate}
            onChange={(date) => setEditingNewDueDate(date)}
            style={{ width: '100%' }}
          />
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default GiaHanPage;
