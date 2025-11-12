# 🎵 Hướng dẫn sử dụng Quản lý Bài hát (Admin)

## ✅ Đã hoàn thành

### 1. **Component SongManagement.jsx**
Trang quản lý bài hát hoàn chỉnh với các tính năng:

- ✅ **Hiển thị danh sách** bài hát dạng bảng (table)
- ✅ **Tìm kiếm** theo tên bài hát hoặc nghệ sĩ
- ✅ **Lọc** theo nghệ sĩ
- ✅ **Phân trang** (10 bài/trang)
- ✅ **Thêm bài hát mới** với upload cover + audio
- ✅ **Chỉnh sửa** thông tin bài hát
- ✅ **Xóa** bài hát (có xác nhận)
- ✅ **Thống kê** tổng số bài hát

### 2. **AdminLayout Component**
Layout wrapper cho các trang admin với:

- ✅ Sidebar navigation cố định
- ✅ Header với thông báo
- ✅ Responsive design
- ✅ User info + logout button

### 3. **Routing**
- ✅ `/admin` - Dashboard tổng quan
- ✅ `/admin/songs` - Quản lý bài hát
- ✅ `/admin/artists` - Quản lý nghệ sĩ (route đã tạo)
- ✅ `/admin/users` - Quản lý người dùng (route đã tạo)

---

## 🚀 Cách sử dụng

### 1. **Khởi động Backend**
```bash
cd backend
npm install
npm run dev
```
Backend sẽ chạy trên: `http://localhost:5000`

### 2. **Khởi động Frontend**
```bash
cd frontend
npm install
npm start
```
Frontend sẽ chạy trên: `http://localhost:3000`

### 3. **Đăng nhập Admin**
- Truy cập: `http://localhost:3000/login`
- Sử dụng tài khoản admin:
  - Email: `admin1@example.com`
  - Password: `123456` (hoặc password bạn đã tạo)

### 4. **Truy cập Quản lý Bài hát**
- Sau khi đăng nhập, click vào menu **"Bài hát"** trong sidebar
- Hoặc truy cập trực tiếp: `http://localhost:3000/admin/songs`

---

## 📋 Các chức năng chính

### 🔍 **Tìm kiếm & Lọc**
1. Gõ từ khóa vào ô tìm kiếm để tìm theo tên bài hát/nghệ sĩ
2. Chọn nghệ sĩ từ dropdown để lọc
3. Click "Đặt lại bộ lọc" để xóa tất cả filter

### ➕ **Thêm bài hát mới**
1. Click nút **"Thêm bài hát mới"** (góc trên phải)
2. Điền thông tin:
   - **Tên bài hát** (bắt buộc)
   - **Nghệ sĩ** (bắt buộc - chọn từ danh sách)
   - **Thể loại** (tùy chọn)
   - **Album** (tùy chọn)
   - **Thời lượng** (tùy chọn, đơn vị: giây)
   - **Ảnh bìa** (khuyến nghị, tối đa 5MB)
   - **File nhạc** (bắt buộc, tối đa 50MB)
3. Click **"Thêm bài hát"**

### ✏️ **Chỉnh sửa bài hát**
1. Click icon **✏️ (Edit)** ở cột "Thao tác"
2. Cập nhật thông tin cần thay đổi
3. Upload file mới (cover/audio) nếu muốn thay thế
4. Click **"Cập nhật"**

### 🗑️ **Xóa bài hát**
1. Click icon **🗑️ (Delete)** ở cột "Thao tác"
2. Xác nhận xóa trong dialog
3. Bài hát và các file liên quan sẽ bị xóa vĩnh viễn

---

## 🎨 Giao diện

### **Bảng danh sách bài hát hiển thị:**
- ID
- Ảnh cover (thumbnail 50x50px)
- Tên bài hát
- Nghệ sĩ
- Thể loại
- Album
- Thời lượng (mm:ss)
- Ngày tạo
- Thao tác (Edit/Delete)

### **Thanh thống kê:**
- Tổng số bài hát
- Trang hiện tại / Tổng số trang

### **Phân trang:**
- Nút "Trước" / "Sau"
- Các số trang (với dấu ... khi có nhiều trang)
- Highlight trang hiện tại

---

## 🔧 API Endpoints được sử dụng

### Backend Node.js (http://localhost:5000)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/songs` | Lấy danh sách bài hát (có phân trang, search, filter) |
| GET | `/api/songs/:id` | Lấy chi tiết 1 bài hát |
| POST | `/api/songs` | Thêm bài hát mới (admin only) |
| PUT | `/api/songs/:id` | Cập nhật bài hát (admin only) |
| DELETE | `/api/songs/:id` | Xóa bài hát (admin only) |
| GET | `/api/artists` | Lấy danh sách nghệ sĩ |

---

## 📝 Lưu ý quan trọng

### ⚠️ **Về Upload Files:**
- **Cover image**: Chỉ chấp nhận JPG, PNG, GIF, WEBP. Tối đa 5MB
- **Audio file**: Chỉ chấp nhận MP3, WAV, M4A, FLAC. Tối đa 50MB
- Files được lưu trong thư mục:
  - Cover: `backend/uploads/song-covers/`
  - Audio: `backend/uploads/songs/`

### ⚠️ **Về Authentication:**
- Tất cả các thao tác CRUD yêu cầu:
  - Token JWT trong localStorage
  - Role = "admin"
- Token được gửi qua header: `Authorization: Bearer <token>`

### ⚠️ **Về Database:**
- Bảng `songs` liên kết với bảng `artists` qua `artist_id`
- Khi xóa nghệ sĩ, các bài hát liên quan sẽ bị ảnh hưởng
- Khuyến nghị: Kiểm tra constraints trong database

---

## 🐛 Xử lý lỗi

### **"Không thể tải danh sách bài hát"**
- Kiểm tra backend đã chạy chưa
- Kiểm tra kết nối database
- Xem console log để biết chi tiết

### **"Bạn cần đăng nhập để thực hiện thao tác này"**
- Token hết hạn hoặc không hợp lệ
- Đăng nhập lại

### **"Có lỗi xảy ra khi lưu bài hát"**
- Kiểm tra dung lượng file
- Kiểm tra định dạng file
- Kiểm tra nghệ sĩ đã tồn tại chưa
- Xem response error từ server

---

## 🎯 Tính năng sắp tới (Có thể mở rộng)

- [ ] Bulk upload (upload nhiều bài cùng lúc)
- [ ] Preview audio trước khi upload
- [ ] Crop/resize ảnh cover
- [ ] Export danh sách bài hát ra Excel
- [ ] Import từ file CSV
- [ ] Quản lý genres riêng
- [ ] Gắn thẻ (tags) cho bài hát
- [ ] Thống kê số lượt phát
- [ ] Bình luận/đánh giá bài hát

---

## 🛠️ Tech Stack

- **Frontend:** React 19.1.1, React Router, Axios
- **Backend:** Node.js, Express, MySQL
- **Upload:** Multer
- **Icons:** React Icons (FaMusic, FaEdit, FaTrash, etc.)
- **Styling:** Custom CSS với gradient và animations

---

## 📧 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console log (F12)
2. Kiểm tra backend logs
3. Kiểm tra database connection
4. Xem file TROUBLESHOOTING.md

---

**🎉 Chúc bạn quản lý bài hát thành công!**
