# Báo cáo Chi tiết API Backend - Library Management System

## 1. Tổng quan hệ thống
Hệ thống Backend được xây dựng bằng framework **FastAPI** (Python), sử dụng **Odmantic** làm Object-Document Mapper (ODM) để tương tác với cơ sở dữ liệu **MongoDB**.

- **Base URL**: `/api/v1`
- **Công nghệ chính**: FastAPI, Pydantic, Odmantic, MongoDB, JWT Authentication.
- **Tài liệu tự động**: 
    - Swagger UI: `http://localhost:8000/docs`
    - Redoc: `http://localhost:8000/redoc`

---

## 2. Cơ chế xác thực & Phân quyền
Hệ thống sử dụng **JWT (JSON Web Token)** để xác thực người dùng. Token được gửi kèm trong Header `Authorization: Bearer <token>`.

### Các vai trò (Roles):
1. **Admin**: Có toàn quyền quản lý hệ thống, bao gồm quản lý người dùng, xem báo cáo dashboard và quản lý tài liệu.
2. **Librarian**: Quản lý tài liệu (thêm/sửa/xóa sách, bản sao), quản lý mượn/trả và xử lý gia hạn.
3. **Reader**: Tìm kiếm sách, xem thông tin cá nhân, quản lý danh sách yêu thích (wishlist), giỏ sách mượn (borrow cart) và xem lịch sử mượn trả.

---

## 3. Danh mục các API Endpoints

### 3.1. Authentication (`/auth`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| POST | `/login/access-token` | Đăng nhập lấy token JWT | Public |
| POST | `/register` | Đăng ký tài khoản người dùng mới | Public |
| POST | `/test-token` | Kiểm tra tính hợp lệ của token | Authenticated |

### 3.2. User Management & Settings (`/settings`, `/admin/users`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| GET | `/settings/me` | Lấy thông tin cá nhân hiện tại | Authenticated |
| PUT | `/settings/me` | Cập nhật thông tin cá nhân | Authenticated |
| GET | `/admin/users` | Danh sách người dùng (có lọc & phân trang) | Admin |
| POST | `/admin/users` | Admin tạo người dùng mới | Admin |
| GET | `/admin/users/{id}` | Chi tiết thông tin một người dùng | Admin |
| PUT | `/admin/users/{id}` | Cập nhật thông tin/vai trò người dùng | Admin |
| PATCH | `/admin/users/{id}/toggle-active` | Khóa/Mở khóa tài khoản | Admin |
| DELETE | `/admin/users/{id}` | Xóa tài khoản người dùng | Admin |

### 3.3. Document & Category Management (`/documents`, `/categories`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| GET | `/documents` | Tìm kiếm sách (keyword, category, paging) | Public |
| GET | `/documents/{id}` | Chi tiết một cuốn sách | Public |
| POST | `/documents` | Thêm sách mới | Librarian/Admin |
| PUT | `/documents/{id}` | Cập nhật thông tin sách | Librarian/Admin |
| DELETE | `/documents/{id}` | Xóa sách và tất cả bản sao | Librarian/Admin |
| POST | `/documents/{id}/copies` | Thêm bản sao (copy) cho sách | Librarian/Admin |
| GET | `/documents/{id}/copies` | Danh sách các bản sao của sách | Librarian/Admin |
| GET | `/categories` | Danh sách tất cả danh mục sách | Public |
| POST | `/categories` | Thêm danh mục mới | Librarian/Admin |

### 3.4. Borrow & Returns (`/borrows`, `/checkin`, `/renewals`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| POST | `/borrows/checkout` | Thực hiện mượn sách từ giỏ hàng | Reader |
| GET | `/borrows/my-records` | Lịch sử mượn sách cá nhân | Reader |
| GET | `/borrows/all` | Toàn bộ bản ghi mượn trả hệ thống | Librarian/Admin |
| POST | `/checkin` | Thực hiện trả sách (quét mã bản sao) | Librarian/Admin |
| POST | `/renewals/request` | Yêu cầu gia hạn mượn sách | Reader |
| PATCH | `/renewals/{id}/approve` | Duyệt yêu cầu gia hạn | Librarian/Admin |

### 3.5. Wishlist & Cart (`/wishlist`, `/cart`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| GET | `/wishlist` | Xem danh sách yêu thích | Reader |
| POST | `/wishlist/{doc_id}` | Thêm sách vào danh sách yêu thích | Reader |
| DELETE | `/wishlist/{doc_id}` | Xóa sách khỏi danh sách yêu thích | Reader |
| GET | `/cart` | Xem giỏ sách mượn tạm thời | Reader |
| POST | `/cart/{doc_id}` | Thêm sách vào giỏ mượn | Reader |

### 3.6. Admin Dashboard (`/admin/dashboard`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| GET | `/admin/dashboard/summary` | Thống kê tổng quan (User, Book, Borrow) | Admin |
| GET | `/admin/dashboard/checkin-traffic`| Biểu đồ lưu lượng trả sách theo thời gian | Admin |
| GET | `/admin/dashboard/top-books` | Danh sách sách mượn nhiều nhất | Admin |
| GET | `/admin/dashboard/overdue` | Thống kê và danh sách sách quá hạn | Admin |

---

## 4. Các Model chính trong Database
Hệ thống sử dụng kiến trúc Document-based với các collection chính:
- **User**: Lưu thông tin người dùng, mật khẩu (hash), vai trò và trạng thái.
- **Role**: Danh mục các vai trò (Admin, Librarian, Reader).
- **Document**: Thông tin sách (Tiêu đề, Tác giả, ISBN, Cover...).
- **DocumentCopy**: Từng bản sao vật lý của sách (Mã code, Tình trạng, Trạng thái: Available/Borrowed/Lost).
- **Category**: Thể loại sách.
- **BorrowRecord**: Lưu vết quá trình mượn trả (Người mượn, Bản sao, Ngày mượn, Ngày hẹn trả, Ngày trả thực tế, Tiền phạt).
- **RenewalRequest**: Các yêu cầu xin gia hạn mượn sách.

---

## 5. Quy trình nghiệp vụ chính (Workflows)

### Quy trình Mượn sách:
1. Reader tìm kiếm sách qua `/documents`.
2. Reader thêm sách vào giỏ qua `/cart`.
3. Reader thực hiện `/borrows/checkout`. Hệ thống kiểm tra số lượng bản sao khả dụng và tạo bản ghi mượn.

### Quy trình Trả sách:
1. Librarian nhận sách từ Reader.
2. Librarian nhập mã bản sao (copy code) vào `/checkin`.
3. Hệ thống cập nhật trạng thái bản sao thành `Available`, tính toán tiền phạt nếu quá hạn.

### Quy trình Quản trị:
1. Admin xem báo cáo tại `/admin/dashboard` để nắm bắt tình hình hoạt động.
2. Admin quản lý người dùng (Khóa/Mở khóa tài khoản vi phạm nội quy).
