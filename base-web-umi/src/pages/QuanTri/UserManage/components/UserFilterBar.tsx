import React from 'react';
import { Button, Input, Select } from 'antd';
import {
	UserAddOutlined, SearchOutlined, ReloadOutlined,
} from '@ant-design/icons';

const { Option } = Select;

interface UserFilterBarProps {
	onSearch: (keyword: string) => void;
	onClearSearch: () => void;
	onRoleChange: (v: string | undefined) => void;
	onStatusChange: (v: string | undefined) => void;
	onRefresh: () => void;
	onAddUser: () => void;
}

const UserFilterBar: React.FC<UserFilterBarProps> = ({
	onSearch,
	onClearSearch,
	onRoleChange,
	onStatusChange,
	onRefresh,
	onAddUser,
}) => (
	<div className='library-action-bar' style={{ marginBottom: 16 }}>
		<div className='library-action-left'>
			<Input
				prefix={<SearchOutlined />}
				placeholder='Tìm tên, email, username...'
				allowClear
				style={{ width: 260, borderRadius: 7 }}
				onPressEnter={(e) => onSearch((e.target as HTMLInputElement).value)}
				onChange={(e) => { if (!e.target.value) onClearSearch(); }}
			/>
			<Select
				allowClear
				placeholder='Lọc vai trò'
				style={{ width: 150 }}
				onChange={onRoleChange}
			>
				<Option value='admin'>Quản trị</Option>
				<Option value='librarian'>Thủ thư</Option>
				<Option value='member'>Độc giả</Option>
			</Select>
			<Select
				allowClear
				placeholder='Trạng thái'
				style={{ width: 150 }}
				onChange={onStatusChange}
			>
				<Option value='active'>Hoạt động</Option>
				<Option value='inactive'>Bị khoá</Option>
			</Select>
			<Button icon={<ReloadOutlined />} onClick={onRefresh} />
		</div>
		<div className='library-action-right'>
			<Button
			type='primary'
			icon={<UserAddOutlined />}
			onClick={onAddUser}
			className='btn-primary-danger'
		>
			Thêm người dùng
		</Button>

		</div>
	</div>
);

export default UserFilterBar;
