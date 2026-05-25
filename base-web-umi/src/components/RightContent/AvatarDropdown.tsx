import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Menu, Spin } from 'antd';
import React from 'react';
import { history, useModel } from 'umi';
import HeaderDropdown from './HeaderDropdown';
import styles from './index.less';

export type GlobalHeaderRightProps = {
	menu?: boolean;
};

const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ menu }) => {
	const { initialState, setInitialState } = useModel('@@initialState');

	const loginOut = async () => {
		localStorage.removeItem('token');
		await setInitialState((s) => ({ ...s, currentUser: undefined }));
		history.push('/user/login');
	};

	if (!initialState || !initialState.currentUser)
		return (
			<span className={`${styles.action} ${styles.account}`}>
				<Spin size='small' style={{ marginLeft: 8, marginRight: 8 }} />
			</span>
		);

	// `Login.IUser` has `username` and `role` fields per typing.d.ts
	const fullName = initialState.currentUser?.username || initialState.currentUser?.email || '';
	const _parts = fullName.split(' ').filter(Boolean);
	const _last = _parts.length ? _parts[_parts.length - 1] : '';
	const lastNameChar = _last ? _last[0].toUpperCase() : undefined;

	const menuOverlay = (
		<div className={styles.menuOverlay}>
			<div className={styles.menuHeader}>
				<div className={styles.menuUsername}>{initialState.currentUser?.username}</div>
			</div>
			<Menu className={styles.menu}>
				<Menu.Item key='logout' danger icon={<LogoutOutlined />} onClick={loginOut}>
					Đăng xuất
				</Menu.Item>
			</Menu>
		</div>
	);

	return (
		<>
			<HeaderDropdown overlay={menuOverlay}>
				<span className={`${styles.action} ${styles.account}`}>
					<Avatar className={styles.avatar} src={undefined}>
						{lastNameChar ? lastNameChar : <UserOutlined />}
					</Avatar>
					{/* role pill next to avatar */}
					{(() => {
						const primary = initialState.currentUser?.role?.name || '';
						if (!primary)
							return (
								<div style={{ display: 'flex', flexDirection: 'column' }}>
									<span className={`${styles.name}`}>{fullName}</span>
								</div>
							);
						const titleCase = primary.charAt(0).toUpperCase() + primary.slice(1).toLowerCase();
						return (
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<div style={{ display: 'flex', flexDirection: 'column' }}>
									<span className={`${styles.name}`}>{fullName}</span>
								</div>
								<span className={styles['role-pill']}>{titleCase}</span>
							</div>
						);
					})()}
				</span>
			</HeaderDropdown>
		</>
	);
};

export default AvatarDropdown;
