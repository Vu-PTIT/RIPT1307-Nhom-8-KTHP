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
1. **Admin**: Có toàn quyền quản lý hệ thống, bao gồm quản lý người dùng, xem báo cáo das
hboard và quản lý tài liệu.
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
| GET | `/admin/users/search` | Tìm kiếm người dùng theo từ khóa | Librarian/Admin |
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

### 3.4. Mượn Trả Sách & Gia Hạn (`/borrows`, `/renewals`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| POST | `/borrows/checkout` | Tạo phiếu mượn sách từ giỏ hàng (chờ nhận sách) | Reader |
| GET | `/borrows` | Lịch sử phiếu mượn sách cá nhân | Reader |
| POST | `/borrows/librarian` | Thủ thư tạo phiếu mượn trực tiếp cho độc giả | Librarian |
| PUT | `/borrows/librarian/{id}/confirm` | Xác nhận giao sách (chuyển sang trạng thái borrowed) | Librarian |
| POST | `/borrows/librarian/return` | Thực hiện trả sách (quét mã bản sao) | Librarian |
| GET | `/borrows/librarian/all` | Toàn bộ bản ghi mượn trả của hệ thống | Librarian/Admin |
| POST | `/renewals` | Yêu cầu xin gia hạn mượn sách | Reader |
| PUT | `/renewals/librarian/{id}` | Duyệt hoặc từ chối yêu cầu gia hạn | Librarian/Admin |

### 3.5. Ra/Vào Thư Viện (`/checkin`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| POST | `/checkin` | Tự check-in/check-out qua cổng thư viện | Reader |
| GET | `/checkin/history` | Lịch sử ra/vào thư viện cá nhân | Reader |
| POST | `/checkin/librarian/manual` | Check-in/out thủ công cho độc giả | Librarian/Admin |
| GET | `/checkin/librarian/all` | Danh sách lịch sử ra/vào toàn thư viện | Librarian/Admin |

### 3.6. Wishlist & Cart (`/wishlist`, `/cart`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| GET | `/wishlist` | Xem danh sách yêu thích | Reader |
| POST | `/wishlist/{doc_id}` | Thêm sách vào danh sách yêu thích | Reader |
| DELETE | `/wishlist/{doc_id}` | Xóa sách khỏi danh sách yêu thích | Reader |
| GET | `/cart` | Xem giỏ sách mượn tạm thời | Reader |
| POST | `/cart/{doc_id}` | Thêm sách vào giỏ mượn | Reader |

### 3.7. Notifications (`/notifications`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| GET | `/notifications` | Lấy danh sách thông báo của bản thân | Authenticated |
| PUT | `/notifications/{id}/read` | Đánh dấu 1 thông báo là đã đọc | Authenticated |
| PUT | `/notifications/read-all` | Đánh dấu tất cả thông báo là đã đọc | Authenticated |
| POST | `/notifications/check-overdue` | Quét và gửi thông báo quá hạn sách | Librarian/Admin |

### 3.8. Admin Dashboard (`/admin/dashboard`)
| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| GET | `/admin/dashboard/summary` | Thống kê tổng quan (User, Book, Borrow) | Admin |
| GET | `/admin/dashboard/checkin-traffic`| Biểu đồ lưu lượng trả sách theo thời gian | Admin |
| GET | `/admin/dashboard/top-books` | Danh sách sách mượn nhiều nhất | Admin |
| GET | `/admin/dashboard/overdue` | Thống kê và danh sách sách quá hạn | Admin |
| GET | `/admin/dashboard/borrow-stats` | Thống kê trạng thái mượn trả (Borrow Status) | Admin |
| GET | `/admin/dashboard/export` | Xuất toàn bộ dữ liệu báo cáo ra file Excel | Admin |

---

## 4. Các Model chính trong Database
Hệ thống sử dụng kiến trúc Document-based với các collection chính:
- **User**: Lưu thông tin người dùng, mật khẩu (hash), vai trò và trạng thái.
- **Role**: Danh mục các vai trò (Admin, Librarian, Reader).
- **Document**: Thông tin sách (Tiêu đề, Tác giả, ISBN, Cover...).
- **DocumentCopy**: Từng bản sao vật lý của sách (Mã code, Tình trạng, Trạng thái: Available/Borrowed/Lost).
- **Category**: Thể loại sách.
- **BorrowRecord**: Lưu vết quá trình mượn trả (Người mượn, Ngày mượn, Ngày hẹn trả tổng thể).
- **BorrowRecordItem**: Lưu từng bản sao chi tiết trong một lần mượn để hỗ trợ việc trả sách rời rạc.
- **RenewalRequest**: Các yêu cầu xin gia hạn mượn sách.
- **Notification**: Thông báo gửi đến người dùng (nhắc nhở trả sách, thông báo quá hạn, duyệt gia hạn...).
- **CheckinLog**: Lưu trữ log ra/vào thư viện (quét thẻ ở cổng) để theo dõi lưu lượng người trong thư viện.

---

## 5. Quy trình nghiệp vụ chính (Workflows)

### Quy trình Mượn sách:
1. Độc giả tìm kiếm sách qua `/documents` và thêm sách vào giỏ qua `/cart`.
2. Độc giả thực hiện đặt sách bằng API `/borrows/checkout`. Hệ thống sẽ tạo một phiếu mượn (Borrow Record) với trạng thái `pending` (chờ nhận sách).
3. Độc giả đến quầy thủ thư để nhận sách vật lý. Thủ thư kiểm tra và gọi API `/borrows/librarian/{id}/confirm` để xác nhận giao sách.
4. Phiếu mượn chuyển sang trạng thái `borrowed`. Ngày mượn bắt đầu được tính.
*(Lưu ý: Thủ thư cũng có thể trực tiếp tạo phiếu mượn thay cho độc giả bằng `/borrows/librarian`).*

### Quy trình Trả sách:
1. Độc giả mang sách trả lại quầy cho thủ thư.
2. Thủ thư quét mã bản sao (copy code) trên sách qua API `/borrows/librarian/return`.
3. Hệ thống ghi nhận ngày trả cho cuốn sách đó trong `BorrowRecordItem`, chuyển trạng thái bản sao thành `Available`, và có thể tính tiền phạt nếu phát hiện sách quá hạn.

### Quy trình Ra/Vào Thư viện (Check-in/Check-out):
1. Khi đến hoặc rời khỏi thư viện, độc giả dùng thẻ quét ở cổng qua API `/checkin` để hệ thống lưu lại thời gian.
2. Trường hợp độc giả quên thẻ, thủ thư có thể thực hiện check-in/out thủ công qua `/checkin/librarian/manual`.

### Quy trình Quản trị:
1. Admin xem báo cáo tại `/admin/dashboard` để nắm bắt tình hình hoạt động.
2. Admin quản lý người dùng (Khóa/Mở khóa tài khoản vi phạm nội quy).

### Quy trình Gửi Thông Báo (Notifications):
1. Hệ thống tự động quét sách quá hạn qua API `/notifications/check-overdue` (chạy bởi Admin/Librarian hoặc cron job).
2. Tạo thông báo (Notification) nhắc nhở gửi cho từng độc giả có sách quá hạn và báo cáo tổng hợp cho thủ thư.
3. Người dùng đăng nhập sẽ gọi `GET /notifications` để xem thông báo mới, và đánh dấu đã đọc qua `PUT /notifications/read-all`.
