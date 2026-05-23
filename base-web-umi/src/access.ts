import type { IInitialState } from './services/base/typing';
// import { currentRole } from './utils/ip';

const getRoleName = (currentUser?: IInitialState['currentUser']) => {
	if (!currentUser) return '';
	if (typeof currentUser.role === 'string') return currentUser.role;
	if (typeof currentUser.role === 'object' && currentUser.role?.name) return currentUser.role.name;
	if ((currentUser as any).role_name) return (currentUser as any).role_name;
	return '';
};

const normalizeRoleName = (roleName: string) => {
	return roleName?.toLowerCase()?.trim() || '';
};

/**
 * @see https://umijs.org/zh-CN/plugins/plugin-access
 * */
export default function access(initialState: IInitialState) {
	const { currentUser } = initialState || {};
	const rawRoleName = getRoleName(currentUser);
	const roleName = normalizeRoleName(rawRoleName);
	const token = localStorage.getItem('token');
	const isAuthenticated = Boolean(token);

	return {
		isAdmin: roleName === 'admin',
		isLibrarian: roleName === 'librarian' || roleName === 'admin',
		isMember: isAuthenticated && ['member', 'reader', 'librarian', 'admin'].includes(roleName),
		accessFilter: (route: any) => true, // Default to true or implement custom logic if needed
	};
}
