<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$servername = "127.0.0.1";
$username = "root";
$password = ""; // đổi theo máy ông
$dbname = "music_app";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["status" => false, "message" => "Lỗi MySQL: " . $conn->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data["user_id"] ?? null;

if (!$user_id) {
    echo json_encode(["status" => false, "message" => "Thiếu user_id"]);
    exit;
}

$stmt = $conn->prepare("UPDATE users SET is_premium = 0, premium_expire = NULL WHERE id = ?");
$stmt->bind_param("i", $user_id);
if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Đã hủy gói Premium"]);
} else {
    echo json_encode(["status" => "error", "message" => "Không thể cập nhật dữ liệu"]);
}

$conn->close();
?>
