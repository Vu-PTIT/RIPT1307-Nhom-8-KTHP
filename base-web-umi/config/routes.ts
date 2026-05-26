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
		path: '/xu-ly-muon-tra',
		name: 'Xử lý mượn trả',
		icon: 'HistoryOutlined',
		component: './ThuThu/BorrowManage',
		access: 'isMember',
	},
	{
		path: '/phe-duyet-gia-han',
		name: 'Phê duyệt gia hạn',
		icon: 'SyncOutlined',
		component: './ThuThu/RenewalReview',
		access: 'isMember',
	},
	{
		path: '/kiem-soat-ra-vao',
		name: 'Kiểm soát ra vào',
		icon: 'LoginOutlined',
		component: './ThuThu/CheckinLogs',
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
				path: '/thu-thu/quan-ly-kho-sach',
				name: 'Quản lý kho sách',
				component: './ThuThu/BookWarehouseManage',
			},
			{
				path: '/thu-thu/tra-cuu-sach',
				name: 'Tra cứu sách',
				component: './ThuThu/LookupBook',
			},
			{
				path: '/thu-thu/xu-ly-muon-tra',
				name: 'Xử lý mượn trả',
				component: './ThuThu/BorrowManage',
			},
			{
				path: '/thu-thu/phe-duyet-gia-han',
				name: 'Phê duyệt gia hạn',
				component: './ThuThu/RenewalReview',
			},
			{
				path: '/thu-thu/kiem-soat-ra-vao',
				name: 'Kiểm soát ra vào',
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
