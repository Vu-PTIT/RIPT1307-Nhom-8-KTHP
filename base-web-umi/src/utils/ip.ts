import { AppModules, EModuleKey } from '@/services/base/constant';

// Fallbacks cho biến môi trường (giúp dev khi chưa build với define vars)
const ipRoot =
	typeof APP_CONFIG_IP_ROOT !== 'undefined' && APP_CONFIG_IP_ROOT
		? APP_CONFIG_IP_ROOT.replace(/\/$/, '') + '/'
		: 'http://localhost:8000/'; // ip dev mặc định

// Ip Chính => Mặc định dùng trong các useInitModel
const ip3 = ipRoot + 'slink'; // ip dev

// Ip khác
const ipNotif = ipRoot + 'notification'; // ip dev
const ipSlink = ipRoot + 'slink'; // ip dev
// Library API base URL. Fall back to localhost when env var missing (dev convenience).
const ipLibrary =
	typeof APP_CONFIG_LIBRARY_API !== 'undefined' && APP_CONFIG_LIBRARY_API
		? APP_CONFIG_LIBRARY_API.replace(/\/$/, '')
		: 'http://localhost:8000/api/v1';

const currentRole = EModuleKey.CONNECT;
const oneSignalRole = EModuleKey.CONNECT;

// DO NOT TOUCH
const keycloakClientID = AppModules[currentRole].clientId;
const keycloakAuthority =
	typeof APP_CONFIG_KEYCLOAK_AUTHORITY !== 'undefined' && APP_CONFIG_KEYCLOAK_AUTHORITY
		? APP_CONFIG_KEYCLOAK_AUTHORITY.replace(/\/$/, '')
		: '';
const resourceServerClientId = `${
	typeof APP_CONFIG_PREFIX_OF_KEYCLOAK_CLIENT_ID !== 'undefined' ? APP_CONFIG_PREFIX_OF_KEYCLOAK_CLIENT_ID : ''
}auth`;
const keycloakAuthEndpoint = keycloakAuthority ? `${keycloakAuthority}/protocol/openid-connect/auth` : '';
const keycloakTokenEndpoint = keycloakAuthority ? `${keycloakAuthority}/protocol/openid-connect/token` : '';
const keycloakUserInfoEndpoint = keycloakAuthority ? `${keycloakAuthority}/protocol/openid-connect/userinfo` : '';
const sentryDSN = typeof APP_CONFIG_SENTRY_DSN !== 'undefined' ? APP_CONFIG_SENTRY_DSN : '';
const oneSignalClient = typeof APP_CONFIG_ONE_SIGNAL_ID !== 'undefined' ? APP_CONFIG_ONE_SIGNAL_ID : '';

export {
	ip3,
	ipNotif,
	ipSlink,
	ipLibrary,
	currentRole,
	oneSignalRole,
	keycloakClientID,
	resourceServerClientId,
	keycloakAuthEndpoint,
	keycloakTokenEndpoint,
	keycloakUserInfoEndpoint,
	keycloakAuthority,
	sentryDSN,
	oneSignalClient,
};
