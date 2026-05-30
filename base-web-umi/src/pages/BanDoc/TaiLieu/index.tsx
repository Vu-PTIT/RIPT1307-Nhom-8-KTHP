import React, { useState } from 'react';
import { message, Empty, Pagination, Row, Col } from 'antd';
import { history, useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import * as TaiLieuService from '@/services/TaiLieu';
import * as MuonSach from '@/services/MuonSach';
import DocumentCard from '@/components/DocumentCard';
import DocumentSearchBar from './components/DocumentSearchBar';
import { getApiError } from '@/utils/getApiError';

export default function DocumentsPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: categoriesRes } = useRequest(TaiLieuService.getCategories, {
    formatResult: (res) => res.data || [],
  });
  const categories: any[] = categoriesRes || [];

  const { data: docsRes, loading, refresh } = useRequest(
    () => TaiLieuService.searchDocuments({ keyword, page, page_size: pageSize, category_id: selectedCategory }),
    {
      refreshDeps: [keyword, page, pageSize, selectedCategory],
      formatResult: (res) => res.data || {},
    },
  );

  const items: any[] = docsRes?.items || docsRes || [];
  const total: number = docsRes?.total || docsRes?.count || items.length;
  const availableOnPage = items.reduce((sum, it) => sum + Number(it.available_copies || 0), 0);

  const handleAddToWishlist = async (doc: any) => {
    try {
      await MuonSach.addToWishlist(doc.id);
      message.success('Đã thêm vào danh sách yêu thích');
    } catch (e: any) {
      message.error(getApiError(e, 'Không thêm được vào danh sách yêu thích'));
    }
  };

  const handleAddToCart = async (doc: any) => {
    try {
      await MuonSach.addToCart(doc.id);
      message.success('Đã thêm vào giỏ mượn');
    } catch (e: any) {
      message.error(getApiError(e, 'Không thêm được vào giỏ mượn'));
    }
  };

  return (
    <PageSkeleton title='Danh sách tài liệu'>
      <div className='library-panel'>
        <DocumentSearchBar
          keyword={keyword}
          total={total}
          availableOnPage={availableOnPage}
          categoriesCount={categories.length}
          categories={categories}
          selectedCategory={selectedCategory}
          onSearch={(val) => { setKeyword(val); setPage(1); }}
          onCategoryChange={(val) => { setSelectedCategory(val); setPage(1); }}
        />

        {items.length === 0 ? (
          <div className='library-empty-state'>
            <Empty description={loading ? 'Đang tải tài liệu' : 'Không có tài liệu phù hợp'} />
          </div>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {items.map((it: any) => (
                <Col xs={24} sm={12} md={12} lg={8} xl={6} key={it.id || it.document_id}>
                  <DocumentCard
                    item={it}
                    onDetail={(id) => history.push(`/ban-doc/tai-lieu/${id}`)}
                    onWishlist={handleAddToWishlist}
                    onCart={handleAddToCart}
                    accent
                  />
                </Col>
              ))}
            </Row>
            <div className='library-pagination'>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
              />
            </div>
          </>
        )}
      </div>
    </PageSkeleton>
  );
}
