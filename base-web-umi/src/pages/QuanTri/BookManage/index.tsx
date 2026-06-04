import React, { useState } from 'react';
import { message } from 'antd';
import { useRequest, history } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import BookTable from './components/BookTable';
import AddBookModal from '@/pages/ThuThu/BookWarehouseManage/components/AddBookModal';
import BookSearchBar from '@/pages/ThuThu/BookWarehouseManage/components/BookSearchBar';
import CategoryManageModal from './components/CategoryManageModal';
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

const BookManage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const { data: categoriesRes, refresh: refreshCategories } = useRequest(TaiLieuService.getCategories, {
    formatResult: (res) => res.data || [],
  });
  const categories: any[] = categoriesRes || [];

  const { data: docsRes, loading, refresh } = useRequest(
    () => TaiLieuService.searchDocuments({
      keyword: searchText || undefined,
      category_id: selectedCategory,
      page,
      page_size: pageSize,
    }),
    {
      refreshDeps: [page, pageSize, selectedCategory],
      formatResult: (res) => res.data || {},
    },
  );

  const rawItems: any[] = docsRes?.items || docsRes || [];
  const total: number = docsRes?.total || rawItems.length;

  const books = rawItems.map((doc: any) => ({
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

  const handleAddBook = async (values: any, coverFile?: File) => {
    setAddLoading(true);
    try {
      const res = await ThuThuService.createDocument(values);
      const createdDoc = res?.data?.data || res?.data || res;
      const docId = createdDoc?.id || createdDoc?._id;
      if (coverFile && docId) {
        await ThuThuService.uploadCover(docId, coverFile);
      }
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

  const handleDeleteBook = async (id: string, title: string) => {
    try {
      await ThuThuService.deleteDocument(id);
      message.success(`Đã xoá đầu sách "${title}"`);
      refresh();
    } catch (err: any) {
      message.error(getApiError(err, 'Xoá đầu sách thất bại!'));
    }
  };

  return (
    <PageSkeleton
      title='Quản lý sách'
      subtitle='Thêm, sửa, xóa đầu sách và xem danh sách dưới dạng bảng.'
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
          onManageCategory={() => setCategoryModalOpen(true)}
        />

        <BookTable
          books={books}
          loading={loading}
          total={total}
          page={page}
          pageSize={pageSize}
          onEdit={(record) => { /* Chỉnh sửa trong detail hoặc modal riêng. Ở đây ta dùng detail */ }}
          onDelete={handleDeleteBook}
          onDetail={(id) => history.push(`/quan-tri/sach/${id}`)}
          onPageChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />

        <AddBookModal
          open={addModalOpen}
          loading={addLoading}
          categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
          onOk={handleAddBook}
          onCancel={() => setAddModalOpen(false)}
        />

        <CategoryManageModal
          open={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          categories={categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))}
          onRefresh={() => {
            refreshCategories();
            refresh();
          }}
        />
      </div>
    </PageSkeleton>
  );
};

export default BookManage;
