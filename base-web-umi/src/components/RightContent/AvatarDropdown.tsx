import React from 'react';
import { Avatar, Dropdown, Menu } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { history, useModel, useAccess } from 'umi';
import { ipLibrary } from '@/utils/ip';

type Props = {
	menu?: boolean;
};

const AvatarDropdown: React.FC<Props> = ({ menu = false }) => {
	const { initialState } = useModel('@@initialState');
	const user: any = initialState?.currentUser;
	const displayName = user?.name || user?.fullname || user?.username || 'Người dùng';
	const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

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

	const access = useAccess();
	const menuOverlay = (
		<Menu style={{ minWidth: 160 }}>
			{access.isMember && (
				<Menu.Item key='profile' onClick={() => history.push('/ban-doc/tai-khoan')}>
					<UserOutlined />
					&nbsp;Thông tin
				</Menu.Item>
			)}
			{access.isMember && <Menu.Divider />}
			<Menu.Item key='logout' onClick={handleLogout}>
				<LogoutOutlined />
				&nbsp;Đăng xuất
			</Menu.Item>
		</Menu>
	);

	const avatarSrc = user?.avatar ? `${ipLibrary}/auth/avatars/${user.avatar}` : undefined;

	const avatar = (
		<span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
			{avatarSrc ? (
				<Avatar src={avatarSrc} />
			) : (
				<Avatar style={{ backgroundColor: '#87d068' }}>{initial}</Avatar>
			)}
			<span style={{ marginLeft: 8 }}>{displayName}</span>
		</span>
	);

	if (!menu) return <>{avatar}</>;

	return <Dropdown overlay={menuOverlay}>{avatar}</Dropdown>;
};

export default React.memo(AvatarDropdown);
