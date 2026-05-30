import React from 'react';
import { Empty, Alert, Button, message, Row, Col } from 'antd';
import { HeartOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { history, useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as MuonSach from '@/services/MuonSach';
import DocumentCard from '@/components/DocumentCard';
import { getApiError } from '@/utils/getApiError';

export default function WishlistPage() {
  const { data: items = [], loading, refresh, error } = useRequest(MuonSach.getMyWishlist, {
    formatResult: (res) => res.data?.items || res.data || [],
  });

  const handleRemove = async (id: string) => {
    try {
      await MuonSach.removeFromWishlist(id);
      refresh();
    } catch (e: any) {
      message.error(getApiError(e, 'Xoá thất bại'));
    }
  };

  const handleMoveToCart = async (item: any) => {
    try {
      await MuonSach.addToCart(item.document_id);
      message.success('Đã chuyển sang giỏ mượn');
      refresh();
    } catch (e: any) {
      message.error(getApiError(e, 'Chuyển sang giỏ mượn thất bại'));
    }
  };

  return (
    <PageSkeleton title='Danh sách yêu thích'>
      <div className='library-panel'>
        {error && <Alert type='error' message='Không tải được danh sách yêu thích' style={{ marginBottom: 12 }} />}
        <div className='library-action-bar'>
          <div className='library-action-left'>
            <div className='library-stat'>
              <HeartOutlined />
              <div>
                <span>Sách đã lưu</span>
                <strong>{items.length}</strong>
              </div>
            </div>
          </div>
          <div className='library-action-right'>
            <Button icon={<SearchOutlined />} onClick={() => history.push('/ban-doc/tai-lieu')}>
              Tra cứu thêm
            </Button>
          </div>
        </div>
        {items.length === 0 ? (
          <div className='library-empty-state'>
            <Empty description='Chưa có sách yêu thích' />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {items.map((it: any) => (
              <Col xs={24} sm={12} md={12} lg={8} xl={6} key={it.id}>
                <DocumentCard
                  item={it}
                  onDetail={() => history.push(`/ban-doc/tai-lieu/${it.document_id}`)}
                  onWishlist={() => {}}
                  onCart={() => handleMoveToCart(it)}
                  accent
                  actions={[
                    <Button key='add' type='primary' icon={<ShoppingCartOutlined />} onClick={() => handleMoveToCart(it)}>
                      Đưa vào giỏ
                    </Button>,
                    <Button key='del' danger onClick={() => handleRemove(it.id)}>Xóa</Button>,
                  ]}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </PageSkeleton>
  );
}
