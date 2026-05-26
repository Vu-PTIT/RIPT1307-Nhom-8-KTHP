import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Button, Card, DatePicker, Empty, Input, message, Modal, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import moment from 'moment';
import { getMyBorrows, getMyRenewals, requestRenewal, getBorrowDetail, updateRenewalRequest, cancelRenewalRequest } from '@/services/MuonSach';

const { Search } = Input;
const { Title, Text } = Typography;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
};

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
      const borrowRecords = Array.isArray(borrowsRes?.data) ? borrowsRes.data : borrowsRes?.data?.data || borrowsRes?.data || [];
      const renewalRecords = Array.isArray(renewalsRes?.data) ? renewalsRes.data : renewalsRes?.data?.data || renewalsRes?.data || [];
      const borrowDetails = await Promise.all(
        borrowRecords.map(async (record: any) => {
          try {
            const recordId = record.id?.toString?.() ?? record.id;
            const detailRes = await getBorrowDetail(recordId);
            return detailRes?.data;
          } catch (e) {
            console.error('Failed to load borrow detail', e);
            return record;
          }
        }),
      );

      setBorrows(borrowDetails.filter(Boolean));
      setRenewals(Array.isArray(renewalRecords) ? renewalRecords : []);
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
    const borrowRecordItemId = item?.borrow_record_item_id || item?.id;
    if (!borrowRecordItemId) {
      message.error('Không xác định được mã bản sao để gia hạn');
      return;
    }
    setSelectedItem({ ...item, borrow_record_item_id: borrowRecordItemId.toString() });
    setNewDueDate(moment(item?.due_date || item?.borrow_date).add(7, 'days'));
    setModalVisible(true);
  };

  const submitRenewal = async () => {
    const borrowRecordItemId = selectedItem?.borrow_record_item_id || selectedItem?.id;
    if (!borrowRecordItemId || !newDueDate) {
      message.warning('Vui lòng chọn ngày gia hạn');
      return;
    }

    try {
      await requestRenewal({ borrow_record_item_id: borrowRecordItemId.toString(), new_due_date: newDueDate.format('YYYY-MM-DD') });
      message.success('Yêu cầu gia hạn đã được gửi');
      setModalVisible(false);
      await fetchData();
    } catch (error: any) {
      console.error('Renewal submit error', error);
      const errorDetail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Gửi yêu cầu gia hạn thất bại';
      message.error(errorDetail);
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

  const toId = (value: any) => value?.toString?.() ?? value;

  const renewalCountMap = renewals.reduce<Record<string, number>>((acc, item: any) => {
    const id = toId(item.borrow_record_item_id ?? item.id);
    if (id) {
      acc[id] = (acc[id] || 0) + 1;
    }
    return acc;
  }, {});

  const pendingRenewalItemIds = new Set(
    renewals
      .filter((item: any) => item.status === 'pending')
      .map((item: any) => toId(item.borrow_record_item_id ?? item.id)),
  );

  const borrowItems = borrows.flatMap((record) =>
    (record.items || []).map((item: any) => {
      const itemId = toId(item.id);
      return {
        ...item,
        id: itemId,
        borrow_record_item_id: item.borrow_record_item_id ?? itemId,
        borrow_record_id: record.id,
        borrow_date: record.borrow_date,
        due_date: record.due_date,
        canRenew: item.return_date == null && item.status === 'borrowed',
        hasPendingRenewal: pendingRenewalItemIds.has(itemId),
        renewalCount: renewalCountMap[itemId] || 0,
      };
    }),
  );

  const filteredRenewals = renewals.filter((renewal) => {
    const status = renewal.status?.toString().toLowerCase();
    const matchesStatus = renewalStatusFilter === 'all' || status === renewalStatusFilter;
    const searchValue = renewalSearch?.toLowerCase() || '';
    const matchesSearch = !searchValue ||
      renewal.document_title?.toLowerCase().includes(searchValue) ||
      renewal.reject_reason?.toLowerCase().includes(searchValue) ||
      renewal.old_due_date?.toString().toLowerCase().includes(searchValue) ||
      renewal.new_due_date?.toString().toLowerCase().includes(searchValue);
    return matchesStatus && matchesSearch;
  });

  const renderStatusTag = (status: string) => {
    const lower = status?.toString().toLowerCase();
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: 'Đang chờ duyệt', color: 'gold' },
      approved: { text: 'Đã duyệt', color: 'green' },
      rejected: { text: 'Đã từ chối', color: 'volcano' },
      cancelled: { text: 'Đã hủy', color: 'default' },
    };
    const item = statusMap[lower] || { text: status || '-', color: 'default' };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const renderBookCard = (item: any) => {
    const dueDate = item.due_date ? moment(item.due_date) : null;
    const isOverdue = dueDate && dueDate.isBefore(moment(), 'day');
    const overdueDays = isOverdue ? moment().diff(dueDate, 'days') : 0;
    const dueLabel = dueDate ? dueDate.format('DD/MM/YYYY') : '-';
    const badgeText = item.hasPendingRenewal
      ? 'Đang chờ duyệt'
      : isOverdue
      ? `Quá hạn ${overdueDays} ngày`
      : `Còn lại ${dueDate?.diff(moment(), 'days')} ngày`;

    return (
      <Card
        key={item.id}
        bodyStyle={{ padding: 24 }}
        style={{ borderRadius: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 110, minWidth: 110, height: 150, borderRadius: 16, overflow: 'hidden', background: '#f5f5f5', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
            {item.cover_image ? (
              <img
                src={item.cover_image}
                alt={item.document_title || 'Bìa sách'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', padding: 8, textAlign: 'center', fontSize: 12 }}>
                Chưa có ảnh bìa
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Title level={5} style={{ marginBottom: 8 }} ellipsis>
              {item.document_title}
            </Title>
            <Text type="secondary">{item.author || 'Không rõ tác giả'}</Text>
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              <Text strong>Hạn trả: </Text>
              <Text>{dueLabel}</Text>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <Tag color={isOverdue ? 'volcano' : item.hasPendingRenewal ? 'gold' : 'geekblue'}>
                  {badgeText}
                </Tag>
                <Tag color="default">Đã gia hạn: {item.renewalCount}/2 lần</Tag>
              </div>
            </div>
          </div>
          <div style={{ minWidth: 140, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              size="large"
              disabled={!item.canRenew || item.hasPendingRenewal}
              onClick={() => openRenewalModal(item)}
              style={{ minWidth: 140 }}
            >
              {item.hasPendingRenewal ? 'Đang chờ duyệt' : 'Yêu cầu gia hạn'}
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  const renderRenewalCard = (renewal: any) => {
    return (
      <Card
        key={renewal.id}
        bodyStyle={{ padding: 20 }}
        style={{ borderRadius: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.06)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={5} style={{ marginBottom: 6 }} ellipsis>
              {renewal.document_title}
            </Title>
            <Text type="secondary">{renewal.author || 'Không rõ tác giả'}</Text>
          </div>
          <div>{renderStatusTag(renewal.status)}</div>
        </div>
        <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
          <Text>Ngày gửi: {renewal.request_date ? moment(renewal.request_date).format('DD/MM/YYYY HH:mm') : '-'}</Text>
          <Text>
            Hạn cũ: {renewal.old_due_date ? moment(renewal.old_due_date).format('DD/MM/YYYY') : '-'}
            {' · '}
            Hạn mới: {renewal.new_due_date ? moment(renewal.new_due_date).format('DD/MM/YYYY') : '-'}
          </Text>
          {renewal.reject_reason ? <Text type="danger">Lý do: {renewal.reject_reason}</Text> : null}
        </div>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          <Button
            type="default"
            size="small"
            disabled={renewal.status !== 'pending'}
            onClick={() => openEditRenewal(renewal)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Hủy yêu cầu gia hạn này?"
            onConfirm={() => cancelRenewal(renewal.id)}
            okText="Hủy"
            cancelText="Không"
          >
            <Button danger size="small" disabled={renewal.status !== 'pending'}>
              Hủy
            </Button>
          </Popconfirm>
        </div>
      </Card>
    );
  };

  return (
    <PageContainer title="Gia hạn trực tuyến">
      <div style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
        Gửi yêu cầu gia hạn thời gian mượn sách
      </div>
      <div style={{ display: 'grid', gap: 28 }}>
        <div>
          <Title level={4}>Sách có thể gia hạn</Title>
          <div style={{ display: 'grid', gap: 16 }}>
            {borrowItems.length > 0 ? borrowItems.map(renderBookCard) : (
              <Empty description="Không có tài liệu để gia hạn" />
            )}
          </div>
        </div>

        <div>
          <Title level={4}>Lịch sử yêu cầu gia hạn</Title>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
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
                { label: 'Chờ duyệt', value: 'pending' },
                { label: 'Đã duyệt', value: 'approved' },
                { label: 'Từ chối', value: 'rejected' },
                { label: 'Đã hủy', value: 'cancelled' },
              ]}
              style={{ width: 180 }}
            />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredRenewals.length > 0 ? filteredRenewals.map(renderRenewalCard) : (
              <Empty description="Chưa có yêu cầu gia hạn" />
            )}
          </div>
        </div>
      </div>

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
