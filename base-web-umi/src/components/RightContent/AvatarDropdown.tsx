import React from 'react';
import { Avatar, Dropdown, Menu } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { history, useModel } from 'umi';

type Props = {
	menu?: boolean;
};

const AvatarDropdown: React.FC<Props> = ({ menu = false }) => {
	const { initialState } = useModel('@@initialState');
	const user: any = initialState?.currentUser;

	const handleLogout = () => {
		try {
			// best-effort: clear auth tokens used by the app
			localStorage.removeItem('umi_token');
			sessionStorage.clear();
		} catch (e) {
			// ignore
		}
		history.push('/user/login');
		window.location.reload();
	};

	const menuOverlay = (
		<Menu>
			<Menu.Item key='profile' onClick={() => history.push('/tai-khoan')}>
				<UserOutlined />
				&nbsp;Thông tin
			</Menu.Item>
			<Menu.Divider />
			<Menu.Item key='logout' onClick={handleLogout}>
				<LogoutOutlined />
				&nbsp;Đăng xuất
			</Menu.Item>
		</Menu>
	);

	const avatar = (
		<span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
			<Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
			<span style={{ marginLeft: 8 }}>{user?.name || user?.fullname || user?.username || 'Người dùng'}</span>
		</span>
	);

	if (!menu) return <>{avatar}</>;

	return <Dropdown overlay={menuOverlay}>{avatar}</Dropdown>;
};

export default React.memo(AvatarDropdown);
