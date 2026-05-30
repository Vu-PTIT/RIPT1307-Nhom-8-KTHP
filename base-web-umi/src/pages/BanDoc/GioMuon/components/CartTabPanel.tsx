import React from 'react';
import { List, Button, Empty, Avatar, Tag } from 'antd';
import { DeleteOutlined, BookOutlined, ShoppingCartOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ipLibrary } from '@/utils/ip';

interface CartItem {
  id: string;
  document_id?: string;
  title?: string;
  document_title?: string;
  author?: string;
  document_author?: string;
  cover_image?: string;
  available_copies?: number;
}

interface CartTabPanelProps {
  items: CartItem[];
  loading: boolean;
  checkoutLoading: boolean;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const CartTabPanel: React.FC<CartTabPanelProps> = ({ items, loading, checkoutLoading, onRemove, onCheckout }) => (
  <div>
    {items.length === 0 ? (
      <div className='library-empty-state'>
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 54, color: '#bfbfbf' }} />}
          description='Giỏ mượn trống — Tìm sách và thêm vào giỏ từ trang Tài liệu'
        />
      </div>
    ) : (
      <>
        <div className='library-action-bar checkout-bar'>
          <div className='library-action-left'>
            <div className='library-count-badge'>{items.length} cuốn</div>
          </div>
          <div className='library-action-right'>
            <Button
              type='primary'
              icon={<CheckCircleOutlined />}
              size='large'
              loading={checkoutLoading}
              onClick={onCheckout}
            >
              Gửi yêu cầu mượn ({items.length})
            </Button>
          </div>
        </div>

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
              const available = it.available_copies ?? 1;
              return (
                <List.Item
                  actions={[
                    <Button key='del' type='text' danger icon={<DeleteOutlined />} onClick={() => onRemove(it.id)}>
                      Xoá
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
                        <Tag className={`library-status-tag ${available > 0 ? 'success' : 'danger'}`} style={{ marginLeft: 8 }}>
                          {available > 0 ? `Còn ${available} bản` : 'Hết sách'}
                        </Tag>
                      </>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </>
    )}
  </div>
);

export default CartTabPanel;
