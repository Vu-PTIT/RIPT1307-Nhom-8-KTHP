import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Button, Card, DatePicker, Empty, Input, message, Modal, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import moment from 'moment';
import { getMyBorrows, getMyRenewals, requestRenewal, getBorrowDetail, updateRenewalRequest, cancelRenewalRequest } from '@/services/MuonSach';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';

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

  const renderBookCard = (item: any) => {
    const dueDate = item.due_date ? moment(item.due_date) : null;
    const isOverdue = dueDate && dueDate.isBefore(moment(), 'day');
    const overdueDays = isOverdue ? moment().diff(dueDate, 'days') : 0;
    const dueLabel = dueDate ? dueDate.format('DD/MM/YYYY') : '-';

    return (
      <Card
        key={item.id}
        cover={
          <div style={{ height: 160, overflow: 'hidden', background: '#f5f5f5', borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
            {item.cover_image ? (
              <img
                src={item.cover_image}
                alt={item.document_title || 'Bìa sách'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
                Chưa có ảnh
              </div>
            )}
            {/* Overdue or remaining days badge */}
            <div style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: isOverdue ? 'rgba(227, 26, 26, 0.9)' : 'rgba(24, 144, 255, 0.9)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500
            }}>
              {isOverdue ? `Quá hạn ${overdueDays} ngày` : `Còn lại ${dueDate ? dueDate.diff(moment(), 'days') : 0} ngày`}
            </div>
            {/* Copy code badge */}
            {item.copy_code && (
              <div style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                background: 'rgba(0, 0, 0, 0.55)',
                color: '#fff',
                padding: '2px 7px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}>
                📖 {item.copy_code}
              </div>
            )}
          </div>
        }
        bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}
        style={{
          borderRadius: 8,
          border: '1px solid #e8e8e8',
          boxShadow: 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#262626', marginBottom: 4, minHeight: 44, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.document_title}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.author || 'Tác giả không rõ'}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8c8c8c', marginBottom: 6 }}>
            <span>Hạn trả:</span>
            <span style={{ fontWeight: 600, color: '#262626' }}>{dueLabel}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8c8c8c', marginBottom: 16 }}>
            <span>Đã gia hạn:</span>
            <span>{item.renewalCount}/2 lần</span>
          </div>
        </div>

        <div>
          {item.hasPendingRenewal ? (
            <Button
              type="primary"
              icon={<ClockCircleOutlined />}
              style={{
                width: '100%',
                background: '#E26D67',
                borderColor: '#E26D67',
                color: '#fff',
                borderRadius: '20px',
                height: '36px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none',
                cursor: 'default',
                pointerEvents: 'none',
              }}
            >
              Đang chờ duyệt
            </Button>
          ) : (
            <Button
              type="primary"
              disabled={!item.canRenew}
              onClick={() => openRenewalModal(item)}
              icon={<SyncOutlined />}
              style={{
                width: '100%',
                background: item.canRenew ? '#E31A1A' : '#f5f5f5',
                borderColor: item.canRenew ? '#E31A1A' : '#d9d9d9',
                color: item.canRenew ? '#fff' : '#bfbfbf',
                borderRadius: '20px',
                height: '36px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: item.canRenew ? '0 2px 4px rgba(227, 26, 26, 0.2)' : 'none',
                cursor: item.canRenew ? 'pointer' : 'not-allowed',
              }}
            >
              Yêu cầu gia hạn
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const renderRenewalCard = (renewal: any) => {
    const isPending = renewal.status === 'pending';
    const isApproved = renewal.status === 'approved';
    const isRejected = renewal.status === 'rejected';
    const isCancelled = renewal.status === 'cancelled';

    let tagBg = '#f5f5f5';
    let tagBorder = '#d9d9d9';
    let tagColor = '#595959';
    let tagText = STATUS_LABELS[renewal.status] || renewal.status;
    let tagIcon = null;

    if (isPending) {
      tagBg = '#FFFBE6';
      tagBorder = '#FFE58F';
      tagColor = '#D48806';
      tagText = 'Chờ duyệt';
      tagIcon = <ClockCircleOutlined style={{ marginRight: 4, color: '#D48806' }} />;
    } else if (isApproved) {
      tagBg = '#F6FFED';
      tagBorder = '#B7EB8F';
      tagColor = '#389E0D';
      tagText = 'Đã duyệt';
      tagIcon = <CheckCircleOutlined style={{ marginRight: 4, color: '#389E0D' }} />;
    } else if (isRejected) {
      tagBg = '#FFF1F0';
      tagBorder = '#FFA39E';
      tagColor = '#CF1322';
      tagText = 'Từ chối';
      tagIcon = <CloseCircleOutlined style={{ marginRight: 4, color: '#CF1322' }} />;
    } else if (isCancelled) {
      tagBg = '#F5F5F5';
      tagBorder = '#D9D9D9';
      tagColor = '#8c8c8c';
      tagText = 'Đã hủy';
    }

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      return moment(dateStr).format('DD/MM/YYYY');
    };

    const matchedBorrow = borrowItems.find((b: any) => toId(b.borrow_record_item_id) === toId(renewal.borrow_record_item_id));
    const author = renewal.author || matchedBorrow?.author || 'Tác giả không rõ';
    const coverImage = matchedBorrow?.cover_image;

    return (
      <Card
        key={renewal.id}
        cover={
          <div style={{ height: 140, overflow: 'hidden', background: '#f5f5f5', borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
            {coverImage ? (
              <img
                src={coverImage}
                alt={renewal.document_title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
                Ảnh
              </div>
            )}
            {/* Status tag in top corner */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: tagBg,
                border: `1px solid ${tagBorder}`,
                color: tagColor,
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              {tagIcon}
              {tagText}
            </div>
          </div>
        }
        bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}
        style={{
          borderRadius: 8,
          border: '1px solid #e8e8e8',
          boxShadow: 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#262626', marginBottom: 4, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {renewal.document_title}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {author}
          </div>
          
          <div style={{ fontSize: '11px', color: '#8c8c8c', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ngày gửi:</span>
              <span style={{ color: '#262626' }}>{formatDate(renewal.request_date)}</span>
            </div>
            {renewal.status !== 'pending' && renewal.reviewed_at && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Xử lý:</span>
                <span style={{ color: '#262626' }}>{formatDate(renewal.reviewed_at)}</span>
              </div>
            )}
          </div>

          {renewal.reject_reason && (
            <div style={{ marginTop: 8, fontSize: '11px', color: '#ff4d4f', background: '#fff2f0', padding: '4px 8px', borderRadius: 4, width: '100%' }}>
              Lý do: {renewal.reject_reason}
            </div>
          )}
        </div>

        {isPending && (
          <div style={{ display: 'flex', gap: 12, marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
            <Button
              type="link"
              size="small"
              onClick={() => openEditRenewal(renewal)}
              style={{ padding: 0, fontSize: '12px', flex: 1, textAlign: 'center', color: '#1890ff' }}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Hủy yêu cầu gia hạn này?"
              onConfirm={() => cancelRenewal(renewal.id)}
              okText="Hủy"
              cancelText="Không"
            >
              <Button
                type="link"
                size="small"
                danger
                style={{ padding: 0, fontSize: '12px', flex: 1, textAlign: 'center' }}
              >
                Hủy
              </Button>
            </Popconfirm>
          </div>
        )}
      </Card>
    );
  };

  return (
    <PageContainer header={{ title: '' }}>
      <div style={{ marginBottom: 24, color: '#666', fontSize: 14 }}>
        Gửi yêu cầu gia hạn thời gian mượn sách
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: '100%' }}>
        <div>
          <Title level={4} style={{ marginBottom: 20 }}>Sách có thể gia hạn</Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {borrowItems.length > 0 ? borrowItems.map(renderBookCard) : (
              <div style={{ gridColumn: 'span 4' }}>
                <Empty description="Không có tài liệu để gia hạn" />
              </div>
            )}
          </div>
        </div>

        <div>
          <Title level={4} style={{ marginBottom: 20, marginTop: 12 }}>Lịch sử yêu cầu gia hạn</Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {filteredRenewals.length > 0 ? filteredRenewals.map(renderRenewalCard) : (
              <div style={{ gridColumn: 'span 4' }}>
                <Empty description="Chưa có yêu cầu gia hạn" />
              </div>
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
