<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");


$conn = new mysqli("127.0.0.1", "root", "", "music_app");
if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}


$genre_id = isset($_GET['genre_id']) ? intval($_GET['genre_id']) : 0;
$genre_name = isset($_GET['genre_name']) ? trim($_GET['genre_name']) : '';
if ($genre_id > 0) {
    $stmt = $conn->prepare("
        SELECT s.song_id, s.title, g.name AS genre, s.audio_url, s.cover_url, s.duration, s.release_date, s.play_count,
               GROUP_CONCAT(a.name SEPARATOR ', ') AS artist
        FROM songs s
        LEFT JOIN genres g ON s.genre_id = g.genre_id
        LEFT JOIN song_artists sa ON sa.song_id = s.song_id
        LEFT JOIN artists a ON a.artist_id = sa.artist_id
        WHERE s.genre_id = ?
        GROUP BY s.song_id
        ORDER BY s.play_count DESC, s.song_id DESC
        LIMIT 20
    ");
    $stmt->bind_param("i", $genre_id);
    $stmt->execute();
    $result = $stmt->get_result();
} elseif ($genre_name !== '') {
    $stmt = $conn->prepare("
        SELECT s.song_id, s.title, g.name AS genre, s.audio_url, s.cover_url, s.duration, s.release_date, s.play_count,
               GROUP_CONCAT(a.name SEPARATOR ', ') AS artist
        FROM songs s
        LEFT JOIN genres g ON s.genre_id = g.genre_id
        LEFT JOIN song_artists sa ON sa.song_id = s.song_id
        LEFT JOIN artists a ON a.artist_id = sa.artist_id
        WHERE g.name = ?
        GROUP BY s.song_id
        ORDER BY s.play_count DESC, s.song_id DESC
        LIMIT 20
    ");
    $stmt->bind_param("s", $genre_name);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $sql = "CALL get_top_songs()";
    $result = $conn->query($sql);
}

if (!$result) {
    echo json_encode([
        "status" => "error",
        "message" => "Query failed: " . $conn->error
    ]);
    exit;
}

$base = "http://10.0.2.2:8081/music_API/online_music";


$songs = [];

while ($row = $result->fetch_assoc()) {
    $audioUrl = $row["audio_url"] ?: "$base/audio/default.mp3";
    $coverUrl = $row["cover_url"] ?: "$base/cover/default.png";

    $songs[] = [
        "song_id" => (int)$row["song_id"],
        "title" => $row["title"],
        "artist" => $row["artist"] ?? "Không rõ",
        "genre" => $row["genre"] ?? "Không rõ",
        "audio_url" => $audioUrl,      
        "cover_url" => $coverUrl,  
        "duration" => (int)($row["duration"] ?? 0),
        "release_date" => $row["release_date"] ?? null,
        "play_count" => (int)$row["play_count"]
    ];
}

// 🔹 Trả kết quả JSON
echo json_encode([
    "status" => "success",
    "count" => count($songs),
    "songs" => $songs
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

$conn->close();
?>
