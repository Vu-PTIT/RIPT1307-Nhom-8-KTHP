export default [
	{
		path: '/user',
		layout: false,
		routes: [
			{
				path: '/user/login',
				layout: false,
				name: 'login',
				component: './user/Login',
			},
			{
				path: '/user/register',
				layout: false,
				name: 'register',
				component: './user/Register',
			},
			{
				path: '/user',
				redirect: '/user/login',
			},
		],
	},

	// === MEMBER PAGES ===
	{
		path: '/tai-lieu',
		name: 'Tài liệu',
		icon: 'BookOutlined',
		component: './TaiLieu',
		access: 'isMember',
	},
	{
		path: '/tai-lieu/:id',
		component: './TaiLieu/Detail',
		hideInMenu: true,
	},
	{
		path: '/yeu-thich',
		name: 'Yêu thích',
		icon: 'HeartOutlined',
		component: './YeuThich',
		access: 'isMember',
	},
	{
		path: '/gio-muon',
		name: 'Giỏ mượn',
		icon: 'ShoppingCartOutlined',
		component: './GioMuon',
		access: 'isMember',
	},
	{
		path: '/lich-su-muon',
		name: 'Lịch sử mượn',
		icon: 'HistoryOutlined',
		component: './LichSuMuon',
		access: 'isMember',
	},
	{
		path: '/lich-su-muon/:id',
		component: './LichSuMuon/Detail',
		hideInMenu: true,
	},
	{
		path: '/gia-han',
		name: 'Gia hạn',
		icon: 'SyncOutlined',
		component: './GiaHan',
		access: 'isMember',
	},
	{
		path: '/diem-danh',
		name: 'Check-in',
		icon: 'LoginOutlined',
		component: './DiemDanh',
		access: 'isMember',
	},

	// === LIBRARIAN PAGES ===
	{
		path: '/thu-thu',
		name: 'Thủ thư',
		icon: 'TeamOutlined',
		access: 'isLibrarian',
		routes: [
			{
				path: '/thu-thu/tai-lieu',
				name: 'Quản lý tài liệu',
				component: './ThuThu/DocumentManage',
			},
			{
				path: '/thu-thu/danh-muc',
				name: 'Danh mục',
				component: './ThuThu/CategoryManage',
			},
			{
				path: '/thu-thu/muon-tra',
				name: 'Mượn / Trả',
				component: './ThuThu/BorrowManage',
			},
			{
				path: '/thu-thu/gia-han',
				name: 'Duyệt gia hạn',
				component: './ThuThu/RenewalReview',
			},
			{
				path: '/thu-thu/diem-danh',
				name: 'Log Check-in',
				component: './ThuThu/CheckinLogs',
			},
		],
	},

	// === ADMIN PAGES ===
	{
		path: '/quan-tri',
		name: 'Quản trị',
		icon: 'SettingOutlined',
		access: 'isAdmin',
		routes: [
			{
				path: '/quan-tri/thong-ke',
				name: 'Thống kê',
				component: './QuanTri/Dashboard',
			},
			{
				path: '/quan-tri/nguoi-dung',
				name: 'Người dùng',
				component: './QuanTri/UserManage',
			},
			{
				path: '/quan-tri/cai-dat',
				name: 'Cài đặt',
				component: './QuanTri/Settings',
			},
		],
	},

	{
		path: '/gioi-thieu',
		name: 'About',
		component: './TienIch/GioiThieu',
		hideInMenu: true,
	},
	{
		path: '/random-user',
		name: 'RandomUser',
		component: './RandomUser',
		icon: 'ArrowsAltOutlined',
		hideInMenu: true,
	},

	// DANH MUC HE THONG
	// {
	// 	name: 'DanhMuc',
	// 	path: '/danh-muc',
	// 	icon: 'copy',
	// 	routes: [
	// 		{
	// 			name: 'ChucVu',
	// 			path: 'chuc-vu',
	// 			component: './DanhMuc/ChucVu',
	// 		},
	// 	],
	// },

	{
		path: '/notification',
		routes: [
			{
				path: './subscribe',
				exact: true,
				component: './ThongBao/Subscribe',
			},
			{
				path: './check',
				exact: true,
				component: './ThongBao/Check',
			},
			{
				path: './',
				exact: true,
				component: './ThongBao/NotifOneSignal',
			},
		],
		layout: false,
		hideInMenu: true,
	},
	{
		path: '/',
		redirect: '/tai-lieu',
	},
	{
		path: '/403',
		component: './exception/403/403Page',
		layout: false,
	},
	{
		path: '/hold-on',
		component: './exception/DangCapNhat',
		layout: false,
	},
	{
		component: './exception/404',
	},
];
