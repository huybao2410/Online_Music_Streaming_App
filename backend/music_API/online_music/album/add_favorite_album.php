<?php
header('Content-Type: application/json');
require_once '../_config.php'; // Kết nối DB, xác thực token

// Hàm lấy token từ header
function getBearerToken() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            if (preg_match('/Bearer\s(\S+)/', $value, $matches)) {
                return $matches[1];
            }
        }
    }
    return null;
}

// Hàm lấy user_id từ token (tùy hệ thống, ví dụ JWT)
function getUserIdFromToken($token) {
    // TODO: Thay bằng logic xác thực thực tế
    // Ví dụ: giải mã JWT lấy user_id
    // return $user_id;
    return isset($_GET['user_id']) ? intval($_GET['user_id']) : 0; // demo
}

// Lấy token và user_id
$token = getBearerToken();
$user_id = getUserIdFromToken($token);
$album_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$user_id || !$album_id) {
    echo json_encode(array('status' => false, 'message' => 'Thiếu thông tin'));
    exit;
}

// Kiểm tra đã tồn tại chưa
$stmt = $pdo->prepare('SELECT * FROM favorite_albums WHERE user_id = ? AND album_id = ?');
$stmt->execute(array($user_id, $album_id));
if ($stmt->fetch()) {
    echo json_encode(array('status' => false, 'message' => 'Đã có trong yêu thích'));
    exit;
}

// Thêm vào bảng favorite_albums
$stmt = $pdo->prepare('INSERT INTO favorite_albums (user_id, album_id) VALUES (?, ?)');
if ($stmt->execute(array($user_id, $album_id))) {
    echo json_encode(array('status' => true, 'message' => 'Đã thêm vào yêu thích'));
} else {
    echo json_encode(array('status' => false, 'message' => 'Lỗi hệ thống'));
}
?>
