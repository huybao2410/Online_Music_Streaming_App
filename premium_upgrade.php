<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$servername = "127.0.0.1";
$username = "root";
$password = ""; // ⚠️ nếu ông dùng mật khẩu MySQL như 'dinh1806' thì đổi tại đây
$dbname = "music_app";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "❌ Lỗi DB: " . $conn->connect_error]);
    exit;
}

// Nhận dữ liệu từ React
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Không nhận được dữ liệu từ frontend"]);
    exit;
}

$user_id = $data["user_id"] ?? null;
$plan = $data["plan"] ?? "1 tháng";

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "Thiếu user_id"]);
    exit;
}

// Tính thời hạn hết hạn gói
switch ($plan) {
    case "1 tháng":
        $expire = date("Y-m-d H:i:s", strtotime("+1 month"));
        break;
    case "3 tháng":
        $expire = date("Y-m-d H:i:s", strtotime("+3 months"));
        break;
    case "1 năm":
        $expire = date("Y-m-d H:i:s", strtotime("+1 year"));
        break;
    default:
        $expire = date("Y-m-d H:i:s", strtotime("+1 month"));
}

// Cập nhật trong DB
$stmt = $conn->prepare("UPDATE users SET is_premium = 1, premium_expire = ? WHERE id = ?");
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Lỗi prepare: " . $conn->error]);
    exit;
}

$stmt->bind_param("si", $expire, $user_id);
if ($stmt->execute()) {
    echo json_encode([
        "status" => "success",
        "message" => "✅ Nâng cấp Premium thành công!",
        "expire" => $expire
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "❌ Không thể cập nhật tài khoản: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
