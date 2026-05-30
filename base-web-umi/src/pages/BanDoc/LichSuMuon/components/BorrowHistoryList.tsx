import React from 'react';
import { List, Tag } from 'antd';
import { history } from 'umi';

const statusClass = (status: string) => {
  const v = String(status || '').toLowerCase();
  if (v.includes('return') || v.includes('trả') || v.includes('done') || v.includes('completed')) return 'success';
  if (v.includes('over') || v.includes('late') || v.includes('quá') || v.includes('cancel')) return 'danger';
  if (v.includes('borrow') || v.includes('mượn') || v.includes('active') || v.includes('pending')) return 'warning';
  return 'neutral';
};

interface BorrowRecord {
  id: string;
  borrow_date?: string;
  due_date?: string;
  status?: string;
}

interface Props {
  items: BorrowRecord[];
  loading?: boolean;
}

const BorrowHistoryList: React.FC<Props> = ({ items, loading }) => (
  <List
    loading={loading}
    dataSource={items}
    pagination={items.length > 10 ? { pageSize: 10 } : false}
    renderItem={(it) => (
      <List.Item
        onClick={() => history.push(`/lich-su-muon/${it.id}`)}
        style={{ cursor: 'pointer' }}
      >
        <List.Item.Meta
          title={`Phiếu mượn ${it.id}`}
          description={`Ngày mượn: ${it.borrow_date || 'Không rõ'} | Hạn trả: ${it.due_date || 'Không rõ'}`}
        />
        <Tag className={`library-status-tag ${statusClass(it.status || '')}`}>
          {it.status || 'Đang cập nhật'}
        </Tag>
      </List.Item>
    )}
  />
);

export default BorrowHistoryList;
