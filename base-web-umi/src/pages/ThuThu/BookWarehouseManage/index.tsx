import React, { useState } from 'react';
import { Row, Col, Empty, Spin, Pagination, message } from 'antd';
import { useRequest, history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import BookCard, { BookData } from './components/BookCard';
import AddBookModal from './components/AddBookModal';
import BookSearchBar from './components/BookSearchBar';
import * as TaiLieuService from '@/services/TaiLieu';
import * as ThuThuService from '@/services/ThuThu';
import { ipLibrary } from '@/utils/ip';
import getCoverForTitle from '@/utils/coverMap';
import { getApiError } from '@/utils/getApiError';

const OBJ_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const buildImageUrl = (doc: any): string => {
  const mapped = getCoverForTitle(doc.title);
  let cover = doc.cover_image || mapped || '/default-cover.png';
  if (typeof cover === 'string' && OBJ_ID_REGEX.test(cover)) {
    return `${ipLibrary}/documents/covers/${cover}`;
  }
  return cover;
};

const PAGE_SIZE = 12;

const BookWarehouseManage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const { data: categoriesRes } = useRequest(TaiLieuService.getCategories, {
    formatResult: (res) => res.data || [],
  });
  const categories: any[] = categoriesRes || [];

  const { data: docsRes, loading, refresh } = useRequest(
    () => TaiLieuService.searchDocuments({
      keyword: searchText || undefined,
      category_id: selectedCategory,
      page,
      page_size: PAGE_SIZE,
    }),
    {
      refreshDeps: [page, selectedCategory],
      formatResult: (res) => res.data || {},
    },
  );

  const rawItems: any[] = docsRes?.items || docsRes || [];
  const total: number = docsRes?.total || rawItems.length;

  const books: BookData[] = rawItems.map((doc: any) => ({
    id: doc.id || doc._id,
    title: doc.title,
    author: doc.author,
    category: doc.category_name || 'Không có danh mục',
    category_id: doc.category_id,
    availableCount: doc.available_copies ?? 0,
    totalCount: doc.total_copies ?? 0,
    image: buildImageUrl(doc),
    isbn: doc.isbn,
    description: doc.description,
  }));

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPage(1);
    refresh();
  };

  const handleAddBook = async (values: any) => {
    setAddLoading(true);
    try {
      await ThuThuService.createDocument(values);
      message.success(`Đã thêm đầu sách "${values.title}" thành công!`);
      setAddModalOpen(false);
      setPage(1);
      refresh();
    } catch (err: any) {
      message.error(getApiError(err, 'Thêm đầu sách thất bại!'));
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <PageSkeleton
      title='Quản lý kho sách'
      subtitle={`${total} đầu sách · Thủ thư có thể thêm, sửa, xóa và quản lý bản sao`}
    >
      <div className='library-panel'>
        <BookSearchBar
          searchText={searchText}
          selectedCategory={selectedCategory}
          categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
          onSearch={handleSearch}
          onSearchChange={setSearchText}
          onCategoryChange={(v) => { setSelectedCategory(v); setPage(1); }}
          onAddBook={() => setAddModalOpen(true)}
        />

        <Spin spinning={loading}>
          {books.length === 0 && !loading ? (
            <div className='library-empty-state'>
              <Empty description='Không có tài liệu phù hợp' />
            </div>
          ) : (
            <Row gutter={[20, 20]}>
              {books.map((book) => (
                <Col xs={24} sm={12} md={8} lg={8} xl={6} key={book.id}>
                  <BookCard
                    book={book}
                    categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
                    onDetail={(id) => history.push(`/thu-thu/kho-sach/${id}`)}
                    onRefresh={refresh}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Spin>

        {total > PAGE_SIZE && (
          <div className='library-pagination'>
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={(p) => setPage(p)}
            />
          </div>
        )}

        <AddBookModal
          open={addModalOpen}
          loading={addLoading}
          categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
          onOk={handleAddBook}
          onCancel={() => setAddModalOpen(false)}
        />
      </div>
    </PageSkeleton>
  );
};

export default BookWarehouseManage;
