<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$mysqli = new mysqli("127.0.0.1", "root", "", "music_app");
if ($mysqli->connect_errno) {
    echo json_encode(["status" => false, "message" => "Lỗi kết nối CSDL"]);
    exit;
}

$albumId = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($albumId <= 0) {
    echo json_encode(["status" => false, "message" => "Thiếu album id"]);
    exit;
}

try {
    // 🔥 Lấy thông tin album + nghệ sĩ
    $albumQuery = "
        SELECT 
            a.album_id,
            a.name AS album_name,
            a.description,
            a.cover_url,
            a.release_date,
            ar.artist_id,
            ar.name AS artist_name
        FROM albums a
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id
        WHERE a.album_id = ?
    ";

    $stmt = $mysqli->prepare($albumQuery);
    $stmt->bind_param("i", $albumId);
    $stmt->execute();
    $albumRes = $stmt->get_result();

    if ($albumRes->num_rows === 0) {
        echo json_encode(["status" => false, "message" => "Không tìm thấy album"]);
        exit;
    }

    $row = $albumRes->fetch_assoc();

    // Tạo object album
    $albumInfo = [
        "album_id"      => (int)$row["album_id"],
        "name"          => $row["album_name"],
        "artist"        => $row["artist_name"],
        "artist_id"     => (int)$row["artist_id"],
        "description"   => $row["description"],
        "cover_url"     => $row["cover_url"],
        "release_date"  => $row["release_date"],
        "songs"         => []
    ];


    // 🔥 Lấy danh sách bài hát của album qua bảng album_songs
    $songQuery = "
        SELECT 
            s.song_id,
            s.title,
            s.audio_url,
            s.cover_url,
            s.duration,
            als.track_number
        FROM album_songs als
        JOIN songs s ON als.song_id = s.song_id
        WHERE als.album_id = ?
        ORDER BY als.track_number ASC, s.song_id ASC
    ";

    $stmt2 = $mysqli->prepare($songQuery);
    $stmt2->bind_param("i", $albumId);
    $stmt2->execute();
    $songsRes = $stmt2->get_result();

    while ($song = $songsRes->fetch_assoc()) {
        $albumInfo["songs"][] = [
            "song_id"      => (int)$song["song_id"],
            "title"        => $song["title"],
            "audio_url"    => $song["audio_url"],
            "cover_url"    => $song["cover_url"],
            "duration"     => (int)$song["duration"],
            "track_number" => (int)$song["track_number"]
        ];
    }

    $albumInfo["song_count"] = count($albumInfo["songs"]);

    echo json_encode([
        "status" => true,
        "album"  => $albumInfo,
        "songs"  => $albumInfo["songs"]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(["status" => false, "message" => $e->getMessage()]);
}

$mysqli->close();
?>