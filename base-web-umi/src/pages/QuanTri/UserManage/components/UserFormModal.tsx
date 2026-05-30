import React from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { ERole } from '@/services/QuanTri/constant';

const { Option } = Select;

interface UserFormModalProps {
	open: boolean;
	editingUser: any | null;
	form: ReturnType<typeof Form.useForm>[0];
	submitting: boolean;
	onOk: () => void;
	onCancel: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
	open,
	editingUser,
	form,
	submitting,
	onOk,
	onCancel,
}) => (
	<Modal
		title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
		open={open}
		onOk={onOk}
		onCancel={onCancel}
		okText={editingUser ? 'Lưu thay đổi' : 'Tạo mới'}
		cancelText='Huỷ'
		confirmLoading={submitting}
		okButtonProps={{ style: { background: '#c90000', borderColor: '#c90000' } }}
		destroyOnClose
	>
		<Form form={form} layout='vertical' style={{ marginTop: 16 }}>
			<Form.Item
				label='Tên đăng nhập'
				name='username'
				rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
			>
				<Input placeholder='username' disabled={!!editingUser} />
			</Form.Item>

			{!editingUser && (
				<Form.Item
					label='Mật khẩu'
					name='password'
					rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
				>
					<Input.Password placeholder='Mật khẩu' />
				</Form.Item>
			)}

			<Form.Item
				label='Họ và tên'
				name='fullname'
				rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
			>
				<Input placeholder='Nguyễn Văn A' />
			</Form.Item>

			<Form.Item
				label='Email'
				name='email'
				rules={[
					{ required: true, message: 'Vui lòng nhập email!' },
					{ type: 'email', message: 'Email không hợp lệ!' },
				]}
			>
				<Input placeholder='example@email.com' />
			</Form.Item>

			<Form.Item
				label='Vai trò'
				name='role'
				rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
			>
				<Select placeholder='Chọn vai trò'>
					<Option value={ERole.ADMIN}>Quản trị</Option>
					<Option value={ERole.LIBRARIAN}>Thủ thư</Option>
					<Option value={ERole.MEMBER}>Độc giả</Option>
				</Select>
			</Form.Item>
		</Form>
	</Modal>
);

export default UserFormModal;
