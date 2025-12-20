<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = new mysqli("127.0.0.1", "root", "", "music_app");
if ($conn->connect_errno) {
    echo json_encode(["status" => false, "message" => "Kết nối CSDL thất bại"]);
    exit();
}

$user_id = $_GET['user_id'] ?? '';
$album_id = $_GET['album_id'] ?? '';

if (!$user_id || !$album_id) {
    echo json_encode(["status" => false, "message" => "Thiếu user_id hoặc album_id"]);
    exit();
}

$sql = "SELECT 1 FROM favorite_albums WHERE user_id = ? AND album_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $user_id, $album_id);
$stmt->execute();
$result = $stmt->get_result();

$isFavorite = $result->num_rows > 0;

echo json_encode([
    "status" => true,
    "is_favorite" => $isFavorite
]);

$stmt->close();
$conn->close();
?>
