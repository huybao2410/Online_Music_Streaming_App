# 🚀 Hướng dẫn chạy ứng dụng

## Bước 1: Khởi động Backend (BẮT BUỘC)

### Windows:
```bash
# Terminal 1 - Backend
cd backend
npm run dev
```

Backend sẽ chạy trên: `http://localhost:5000`

**Kiểm tra backend đã chạy:**
- Mở trình duyệt: `http://localhost:5000/api/health`
- Nếu thấy `{"message": "Backend is running"}` → OK ✅

## Bước 2: Khởi động Frontend

### Windows:
```bash
# Terminal 2 - Frontend
cd frontend
npm start
```

Frontend sẽ chạy trên: `http://localhost:3000`

---

## 🔧 Nếu gặp lỗi "Không thể tải danh sách bài hát"

### 1. Kiểm tra Backend đã chạy chưa:
```bash
# Kiểm tra process đang chạy
netstat -ano | findstr :5000
```

Nếu không thấy gì → Backend chưa chạy!

### 2. Kiểm tra database đã kết nối:
- Mở MySQL/XAMPP
- Đảm bảo database `music_app` đã tồn tại
- Kiểm tra file `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=music_app
PORT=5000
```

### 3. Kiểm tra console logs:
- Mở DevTools (F12) trong trình duyệt
- Vào tab Console
- Xem có lỗi gì không:
  - ❌ `ERR_NETWORK` → Backend chưa chạy
  - ❌ `404` → Route không đúng
  - ❌ `500` → Lỗi database

### 4. Test API trực tiếp:
```bash
# Test songs API
curl http://localhost:5000/api/songs

# Test artists API
curl http://localhost:5000/api/artists
```

---

## 📋 Checklist

- [ ] MySQL/XAMPP đã chạy
- [ ] Database `music_app` đã tồn tại
- [ ] File `backend/.env` đã cấu hình đúng
- [ ] Backend đã chạy (port 5000)
- [ ] Frontend đã chạy (port 3000)
- [ ] Đã test API: `http://localhost:5000/api/health`

---

## 🎯 Sau khi khởi động thành công:

1. Truy cập: `http://localhost:3000/login`
2. Đăng nhập admin: `admin1@example.com` / `123456`
3. Vào Admin Dashboard: `http://localhost:3000/admin`
4. Click "Bài hát" trong sidebar
5. Thấy danh sách bài hát từ database

---

## 💡 Tips

- Backend PHẢI chạy trước Frontend
- Nếu thay đổi code backend, cần restart server
- Nếu lỗi CORS: Kiểm tra `backend/src/server.js` dòng `cors()`
- Nếu lỗi kết nối DB: Kiểm tra MySQL đang chạy chưa

---

**Gặp vấn đề?** Xem console log để biết chi tiết lỗi!
