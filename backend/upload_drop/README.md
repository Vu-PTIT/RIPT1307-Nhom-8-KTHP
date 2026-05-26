# Upload Drop Folder

Đặt các file ảnh bìa sách vào thư mục này:

- `backend/upload_drop/`

Script `backend/scripts/assign_drop_images.py` sẽ tự động:

1. Đọc ảnh trong `backend/upload_drop/` (jpg/jpeg/png/webp/gif)
2. Tìm `document_id` theo thứ tự:
   - tên file bắt đầu bằng object id 24 ký tự
   - mapping trong `mapping.csv`
   - tìm theo tiêu đề sách
3. Cập nhật `Document.cover_image` trong MongoDB
4. Di chuyển file vào `processed/` nếu thành công hoặc `failed/` nếu thất bại

## Cách chạy

```powershell
cd backend
py scripts\assign_drop_images.py
```

## Tên file nên sử dụng

File `mapping.csv` đã chứa các ánh xạ từ tên file sang `document_id` hiện có trong database.

Nếu bạn dùng tên file khác, script vẫn sẽ thử tìm sách theo tên file (stem của tên file).
