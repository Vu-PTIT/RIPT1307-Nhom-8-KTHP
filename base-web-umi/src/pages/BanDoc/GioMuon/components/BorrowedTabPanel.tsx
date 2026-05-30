import React from 'react';
import { List, Button, Empty, Tag, Avatar, Tooltip } from 'antd';
import { BookOutlined, RetweetOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { ipLibrary } from '@/utils/ip';

interface BorrowedBook {
  id: string;
  borrow_id?: string;
  document_id?: string;
  document_title?: string;
  title?: string;
  document_author?: string;
  author?: string;
  cover_image?: string;
  due_date?: string;
  status?: string;
  renewal_count?: number;
}

interface Props {
  items: BorrowedBook[];
  loading: boolean;
  onRenew?: (id: string) => void;
}

const statusClass = (status?: string) => {
  const v = String(status || '').toLowerCase();
  if (v.includes('return') || v.includes('done') || v.includes('completed')) return 'success';
  if (v.includes('over') || v.includes('late') || v.includes('cancel')) return 'danger';
  if (v.includes('pending')) return 'warning';
  return 'neutral';
};

const statusLabel = (status?: string) => {
  const v = String(status || '').toLowerCase();
  if (v.includes('return') || v.includes('done')) return 'Đã trả';
  if (v.includes('over') || v.includes('late')) return 'Quá hạn';
  if (v.includes('pending')) return 'Chờ xử lý';
  if (v.includes('borrow') || v.includes('active')) return 'Đang mượn';
  return status || 'Đang cập nhật';
};

const BorrowedTabPanel: React.FC<Props> = ({ items, loading, onRenew }) => (
  <div>
    {items.length === 0 ? (
      <div className='library-empty-state'>
        <Empty
          image={<BookOutlined style={{ fontSize: 54, color: '#bfbfbf' }} />}
          description='Hiện chưa có sách nào đang mượn'
        />
      </div>
    ) : (
      <div className='library-list-card'>
        <List
          loading={loading}
          dataSource={items}
          renderItem={(it) => {
            const coverSrc = it.cover_image
              ? `${ipLibrary}/documents/covers/${it.cover_image}`
              : undefined;
            const title = it.document_title || it.title || 'Không rõ tiêu đề';
            const author = it.document_author || it.author || 'Không rõ tác giả';
            const renewDisabled = (it.renewal_count || 0) >= 2;
            return (
              <List.Item
                className='borrowed-now-item'
                actions={[
                  <Tooltip key='renew' title={renewDisabled ? 'Đã đạt tối đa 2 lần gia hạn' : 'Gửi yêu cầu gia hạn'}>
                    <Button
                      icon={<RetweetOutlined />}
                      size='small'
                      disabled={renewDisabled}
                      onClick={() => onRenew?.(it.id)}
                    >
                      Gia hạn
                    </Button>
                  </Tooltip>,
                  <Button key='detail' size='small' onClick={() => history.push(`/ban-doc/lich-su-muon/${it.borrow_id || it.id}`)}>
                    Chi tiết
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    coverSrc ? (
                      <img src={coverSrc} alt={title} style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <Avatar size={44} shape='square' icon={<BookOutlined />} />
                    )
                  }
                  title={title}
                  description={
                    <>
                      <span style={{ fontSize: 13 }}>{author}</span>
                      <Tag className={`library-status-tag ${statusClass(it.status)}`} style={{ marginLeft: 8 }}>
                        {statusLabel(it.status)}
                      </Tag>
                      {it.due_date && (
                        <span style={{ marginLeft: 8, fontSize: 13, color: '#8c8c8c' }}>Hạn trả: {it.due_date}</span>
                      )}
                    </>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>
    )}
  </div>
);

export default BorrowedTabPanel;
