# Hướng dẫn chạy Database Migrations

## Các bảng mới được thêm:

### 1. favorite_artists
- Lưu nghệ sĩ yêu thích của user
- File: `backend/migrations/create_favorite_artists_table.sql`

### 2. subscription_plans và user_subscriptions
- Quản lý gói premium và subscriptions
- File: `backend/migrations/create_subscription_tables.sql`

## Cách chạy migrations:

### Cách 1: Qua phpMyAdmin (Khuyến nghị)
1. Mở XAMPP Control Panel
2. Start MySQL
3. Click "Admin" bên cạnh MySQL → mở phpMyAdmin
4. Chọn database `music_app`
5. Vào tab "SQL"
6. Copy nội dung từ file migration và paste vào
7. Click "Go" để chạy

### Cách 2: Qua MySQL Command Line
```bash
# Vào thư mục backend
cd backend

# Chạy migration favorite_artists
mysql -u root music_app < migrations/create_favorite_artists_table.sql

# Chạy migration subscriptions
mysql -u root music_app < migrations/create_subscription_tables.sql
```

### Cách 3: Node.js Script (Tự động)
```bash
# Trong thư mục backend
node migrations/run-migration.js
```

## Kiểm tra bảng đã tạo thành công:

```sql
-- Kiểm tra bảng favorite_artists
SELECT * FROM favorite_artists LIMIT 5;

-- Kiểm tra bảng subscription_plans
SELECT * FROM subscription_plans;

-- Kiểm tra bảng user_subscriptions
SELECT * FROM user_subscriptions LIMIT 5;
```

## Các API endpoints mới:

### Favorite Artists:
- GET `/api/favorite-artists` - Lấy nghệ sĩ yêu thích
- POST `/api/favorite-artists` - Thêm nghệ sĩ yêu thích
- DELETE `/api/favorite-artists/:artist_id` - Xóa nghệ sĩ yêu thích
- POST `/api/favorite-artists/bulk` - Lưu nhiều nghệ sĩ (onboarding)
- GET `/api/favorite-artists/check` - Kiểm tra đã chọn nghệ sĩ chưa

### Subscriptions:
- GET `/api/subscriptions/plans` - Lấy danh sách gói premium
- GET `/api/subscriptions/current` - Lấy subscription hiện tại
- POST `/api/subscriptions/create` - Tạo subscription mới
- POST `/api/subscriptions/cancel` - Hủy subscription
- GET `/api/subscriptions/check-premium` - Kiểm tra trạng thái premium

## Frontend routes mới:

- `/artist-selection` - Trang chọn nghệ sĩ yêu thích (onboarding)
- `/premium-subscribe` - Trang đăng ký Premium

## Luồng hoạt động:

### 1. User mới đăng ký:
1. Đăng ký tài khoản
2. Redirect đến `/artist-selection`
3. Chọn ít nhất 3 nghệ sĩ yêu thích
4. Lưu vào database qua API `/api/favorite-artists/bulk`
5. Redirect đến `/home`

### 2. User muốn nâng cấp Premium:
1. Vào trang `/premium-subscribe`
2. Chọn gói Premium (Monthly/Yearly)
3. Click "Nâng cấp ngay"
4. Tạo subscription qua API `/api/subscriptions/create`
5. Enjoy Premium features!

## Notes:
- Cần chạy migrations TRƯỚC KHI khởi động backend
- Default có 2 gói Premium: Monthly (59k) và Yearly (590k)
- Payment gateway chưa được tích hợp (TODO: VNPay/MoMo)
