# Hướng dẫn Upload Hàng Loạt Ảnh Sách

Có 3 cách để upload hàng loạt ảnh sách:

---

## **Cách 1: API Endpoint (Khuyến nghị)**

### Endpoint
```
POST /api/v1/documents/bulk/upload-images
```

### Request Format (JSON)
```json
[
  {
    "document_id": "507f1f77bcf86cd799439011",
    "cover_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  },
  {
    "document_id": "507f1f77bcf86cd799439012",
    "cover_image": "data:image/png;base64,iVBORw0KGgo..."
  }
]
```

### Response
```json
{
  "success": 2,
  "failed": 0,
  "results": [
    {
      "document_id": "507f1f77bcf86cd799439011",
      "status": "success"
    },
    {
      "document_id": "507f1f77bcf86cd799439012",
      "status": "success"
    }
  ]
}
```

### Cách sử dụng:
```bash
# Cần token JWT
curl -X POST http://localhost:8000/api/v1/documents/bulk/upload-images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "document_id": "507f1f77bcf86cd799439011",
      "cover_image": "data:image/jpeg;base64,..."
    }
  ]'
```

---

## **Cách 2: Script Python (Dùng CSV)**

### Bước 1: Chuẩn bị CSV file
Tạo file `books.csv`:
```csv
document_id,image_filename
507f1f77bcf86cd799439011,book1.jpg
507f1f77bcf86cd799439012,book2.jpg
507f1f77bcf86cd799439013,book3.png
```

### Bước 2: Chuẩn bị ảnh
Tạo folder `/path/to/images/` chứa:
```
images/
├── book1.jpg
├── book2.jpg
└── book3.png
```

### Bước 3: Chạy script
```bash
cd backend
python scripts/bulk_upload_book_images.py \
  --image-folder "/path/to/images" \
  --csv-file "books.csv" \
  --username "librarian@example.com" \
  --password "password"
```

**Output:**
```
🔐 Authenticating...
✅ Authenticated
✓ Loaded: book1.jpg (507f1f77bcf86cd799439011)
✓ Loaded: book2.jpg (507f1f77bcf86cd799439012)
✓ Loaded: book3.png (507f1f77bcf86cd799439013)

📤 Uploading 3 images...
✅ Upload complete!
   Success: 3
   Failed: 0
```

---

## **Cách 3: Script Python (Tìm bằng tên file)**

### Bước 1: Chuẩn bị ảnh
Đặt ảnh vào folder với tên file **giống tên sách**:
```
images/
├── The Great Gatsby.jpg
├── To Kill a Mockingbird.jpg
└── 1984.png
```

### Bước 2: Chạy script
```bash
cd backend
python scripts/bulk_upload_book_images.py \
  --image-folder "/path/to/images" \
  --match-by-title \
  --username "librarian@example.com" \
  --password "password"
```

**Output:**
```
📁 Scanning /path/to/images...
Found 3 image files
🔍 Looking for: The Great Gatsby
   ✓ Found: The Great Gatsby (507f1f77bcf86cd799439011)
🔍 Looking for: To Kill a Mockingbird
   ✓ Found: To Kill a Mockingbird (507f1f77bcf86cd799439012)
🔍 Looking for: 1984
   ✓ Found: 1984 (507f1f77bcf86cd799439013)

📤 Uploading 3 images...
✅ Upload complete!
   Success: 3
   Failed: 0
```

---

## **Hướng dẫn lấy Document ID**

### Cách 1: Từ API search documents
```bash
curl "http://localhost:8000/api/v1/documents?keyword=sach&page=1"
```

Response:
```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Tên sách",
      "author": "Tác giả"
    }
  ]
}
```

### Cách 2: Từ database (MongoDB)
```bash
# Kết nối MongoDB
mongosh mongodb://localhost:27017/app_db

# Query
db.document.find({}, {_id: 1, title: 1})
```

### Cách 3: Xuất danh sách document để dùng mapping (CSV)
```bash
cd backend
python scripts/export_document_titles.py
```

Sẽ tạo file `backend/scripts/document_title_map.csv` với hai cột `document_id,title`.

---

## **Cài đặt Environment (nếu cần)**

Tạo file `.env` trong folder `backend/`:
```
API_BASE_URL=http://localhost:8000
TEST_USERNAME=librarian@example.com
TEST_PASSWORD=password
```

---

## **Troubleshooting**

### "Document not found"
- Kiểm tra document_id có chính xác không
- Kiểm tra document đó có tồn tại trong database

### "Invalid image format"
- Đảm bảo ảnh là JPEG, PNG, WebP hoặc GIF
- Kiểm tra file không bị hỏng

### "CSV file not found"
- Kiểm tra đường dẫn CSV file có chính xác không
- CSV phải có header: `document_id,image_filename`

### "Authentication failed"
- Kiểm tra username/password có chính xác không
- Kiểm tra user có role Librarian hoặc Admin không

---

## **Cách 4: Dán ảnh vào thư mục (Drop folder) — TỰ ĐỘNG**

Bạn có thể chỉ cần dán file ảnh vào thư mục `backend/upload_drop` — script giám sát sẽ tự động xử lý và gán ảnh vào sách tương ứng.

Quy tắc lấy `document_id`:
- Nếu tên file bắt đầu bằng ObjectId (24 hex) thì dùng id đó.
- Nếu có file `mapping.csv` trong thư mục `upload_drop` thì dùng mapping (format: `filename,document_id`).
- Nếu không có mapping, script sẽ gọi API search theo tiêu đề (tên file không có phần mở rộng) và dùng kết quả phù hợp nhất.
- Script hiện hỗ trợ chuẩn hóa (bỏ dấu, chữ hoa/chữ thường, khoảng trắng) và khớp gần khi tên file giống tên sách.

Sau khi xử lý, file sẽ được di chuyển vào `upload_drop/processed` (thành công) hoặc `upload_drop/failed` (thất bại).

Chạy watcher:
```
cd backend
python scripts/watch_upload_folder.py
```

ENV variables (trong `.env`):
- `API_BASE_URL` (mặc định `http://localhost:8000`)
- `WATCH_USERNAME`, `WATCH_PASSWORD` (hoặc `TEST_USERNAME`, `TEST_PASSWORD`) dùng để lấy token

Ví dụ sử dụng `mapping.csv`:
```
book1.jpg,507f1f77bcf86cd799439011
The Great Gatsby.jpg,507f1f77bcf86cd799439012
```


---

## **Tips**

- **Kích thước ảnh**: Script tự động nén ảnh xuống (tối đa 1024x1024)
- **Format**: Hỗ trợ JPG, PNG, WebP, GIF
- **Batch**: Có thể upload cùng lúc hàng chục/trăm ảnh
- **Performance**: Script chạy tuần tự, mỗi ảnh ~1-2 giây

---

## **Ví dụ thực tế**

### CSV file example
```csv
document_id,image_filename
507f1f77bcf86cd799439001,Harry Potter.jpg
507f1f77bcf86cd799439002,The Hobbit.png
507f1f77bcf86cd799439003,LOTR Fellowship.jpg
507f1f77bcf86cd799439004,LOTR Two Towers.jpg
507f1f77bcf86cd799439005,LOTR Return.jpg
```

### Lệnh chạy
```bash
# Đảm bảo bạn có:
# - Folder images/ chứa các file JPG/PNG
# - File books.csv có danh sách document_id
# - Tài khoản librarian đã có trong DB

python scripts/bulk_upload_book_images.py \
  --image-folder "C:\KTHP\RIPT1307-Nhom-8-KTHP\backend\images" \
  --csv-file "C:\KTHP\RIPT1307-Nhom-8-KTHP\backend\books.csv" \
  --username "librarian@example.com" \
  --password "password" \
  --api-url "http://localhost:8000"
```
