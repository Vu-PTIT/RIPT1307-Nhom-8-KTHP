# Bàn giao công việc cho team

Tài liệu này tóm tắt những gì đã xử lý trong nhánh hiện tại, phần nào đã ổn định, phần nào cần làm tiếp, và các file nên giữ nguyên cấu trúc để khi ghép code không bị xung đột.

## 1) Trạng thái hiện tại

Backend reader flow đã được sửa để chạy ổn hơn:

- Đăng nhập demo hoạt động.
- Wishlist và giỏ mượn hoạt động.
- Checkout "Tạo phiếu mượn" đã chạy thành công.
- Lịch sử mượn đã được sửa để không còn lỗi validate response.

Frontend các trang reader chính đã có luồng cơ bản:

- `Tài liệu`
- `Yêu thích`
- `Giỏ mượn`
- `Lịch sử mượn`
- `Gia hạn`
- `Check-in`

## 2) Những thay đổi đã làm

### Backend

#### Xác thực và quyền truy cập

- `backend/app/core/security.py`
  - Chỉnh lại cơ chế hash/verify mật khẩu để tránh lỗi bcrypt/passlib.
- `backend/app/api/deps.py`
  - Sửa cách lấy role của user để tránh lỗi từ Odmantic `Reference`.
- `backend/init_db.py`
  - Seed lại dữ liệu demo và reset mật khẩu demo để luôn đăng nhập được.

#### Documents

- `backend/app/api/endpoints/documents.py`
  - Sắp xếp lại route `/search` trước `/{id}` để tránh route bị bắt nhầm.

#### Wishlist / Cart

- `backend/app/crud/borrow.py`
- `backend/app/api/endpoints/wishlist.py`
- `backend/app/api/endpoints/borrow_cart.py`
  - Chuyển các thao tác wishlist/cart sang query trực tiếp bằng Mongo/motor.
  - Loại bỏ các chỗ dùng `engine.database_to_model()` không tương thích.
  - Sửa cách đọc `Reference` của document để không còn 500.

#### Checkout / Borrow record

- `backend/app/crud/borrow.py`
- `backend/app/api/endpoints/borrows.py`
- `backend/app/api/endpoints/renewals.py`
- `backend/app/models/borrow.py`
- `backend/app/schemas/borrow.py`
- `backend/app/crud/dashboard.py`
  - Sửa luồng checkout từ giỏ mượn.
  - Chuyển dữ liệu lưu trong Mongo sang `datetime` để Mongo nhận được.
  - API vẫn trả về `date` ở response để frontend không phải đổi nhiều.
  - Thêm schema `BorrowRecordSummary` cho lịch sử mượn.
  - Sửa các endpoint renew/review để không còn dùng `.model` trên `Reference`.

### Frontend

Các file frontend đã được chỉnh để khớp backend reader flow:

- `base-web-umi/src/services/MuonSach/index.ts`
  - Có các hàm gọi API wishlist/cart/borrows/renewals/checkin.
- `base-web-umi/src/pages/TaiLieu/index.tsx`
- `base-web-umi/src/pages/TaiLieu/Detail.tsx`
- `base-web-umi/src/pages/YeuThich/index.tsx`
- `base-web-umi/src/pages/GioMuon/index.tsx`
- `base-web-umi/src/pages/LichSuMuon/index.tsx`

## 3) Các điểm kỹ thuật quan trọng cần giữ nguyên

1. Không đưa lại các chỗ dùng `engine.database_to_model()` cho các collection reader flow nếu chưa kiểm tra runtime support.
2. Trong các endpoint liên quan tới `Reference`, tránh dùng `.model` trên object đã load từ Mongo.
3. Với borrow record:
   - Lưu trong Mongo bằng `datetime`.
   - Response API cho frontend vẫn nên là `date`.
4. Khi thêm route mới, để ý thứ tự route:
   - route tĩnh như `/search` phải đứng trước route động như `/{id}`.
5. Không sửa lan sang các module không liên quan nếu không có lỗi trực tiếp.

## 4) Những việc còn nên làm tiếp

### Backend

- Kiểm tra thêm luồng `check-in` và `gia hạn` bằng test thật từ frontend.
- Rà soát các file còn dùng `engine.database_to_model()` để xem file nào thực sự còn cần, file nào nên chuyển dần sang query/model explicit.
- Nếu xuất hiện lỗi response validation ở các endpoint khác, sửa theo cùng nguyên tắc:
  - backend lưu kiểu phù hợp với Mongo
  - API trả kiểu đúng schema

### Frontend

- Kiểm tra lại 3 trang reader đã thuộc phạm vi làm việc:
  - `Tài liệu`
  - `Yêu thích`
  - `Giỏ mượn`
- Kiểm tra trang `Lịch sử mượn` sau checkout để chắc chắn list render đúng khi có dữ liệu.
- Nếu cần làm đẹp UI thì chỉ chỉnh trong các trang reader được phân công, không đụng các khu vực khác.

## 5) File nên ưu tiên đọc khi tiếp tục

### Backend lõi

- `backend/app/crud/borrow.py`
- `backend/app/api/endpoints/borrows.py`
- `backend/app/api/endpoints/renewals.py`
- `backend/app/models/borrow.py`
- `backend/app/schemas/borrow.py`

### Auth / base

- `backend/app/core/security.py`
- `backend/app/api/deps.py`
- `backend/init_db.py`

### Frontend reader flow

- `base-web-umi/src/services/MuonSach/index.ts`
- `base-web-umi/src/pages/GioMuon/index.tsx`
- `base-web-umi/src/pages/LichSuMuon/index.tsx`
- `base-web-umi/src/pages/YeuThich/index.tsx`
- `base-web-umi/src/pages/TaiLieu/index.tsx`
- `base-web-umi/src/pages/TaiLieu/Detail.tsx`

## 6) Cách ghép code để ít xung đột

- Giữ mỗi người làm đúng phạm vi trang của mình.
- Không đồng thời sửa cùng một hàm trong `borrow.py` nếu chưa thống nhất.
- Nếu thêm endpoint mới, nên tách rõ:
  - CRUD trong `backend/app/crud/`
  - API routing trong `backend/app/api/endpoints/`
  - Schema trong `backend/app/schemas/`
- Khi merge, ưu tiên giữ format hiện có của project thay vì reformat toàn bộ file.

### Tiêu chí để biết ghép đã khít

Ghép được xem là ổn khi thỏa cả 4 điều sau:

1. Không còn file nào trong nhóm reader bị hai người cùng sửa chồng lên nhau.
2. Chạy lại được chuỗi luồng chính mà không ra 500 hoặc ResponseValidationError:

- login
- thêm/xóa wishlist
- thêm/xóa giỏ mượn
- checkout tạo phiếu mượn
- xem lịch sử mượn

3. Frontend gọi đúng response backend và không cần thêm patch tạm ở component để né lỗi.
4. Nếu diff cuối cùng chỉ nằm trong đúng các file đã phân công thì merge an toàn hơn; nếu đụng sang file ngoài phạm vi thì cần review lại trước khi ghép.

### Cách chia trách nhiệm khi thành viên còn lại làm xong

- Người đã làm frontend reader flow nên giữ nguyên các file trong `base-web-umi/src/pages/` đã được bàn giao.
- Người còn lại nên ưu tiên backend hoặc các phần chưa chạm tới, không quay lại chỉnh cùng một hàm trong `backend/app/crud/borrow.py` nếu không thật sự cần.
- Nếu cần sửa tiếp một endpoint, chỉ sửa theo một hướng duy nhất: hoặc sửa CRUD + schema, hoặc sửa endpoint + mapping response, tránh sửa lặp cả hai phía cho cùng một lỗi.

### Dấu hiệu merge chưa khít

- Trang frontend vẫn báo lỗi nhưng API đã trả 200.
- API trả 200 nhưng response bị thiếu field hoặc sai kiểu ngày.
- Có thêm `.model` hoặc `database_to_model()` mới xuất hiện ở flow reader.
- Hai người cùng sửa một file lớn rồi mỗi bên giữ một kiểu dữ liệu khác nhau.

## 7) Cách kiểm tra nhanh sau khi ghép

Chạy các test API cơ bản:

- Login demo
- GET `/api/v1/borrows`
- POST `/api/v1/borrows/checkout`
- GET `/api/v1/wishlist`
- GET `/api/v1/cart`

Nếu cả 5 test này đều xanh trên đúng cổng backend mà frontend đang dùng thì ghép gần như đã khớp.

Nếu muốn kiểm tra nhanh bằng CLI, có thể dùng tài khoản demo đã seed trong `init_db.py`.

## 8) Ghi chú cuối

Hiện tại luồng mượn đã đi qua được, nên phần tiếp theo nên tập trung vào:

- ổn định giao diện 3 trang reader
- kiểm tra check-in/gia hạn
- dọn các chỗ còn dùng pattern cũ nếu phát sinh lỗi mới
