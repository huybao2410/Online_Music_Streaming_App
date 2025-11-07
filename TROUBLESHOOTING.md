# Fix: Không Load Được Bài Hát

## Nguyên nhân:
- Bảng `songs` chưa tồn tại trong database
- API `/api/songs` mới được tạo nhưng chưa có dữ liệu

## Cách fix:

### Bước 1: Chạy Migration (Tạo bảng songs)

**Cách 1: Dùng node script**
```bash
cd backend/migrations
node run-songs-migration.js
```

**Cách 2: Chạy SQL trực tiếp trong MySQL**
1. Mở MySQL Workbench hoặc phpMyAdmin
2. Chọn database `music_streaming`
3. Copy nội dung file `backend/migrations/create_songs_table.sql`
4. Paste và Execute

### Bước 2: Kiểm tra Backend

**Khởi động backend:**
```bash
cd backend
npm start
```

**Kiểm tra log console:**
- Phải thấy: `Server running on port 5000`
- Phải thấy: `MySQL connected!`

**Test API bằng browser:**
```
http://localhost:5000/api/songs
```
Kết quả mong đợi:
```json
{
  "success": true,
  "songs": [...],
  "total": 3
}
```

### Bước 3: Kiểm tra Frontend

**Mở Console (F12):**
- Vào tab "Music" trong HomePage
- Xem logs:
  - `Fetching songs...`
  - `Songs received: [...]`

**Nếu thấy lỗi:**
- Check proxy trong `frontend/package.json` có `"proxy": "http://localhost:5000"`
- Check `.env` có `REACT_APP_API_URL=http://localhost:5000/api`

### Bước 4: Nếu vẫn lỗi

**Kiểm tra database:**
```sql
-- Xem các bảng
SHOW TABLES;

-- Xem cấu trúc bảng songs
DESCRIBE songs;

-- Đếm số bài hát
SELECT COUNT(*) FROM songs;

-- Xem dữ liệu
SELECT * FROM songs;
```

**Thêm data test:**
```sql
INSERT INTO songs (title, artist_id, album, duration, genre) 
VALUES 
('Bài Hát Test 1', 1, 'Album Test', 180, 'Pop'),
('Bài Hát Test 2', 1, 'Album Test', 210, 'Rock'),
('Bài Hát Test 3', 1, 'Album Test', 240, 'Jazz');
```

## Debug Checklist:

- [ ] Backend đang chạy (port 5000)
- [ ] Database connected
- [ ] Bảng `songs` tồn tại
- [ ] Bảng có ít nhất 1 bài hát
- [ ] API `/api/songs` trả về data
- [ ] Frontend có proxy hoặc REACT_APP_API_URL
- [ ] Console không có lỗi CORS
- [ ] Console log "Songs received"

## Các file đã tạo:

1. `backend/src/routes/songs.js` - API routes
2. `backend/migrations/create_songs_table.sql` - SQL migration
3. `backend/migrations/run-songs-migration.js` - Migration runner
4. `frontend/src/services/songService.js` - Updated service

## Next Steps:

Sau khi fix xong, bạn sẽ thấy:
- Danh sách bài hát hiển thị trong tab "Music"
- Số lượng bài hát: `Danh sách bài hát (3)`
- Có thể click vào để phát nhạc
