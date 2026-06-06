import React, { useState } from 'react';
import { Modal, Table, Button, Input, Space, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { createCategory, updateCategory, deleteCategory } from '@/services/ThuThu';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryManageModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onRefresh: () => void;
}

const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  open, onClose, categories, onRefresh
}) => {
  const [editingId, setEditingId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [addSlug, setAddSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const resetEdit = () => {
    setEditingId('');
    setEditName('');
    setEditSlug('');
  };

  const resetAdd = () => {
    setIsAdding(false);
    setAddName('');
    setAddSlug('');
  };

  const handleEdit = (record: Category) => {
    setEditingId(record.id);
    setEditName(record.name);
    setEditSlug(record.slug || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      message.error('Tên danh mục không được để trống');
      return;
    }
    setLoading(true);
    try {
      await updateCategory(id, { name: editName, slug: editSlug });
      message.success('Cập nhật danh mục thành công');
      resetEdit();
      onRefresh();
    } catch (error: any) {
      message.error('Lỗi khi cập nhật danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteCategory(id);
      message.success('Xoá danh mục thành công');
      onRefresh();
    } catch (error: any) {
      message.error('Không thể xoá danh mục đã có sách');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addName.trim() || !addSlug.trim()) {
      message.error('Vui lòng nhập tên và slug danh mục');
      return;
    }
    setLoading(true);
    try {
      await createCategory({ name: addName, slug: addSlug });
      message.success('Thêm danh mục thành công');
      resetAdd();
      onRefresh();
    } catch (error: any) {
      message.error('Lỗi khi thêm danh mục, có thể slug đã tồn tại');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Category) => {
        if (editingId === record.id) {
          return <Input value={editName} onChange={(e) => setEditName(e.target.value)} />;
        }
        return text;
      }
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (text: string, record: Category) => {
        if (editingId === record.id) {
          return <Input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />;
        }
        return text;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_: any, record: Category) => {
        if (editingId === record.id) {
          return (
            <Space>
              <Button type="link" icon={<SaveOutlined />} onClick={() => handleSaveEdit(record.id)} loading={loading} />
              <Button type="link" danger icon={<CloseOutlined />} onClick={resetEdit} />
            </Space>
          );
        }
        return (
          <Space>
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm title="Xác nhận xoá?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  const responsiveColumns = columns.map(col => ({
    ...col,
    onCell: (record: any) => ({
      'data-label': col.title,
      ...(col.onCell ? col.onCell(record) : {})
    })
  }));

  return (
    <Modal
      title="Quản lý danh mục"
      visible={open}
      onCancel={() => {
        resetAdd();
        resetEdit();
        onClose();
      }}
      footer={null}
      width={700}
    >
      <div style={{ marginBottom: 16 }}>
        {!isAdding ? (
          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setIsAdding(true)}>
            Thêm danh mục mới
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder="Tên danh mục" value={addName} onChange={e => setAddName(e.target.value)} />
            <Input placeholder="Slug (vd: van-hoc)" value={addSlug} onChange={e => setAddSlug(e.target.value)} />
            <Button type="primary" onClick={handleAdd} loading={loading}>Lưu</Button>
            <Button onClick={resetAdd}>Huỷ</Button>
          </div>
        )}
      </div>
      <Table 
        className="library-responsive-table"
        dataSource={categories} 
        columns={responsiveColumns} 
        rowKey="id" 
        pagination={false} 
      />
    </Modal>
  );
};

export default CategoryManageModal;
