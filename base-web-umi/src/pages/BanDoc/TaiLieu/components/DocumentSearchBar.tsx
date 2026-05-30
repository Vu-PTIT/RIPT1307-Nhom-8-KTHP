import React from 'react';
import { Input, Select } from 'antd';
import { BookOutlined, CheckCircleOutlined, TagsOutlined } from '@ant-design/icons';

const { Search } = Input;

interface Category {
  id?: string;
  category_id?: string;
  name?: string;
  category_name?: string;
}

interface DocumentSearchBarProps {
  keyword: string;
  total: number;
  availableOnPage: number;
  categoriesCount: number;
  categories: Category[];
  selectedCategory?: string;
  onSearch: (val: string) => void;
  onCategoryChange: (val: string | undefined) => void;
}

const DocumentSearchBar: React.FC<DocumentSearchBarProps> = ({
  keyword,
  total,
  availableOnPage,
  categoriesCount,
  categories,
  selectedCategory,
  onSearch,
  onCategoryChange,
}) => (
  <>
    <div className='library-summary-strip'>
      <div className='library-stat'>
        <BookOutlined />
        <div><span>Tổng đầu sách</span><strong>{total}</strong></div>
      </div>
      <div className='library-stat'>
        <CheckCircleOutlined />
        <div><span>Bản sẵn sàng trên trang</span><strong>{availableOnPage}</strong></div>
      </div>
      <div className='library-stat'>
        <TagsOutlined />
        <div><span>Danh mục</span><strong>{categoriesCount}</strong></div>
      </div>
    </div>
    <div className='library-toolbar'>
      <Search placeholder='Tìm theo tiêu đề, tác giả, ISBN...' enterButton onSearch={onSearch} />
      <Select
        allowClear
        placeholder='Tất cả danh mục'
        style={{ width: '100%' }}
        onChange={onCategoryChange}
        value={selectedCategory}
      >
        {categories.map((c) => (
          <Select.Option key={c.id || c.category_id} value={c.id || c.category_id}>
            {c.name || c.category_name}
          </Select.Option>
        ))}
      </Select>
      <div className='library-count-badge'>{total} tài liệu</div>
    </div>
  </>
);

export default DocumentSearchBar;
