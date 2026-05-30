import React from 'react';
import { Modal, Form, Input, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

interface Category {
  id: string;
  name: string;
}

interface AddBookModalProps {
  open: boolean;
  loading: boolean;
  categories: Category[];
  onOk: (values: any) => void;
  onCancel: () => void;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ open, loading, categories, onOk, onCancel }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    await onOk(values);
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={<><PlusOutlined style={{ marginRight: 8 }} />Thêm đầu sách mới</>}
      visible={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okText='Thêm đầu sách'
      cancelText='Hủy'
      confirmLoading={loading}
      okButtonProps={{ className: 'btn-primary-danger' }}
      width={600}
    >
      <Form form={form} layout='vertical' style={{ marginTop: 16 }}>
        <Form.Item name='title' label='Tên sách' rules={[{ required: true, message: 'Vui lòng nhập tên sách!' }]}>
          <Input size='large' placeholder='Nhập tên đầu sách...' />
        </Form.Item>
        <Form.Item name='author' label='Tác giả' rules={[{ required: true, message: 'Vui lòng nhập tác giả!' }]}>
          <Input size='large' placeholder='Nhập tên tác giả...' />
        </Form.Item>
        <Form.Item name='isbn' label='ISBN'>
          <Input size='large' placeholder='Ví dụ: 978-0-13-468599-1' />
        </Form.Item>
        <Form.Item name='category_id' label='Danh mục' rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}>
          <Select size='large' placeholder='Chọn danh mục'>
            {categories.map((c) => (
              <Option key={c.id} value={c.id}>{c.name}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name='description' label='Mô tả'>
          <Input.TextArea rows={3} placeholder='Mô tả nội dung sách...' />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddBookModal;
