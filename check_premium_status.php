<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

$servername = "127.0.0.1";
$username = "root";
$password = ""; // đổi nếu cần
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

$stmt = $conn->prepare("SELECT is_premium, premium_expire FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    echo json_encode(["status" => false, "message" => "Không tìm thấy user"]);
    exit;
}

$is_premium = (int)$user["is_premium"];
$expire = $user["premium_expire"];
$current_time = date("Y-m-d H:i:s");

if ($is_premium === 1 && $expire && $expire < $current_time) {
    // Đã hết hạn → set về user thường
    $update = $conn->prepare("UPDATE users SET is_premium = 0 WHERE id = ?");
    $update->bind_param("i", $user_id);
    $update->execute();

    echo json_encode([
        "status" => "expired",
        "message" => "Gói Premium của bạn đã hết hạn.",
        "expire" => $expire
    ]);
} else if ($is_premium === 1) {
    echo json_encode([
        "status" => "active",
        "message" => "Premium còn hiệu lực.",
        "expire" => $expire
    ]);
} else {
    echo json_encode([
        "status" => "none",
        "message" => "Bạn chưa có gói Premium."
    ]);
}

$conn->close();
?>
