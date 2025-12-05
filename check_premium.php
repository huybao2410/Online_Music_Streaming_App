<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

$user_id = $_GET["user_id"] ?? null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "Thiếu user_id"]);
    exit;
}

$conn = new mysqli("127.0.0.1", "root", "", "music_app");

if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => $conn->connect_error]);
    exit;
}

// ⭐ Kiểm tra gói Premium còn hạn hay không
$sql = "
    SELECT 
        id,
        start_date,
        end_date,
        status
    FROM user_subscriptions
    WHERE user_id = ?
      AND status = 'active'
      AND NOW() BETWEEN start_date AND end_date
    LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    
    echo json_encode([
        "status" => "success",
        "is_premium" => true,
        "subscription_id" => $row["id"],
        "start_date" => $row["start_date"],
        "end_date" => $row["end_date"]
    ]);

} else {

    echo json_encode([
        "status" => "success",
        "is_premium" => false
    ]);
}

$stmt->close();
$conn->close();
?>
