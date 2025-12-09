<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../../config.php";

$artist_id = isset($_POST['artist_id']) ? intval($_POST['artist_id']) : 0;
if ($artist_id <= 0) {
    echo json_encode(["status" => false, "message" => "Thiếu ID nghệ sĩ"]);
    exit;
}

// Kiểm tra nghệ sĩ còn bài hát không
$stmt = $conn->prepare("SELECT COUNT(*) AS total FROM song_artists WHERE artist_id = ?");
$stmt->bind_param("i", $artist_id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
if ($row['total'] > 0) {
    echo json_encode(["status" => false, "message" => "Nghệ sĩ vẫn còn bài hát, không thể xóa!"]);
    exit;
}

// Xóa file avatar nếu có
$resAvt = $conn->prepare("SELECT avatar_url FROM artists WHERE artist_id = ?");
$resAvt->bind_param("i", $artist_id);
$resAvt->execute();
$avtRes = $resAvt->get_result();
$avtRow = $avtRes->fetch_assoc();
if ($avtRow && !empty($avtRow['avatar_url'])) {
    $avatarUrl = $avtRow['avatar_url'];
    $filename = basename($avatarUrl);
    $avatarDir = __DIR__ . "/../artist_avatar";
    $avatarPath = $avatarDir . "/" . $filename;
    if (file_exists($avatarPath)) {
        unlink($avatarPath);
    }
}

// Xóa nghệ sĩ
$stmtDel = $conn->prepare("DELETE FROM artists WHERE artist_id = ?");
$stmtDel->bind_param("i", $artist_id);
$stmtDel->execute();
if ($stmtDel->affected_rows > 0) {
    echo json_encode(["status" => true, "message" => "Đã xóa nghệ sĩ thành công!"]);
} else {
    echo json_encode(["status" => false, "message" => "Không tìm thấy nghệ sĩ hoặc lỗi khi xóa!"]);
}
?>
