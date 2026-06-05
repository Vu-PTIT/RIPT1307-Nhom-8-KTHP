import React, { useState } from 'react';
import { Select, Avatar, Button, Spin, Empty, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import { searchReaders } from '@/services/ThuThu';

const { Text } = Typography;
const { Option } = Select;

export interface ReaderInfo {
  id: string;
  username: string;
  email: string;
  max_books_allowed?: number;
  active_borrows_count?: number;
}

interface ReaderSelectorProps {
  selectedReader: ReaderInfo | null;
  onSelectReader: (reader: ReaderInfo | null) => void;
}

const ReaderSelector: React.FC<ReaderSelectorProps> = ({ selectedReader, onSelectReader }) => {
  const [readerKeyword, setReaderKeyword] = useState('');

  const { data: readersData, loading: searchingReader } = useRequest(
    () => searchReaders({ keyword: readerKeyword, page_size: 10 }),
    {
      refreshDeps: [readerKeyword],
      debounceInterval: 400,
      ready: readerKeyword.length >= 2,
      formatResult: (res) => res.data?.items || [],
    },
  );

  return (
    <div className='tt-checkout-section'>
      <div className='tt-section-title'>
        <UserOutlined /> Độc giả
      </div>
      {selectedReader ? (
        <div className='tt-reader-selected'>
          <Avatar className='tt-reader-avatar' size="large">
            {selectedReader.username.charAt(0).toUpperCase()}
          </Avatar>
          <div className='tt-reader-info' style={{ flex: 1 }}>
            <div className='name'>{selectedReader.username}</div>
            <div className='email'>{selectedReader.email}</div>
          </div>
          <Button size='small' type='text' danger onClick={() => onSelectReader(null)}>
            Đổi
          </Button>
        </div>
      ) : (
        <Select
          showSearch
          size='large'
          className='w-100'
          placeholder='Tìm kiếm theo tên hoặc email độc giả...'
          filterOption={false}
          onSearch={setReaderKeyword}
          loading={searchingReader}
          notFoundContent={
            readerKeyword.length < 2 ? (
              <Text type='secondary'>Nhập ít nhất 2 ký tự...</Text>
            ) : searchingReader ? (
              <Spin size='small' />
            ) : (
              <Empty description='Không tìm thấy' />
            )
          }
          onSelect={(_: string, opt: any) => {
            onSelectReader({ 
                id: opt.value, 
                username: opt.username, 
                email: opt.email,
                max_books_allowed: opt.max_books_allowed,
                active_borrows_count: opt.active_borrows_count
            });
            setReaderKeyword('');
          }}
        >
          {(readersData || []).map((r: any) => (
            <Option 
                key={String(r.id)} 
                value={String(r.id)} 
                username={r.username} 
                email={r.email}
                max_books_allowed={r.max_books_allowed}
                active_borrows_count={r.active_borrows_count}
            >
              <div>
                <span style={{ fontWeight: 500 }}>{r.username}</span>
                <Text type='secondary' style={{ marginLeft: 8, fontSize: 12 }}>
                  {r.email}
                </Text>
              </div>
            </Option>
          ))}
        </Select>
      )}
    </div>
  );
};

export default ReaderSelector;
