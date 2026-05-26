import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Typography, message } from 'antd';
import moment from 'moment';
import { getMyBorrows, getBorrowDetail, getMyRenewals } from '@/services/MuonSach';
import { CalendarOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

const LichSuMuonPage: React.FC = () => {
  const [borrows, setBorrows] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const toId = (value: any) => value?.toString?.() ?? value;

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.warning('Vui lòng đăng nhập để xem lịch sử mượn');
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
      message.error('Không thể tải lịch sử mượn trả');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

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

  const allBorrowItems = borrows.flatMap((record) =>
    (record.items || []).map((item: any) => {
      const itemId = toId(item.id);
      const borrowRecordItemId = item.borrow_record_item_id ?? itemId;
      return {
        ...item,
        id: itemId,
        borrow_record_item_id: borrowRecordItemId,
        borrow_record_id: record.id,
        borrow_date: record.borrow_date,
        due_date: record.due_date,
        return_date: item.return_date,
        status: item.status || record.status,
        hasPendingRenewal: pendingRenewalItemIds.has(borrowRecordItemId),
        renewalCount: renewalCountMap[borrowRecordItemId] || 0,
      };
    }),
  );

  const currentBorrowedItems = allBorrowItems.filter((item) => item.return_date == null && item.status !== 'returned');
  const returnedHistoryItems = allBorrowItems.filter((item) => item.return_date != null || item.status === 'returned');

  const renderBorrowedBookCard = (item: any) => {
    const borrowDate = item.borrow_date ? moment(item.borrow_date) : null;
    const dueDate = item.due_date ? moment(item.due_date) : null;
    const isOverdue = dueDate && dueDate.isBefore(moment(), 'day');
    const overdueDays = isOverdue ? moment().diff(dueDate, 'days') : 0;
    
    const borrowLabel = borrowDate ? borrowDate.format('DD/MM/YYYY') : '-';
    const dueLabel = dueDate ? dueDate.format('DD/MM/YYYY') : '-';

    const isPending = item.hasPendingRenewal;
    const isActuallyOverdue = isOverdue || item.status === 'overdue';
    
    const tagText = isActuallyOverdue ? 'Quá hạn' : 'Đang mượn';
    const tagBg = isActuallyOverdue ? '#FFF1F0' : '#F6FFED';
    const tagBorder = isActuallyOverdue ? '#FFA39E' : '#B7EB8F';
    const tagColor = isActuallyOverdue ? '#CF1322' : '#389E0D';

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
            {/* Status tag */}
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
              {tagText}
            </div>
          </div>
        }
        bodyStyle={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}
        style={{
          borderRadius: 8,
          border: isActuallyOverdue ? '1px solid #FFA39E' : '1px solid #e8e8e8',
          background: isActuallyOverdue ? '#FFFDFD' : '#fff',
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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12px', color: '#8c8c8c', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: 2 }}>Ngày mượn</div>
              <div style={{ fontSize: '13px', color: '#262626', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarOutlined style={{ color: '#8c8c8c' }} />
                {borrowLabel}
              </div>
              {isActuallyOverdue && (
                <div style={{ fontSize: '11px', color: '#ff4d4f', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <InfoCircleOutlined />
                  Quá hạn {overdueDays} ngày
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#8c8c8c', marginBottom: 2 }}>Hạn trả</div>
              <div style={{ fontSize: '13px', color: isActuallyOverdue ? '#ff4d4f' : '#262626', display: 'flex', alignItems: 'center', gap: 6, fontWeight: isActuallyOverdue ? 600 : 400 }}>
                <CalendarOutlined style={{ color: isActuallyOverdue ? '#ff4d4f' : '#8c8c8c' }} />
                {dueLabel}
              </div>
            </div>
          </div>

          {item.renewalCount > 0 && (
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: isPending ? 8 : 0 }}>
              Đã gia hạn: {item.renewalCount} lần
            </div>
          )}
        </div>

        {isPending && (
          <div
            style={{
              backgroundColor: '#FFFBE6',
              border: '1px solid #FFE58F',
              borderRadius: '4px',
              padding: '6px 10px',
              fontSize: '12px',
              color: '#D48806',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
            }}
          >
            Yêu cầu gia hạn đang chờ duyệt
          </div>
        )}
      </Card>
    );
  };

  const renderReturnedBookCard = (item: any) => {
    const borrowDate = item.borrow_date ? moment(item.borrow_date) : null;
    const returnDate = item.return_date ? moment(item.return_date) : null;
    const dueDate = item.due_date ? moment(item.due_date) : null;
    
    const borrowLabel = borrowDate ? borrowDate.format('DD/MM/YYYY') : '-';
    const returnLabel = returnDate ? returnDate.format('DD/MM/YYYY') : '-';
    const dueLabel = dueDate ? dueDate.format('DD/MM/YYYY') : '-';

    return (
      <Card
        key={item.id}
        cover={
          <div style={{ height: 140, overflow: 'hidden', background: '#f5f5f5', borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
            {item.cover_image ? (
              <img
                src={item.cover_image}
                alt={item.document_title || 'Bìa sách'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
                Ảnh
              </div>
            )}
            {/* Status tag */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#F6FFED',
                border: '1px solid #B7EB8F',
                color: '#389E0D',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 500,
              }}
            >
              Đã trả
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
            {item.document_title}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.author || 'Tác giả không rõ'}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '11px', color: '#8c8c8c' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ngày mượn:</span>
              <span style={{ color: '#262626' }}>{borrowLabel}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Hạn trả:</span>
              <span style={{ color: '#262626' }}>{dueLabel}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ngày trả:</span>
              <span style={{ color: '#389E0D', fontWeight: 500 }}>{returnLabel}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderEmptyHistory = () => (
    <div
      style={{
        gridColumn: 'span 4',
        padding: '40px 24px',
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#8c8c8c',
        fontSize: '14px',
      }}
    >
      Chưa có lịch sử mượn trả
    </div>
  );

  const renderEmptyBorrowed = () => (
    <div
      style={{
        gridColumn: 'span 4',
        padding: '40px 24px',
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#8c8c8c',
        fontSize: '14px',
      }}
    >
      Không có sách đang mượn
    </div>
  );

  return (
    <PageContainer header={{ title: '' }} loading={loading}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
          Quản lý mượn trả
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Theo dõi trạng thái sách đang mượn và lịch sử mượn trả
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: '100%' }}>
        {/* Books currently borrowed */}
        <div>
          <Title level={4} style={{ marginBottom: 20 }}>Sách đang mượn</Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {currentBorrowedItems.length > 0 ? (
              currentBorrowedItems.map(renderBorrowedBookCard)
            ) : (
              renderEmptyBorrowed()
            )}
          </div>
        </div>

        {/* Borrow-return history */}
        <div>
          <Title level={4} style={{ marginBottom: 20, marginTop: 12 }}>Lịch sử mượn trả</Title>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {returnedHistoryItems.length > 0 ? (
              returnedHistoryItems.map(renderReturnedBookCard)
            ) : (
              renderEmptyHistory()
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default LichSuMuonPage;
