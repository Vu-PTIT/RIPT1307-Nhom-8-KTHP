import React, { useState } from 'react';
import { Form, message } from 'antd';
import { useRequest } from 'umi';
import PageSkeleton from '@/components/PageSkeleton';
import {
	listUsers, createUser, updateUser, toggleUserActive, deleteUser,
} from '@/services/QuanTri';
import UserFilterBar from './components/UserFilterBar';
import UserTable from './components/UserTable';
import UserFormModal from './components/UserFormModal';

interface ListParams {
	keyword?: string;
	role_id?: string;
	is_active?: boolean;
	page: number;
	page_size: number;
}

const UserManage: React.FC = () => {
	const [form] = Form.useForm();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingUser, setEditingUser] = useState<any>(null);
	const [submitting, setSubmitting] = useState(false);
	const [params, setParams] = useState<ListParams>({ page: 1, page_size: 15 });

	const { data: usersRes, loading, refresh } = useRequest(
		() => listUsers(params),
		{
			refreshDeps: [params],
			formatResult: (res) => res.data || res,
		},
	);

	const users: any[] = usersRes?.items || usersRes?.data || usersRes || [];
	const total: number = usersRes?.total || users.length;

	// ── Modal helpers ──────────────────────────────────────────────────
	const openCreate = () => {
		setEditingUser(null);
		form.resetFields();
		setModalVisible(true);
	};

	const openEdit = (record: any) => {
		setEditingUser(record);
		form.setFieldsValue({
			username: record.username,
			fullname: record.fullname,
			email: record.email,
			role: record.role,
		});
		setModalVisible(true);
	};

	// ── API handlers ───────────────────────────────────────────────────
	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			setSubmitting(true);
			if (editingUser) {
				await updateUser(editingUser.id, values);
				message.success('Cập nhật người dùng thành công!');
			} else {
				await createUser(values);
				message.success('Tạo người dùng thành công!');
			}
			setModalVisible(false);
			refresh();
		} catch (err: any) {
			const detail = err?.response?.data?.detail || 'Có lỗi xảy ra!';
			if (typeof detail === 'string') message.error(detail);
		} finally {
			setSubmitting(false);
		}
	};

	const handleToggle = async (id: string) => {
		try {
			await toggleUserActive(id);
			message.success('Đã cập nhật trạng thái người dùng!');
			refresh();
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Có lỗi xảy ra!');
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteUser(id);
			message.success('Đã xoá người dùng!');
			refresh();
		} catch (err: any) {
			message.error(err?.response?.data?.detail || 'Có lỗi xảy ra!');
		}
	};

	const updateParam = (patch: Partial<ListParams>) =>
		setParams((p) => ({ ...p, ...patch, page: 1 }));

	return (
		<PageSkeleton
			title='Quản lý người dùng'
			subtitle='Tạo, chỉnh sửa, khoá tài khoản và phân quyền người dùng trong hệ thống.'
		>
			<div className='library-panel'>
				<UserFilterBar
					onSearch={(kw) => updateParam({ keyword: kw })}
					onClearSearch={() => updateParam({ keyword: undefined })}
					onRoleChange={(v) => updateParam({ role_id: v })}
					onStatusChange={(v) =>
						updateParam({ is_active: v === undefined ? undefined : v === 'active' })
					}
					onRefresh={refresh}
					onAddUser={openCreate}
				/>

				<UserTable
					users={users}
					loading={loading}
					total={total}
					page={params.page}
					pageSize={params.page_size}
					onEdit={openEdit}
					onToggle={handleToggle}
					onDelete={handleDelete}
					onPageChange={(page, page_size) => setParams((p) => ({ ...p, page, page_size }))}
				/>
			</div>

			<UserFormModal
				open={modalVisible}
				editingUser={editingUser}
				form={form}
				submitting={submitting}
				onOk={handleSubmit}
				onCancel={() => setModalVisible(false)}
			/>
		</PageSkeleton>
	);
};

export default UserManage;
