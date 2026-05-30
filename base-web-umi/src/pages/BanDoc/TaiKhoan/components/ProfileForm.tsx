import React from 'react';
import { Form, Input, Select, Button, Row, Col, Tag } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { history } from 'umi';
import UploadFile from '@/components/Upload/UploadFile';
import MyDatePicker from '@/components/MyDatePicker';
import BorrowStatsCard from './BorrowStatsCard';

interface ProfileFormProps {
  form: any;
  displayName: string;
  email: string;
  roleName: string;
  borrowStats: { current: number; returned: number };
  loading: boolean;
  onFinish: (values: any) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  form,
  displayName,
  email,
  roleName,
  borrowStats,
  loading,
  onFinish,
}) => (
  <Form layout='vertical' form={form} onFinish={onFinish}>
    <div className='library-detail' style={{ alignItems: 'flex-start', gap: 32 }}>
      {/* Cột 1: Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 200 }}>
        <Form.Item name='avatar' style={{ marginBottom: 0 }}>
          <UploadFile isAvatar accept='image/*' buttonDescription='Đổi ảnh' maxFileSize={5} />
        </Form.Item>
      </div>

      {/* Cột 2: Thông tin */}
      <div className='library-detail-main'>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <h2 style={{ fontSize: 28, marginBottom: 4 }}>{displayName}</h2>
            <div className='library-detail-author' style={{ fontSize: 16, color: '#666', marginBottom: 12 }}>{email}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Tag className='library-status-tag neutral' style={{ fontSize: 13, padding: '4px 10px' }}>{roleName}</Tag>
              <Tag className='library-status-tag success' style={{ fontSize: 13, padding: '4px 10px' }}>Tài khoản cá nhân</Tag>
            </div>
          </div>
          <BorrowStatsCard current={borrowStats.current} returned={borrowStats.returned} />
        </div>

        {/* Form fields */}
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label='Họ và Tên' name='full_name' rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input size='large' placeholder='Nhập họ và tên' />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Giới tính' name='gender'>
              <Select size='large' placeholder='Chọn giới tính'>
                <Select.Option value='Nam'>Nam</Select.Option>
                <Select.Option value='Nữ'>Nữ</Select.Option>
                <Select.Option value='Khác'>Khác</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label='Ngày sinh' name='date_of_birth'>
              <MyDatePicker style={{ width: '100%', height: 40 }} placeholder='Chọn ngày sinh' format='DD/MM/YYYY' />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label='Số điện thoại' name='phone'>
              <Input size='large' placeholder='Nhập số điện thoại' />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label='Mã thẻ số' name='member_code'>
              <Input size='large' placeholder='LIB-2026-XXXX' disabled />
            </Form.Item>
          </Col>
        </Row>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40, borderTop: '1px solid #f0f0f0', paddingTop: 24, gap: 12 }}>
          <Button size='large' icon={<ArrowLeftOutlined />} onClick={() => history.goBack()}>Quay lại</Button>
          <Button size='large' type='primary' htmlType='submit' icon={<SaveOutlined />} loading={loading}>
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  </Form>
);

export default ProfileForm;
