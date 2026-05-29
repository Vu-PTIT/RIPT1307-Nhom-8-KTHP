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
		path: '/ban-doc/tai-lieu',
		name: 'Tra cứu sách',
		icon: 'BookOutlined',
		component: './BanDoc/TaiLieu',
		access: 'isMember',
	},
	{
		path: '/ban-doc/tai-lieu/:id',
		component: './BanDoc/TaiLieu/Detail',
		hideInMenu: true,
		access: 'isMember',
	},
	{
		path: '/ban-doc/yeu-thich',
		name: 'Yêu thích',
		icon: 'HeartOutlined',
		component: './BanDoc/YeuThich',
		access: 'isMember',
	},
	{
		path: '/ban-doc/gio-muon',
		name: 'Giỏ mượn',
		icon: 'ShoppingCartOutlined',
		component: './BanDoc/GioMuon',
		access: 'isMember',
	},
	{
		path: '/ban-doc/lich-su-muon',
		name: 'Lịch sử mượn',
		icon: 'HistoryOutlined',
		component: './BanDoc/LichSuMuon',
		access: 'isMember',
	},
	{
		path: '/ban-doc/lich-su-muon/:id',
		component: './BanDoc/LichSuMuon/Detail',
		hideInMenu: true,
		access: 'isMember',
	},
	{
		path: '/ban-doc/gia-han',
		name: 'Gia hạn',
		icon: 'SyncOutlined',
		component: './BanDoc/GiaHan',
		access: 'isMember',
	},
	{
		path: '/ban-doc/diem-danh',
		name: 'Check-in',
		icon: 'LoginOutlined',
		component: './BanDoc/DiemDanh',
		access: 'isMember',
	},

	// === LIBRARIAN PAGES ===
	{
		path: '/thu-thu/kho-sach',
		name: 'Quản lý kho sách',
		icon: 'BookOutlined',
		component: './ThuThu/BookWarehouseManage',
		access: 'isLibrarian',
	},
	{
		path: '/thu-thu/muon-tra',
		name: 'Mượn / Trả',
		icon: 'SwapOutlined',
		component: './ThuThu/BorrowManage',
		access: 'isLibrarian',
	},
	{
		path: '/thu-thu/gia-han',
		name: 'Duyệt gia hạn',
		icon: 'CheckSquareOutlined',
		component: './ThuThu/RenewalReview',
		access: 'isLibrarian',
	},
	{
		path: '/thu-thu/diem-danh',
		name: 'Log Check-in',
		icon: 'FileDoneOutlined',
		component: './ThuThu/CheckinLogs',
		access: 'isLibrarian',
	},
	{
		path: '/thu-thu/bulk-upload-images',
		name: 'Upload ảnh bìa',
		icon: 'UploadOutlined',
		component: './BulkUploadImages',
		access: 'isLibrarian',
	},

	// === ADMIN PAGES ===
	{
		path: '/quan-tri/thong-ke',
		name: 'Thống kê',
		icon: 'LineChartOutlined',
		component: './QuanTri/Dashboard',
		access: 'isAdmin',
	},
	{
		path: '/quan-tri/nguoi-dung',
		name: 'Người dùng',
		icon: 'UserOutlined',
		component: './QuanTri/UserManage',
		access: 'isAdmin',
	},
	{
		path: '/quan-tri/cai-dat',
		name: 'Cài đặt',
		icon: 'SettingOutlined',
		component: './QuanTri/Settings',
		access: 'isAdmin',
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
		component: './TrangChu',
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
