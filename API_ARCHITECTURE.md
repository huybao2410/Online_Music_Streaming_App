# 🏗️ Kiến Trúc API - Online Music Streaming App

## 📊 Tổng Quan

Ứng dụng sử dụng **2 backend song song**:

### 1️⃣ PHP API (Port 8081) - READ Operations
- **Vai trò**: Cung cấp dữ liệu bài hát cho **User Side**
- **URL**: `http://localhost:8081/music_API/online_music`
- **Database**: MySQL qua XAMPP
- **Endpoints**:
  - `GET /song/get_songs.php` - Lấy danh sách bài hát

**Sử dụng bởi:**
- ✅ `HomePage.jsx` - Hiển thị bài hát cho user
- ✅ `SongList.jsx` - Danh sách phát nhạc
- ✅ `SongManagementContent.jsx` - **Admin load bài hát** (READ)

### 2️⃣ Node.js API (Port 5000) - CRUD Operations  
- **Vai trò**: Xử lý thao tác **Admin CRUD** (Create, Update, Delete)
- **URL**: `http://localhost:5000/api`
- **Database**: MySQL qua mysql2 pool
- **Endpoints**:
  - `POST /songs` - Tạo bài hát mới (admin only)
  - `PUT /songs/:id` - Cập nhật bài hát (admin only)
  - `DELETE /songs/:id` - Xóa bài hát (admin only)
  - `GET /artists` - Lấy danh sách nghệ sĩ

**Sử dụng bởi:**
- ✅ `SongManagementContent.jsx` - **Admin thao tác CRUD** (CREATE, UPDATE, DELETE)

---

## 🔄 Luồng Dữ Liệu Admin

### **1. Load Bài Hát (READ)**
```
SongManagementContent → PHP API (port 8081) → get_songs.php → MySQL
```
```javascript
// fetchSongs() trong SongManagementContent.jsx
const response = await axios.get(`${PHP_API_URL}/song/get_songs.php`);
```

### **2. Thêm Bài Hát (CREATE)**
```
SongManagementContent → Node.js API (port 5000) → songs.js → MySQL
```
```javascript
// handleSubmit() - modalMode === "create"
const response = await axios.post(`${NODE_API_URL}/songs`, formData, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### **3. Sửa Bài Hát (UPDATE)**
```
SongManagementContent → Node.js API (port 5000) → songs.js → MySQL
```
```javascript
// handleSubmit() - modalMode === "edit"
const response = await axios.put(`${NODE_API_URL}/songs/${song_id}`, formData, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### **4. Xóa Bài Hát (DELETE)**
```
SongManagementContent → Node.js API (port 5000) → songs.js → MySQL
```
```javascript
// handleDelete()
const response = await axios.delete(`${NODE_API_URL}/songs/${songId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## 🗄️ Cấu Trúc Database

### **Bảng `songs`** (từ PHP API)
```sql
song_id      INT PRIMARY KEY
title        VARCHAR(255)
artist       VARCHAR(255)      -- Tên nghệ sĩ (text)
artist_id    INT               -- ID nghệ sĩ
album        VARCHAR(255)
genre        VARCHAR(100)
duration     INT               -- Giây
cover        VARCHAR(500)      -- URL ảnh bìa
audio        VARCHAR(500)      -- URL file nhạc
play_count   INT
```

### **Bảng `artists`** (Node.js API)
```sql
artist_id    INT PRIMARY KEY AUTO_INCREMENT
name         VARCHAR(100)
bio          TEXT
avatar_url   VARCHAR(500)
created_at   TIMESTAMP
```

---

## ⚙️ Cấu Hình

### **Frontend (React)**
```javascript
// SongManagementContent.jsx
const PHP_API_URL = "http://localhost:8081/music_API/online_music";
const NODE_API_URL = "http://localhost:5000/api";
```

### **Backend Node.js**
```env
# backend/.env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=music_app
PORT=5000
JWT_SECRET=your_secret_key
```

### **Backend PHP**
```
# XAMPP Apache đang chạy trên port 8081
DocumentRoot: C:\xampp\htdocs\music_API
```

---

## 🚀 Khởi Động Hệ Thống

### **1. Bật XAMPP**
```bash
# Bật Apache (PHP API)
# Bật MySQL
# Truy cập: http://localhost:8081/music_API/online_music/song/get_songs.php
```

### **2. Chạy Backend Node.js**
```bash
cd backend
npm run dev
# Server chạy tại: http://localhost:5000
```

### **3. Chạy Frontend**
```bash
cd frontend
npm start
# App chạy tại: http://localhost:3000
```

---

## 🐛 Troubleshooting

### ❌ "Không thể kết nối với PHP API server"
- **Nguyên nhân**: XAMPP Apache chưa chạy
- **Giải pháp**: 
  1. Mở XAMPP Control Panel
  2. Start Apache
  3. Kiểm tra port 8081 không bị chiếm dụng

### ❌ "Không thể thêm/sửa/xóa bài hát"
- **Nguyên nhân**: Node.js backend chưa chạy
- **Giải pháp**:
  ```bash
  cd backend
  npm run dev
  ```

### ❌ "Unknown column 's.id' in 'field list'"
- **Nguyên nhân**: Database structure khác với code
- **Giải pháp**: 
  - Admin load bài hát từ **PHP API** (không dùng Node.js API)
  - PHP API dùng `song_id`, không phải `id`

---

## 📝 Tóm Tắt

| Thao Tác | API | Port | File |
|----------|-----|------|------|
| Load bài hát (Admin) | PHP API | 8081 | `get_songs.php` |
| Load bài hát (User) | PHP API | 8081 | `get_songs.php` |
| Thêm bài hát | Node.js | 5000 | `backend/src/routes/songs.js` |
| Sửa bài hát | Node.js | 5000 | `backend/src/routes/songs.js` |
| Xóa bài hát | Node.js | 5000 | `backend/src/routes/songs.js` |
| Load artists | PHP API | 8081 | Extract từ `get_songs.php` |

**Lý do thiết kế này:**
- PHP API là legacy system đã có sẵn với dữ liệu
- Node.js API chỉ handle các thao tác admin (CRUD với authentication)
- Tránh duplicate data giữa 2 systems
