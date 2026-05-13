import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import { notification } from 'antd';
import 'moment/locale/vi';
import type { RequestConfig, RunTimeLayoutConfig } from 'umi';
import { getIntl, getLocale, history } from 'umi';
import type { RequestOptionsInit, ResponseError } from 'umi-request';
import ErrorBoundary from './components/ErrorBoundary';
import { unCheckPermissionPaths } from './components/OIDCBounder/constant';
import OneSignalBounder from './components/OneSignalBounder';
import NotAccessible from './pages/exception/403';
import NotFoundContent from './pages/exception/404';
import type { IInitialState } from './services/base/typing';
import './styles/global.less';
import { getUserInfo } from './services/base/api';
import { currentRole } from './utils/ip';

/**  loading */
export const initialStateConfig = {
	loading: <></>,
};

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<IInitialState> {
	const fetchUserInfo = async () => {
		try {
			const info = await getUserInfo();
			return info.data;
		} catch (error) {
			// history.push('/user/login');
		}
		return undefined;
	};

	// If not on login page, fetch user info
	if (!history.location.pathname.startsWith('/user/')) {
		const currentUser = await fetchUserInfo();
		return {
			currentUser,
			settings: {},
		};
	}

	return {
		settings: {},
	};
}

const authHeaderInterceptor = (url: string, options: RequestOptionsInit) => {
	const token = localStorage.getItem('token');
	if (token) {
		const headers = {
			...options.headers,
			Authorization: `Bearer ${token}`,
		};
		return { url, options: { ...options, headers } };
	}
	return { url, options };
};

/**
 * @see https://beta-pro.ant.design/docs/request-cn
 */
export const request: RequestConfig = {
	errorHandler: (error: ResponseError) => {
		const { messages } = getIntl(getLocale());
		const { response } = error;

		if (response && response.status) {
			const { status, statusText, url } = response;
			if (status === 401) {
				localStorage.removeItem('token');
				history.replace('/user/login');
				return;
			}
			const requestErrorMessage = messages['app.request.error'];
			const errorMessage = `${requestErrorMessage} ${status}: ${url}`;
			const errorDescription = messages[`app.request.${status}`] || statusText;
			notification.error({
				message: errorMessage,
				description: errorDescription,
			});
		}

		if (!response) {
			notification.error({
				description: 'Yêu cầu gặp lỗi',
				message: 'Bạn hãy thử lại sau',
			});
		}
		throw error;
	},
	requestInterceptors: [authHeaderInterceptor],
};

// ProLayout  https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
	return {
		unAccessible: <NotAccessible />,
		noFound: <NotFoundContent />,
		rightContentRender: () => <RightContent />,
		disableContentMargin: false,

		footerRender: () => <Footer />,

		onPageChange: () => {
			const token = localStorage.getItem('token');
			const { location } = history;
			
			// Redirect to login if not authenticated and trying to access a protected route
			if (!token && !location.pathname.includes('/user/')) {
				history.replace('/user/login');
				return;
			}

			if (token) {
				const isUncheckPath = unCheckPermissionPaths.some((path) => window.location.pathname.includes(path));

				if (location.pathname === '/') {
					const roleName = initialState?.currentUser?.role?.name;
					if (roleName === 'Admin') {
						history.replace('/quan-tri/thong-ke');
					} else if (roleName === 'Librarian') {
						history.replace('/thu-thu/muon-tra');
					} else {
						history.replace('/tai-lieu');
					}
				}
			}
		},

		menuItemRender: (item: any, dom: any) => (
			<a
				className='not-underline'
				key={item?.path}
				href={item?.path}
				onClick={(e) => {
					e.preventDefault();
					history.push(item?.path ?? '/');
				}}
				style={{ display: 'block' }}
			>
				{dom}
			</a>
		),

		childrenRender: (dom) => (
			<ErrorBoundary>
				<OneSignalBounder>{dom}</OneSignalBounder>
			</ErrorBoundary>
		),
		menuHeaderRender: undefined,
		...initialState?.settings,
	};
};
