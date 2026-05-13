import type { IInitialState } from './services/base/typing';
// import { currentRole } from './utils/ip';

/**
 * @see https://umijs.org/zh-CN/plugins/plugin-access
 * */
export default function access(initialState: IInitialState) {
	const { currentUser } = initialState || {};
	const roleName = currentUser?.role?.name;

	return {
		isAdmin: roleName === 'Admin',
		isLibrarian: roleName === 'Librarian' || roleName === 'Admin',
		isMember: roleName === 'Member' || roleName === 'Librarian' || roleName === 'Admin',
		accessFilter: (route: any) => true, // Default to true or implement custom logic if needed
	};
}
