import React from 'react';
import { Input, Select, Row, Col, Button } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

interface Category {
  id: string;
  name: string;
}

interface BookSearchBarProps {
  searchText: string;
  selectedCategory?: string;
  categories: Category[];
  onSearch: (value: string) => void;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string | undefined) => void;
  onAddBook: () => void;
  onManageCategory?: () => void;
}

const BookSearchBar: React.FC<BookSearchBarProps> = ({
  searchText,
  selectedCategory,
  categories,
  onSearch,
  onSearchChange,
  onCategoryChange,
  onAddBook,
  onManageCategory,
}) => (
  <div className='library-action-bar' style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
    <div className='library-action-left' style={{ flex: 1, display: 'flex', gap: 16 }}>
      <Input.Search
        size='large'
        placeholder='Tìm kiếm theo tên sách, tác giả, ISBN...'
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        onSearch={onSearch}
        enterButton
        style={{ maxWidth: 480 }}
      />
      <Select
        size='large'
        allowClear
        placeholder='Tất cả danh mục'
        style={{ width: 200 }}
        onChange={onCategoryChange}
        value={selectedCategory}
      >
        {categories.map((c) => (
          <Option key={c.id} value={c.id}>{c.name}</Option>
        ))}
      </Select>
    </div>
    <div className='library-action-right' style={{ display: 'flex', gap: 8 }}>
      {onManageCategory && (
        <Button
          size='large'
          onClick={onManageCategory}
        >
          Quản lý danh mục
        </Button>
      )}
      <Button
        type='primary'
        icon={<PlusOutlined />}
        size='large'
        className='btn-primary-danger'
        onClick={onAddBook}
      >
        Thêm đầu sách
      </Button>
    </div>
  </div>
);

export default BookSearchBar;
