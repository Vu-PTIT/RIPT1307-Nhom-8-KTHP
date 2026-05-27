// import { refreshAccesssToken } from '@/services/ant-design-pro/api';
import { message, notification } from 'antd';
import axios from 'axios';
// import { history } from 'umi';
import data from './data';

// function routeLogin(errorCode: string) {
//   // notification.warning({
//   //   message: 'Vui lòng đăng nhập lại',
//   //   description: data.error[errorCode],
//   // });
//   // localStorage.clear();
//   history.replace({
//     pathname: '/user/login',
//   });
// }

// for multiple request
// let isRefreshing = false;
// let failedQueue: any[] = [];
// const processQueue = (error: any, token: any = null) => {
//   failedQueue.forEach((prom) => {
//     if (error) {
//       prom.reject(error);
//     } else {
//       prom.resolve(token);
//     }
//   });
//   failedQueue = [];
// };

/**
 * Chuyển sang xử lý access_token with OIDC auth ở Technical Support
 */
// Add a request interceptor
axios.interceptors.request.use(
	(config) => {
		try {
			const m = (config.method || 'get').toUpperCase();
			// don't log Authorization value
			console.debug('[API request]', m, config.url);
		} catch (e) {
			// ignore
		}
		if (!config.headers.Authorization) {
			const token = localStorage.getItem('token');
			if (token) {
				// eslint-disable-next-line no-param-reassign
				config.headers.Authorization = `Bearer ${token}`;
			}
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Add a response interceptor
axios.interceptors.response.use(
	(response) => {
		try {
			console.debug('[API response]', response.config?.method?.toUpperCase(), response.config?.url, response.status);
		} catch (e) {}
		return response;
	},
	(error) => {
		try {
			const cfg = error?.config || {};
			console.debug('[API error]', (cfg.method || '').toUpperCase(), cfg.url, error?.response?.status);
		} catch (e) {}
		let er = error?.response?.data;
		// Convert response data to JSON
		if ((error?.response?.config?.responseType as string)?.toLowerCase() === 'arraybuffer') {
			const decoder = new TextDecoder('utf-8');
			er = JSON.parse(decoder.decode(er));
		}
		const descriptionError = Array.isArray(er?.detail?.exception?.response?.message)
			? er?.detail?.exception?.response?.message?.join(', ')
			: // Sequelize validation Errors
			Array.isArray(er?.detail?.exception?.errors)
			? er?.detail?.exception?.errors?.map((e: any) => e?.message)?.join(', ')
			: data.error[er?.detail?.errorCode || er?.errorCode] ||
			  er?.detail?.message ||
			  er?.message ||
			  er?.errorDescription;

		const originalRequest = error.config || {};
		let originData = originalRequest?.data;
		if (typeof originData === 'string') {
			try {
				originData = JSON.parse(originData);
			} catch (e) {
				originData = undefined;
			}
		}
		const silent = !!(originalRequest?.silent || originData?.silent || originalRequest?.params?.silent);
		if (!silent)
			switch (error?.response?.status) {
				case 400:
					notification.error({
						message: 'Dữ liệu chưa đúng (004)',
						description: descriptionError,
					});
					break;

				case 401:
					// Nếu có access token (có thể access token hết hạn) thì mới cảnh báo
					if (originalRequest?.headers?.Authorization)
						notification.error({
							message: 'Phiên đăng nhập đã thay đổi (104)',
							description: 'Vui lòng tải lại trang (F5) để cập nhật. Chú ý các dữ liệu chưa lưu sẽ bị mất!',
						});
					else
						notification.error({
							message: 'Không có quyền truy cập',
							description: descriptionError || 'Vui lòng đăng nhập lại để tiếp tục.',
						});
					if (originalRequest._retry) break;
					break;
				case 403:
				case 405:
					notification.error({
						message: 'Thao tác không được phép (304)',
						description: descriptionError,
					});
					break;

				case 404:
					notification.error({
						message: 'Không tìm thấy dữ liệu (040)',
						description: descriptionError,
					});
					break;

				case 409:
					notification.error({
						message: 'Dữ liệu chưa đúng (904)',
						description: descriptionError,
					});
					break;

				case 500:
				case 502:
					notification.error({
						message: 'Hệ thống đang cập nhật (005)',
						description: descriptionError || 'Máy chủ gặp sự cố. Vui lòng thử lại sau.',
					});
					break;

				default:
					notification.error({
						message: 'Lỗi hệ thống',
						description: descriptionError || 'Hệ thống đang cập nhật. Vui lòng thử lại sau.',
					});
					break;
			}
		// Do something with response error
		return Promise.reject(error);
	},
);

export default axios;
