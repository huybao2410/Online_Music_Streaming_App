-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 20, 2025 at 12:14 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `music_app`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `AddOrUpdateDownloadedSong` (IN `p_user_id` INT, IN `p_song_id` INT, IN `p_title` VARCHAR(255), IN `p_artist` VARCHAR(255), IN `p_cover_url` VARCHAR(255), IN `p_duration` INT, IN `p_local_path` VARCHAR(255))   BEGIN
    INSERT INTO downloaded_songs (user_id, song_id, title, artist, cover_url, duration, local_path)
    VALUES (p_user_id, p_song_id, p_title, p_artist, p_cover_url, p_duration, p_local_path)
    ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        artist = VALUES(artist),
        cover_url = VALUES(cover_url),
        duration = VALUES(duration),
        local_path = VALUES(local_path),
        downloaded_at = CURRENT_TIMESTAMP;  -- cập nhật thời gian tải mới nhất
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `AddSongToPlaylist` (IN `p_user_id` INT, IN `p_playlist_id` INT, IN `p_song_id` INT)   BEGIN
    DECLARE v_count INT DEFAULT 0;

    -- Kiểm tra xem playlist có thuộc về user này không
    SELECT COUNT(*) INTO v_count
    FROM playlists
    WHERE playlist_id = p_playlist_id AND user_id = p_user_id;

    IF v_count = 0 THEN
        -- Nếu không có quyền, trả về lỗi
        SELECT 'error' AS status, 'Không tìm thấy playlist hoặc không thuộc về user này' AS message;
    ELSE
        -- Nếu hợp lệ, thêm bài hát vào playlist (nếu chưa có)
        INSERT IGNORE INTO playlist_songs (playlist_id, song_id)
        VALUES (p_playlist_id, p_song_id);
        SELECT 'success' AS status, 'Đã thêm bài hát vào playlist' AS message;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `CreatePlaylist` (IN `p_user_id` INT, IN `p_name` VARCHAR(100))   BEGIN
    DECLARE v_count INT DEFAULT 0;

    -- Kiểm tra playlist đã tồn tại cho user chưa
    SELECT COUNT(*) INTO v_count
    FROM playlists
    WHERE user_id = p_user_id AND name = p_name;

    IF v_count > 0 THEN
        -- Nếu đã tồn tại playlist cùng tên
        SELECT 'error' AS status, 'Playlist này đã tồn tại' AS message, NULL AS playlist_id;
    ELSE
        -- Nếu chưa tồn tại thì thêm mới
        INSERT INTO playlists (user_id, name)
        VALUES (p_user_id, p_name);

        SELECT 
            'success' AS status, 
            'Tạo playlist thành công!' AS message,
            LAST_INSERT_ID() AS playlist_id;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetAllAlbumsWithSongs` ()   BEGIN
    SELECT 
        al.album_id,
        al.name AS album_name,
        al.description,
        al.cover_url,
        al.release_date,
        ar.artist_id,
        ar.name AS artist_name,
        COUNT(asg.song_id) AS song_count
    FROM albums al
    LEFT JOIN artists ar ON al.artist_id = ar.artist_id
    LEFT JOIN album_songs asg ON al.album_id = asg.album_id
    GROUP BY al.album_id
    ORDER BY al.album_id DESC;

    SELECT 
        asg.album_id,
        s.song_id,
        s.title,
        s.audio_url,
        s.cover_url,
        s.duration,
        a.name AS artist_name,
        asg.track_number
    FROM album_songs asg
    INNER JOIN songs s ON asg.song_id = s.song_id
    LEFT JOIN artists a ON s.artist_id = a.artist_id
    ORDER BY asg.album_id ASC, asg.track_number ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetAllSongs` ()   BEGIN
    SELECT 
        s.song_id,
        s.title,
        s.duration,
        s.audio_url,
        s.cover_url,
        s.release_date,
        s.play_count,
        COALESCE(
            GROUP_CONCAT(DISTINCT ar.name ORDER BY ar.name SEPARATOR ', '),
            'Không rõ'
        ) AS artist_names,
        g.name AS genre_name
    FROM songs s
    LEFT JOIN song_artists sa ON sa.song_id = s.song_id
    LEFT JOIN artists ar ON sa.artist_id = ar.artist_id
    LEFT JOIN genres g ON s.genre_id = g.genre_id
    GROUP BY 
        s.song_id,
        s.title,
        s.duration,
        s.audio_url,
        s.cover_url,
        s.release_date,
        s.play_count,
        g.name
    ORDER BY s.song_id DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetDownloadedSongsByUser` (IN `p_user_id` INT)   BEGIN
    SELECT 
        song_id,
        title,
        artist,
        cover_url,
        duration,
        local_path
    FROM downloaded_songs
    WHERE user_id = p_user_id
    ORDER BY downloaded_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetFavoriteAlbums` (IN `p_user_id` VARCHAR(50))   BEGIN
    SELECT 
        al.album_id,
        al.name,
        al.description,
        al.cover_url
    FROM favorite_albums fa
    JOIN albums al ON fa.album_id = al.album_id
    WHERE fa.user_id = p_user_id
    ORDER BY fa.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetSongsByAlbum` (IN `p_album_id` INT)   BEGIN
    SELECT 
        s.song_id,
        s.title,
        s.duration,
        s.audio_url,
        s.cover_url,
        COALESCE(
            GROUP_CONCAT(DISTINCT ar.name ORDER BY ar.name SEPARATOR ', '),
            'Không rõ'
        ) AS artists,
        g.name AS genre,
        als.track_number,
        s.release_date
    FROM album_songs als
    JOIN songs s ON als.song_id = s.song_id
    LEFT JOIN song_artists sa ON sa.song_id = s.song_id
    LEFT JOIN artists ar ON sa.artist_id = ar.artist_id
    LEFT JOIN genres g ON s.genre_id = g.genre_id
    WHERE als.album_id = p_album_id
    GROUP BY 
        s.song_id,
        s.title,
        s.duration,
        s.audio_url,
        s.cover_url,
        g.name,
        als.track_number,
        s.release_date
    ORDER BY als.track_number ASC, s.song_id ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetSongsInPlaylist` (IN `p_playlist_id` INT)   BEGIN
    SELECT 
        s.song_id,
        s.title,
        COALESCE(
            GROUP_CONCAT(DISTINCT ar.name ORDER BY ar.name SEPARATOR ', '),
            'Không rõ'
        ) AS artist_names,
        s.audio_url,
        s.cover_url,
        MIN(ps.added_at) AS added_time
    FROM playlist_songs ps
    JOIN songs s ON ps.song_id = s.song_id
    LEFT JOIN song_artists sa ON sa.song_id = s.song_id
    LEFT JOIN artists ar ON sa.artist_id = ar.artist_id
    WHERE ps.playlist_id = p_playlist_id
    GROUP BY s.song_id, s.title, s.audio_url, s.cover_url
    ORDER BY added_time DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GetUserPlaylists` (IN `p_user_id` INT)   BEGIN
    SELECT 
        p.playlist_id,
        p.name,
        p.is_public,
        p.created_at,

        -- Lấy tối đa 4 ảnh cover mới nhất
        (
            SELECT JSON_ARRAYAGG(s.cover_url)
            FROM (
                SELECT s.cover_url
                FROM playlist_songs ps
                JOIN songs s ON ps.song_id = s.song_id
                WHERE ps.playlist_id = p.playlist_id
                ORDER BY ps.added_at DESC
                LIMIT 4
            ) AS s
        ) AS covers,

        -- ⭐ Lấy số lượng bài hát trong playlist
        (
            SELECT COUNT(*)
            FROM playlist_songs ps
            WHERE ps.playlist_id = p.playlist_id
        ) AS song_count

    FROM playlists p
    WHERE p.user_id = p_user_id
    ORDER BY p.created_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_favorite_songs` (IN `p_user_id` INT)   BEGIN
    IF p_user_id IS NULL OR p_user_id <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Thiếu user_id hợp lệ';
    END IF;

    SELECT 
        s.song_id,
        s.title,
        s.audio_url,
        s.cover_url,
        s.duration,
        s.release_date,
        s.play_count,

        -- ⭐ Nghệ sĩ (nhiều)
        COALESCE(
            GROUP_CONCAT(DISTINCT ar.name ORDER BY ar.name SEPARATOR ', '),
            'Không rõ'
        ) AS artists,

        g.name AS genre_name,
        f.added_at

    FROM favorites_songs f
    JOIN songs s ON f.song_id = s.song_id
    
    -- join bảng nghệ sĩ mới
    LEFT JOIN song_artists sa ON sa.song_id = s.song_id
    LEFT JOIN artists ar ON ar.artist_id = sa.artist_id

    LEFT JOIN genres g ON s.genre_id = g.genre_id

    WHERE f.user_id = p_user_id

    GROUP BY 
        s.song_id,
        s.title,
        s.audio_url,
        s.cover_url,
        s.duration,
        s.release_date,
        s.play_count,
        g.name,
        f.added_at

    ORDER BY f.added_at DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_top_songs` ()   BEGIN
    SELECT 
        s.song_id,
        s.title,
        s.duration,
        s.audio_url,
        s.cover_url,
        s.release_date,
        s.play_count,
        GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ') AS artist,
        g.name AS genre
    FROM songs s
    LEFT JOIN song_artists sa ON s.song_id = sa.song_id
    LEFT JOIN artists a ON sa.artist_id = a.artist_id
    LEFT JOIN genres g ON s.genre_id = g.genre_id
    WHERE s.is_top = 1
    GROUP BY s.song_id
    ORDER BY s.song_id DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `RemoveSongsFromPlaylist` (IN `p_user_id` INT, IN `p_playlist_id` INT, IN `p_song_ids` TEXT)   BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE sql_query TEXT;

    -- Kiểm tra quyền sở hữu playlist
    SELECT COUNT(*) INTO v_count
    FROM playlists
    WHERE playlist_id = p_playlist_id AND user_id = p_user_id;

    IF v_count = 0 THEN
        SELECT 'error' AS status, 'Playlist không tồn tại hoặc không thuộc về user này' AS message;
    ELSE
        -- Tạo câu SQL động để xóa danh sách bài hát
        SET @query = CONCAT(
            'DELETE FROM playlist_songs WHERE playlist_id = ',
            p_playlist_id,
            ' AND song_id IN (', p_song_ids, ')'
        );

        PREPARE stmt FROM @query;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        SELECT 'success' AS status, 'Đã xóa các bài hát khỏi playlist' AS message;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `ToggleFavoriteAlbum` (IN `p_user_id` VARCHAR(50), IN `p_album_id` INT, IN `p_action` VARCHAR(10))   BEGIN
    IF p_action = 'add' THEN
        INSERT IGNORE INTO favorite_albums (user_id, album_id)
        VALUES (p_user_id, p_album_id);
        SELECT 'Đã thêm vào yêu thích' AS message, TRUE AS status;

    ELSEIF p_action = 'remove' THEN
        DELETE FROM favorite_albums 
        WHERE user_id = p_user_id AND album_id = p_album_id;
        SELECT 'Đã xóa khỏi yêu thích' AS message, TRUE AS status;

    ELSE
        SELECT 'Hành động không hợp lệ' AS message, FALSE AS status;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `toggle_favorite_song` (IN `p_user_id` INT, IN `p_song_id` INT, IN `p_action` VARCHAR(10))   BEGIN
    -- Kiểm tra xem user_id và song_id có hợp lệ không
    IF p_user_id IS NULL OR p_song_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Thiếu user_id hoặc song_id';
    END IF;

    IF p_action = 'add' THEN
        INSERT IGNORE INTO favorites_songs (user_id, song_id)
        VALUES (p_user_id, p_song_id);

    ELSEIF p_action = 'remove' THEN
        DELETE FROM favorites_songs 
        WHERE user_id = p_user_id AND song_id = p_song_id;

    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Hành động không hợp lệ (phải là add hoặc remove)';
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `update_play_count` (IN `p_song_id` INT)   BEGIN
    IF p_song_id IS NULL OR p_song_id <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'song_id không hợp lệ';
    END IF;

    -- Tăng play_count lên 1
    UPDATE songs 
    SET play_count = play_count + 1
    WHERE song_id = p_song_id;

    -- Trả về play_count mới
    SELECT play_count 
    FROM songs 
    WHERE song_id = p_song_id;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `ads_songs`
--

CREATE TABLE `ads_songs` (
  `ad_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `brand_name` varchar(100) DEFAULT NULL,
  `audio_url` varchar(255) NOT NULL,
  `cover_url` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `priority` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ads_songs`
--

INSERT INTO `ads_songs` (`ad_id`, `title`, `brand_name`, `audio_url`, `cover_url`, `duration`, `is_active`, `priority`, `created_at`, `updated_at`) VALUES
(1, 'NÂNG CẤP TÀI KHOẢN PREMIUM', 'ChillChill', 'http://10.0.2.2:8081/music_API/online_music/ads/ads_sounds/ads_sounds_1.mp3', 'http://10.0.2.2:8081/music_API/online_music/ads/ads_cover/ads_cover_1.jpg', 0, 1, 1, '2025-11-10 19:26:12', '2025-11-10 21:44:58'),
(2, 'NÂNG CẤP TÀI KHOẢN PREMIUM', 'Chill Chill', 'http://10.0.2.2:8081/music_API/online_music/ads/ads_sounds/ads_sounds_2.mp3', 'http://10.0.2.2:8081/music_API/online_music/ads/ads_cover/ads_cover_1.jpg', 0, 1, 2, '2025-11-10 20:42:38', '2025-11-10 21:45:07');

-- --------------------------------------------------------

--
-- Table structure for table `albums`
--

CREATE TABLE `albums` (
  `album_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `artist_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `cover_url` varchar(255) DEFAULT NULL,
  `release_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `albums`
--

INSERT INTO `albums` (`album_id`, `name`, `artist_id`, `description`, `cover_url`, `release_date`, `created_at`, `updated_at`) VALUES
(3, 'Sơn Tùng M-TP', 11, 'Album', 'http://10.0.2.2:8081/music_API/online_music/album/album_cover/album_1762643216.jpeg', '2025-11-09', '2025-11-08 23:06:56', '2025-11-10 07:47:54'),
(4, 'Nhạc chill', 1, 'Hãy tận hưởng âm nhạc cùng Chill Chill', 'http://10.0.2.2:8081/music_API/online_music/album/album_cover/album_1762760004.jpeg', '2025-11-10', '2025-11-10 07:33:24', '2025-11-10 07:33:24'),
(5, 'Mỹ Tâm', 15, 'Album', 'http://10.0.2.2:8081/music_API/online_music/album/album_cover/album_1762761150.jpg', '2025-11-10', '2025-11-10 07:52:30', '2025-11-10 07:52:30'),
(6, 'Jack - J97', 14, 'Album', 'http://10.0.2.2:8081/music_API/online_music/album/album_cover/album_1762896202.jpg', '2025-11-12', '2025-11-11 21:23:22', '2025-11-11 21:23:22'),
(9, 'Ed Sheeran', 2, 'Album', 'http://10.0.2.2:8081/music_API/online_music/album/album_cover/album_1762907616.jpg', '2025-11-12', '2025-11-12 00:33:36', '2025-11-12 00:33:36'),
(12, 'Đen', 12, 'Album', 'http://10.0.2.2:8081/music_API/online_music/album/album_cover/album_1763164837.jpeg', '2025-11-15', '2025-11-15 00:00:37', '2025-11-15 00:00:37'),
(19, 'The NewOne', 4, 'ưqeqwewqe', 'https://image-cdn.nct.vn/song/2025/10/22/B/m/W/i/1761146738378_300.jpg', '2025-12-09', '2025-12-09 06:43:58', '2025-12-09 06:43:58');

-- --------------------------------------------------------

--
-- Table structure for table `album_songs`
--

CREATE TABLE `album_songs` (
  `album_id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `track_number` int(11) DEFAULT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `album_songs`
--

INSERT INTO `album_songs` (`album_id`, `song_id`, `track_number`, `added_at`) VALUES
(3, 19, 3, '2025-11-23 03:32:53'),
(3, 77, 7, '2025-11-23 03:32:53'),
(4, 1, 5, '2025-11-10 07:33:24'),
(4, 2, 4, '2025-11-10 07:33:24'),
(4, 18, 2, '2025-11-10 07:33:24'),
(4, 19, 1, '2025-11-10 07:33:24'),
(5, 16, 2, '2025-11-10 07:52:30'),
(6, 35, 4, '2025-11-23 03:48:14'),
(6, 88, 12, '2025-11-23 03:48:14'),
(9, 2, 5, '2025-11-12 00:33:36'),
(9, 3, 3, '2025-11-12 00:33:36'),
(12, 40, 1, '2025-11-15 00:00:37'),
(19, 1, 1, '2025-12-09 06:43:58'),
(19, 3, 2, '2025-12-09 06:43:58');

-- --------------------------------------------------------

--
-- Table structure for table `artists`
--

CREATE TABLE `artists` (
  `artist_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `bio` text DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `artists`
--

INSERT INTO `artists` (`artist_id`, `name`, `bio`, `avatar_url`, `created_at`, `updated_at`) VALUES
(1, 'Taylor Swift', 'Nữ ca sĩ, nhạc sĩ người Mỹ nổi tiếng với các ca khúc pop và country, từng đạt nhiều giải Grammy.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/taylor_swift.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:50:25'),
(2, 'Ed Sheeran', 'Ca sĩ, nhạc sĩ người Anh với phong cách pop, acoustic, nổi tiếng với các bản hit như \"Shape of You\" và \"Perfect\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/ed_sheeran.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:48:29'),
(3, 'Adele', 'Ca sĩ người Anh sở hữu giọng hát nội lực, được biết đến với các ca khúc ballad đầy cảm xúc như \"Hello\" và \"Someone Like You\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/adele.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:47:58'),
(4, 'The Weeknd', 'Ca sĩ người Canada với phong cách R&B pha lẫn pop, nổi bật với album \"After Hours\" và ca khúc \"Blinding Lights\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/the_weeknd.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:46:50'),
(5, 'Billie Eilish', 'Ca sĩ kiêm nhạc sĩ trẻ người Mỹ, nổi tiếng với phong cách âm nhạc độc đáo và chất giọng trầm đặc trưng.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/billie_eilish.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:46:27'),
(6, 'Bruno Mars', 'Ca sĩ, nhạc sĩ và nhà sản xuất người Mỹ, được biết đến với các bản hit như \"Uptown Funk\" và \"24K Magic\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/bruno_mars.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:45:43'),
(7, 'Ariana Grande', 'Nữ ca sĩ người Mỹ nổi tiếng với giọng hát 4 quãng tám và phong cách pop-R&B hiện đại.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/ariana_grande.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:45:14'),
(8, 'Justin Bieber', 'Nam ca sĩ người Canada nổi lên từ YouTube, sở hữu nhiều bản hit quốc tế như \"Sorry\" và \"Peaches\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/justin_bieber.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:41:32'),
(9, 'Olivia Rodrigo', 'Ca sĩ, nhạc sĩ trẻ người Mỹ nổi tiếng với các ca khúc pop-rock đầy cảm xúc như \"drivers license\" và \"vampire\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/olivia_rodrigo.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:40:51'),
(10, 'Shawn Mendes', 'Ca sĩ, nhạc sĩ người Canada với phong cách pop và acoustic, nổi bật với các ca khúc \"Stitches\" và \"Treat You Better\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/shawn_mendes.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:40:26'),
(11, 'Sơn Tùng M-TP', 'Ca sĩ, nhạc sĩ và nhà sản xuất người Việt Nam, nổi bật với các ca khúc \"Lạc Trôi\", \"Hãy Trao Cho Anh\" và \"Chúng Ta Của Hiện Tại\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/son_tung_m_tp.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:40:07'),
(12, 'Đen', 'Rapper và nhạc sĩ người Việt Nam, nổi tiếng với phong cách rap sâu lắng, truyền cảm.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/en.jpeg', '2025-11-08 21:08:13', '2025-11-14 23:44:08'),
(13, 'Hoàng Thùy Linh', 'Ca sĩ, diễn viên người Việt Nam, nổi bật với phong cách âm nhạc dân gian đương đại.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/hoang_thuy_linh.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:39:09'),
(14, 'Jack - J97', 'Ca sĩ, rapper và nhạc sĩ người Việt Nam, được biết đến qua các bài hát như \"Hồng Nhan\", \"Sóng Gió\" và \"Đom Đóm\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/jack_j97.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:38:36'),
(15, 'Mỹ Tâm', 'Nữ ca sĩ hàng đầu Việt Nam, được mệnh danh là \"Họa mi tóc nâu\", sở hữu lượng người hâm mộ đông đảo.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/my_tam.jpeg', '2025-11-08 21:08:13', '2025-11-11 19:33:52'),
(79, 'Michael Jackson', 'Nghệ sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/michael_jackson.jpeg', '2025-11-16 17:19:53', '2025-11-16 17:22:33'),
(80, 'Shakira', 'Nghệ sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/shakira.webp', '2025-11-16 17:36:04', '2025-11-16 17:36:04'),
(81, 'Halsey', 'Nghệ Sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/halsey.jpeg', '2025-11-16 17:42:16', '2025-11-16 17:43:07'),
(82, 'Lana Del Rey', 'Nghệ sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/lana_del_rey.jpeg', '2025-11-16 17:44:02', '2025-11-16 17:44:02'),
(83, 'Westlife', 'Nhóm nghễ sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/westlife.jpeg', '2025-11-16 17:45:18', '2025-11-16 17:45:18'),
(88, 'Wanting (Khúc Uyển Đình)', 'Nghệ Sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/wanting_khuc_uyen_inh.webp', '2025-11-16 18:08:42', '2025-11-16 18:08:42'),
(89, 'Kenshi Yonezu', 'Nghệ sĩ Nhật Bản', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/kenshi_yonezu.jpeg', '2025-11-16 18:11:16', '2025-11-16 18:11:16'),
(91, 'imase', 'Nghệ Sĩ Nhật Bản', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/imase.webp', '2025-11-16 18:12:23', '2025-11-16 18:12:23'),
(92, 'YOASOBI', 'Nghệ sĩ Nhật Bản', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/yoasobi.jpeg', '2025-11-16 18:13:16', '2025-11-16 18:13:16'),
(93, 'Fujii Kaze', 'Nghệ sĩ Nhật Bản', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/fujii_kaze.jpeg', '2025-11-16 18:13:56', '2025-11-16 18:13:56'),
(94, 'Rokudenashi', 'Nghệ sĩ Nhật Bản', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/rokudenashi.jpeg', '2025-11-16 18:14:42', '2025-11-16 18:14:42'),
(95, 'BEAST', 'Nhóm nghệ sĩ Hàn Quốc', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/beast.jpeg', '2025-11-16 18:33:20', '2025-11-16 18:33:20'),
(96, 'AKMU', 'Nhóm nhạc Hàn Quốc', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/akmu.jpeg', '2025-11-16 18:34:02', '2025-11-16 18:34:02'),
(97, 'Girls\' Generation', 'Nhóm nhạc Hàn', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/girls_generation.jpeg', '2025-11-16 18:34:25', '2025-11-16 18:34:25'),
(98, 'BIGBANG', 'Nhóm nhạc Hàn', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/bigbang.jpeg', '2025-11-16 18:34:55', '2025-11-16 18:34:55'),
(99, 'WINNER', 'Nhóm nhạc Hàn', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/winner.jpeg', '2025-11-16 18:35:25', '2025-11-16 18:35:52'),
(100, 'BTS (Bangtan Boys)', 'Nhóm nhạc Hàn', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/bts_bangtan_boys.jpeg', '2025-11-16 18:36:12', '2025-11-16 18:36:12'),
(101, 'PSY', 'Nghệ sĩ Hàn', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/psy.jpeg', '2025-11-16 18:37:26', '2025-11-16 18:37:26'),
(102, 'Wonder Girls', 'Nhóm nhạc Hàn', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/wonder_girls.jpeg', '2025-11-16 18:37:46', '2025-11-16 18:37:46'),
(118, 'GreenD', 'Nghệ sĩ Việt Nam', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/greend.jpeg', '2025-11-28 23:46:24', '2025-12-02 23:15:36'),
(119, 'Juky San', 'Nghệ sĩ Việt Nam', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/juky_san.jpeg', '2025-12-05 09:08:24', '2025-12-05 09:08:24'),
(120, 'buitruonglinh', 'Nghệ sĩ Việt Nam', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/buitruonglinh.jpeg', '2025-12-05 09:09:01', '2025-12-05 09:09:01'),
(121, 'Vũ Cát Tường', 'Nghệ sĩ Việt Nam', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/vu_cat_tuong.jpeg', '2025-12-05 09:26:50', '2025-12-05 09:26:50'),
(122, 'Karik', 'Nghệ sĩ Việt Nam', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/karik.jpeg', '2025-12-05 09:27:26', '2025-12-05 09:27:26'),
(123, 'Negav', 'Nghệ sĩ Việt Nam', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/negav.jpeg', '2025-12-05 09:28:01', '2025-12-05 09:28:01'),
(124, 'Ngô Kiến Huy', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/ngo_kien_huy.jpeg', '2025-12-05 09:28:53', '2025-12-05 09:28:53'),
(125, 'Jey B', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/jey_b.jpeg', '2025-12-05 09:29:14', '2025-12-05 09:29:14'),
(126, 'Việt Anh', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/viet_anh.jpeg', '2025-12-05 09:32:24', '2025-12-05 09:32:24'),
(127, 'MiiNa', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/miina.jpeg', '2025-12-05 09:33:34', '2025-12-05 09:33:34'),
(128, 'RIN9', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/rin9.jpeg', '2025-12-05 09:34:31', '2025-12-05 09:34:31'),
(129, 'DREAMeR', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/dreamer.jpeg', '2025-12-05 09:35:05', '2025-12-05 09:35:05'),
(130, 'Low G', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/low_g.jpeg', '2025-12-05 09:36:19', '2025-12-05 09:36:19'),
(131, 'JustaTee', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/justatee.jpeg', '2025-12-05 09:36:44', '2025-12-05 09:36:44'),
(132, 'Binz', 'Ca sĩ', 'artist/artist_avatar/artist-1765262842489-472539137.jpg', '2025-12-05 09:38:21', '2025-12-09 06:47:22'),
(133, 'Hngle', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/hngle.jpeg', '2025-12-05 09:39:27', '2025-12-05 09:39:27'),
(134, 'Ari', 'Ca sĩ', 'artist/artist_avatar/artist-1765256595921-411755963.png', '2025-12-05 09:39:53', '2025-12-09 05:03:15'),
(135, 'Michita, 愛海', 'Ca sĩ Nhật Bổn', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/michita.jpeg', '2025-12-05 10:05:53', '2025-12-05 10:05:53'),
(136, 'K-ICM', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/k_icm.jpeg', '2025-12-05 10:18:11', '2025-12-05 10:18:11'),
(137, 'RyoT', 'Nghệ sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/ryot.jpeg', '2025-12-05 10:20:57', '2025-12-05 10:20:57'),
(138, 'Kiều Phong', 'Ca sĩ', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/kieu_phong.jpeg', '2025-12-05 10:21:49', '2025-12-05 10:21:49');

-- --------------------------------------------------------

--
-- Table structure for table `downloaded_songs`
--

CREATE TABLE `downloaded_songs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `artist` varchar(255) DEFAULT NULL,
  `cover_url` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `local_path` text DEFAULT NULL,
  `downloaded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `downloaded_songs`
--

INSERT INTO `downloaded_songs` (`id`, `user_id`, `song_id`, `title`, `artist`, `cover_url`, `duration`, `local_path`, `downloaded_at`) VALUES
(1, 46, 19, 'Chắc Ai Đó Sẽ Về', 'Sơn Tùng M-TP', 'http://10.0.2.2:8081/music_API/online_music/cover/son_chac_ai_do_se_ve.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/19_Chắc_Ai_Đó_Sẽ_Về.mp3', '2025-12-05 12:35:22'),
(2, 46, 29, 'Ngày Này Năm Ấy', 'Việt Anh', 'http://10.0.2.2:8081/music_API/online_music/cover/viet_anh_ngay_nay_nam_ay.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/29_Ngày_Này_Năm_Ấy.mp3', '2025-12-05 12:45:54'),
(3, 46, 25, 'In Love', 'JustaTee, Low G', 'http://10.0.2.2:8081/music_API/online_music/cover/low_g_justatee_in_love.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/25_In_Love.mp3', '2025-12-05 13:04:06');

-- --------------------------------------------------------

--
-- Table structure for table `favorites_songs`
--

CREATE TABLE `favorites_songs` (
  `user_id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `favorites_songs`
--

INSERT INTO `favorites_songs` (`user_id`, `song_id`, `added_at`) VALUES
(32, 3, '2025-11-19 23:44:22'),
(32, 18, '2025-11-17 11:31:30'),
(32, 19, '2025-11-17 11:09:07'),
(32, 26, '2025-11-19 23:51:48'),
(32, 35, '2025-11-17 11:36:53'),
(32, 44, '2025-11-19 03:30:44'),
(32, 64, '2025-11-17 14:31:01'),
(46, 25, '2025-12-05 13:03:37'),
(46, 64, '2025-12-05 12:19:37'),
(46, 77, '2025-12-05 12:35:58'),
(48, 30, '2025-12-05 14:26:47'),
(49, 1, '2025-12-09 05:17:45'),
(49, 2, '2025-12-09 05:17:44'),
(49, 16, '2025-12-09 05:16:56');

-- --------------------------------------------------------

--
-- Table structure for table `favorite_albums`
--

CREATE TABLE `favorite_albums` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `album_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `favorite_albums`
--

INSERT INTO `favorite_albums` (`id`, `user_id`, `album_id`, `created_at`) VALUES
(1, 46, 3, '2025-12-02 22:30:34'),
(2, 46, 6, '2025-12-05 12:37:22'),
(5, 49, 12, '2025-12-19 17:59:05'),
(6, 49, 5, '2025-12-20 11:10:07'),
(7, 49, 3, '2025-12-20 11:10:08');

-- --------------------------------------------------------

--
-- Table structure for table `genres`
--

CREATE TABLE `genres` (
  `genre_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `genres`
--

INSERT INTO `genres` (`genre_id`, `name`, `description`, `created_at`) VALUES
(1, 'Pop', 'Thể loại nhạc đại chúng phổ biến nhất trên thế giới, có giai điệu dễ nghe, tiết tấu bắt tai.', '2025-11-08 21:08:20'),
(2, 'Rock', 'Nhạc có tiết tấu mạnh mẽ, sử dụng nhiều guitar điện, trống và bass.', '2025-11-08 21:08:20'),
(3, 'Hip Hop', 'Thể loại kết hợp rap, beat, và tiết tấu mạnh mẽ, phổ biến trong văn hóa đường phố.', '2025-11-08 21:08:20'),
(4, 'R&B', 'Rhythm and Blues, thể loại nhạc có nhịp điệu mượt mà, trầm lắng, giàu cảm xúc.', '2025-11-08 21:08:20'),
(5, 'Country', 'Nhạc đồng quê của Mỹ, thường sử dụng guitar acoustic và kể chuyện qua lời bài hát.', '2025-11-08 21:08:20'),
(6, 'Jazz', 'Thể loại nhạc có tính ngẫu hứng cao, giàu tính nghệ thuật, bắt nguồn từ Mỹ.', '2025-11-08 21:08:20'),
(7, 'Blues', 'Nhạc cảm xúc, buồn, thường nói về những khó khăn trong cuộc sống, tiền thân của Rock và Jazz.', '2025-11-08 21:08:20'),
(8, 'Electronic', 'Nhạc điện tử sử dụng công nghệ và máy tính để tạo âm thanh nhân tạo.', '2025-11-08 21:08:20'),
(9, 'Dance', 'Nhạc có tiết tấu nhanh, sôi động, dùng trong các sàn nhảy hoặc lễ hội.', '2025-11-08 21:08:20'),
(10, 'EDM', 'Electronic Dance Music – nhạc điện tử dành cho khiêu vũ và DJ biểu diễn.', '2025-11-08 21:08:20'),
(11, 'Ballad', 'Nhạc chậm, nhẹ nhàng, tập trung vào cảm xúc và ca từ.', '2025-11-08 21:08:20'),
(12, 'Indie', 'Thể loại nhạc độc lập, tự sản xuất và phát hành, mang phong cách tự do.', '2025-11-08 21:08:20'),
(13, 'Reggae', 'Nhạc đặc trưng của Jamaica, tiết tấu chậm rãi và dễ chịu.', '2025-11-08 21:08:20'),
(14, 'K-Pop', 'Nhạc pop Hàn Quốc, kết hợp vũ đạo bắt mắt và phong cách thời trang đặc sắc.', '2025-11-08 21:08:20'),
(15, 'J-Pop', 'Nhạc pop Nhật Bản, thường gắn liền với anime, idol và văn hóa Nhật.', '2025-11-08 21:08:20'),
(16, 'Latin', 'Nhạc Latin Mỹ với nhịp điệu sôi động, gắn liền với điệu nhảy Salsa, Bachata.', '2025-11-08 21:08:20'),
(17, 'Classical', 'Nhạc cổ điển với dàn nhạc giao hưởng, mang tính nghệ thuật và học thuật cao.', '2025-11-08 21:08:20'),
(18, 'Lo-fi', 'Nhạc có tiết tấu chậm, dễ chịu, thường dùng để học tập hoặc thư giãn.', '2025-11-08 21:08:20'),
(19, 'Soundtrack', 'Nhạc nền cho phim, game, hoặc chương trình truyền hình.', '2025-11-08 21:08:20'),
(20, 'Acoustic', 'Nhạc sử dụng nhạc cụ mộc như guitar, piano – gần gũi và tự nhiên.', '2025-11-08 21:08:20'),
(21, 'Rap', 'Thể loại nhạc sử dụng lời nói nhanh, có vần, trên nền beat.', '2025-11-08 21:08:20'),
(22, 'Soul', 'Nhạc bắt nguồn từ R&B, mang đậm cảm xúc và nội tâm.', '2025-11-08 21:08:20'),
(23, 'Alternative', 'Thể loại pha trộn giữa Rock, Pop và Indie, mang phong cách khác biệt.', '2025-11-08 21:08:20'),
(24, 'Trance', 'Nhạc điện tử có nhịp điệu lặp lại, tạo cảm giác thôi miên, thường dùng trong các lễ hội lớn.', '2025-11-08 21:08:20'),
(25, 'V-Pop', 'Nhạc Pop Việt Nam – hiện đại, đa dạng phong cách, phản ánh văn hóa và đời sống Việt.', '2025-11-08 21:08:20'),
(26, 'Bolero', 'Dòng nhạc trữ tình Việt Nam, giai điệu chậm, sâu lắng và giàu cảm xúc.', '2025-11-08 21:08:20'),
(27, 'Folk', 'Nhạc dân gian, phản ánh văn hóa truyền thống của từng vùng miền.', '2025-11-08 21:08:20'),
(28, 'Chill', 'Nhạc nhẹ nhàng, thư giãn, thích hợp khi làm việc hoặc nghỉ ngơi.', '2025-11-08 21:08:20'),
(29, 'Instrumental', 'Nhạc không lời, tập trung vào giai điệu và nhạc cụ.', '2025-11-08 21:08:20'),
(30, 'Children', 'Nhạc thiếu nhi, vui tươi, trong sáng, dành cho trẻ em.', '2025-11-08 21:08:20');

-- --------------------------------------------------------

--
-- Table structure for table `listening_history`
--

CREATE TABLE `listening_history` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `listened_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `listening_history`
--

INSERT INTO `listening_history` (`id`, `user_id`, `song_id`, `listened_at`) VALUES
(151, 32, 24, '2025-11-16 16:48:24'),
(154, 32, 2, '2025-11-16 16:54:45'),
(155, 32, 3, '2025-11-16 16:54:46'),
(159, 32, 35, '2025-11-16 16:54:57'),
(162, 32, 71, '2025-11-17 04:23:05'),
(163, 32, 64, '2025-11-17 04:23:14'),
(168, 32, 44, '2025-11-17 04:53:35'),
(169, 32, 45, '2025-11-17 04:57:53'),
(172, 32, 35, '2025-11-17 05:22:53'),
(174, 32, 72, '2025-11-17 10:02:06'),
(175, 32, 45, '2025-11-17 10:03:16'),
(176, 32, 26, '2025-11-17 10:04:03'),
(177, 32, 3, '2025-11-17 10:04:04'),
(180, 32, 1, '2025-11-17 11:01:38'),
(183, 32, 30, '2025-11-17 11:09:01'),
(184, 32, 19, '2025-11-17 11:09:05'),
(186, 32, 18, '2025-11-17 11:30:41'),
(189, 32, 35, '2025-11-17 11:36:52'),
(190, 32, 25, '2025-11-17 11:38:49'),
(191, 32, 3, '2025-11-17 11:39:23'),
(192, 32, 72, '2025-11-17 12:30:49'),
(193, 32, 35, '2025-11-17 12:49:27'),
(194, 32, 64, '2025-11-17 13:16:08'),
(195, 32, 64, '2025-11-17 14:24:23'),
(196, 32, 35, '2025-11-17 14:24:32'),
(198, 32, 64, '2025-11-17 23:18:52'),
(202, 32, 24, '2025-11-18 15:10:56'),
(203, 32, 45, '2025-11-18 16:31:02'),
(204, 32, 18, '2025-11-18 17:00:11'),
(205, 32, 64, '2025-11-18 17:14:32'),
(208, 32, 35, '2025-11-19 03:15:06'),
(210, 32, 64, '2025-11-19 03:29:29'),
(211, 32, 44, '2025-11-19 03:29:40'),
(219, 32, 22, '2025-11-19 23:38:41'),
(220, 32, 3, '2025-11-19 23:38:47'),
(221, 32, 26, '2025-11-19 23:51:34'),
(223, 32, 18, '2025-11-19 23:52:38'),
(224, 32, 19, '2025-11-19 23:52:42'),
(226, 32, 44, '2025-11-19 23:52:56'),
(231, 32, 35, '2025-11-20 17:13:37'),
(233, 32, 29, '2025-11-20 17:45:00'),
(234, 32, 64, '2025-11-20 17:45:17'),
(236, 32, 25, '2025-11-20 17:47:02'),
(238, 32, 26, '2025-11-20 17:50:04'),
(239, 32, 30, '2025-11-20 17:54:21'),
(240, 32, 22, '2025-11-20 17:54:31'),
(241, 32, 2, '2025-11-20 17:54:34'),
(242, 32, 24, '2025-11-20 18:23:48'),
(248, 32, 45, '2025-11-20 18:39:21'),
(250, 32, 35, '2025-11-20 23:07:33'),
(257, 32, 19, '2025-11-20 23:10:03'),
(261, 32, 30, '2025-11-20 23:16:30'),
(262, 32, 64, '2025-11-20 23:23:42'),
(265, 32, 26, '2025-11-20 23:32:30'),
(266, 32, 3, '2025-11-20 23:32:31'),
(267, 32, 44, '2025-11-20 23:32:33'),
(269, 32, 35, '2025-11-21 03:11:35'),
(272, 32, 44, '2025-11-21 12:16:43'),
(273, 32, 35, '2025-11-21 12:16:58'),
(274, 32, 88, '2025-11-23 03:49:06'),
(276, 46, 35, '2025-11-27 00:28:13'),
(277, 46, 89, '2025-11-29 00:10:05'),
(278, 46, 71, '2025-11-29 00:10:44'),
(279, 46, 29, '2025-11-29 00:10:46'),
(282, 46, 26, '2025-11-29 05:56:26'),
(283, 46, 88, '2025-11-29 05:58:58'),
(284, 46, 89, '2025-11-29 06:03:56'),
(287, 46, 88, '2025-11-30 08:14:13'),
(291, 46, 44, '2025-11-30 08:15:01'),
(292, 46, 30, '2025-11-30 08:24:15'),
(293, 46, 29, '2025-11-30 08:24:21'),
(295, 46, 40, '2025-12-02 22:47:10'),
(296, 46, 45, '2025-12-02 23:32:20'),
(298, 46, 29, '2025-12-05 12:18:20'),
(299, 46, 18, '2025-12-05 12:18:34'),
(300, 46, 64, '2025-12-05 12:18:45'),
(301, 46, 89, '2025-12-05 12:32:11'),
(302, 46, 35, '2025-12-05 12:34:34'),
(303, 46, 19, '2025-12-05 12:34:55'),
(304, 46, 77, '2025-12-05 12:35:32'),
(305, 46, 2, '2025-12-05 12:37:30'),
(306, 46, 24, '2025-12-05 12:45:55'),
(307, 48, 77, '2025-12-05 12:51:05'),
(308, 46, 25, '2025-12-05 13:03:34'),
(309, 46, 1, '2025-12-05 13:14:00'),
(310, 48, 30, '2025-12-05 13:34:59'),
(311, 48, 18, '2025-12-05 13:35:26'),
(312, 48, 29, '2025-12-05 13:36:06'),
(313, 48, 88, '2025-12-05 13:36:07'),
(314, 48, 24, '2025-12-05 13:36:10'),
(315, 48, 26, '2025-12-05 13:36:17'),
(316, 48, 25, '2025-12-05 13:36:23'),
(318, 48, 22, '2025-12-05 13:36:53'),
(319, 48, 35, '2025-12-05 13:41:40'),
(320, 46, 26, '2025-12-09 02:48:56'),
(321, 48, 35, '2025-12-09 03:08:43'),
(322, 48, 18, '2025-12-09 03:08:51'),
(323, 48, 77, '2025-12-09 03:18:07'),
(324, 48, 89, '2025-12-09 03:18:17');

-- --------------------------------------------------------

--
-- Table structure for table `playlists`
--

CREATE TABLE `playlists` (
  `playlist_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `playlists`
--

INSERT INTO `playlists` (`playlist_id`, `user_id`, `name`, `is_public`, `created_at`, `updated_at`) VALUES
(4, 32, 'chill guy 9', 0, '2025-11-17 05:05:15', '2025-11-17 05:23:30'),
(5, 32, 'chill guy 2', 0, '2025-11-17 05:05:58', '2025-11-17 05:05:58'),
(6, 32, 'chill guy 3', 0, '2025-11-17 12:32:02', '2025-11-17 12:32:02'),
(7, 32, 'chill guy 4', 0, '2025-11-17 12:35:10', '2025-11-17 12:35:10'),
(9, 32, 'chil guy 22', 0, '2025-11-17 13:15:54', '2025-11-17 13:27:25'),
(35, 32, 'cgg', 0, '2025-11-19 03:45:30', '2025-11-19 03:45:30'),
(36, 32, 'abc', 0, '2025-11-20 17:00:58', '2025-11-20 17:00:58'),
(37, 32, 'kkk', 0, '2025-11-20 17:30:05', '2025-11-20 17:30:05'),
(48, 46, 'chill 1', 0, '2025-12-02 22:16:41', '2025-12-02 22:16:41'),
(51, 49, '123', 1, '2025-12-09 04:10:34', '2025-12-09 04:10:34'),
(52, 49, '132214', 1, '2025-12-09 05:11:27', '2025-12-09 05:11:27');

-- --------------------------------------------------------

--
-- Table structure for table `playlist_songs`
--

CREATE TABLE `playlist_songs` (
  `playlist_id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `playlist_songs`
--

INSERT INTO `playlist_songs` (`playlist_id`, `song_id`, `added_at`) VALUES
(4, 1, '2025-12-03 05:08:07'),
(4, 64, '2025-11-17 05:23:01'),
(5, 35, '2025-11-17 10:02:47'),
(5, 64, '2025-11-17 10:02:56'),
(5, 72, '2025-11-17 05:22:25'),
(6, 35, '2025-11-17 12:55:06'),
(6, 64, '2025-11-17 12:54:40'),
(7, 35, '2025-11-17 12:49:33'),
(7, 64, '2025-11-17 12:50:12'),
(9, 64, '2025-11-17 13:16:02'),
(9, 68, '2025-11-17 13:27:55'),
(9, 69, '2025-11-17 13:27:54'),
(9, 70, '2025-11-17 13:27:53'),
(9, 71, '2025-11-17 13:27:46'),
(35, 26, '2025-11-20 17:00:49'),
(35, 64, '2025-11-19 03:45:53'),
(36, 35, '2025-11-20 17:18:33'),
(36, 64, '2025-11-20 17:19:16'),
(37, 18, '2025-11-20 23:40:30'),
(37, 30, '2025-11-20 23:40:20'),
(37, 35, '2025-11-20 23:40:22'),
(37, 64, '2025-11-20 17:37:27'),
(48, 16, '2025-12-05 12:37:41'),
(48, 18, '2025-12-02 22:29:50'),
(48, 26, '2025-12-05 12:37:13'),
(48, 29, '2025-12-05 09:01:39'),
(48, 30, '2025-12-02 22:17:51'),
(48, 35, '2025-12-02 22:17:53'),
(48, 40, '2025-12-05 12:36:19'),
(48, 64, '2025-12-02 22:17:55'),
(51, 2, '2025-12-09 05:11:24'),
(51, 3, '2025-12-09 05:11:31'),
(51, 30, '2025-12-19 17:58:45'),
(52, 3, '2025-12-09 05:11:35'),
(52, 30, '2025-12-19 17:58:44'),
(52, 35, '2025-12-20 10:16:51'),
(52, 94, '2025-12-19 17:49:36'),
(52, 95, '2025-12-20 10:16:34');

-- --------------------------------------------------------

--
-- Table structure for table `songs`
--

CREATE TABLE `songs` (
  `song_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `genre_id` int(11) NOT NULL,
  `duration` int(11) DEFAULT NULL,
  `audio_url` varchar(255) NOT NULL,
  `cover_url` varchar(255) DEFAULT NULL,
  `release_date` date DEFAULT NULL,
  `play_count` bigint(20) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_top` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `songs`
--

INSERT INTO `songs` (`song_id`, `title`, `genre_id`, `duration`, `audio_url`, `cover_url`, `release_date`, `play_count`, `created_at`, `updated_at`, `is_top`) VALUES
(1, 'Love Story', 1, 230, 'http://10.0.2.2:8081/music_API/online_music/audio/love_story.mp3', 'http://localhost:8081/music_API/online_music/cover/taylor_swift_love_story.jpg', NULL, 4, '2025-11-08 21:08:26', '2025-12-09 06:46:51', 0),
(2, 'Shape of You', 1, 240, 'http://10.0.2.2:8081/music_API/online_music/audio/shape_of_you.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/ed_sheeran_shape_of_you.jpg', NULL, 16, '2025-11-08 21:08:26', '2025-12-05 12:37:30', 0),
(3, 'Perfect', 1, 263, 'http://10.0.2.2:8081/music_API/online_music/audio/perfect.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/ed_sheeran_perfect.jpg', NULL, 16, '2025-11-08 21:08:26', '2025-12-05 09:41:55', 0),
(16, 'Nếu Anh Đi', 25, 245, 'http://10.0.2.2:8081/music_API/online_music/audio/neu_anh_di.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/my_tam_neu_anh_di.jpg', NULL, 5, '2025-11-08 21:08:26', '2025-12-05 10:25:49', 0),
(18, 'Tình Phai', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/tinh_phai.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/kieu_phong_ryot_tinh_phai.jpeg', NULL, 26, '2025-11-08 22:20:26', '2025-12-09 03:08:51', 0),
(19, 'Chắc Ai Đó Sẽ Về', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/chac_ai_do_se_ve.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/son_chac_ai_do_se_ve.jpeg', NULL, 10, '2025-11-08 22:29:14', '2025-12-05 12:35:25', 0),
(22, 'Không Buông', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/khong_buong.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/hngle_ari_khong_buong.jpeg', NULL, 14, '2025-11-10 14:21:55', '2025-12-05 14:15:59', 1),
(24, 'Em', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/em.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/binz_em.jpeg', '2025-11-10', 23, '2025-11-10 15:08:38', '2025-12-05 14:15:48', 1),
(25, 'In Love', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/in_love.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/low_g_justatee_in_love.jpeg', NULL, 19, '2025-11-10 15:12:21', '2025-12-05 14:15:46', 1),
(26, 'Quyền Yếu Đuối', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/quyen_yeu_duoi.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/miina_rin9_dreamer_quyen_yeu_duoi.jpeg', NULL, 22, '2025-11-10 15:14:00', '2025-12-09 02:48:56', 1),
(29, 'Ngày Này Năm Ấy', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/ngay_nay_nam_ay.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/viet_anh_ngay_nay_nam_ay.jpeg', NULL, 25, '2025-11-10 15:49:13', '2025-12-05 14:16:27', 1),
(30, 'NGƯỜI NHƯ ANH XỨNG ĐÁNG CÔ ĐƠN', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/nguoi_nhu_anh_xung_dang_co_don.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/anh_trai_say_hi_vu_cat_tuong_karik_nguoi_nhu_anh_xung_dang_co_don.jpeg', NULL, 84, '2025-11-10 15:54:00', '2025-12-05 14:26:42', 1),
(35, 'Em Gì Ơi', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/em_gi_oi.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/jack_j97_em_gi_oi.jpeg', NULL, 51, '2025-11-11 21:21:20', '2025-12-09 03:08:43', 0),
(40, 'Gieo Quẻ', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/gieo_que.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/hoang_thuy_linh_en_gieo_que.jpeg', NULL, 10, '2025-11-12 00:08:34', '2025-12-05 06:07:18', 0),
(44, 'Beat It', 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/beat_it.mp3', 'https://upload.wikimedia.org/wikipedia/vi/6/65/Michael_Jackson_-_Beat_It_cover.jpg', NULL, 10, '2025-11-16 17:19:54', '2025-12-05 06:07:18', 0),
(45, 'Waka Waka', 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/waka_waka.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_waka_waka.jpeg', NULL, 8, '2025-11-16 17:38:30', '2025-12-05 06:07:18', 0),
(54, 'Jar Of Love', 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/jar_of_love.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_jar_of_love.jpeg', NULL, 0, '2025-11-16 18:09:42', '2025-12-05 06:07:18', 0),
(59, 'Lemon', 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/lemon.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_lemon.jpeg', NULL, 0, '2025-11-16 18:21:50', '2025-12-05 06:07:18', 0),
(60, 'Shinunoga E-Wa', 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/shinunoga_e_wa.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_shinunoga_e_wa.jpeg', NULL, 0, '2025-11-16 18:22:31', '2025-12-05 06:07:18', 0),
(61, 'Yoru Ni Kakeru / 夜に駆ける', 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/yoru_ni_kakeru_夜に駆ける.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_yoru_ni_kakeru.jpeg', NULL, 0, '2025-11-16 18:23:08', '2025-12-05 06:07:18', 0),
(62, 'Idol / アイドル', 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/idoi_アイドル.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_idoi.jpeg', NULL, 0, '2025-11-16 18:23:50', '2025-12-05 06:07:18', 0),
(63, 'まつり', 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/まつり.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_.jpeg', NULL, 0, '2025-11-16 18:24:57', '2025-12-05 06:07:18', 0),
(64, 'Cry For Me', 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/cry_for_me.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_cry_for_me.jpeg', NULL, 35, '2025-11-16 18:29:32', '2025-12-05 12:19:44', 0),
(65, 'Fiction', 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/fiction.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_fiction.jpeg', NULL, 0, '2025-11-16 18:38:22', '2025-12-05 06:07:18', 0),
(67, 'The Boys', 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/the_boys.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_the_boys.jpeg', NULL, 0, '2025-11-16 18:40:02', '2025-12-05 06:07:18', 0),
(68, 'Fantastic Baby', 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/fantastic_baby.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_fantastic_baby.jpeg', NULL, 0, '2025-11-16 18:40:42', '2025-12-05 06:07:18', 0),
(69, 'Island', 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/island.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_island.jpeg', NULL, 0, '2025-11-16 18:41:28', '2025-12-05 06:07:18', 0),
(70, 'FAKE LOVE', 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/fake_love.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_fake_love.jpeg', NULL, 0, '2025-11-16 18:42:01', '2025-12-05 06:07:18', 0),
(71, 'Gangnam Style', 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/gangnam_style.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_gangnam_style.jpeg', NULL, 2, '2025-11-16 18:42:33', '2025-12-05 06:07:18', 0),
(72, 'Nobody', 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/nobody.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_nobody.jpeg', NULL, 3, '2025-11-16 18:43:18', '2025-12-05 06:07:18', 0),
(77, 'Em Của Ngày Hôm Qua', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/em_cua_ngay_hom_qua.mp3', 'https://upload.wikimedia.org/wikipedia/vi/5/5d/Em_c%E1%BB%A7a_ng%C3%A0y_h%C3%B4m_qua.png', NULL, 3, '2025-11-23 03:20:30', '2025-12-09 03:18:07', 0),
(88, 'Vực Thẩm Của Bình Yên', 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/vuc_tham_cua_binh_yen.mp3', 'https://th.bing.com/th/id/OIP.7c1u1TSEKaZqKAOx8rezbwHaHa?w=154&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', NULL, 22, '2025-11-23 03:47:36', '2025-12-09 07:25:17', 0),
(89, 'Năm Tháng Ấy', 25, 151, 'http://10.0.2.2:8081/music_API/online_music/audio/greend_nam_thang_y_1764374805.mp3', 'https://th.bing.com/th/id/OIP.Jxcyu8aKpD8AvvJxSTmUbQHaEK?w=314&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', NULL, 6, '2025-11-29 00:06:46', '2025-12-09 07:25:52', 0),
(94, 'Chẳng phải', 20, 239, 'http://10.0.2.2:8081/music_API/online_music/audio/buitruonglinh_chang_phai_1765262357.mp3', 'https://image-cdn.nct.vn/song/2025/10/22/B/m/W/i/1761146738378_300.jpg', NULL, 0, '2025-12-09 06:39:17', '2025-12-09 06:39:17', 0),
(95, 'Ai biết', 28, 239, 'http://10.0.2.2:8081/music_API/online_music/audio/negav_ai_biet_1765266635.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/negav_ai_biet_cover_1765266635.jpg', NULL, 0, '2025-12-09 07:50:35', '2025-12-09 07:50:35', 0);

-- --------------------------------------------------------

--
-- Table structure for table `song_artists`
--

CREATE TABLE `song_artists` (
  `id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `artist_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `song_artists`
--

INSERT INTO `song_artists` (`id`, `song_id`, `artist_id`) VALUES
(8, 77, 11),
(9, 72, 102),
(14, 30, 125),
(15, 30, 122),
(16, 30, 123),
(17, 30, 124),
(18, 30, 121),
(19, 29, 126),
(20, 26, 129),
(21, 26, 127),
(22, 26, 128),
(23, 25, 131),
(24, 25, 130),
(25, 24, 132),
(26, 22, 134),
(27, 22, 133),
(28, 71, 101),
(29, 70, 100),
(30, 69, 99),
(31, 68, 98),
(32, 67, 97),
(34, 65, 95),
(35, 64, 135),
(36, 63, 93),
(37, 62, 92),
(38, 61, 92),
(39, 60, 93),
(40, 59, 89),
(41, 54, 88),
(42, 45, 80),
(43, 44, 79),
(44, 40, 12),
(45, 40, 13),
(47, 35, 14),
(48, 35, 136),
(49, 19, 11),
(50, 18, 138),
(51, 18, 137),
(53, 16, 15),
(54, 3, 2),
(55, 2, 2),
(58, 94, 120),
(59, 94, 123),
(60, 1, 1),
(61, 1, 123),
(62, 88, 14),
(63, 89, 118),
(64, 95, 123),
(65, 95, 120);

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` enum('USD','VND','EUR','OTHER') DEFAULT 'USD',
  `audio_quality` enum('low','standard','high') DEFAULT 'standard',
  `ad_free` tinyint(1) DEFAULT 0,
  `duration_days` int(11) NOT NULL,
  `trial_period_days` int(11) DEFAULT 0,
  `is_renewable` tinyint(1) DEFAULT 1,
  `renewal_discount` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `description`, `price`, `currency`, `audio_quality`, `ad_free`, `duration_days`, `trial_period_days`, `is_renewable`, `renewal_discount`, `created_at`, `updated_at`) VALUES
(1, '1 tháng', 'Nghe nhạc không quảng cáo, tải offline', 49000.00, 'VND', 'high', 1, 30, 0, 1, 0.00, '2025-11-11 12:17:07', '2025-11-11 12:17:07'),
(2, '3 tháng', 'Gói 3 tháng ưu đãi', 129000.00, 'VND', 'high', 1, 90, 0, 1, 0.00, '2025-11-11 12:17:07', '2025-11-11 12:17:07'),
(3, '1 năm', 'Gói 1 năm tiết kiệm', 499000.00, 'VND', 'high', 1, 365, 0, 1, 0.00, '2025-11-11 12:17:07', '2025-11-11 12:17:07');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `plan_name` varchar(150) NOT NULL,
  `amount` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `transaction_date` varchar(14) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `plan_id`, `plan_name`, `amount`, `status`, `payment_method`, `transaction_date`, `created_at`) VALUES
('1764818759513', 46, 1, '1 tháng', 49000, 'pending', 'VNPay', '20251204102559', '2025-12-04 10:25:59'),
('1764821857395', 46, 1, '1 tháng', 49000, 'completed', 'VNPay', '20251204111819', '2025-12-04 11:17:37'),
('1764939034799', 48, 1, '1 tháng', 49000, 'pending', 'VNPay', '20251205195034', '2025-12-05 19:50:34'),
('POnlineMusicWeb_1764713522221_319', 32, 3, '1 năm', 499000, 'completed', 'VNPay', '20251203051224', '2025-12-03 05:12:02'),
('POnlineMusicWeb_1765262967060_321', 49, 3, '1 năm', 499000, 'pending', 'VNPay', NULL, '2025-12-09 13:49:27'),
('POnlineMusicWeb_1765330964291_545', 50, 3, '1 năm', 499000, 'completed', 'VNPay', '20251210084314', '2025-12-10 08:42:44'),
('POnlineMusicWeb_1766221965574_896', 51, 3, '1 năm', 499000, 'pending', 'VNPay', NULL, '2025-12-20 16:12:45'),
('POnlineMusicWeb_1766222471176_774', 51, 3, '1 năm', 499000, 'pending', 'VNPay', NULL, '2025-12-20 16:21:11'),
('POnlineMusicWeb_1766222514831_813', 51, 3, '1 năm', 499000, 'pending', 'VNPay', NULL, '2025-12-20 16:21:54'),
('POnlineMusicWeb_1766224697993_991', 49, 1, '1 tháng', 49000, 'pending', 'VNPay', NULL, '2025-12-20 16:58:17');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `status` enum('active','inactive','banned') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `phone_number`, `password_hash`, `avatar_url`, `date_of_birth`, `role`, `status`, `created_at`, `updated_at`) VALUES
(32, 'Thanh Đình', 'thanhdinh1806.tphcm@gmail.com', NULL, '#', 'https://lh3.googleusercontent.com/a/ACg8ocLB1hb9PlcCAsBXVLL5121WlKlpe8hulQkAyto4nEYhPJjpcQ=s96-c', NULL, 'user', 'active', '2025-11-16 16:47:58', '2025-11-16 16:47:58'),
(46, 'Thanh Đình Nguyễn Ngô', 'nguyenngothanhdinh.hvt@gmail.com', NULL, '#', 'https://lh3.googleusercontent.com/a/ACg8ocKYNfyZ4lXvrH2w4nQ1Xwu7AVk-pHcwzF5R3AmxuazRfliC_GM=s96-c', NULL, 'user', 'active', '2025-11-23 03:04:45', '2025-11-23 03:04:45'),
(47, 'admin1', 'admin1@example.com', '0329944649', '$2b$10$rvT23fNdcAhCQ7GHUGxUOe/BNBIxk3dBUad2U9P5Er7u8NYP/6LhS', '/uploads/avatars/avatar-1763870616661-108530077.jpg', '1989-12-31', 'admin', 'active', '2025-11-23 03:58:15', '2025-12-05 06:09:26'),
(48, 'Đình Thanh', 'dangthanhdinh.1806@gmail.com', NULL, '#', 'https://lh3.googleusercontent.com/a/ACg8ocI-qcPPlV369oRzT9J0EGoqU8jrfHxLFfTdue7czOSzHRWLtA=s96-c', NULL, 'user', 'active', '2025-12-05 09:50:25', '2025-12-05 09:50:25'),
(49, 'Nguyễn Hồng Huy Bảo', 'huybaonguyenhong@gmail.com', NULL, '$2a$10$GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER', 'https://lh3.googleusercontent.com/a/ACg8ocJV4KAFwgJWm_3xNMcT3zT9w7CwEWizjzsKwwkTkgXwcjuxQoFh=s96-c', NULL, 'user', 'active', '2025-12-09 03:38:47', '2025-12-19 17:48:38'),
(50, 'Nguyen Huy Bao', 'huybaonguyen2004@gmail.com', NULL, '$2a$10$GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER', 'https://lh3.googleusercontent.com/a/ACg8ocLLZvAeSvdwNdFrUEqw7lrMfTWItaavMQGUg3w9SbTmYqQr8w=s96-c', NULL, 'user', 'active', '2025-12-10 01:42:28', '2025-12-10 01:42:28'),
(51, NULL, 'nammo@gmail.com', NULL, '$2b$10$WFfH419Boj.o9Z4NfS.Z7OEhjEEQbaJ5tBmUMya6EMh6QaHyz703a', NULL, NULL, 'user', 'active', '2025-12-20 09:12:13', '2025-12-20 09:12:13');

-- --------------------------------------------------------

--
-- Table structure for table `user_artists_follow`
--

CREATE TABLE `user_artists_follow` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `artist_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_artists_follow`
--

INSERT INTO `user_artists_follow` (`id`, `user_id`, `artist_id`, `created_at`) VALUES
(7, 32, 2, '2025-11-19 02:31:03'),
(8, 32, 14, '2025-11-19 02:31:38'),
(10, 46, 14, '2025-12-05 10:40:02'),
(11, 48, 126, '2025-12-09 03:17:55'),
(13, 49, 2, '2025-12-20 11:07:08');

-- --------------------------------------------------------

--
-- Table structure for table `user_favorite_artists`
--

CREATE TABLE `user_favorite_artists` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `artist_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_favorite_artists`
--

INSERT INTO `user_favorite_artists` (`id`, `user_id`, `artist_id`, `created_at`) VALUES
(60, 32, 11, '2025-11-16 16:48:03'),
(61, 32, 12, '2025-11-16 16:48:03'),
(62, 32, 14, '2025-11-16 16:48:03'),
(107, 46, 11, '2025-11-26 19:50:30'),
(108, 46, 12, '2025-11-26 19:50:30'),
(109, 46, 14, '2025-11-26 19:50:30'),
(110, 48, 11, '2025-12-05 10:53:54'),
(111, 48, 12, '2025-12-05 10:53:54'),
(112, 48, 14, '2025-12-05 10:53:54');

-- --------------------------------------------------------

--
-- Table structure for table `user_subscriptions`
--

CREATE TABLE `user_subscriptions` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subscription_plan_id` int(11) NOT NULL,
  `start_date` timestamp NULL DEFAULT current_timestamp(),
  `duration_days` int(11) NOT NULL,
  `adjusted_duration_days` int(11) DEFAULT NULL,
  `end_date` timestamp GENERATED ALWAYS AS (`start_date` + interval coalesce(`adjusted_duration_days`,`duration_days`) day) STORED,
  `status` enum('active','expired','canceled') DEFAULT 'active',
  `renewal_count` int(11) DEFAULT 0,
  `auto_renew` tinyint(1) DEFAULT 0,
  `next_renewal_date` timestamp GENERATED ALWAYS AS (`end_date` + interval coalesce(`adjusted_duration_days`,`duration_days`) day) STORED,
  `last_renewal_date` timestamp NULL DEFAULT NULL,
  `payment_status` enum('pending','completed','failed') DEFAULT 'pending',
  `payment_method_token` varchar(255) DEFAULT NULL,
  `payment_gateway` varchar(50) DEFAULT NULL,
  `prorated_amount` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_subscriptions`
--

INSERT INTO `user_subscriptions` (`id`, `user_id`, `subscription_plan_id`, `start_date`, `duration_days`, `adjusted_duration_days`, `status`, `renewal_count`, `auto_renew`, `last_renewal_date`, `payment_status`, `payment_method_token`, `payment_gateway`, `prorated_amount`, `created_at`, `updated_at`) VALUES
(1, 32, 3, '2025-12-02 22:12:28', 365, NULL, 'active', 0, 0, NULL, 'completed', NULL, 'vnpay', 0.00, '2025-12-02 22:12:28', '2025-12-02 22:12:28'),
(2, 46, 1, '2025-12-04 04:18:19', 30, NULL, 'active', 0, 0, NULL, 'completed', NULL, 'vnpay', 0.00, '2025-12-04 04:18:19', '2025-12-04 04:18:19'),
(3, 50, 3, '2025-12-10 01:43:18', 365, NULL, 'canceled', 0, 0, NULL, 'failed', NULL, 'vnpay', 0.00, '2025-12-10 01:43:18', '2025-12-10 02:19:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ads_songs`
--
ALTER TABLE `ads_songs`
  ADD PRIMARY KEY (`ad_id`);

--
-- Indexes for table `albums`
--
ALTER TABLE `albums`
  ADD PRIMARY KEY (`album_id`),
  ADD KEY `artist_id` (`artist_id`);

--
-- Indexes for table `album_songs`
--
ALTER TABLE `album_songs`
  ADD PRIMARY KEY (`album_id`,`song_id`),
  ADD KEY `song_id` (`song_id`);

--
-- Indexes for table `artists`
--
ALTER TABLE `artists`
  ADD PRIMARY KEY (`artist_id`);

--
-- Indexes for table `downloaded_songs`
--
ALTER TABLE `downloaded_songs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_song` (`user_id`,`song_id`),
  ADD KEY `song_id` (`song_id`);

--
-- Indexes for table `favorites_songs`
--
ALTER TABLE `favorites_songs`
  ADD PRIMARY KEY (`user_id`,`song_id`),
  ADD KEY `song_id` (`song_id`);

--
-- Indexes for table `favorite_albums`
--
ALTER TABLE `favorite_albums`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_favorite` (`user_id`,`album_id`),
  ADD KEY `album_id` (`album_id`);

--
-- Indexes for table `genres`
--
ALTER TABLE `genres`
  ADD PRIMARY KEY (`genre_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `listening_history`
--
ALTER TABLE `listening_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `song_id` (`song_id`);

--
-- Indexes for table `playlists`
--
ALTER TABLE `playlists`
  ADD PRIMARY KEY (`playlist_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `playlist_songs`
--
ALTER TABLE `playlist_songs`
  ADD PRIMARY KEY (`playlist_id`,`song_id`),
  ADD KEY `song_id` (`song_id`);

--
-- Indexes for table `songs`
--
ALTER TABLE `songs`
  ADD PRIMARY KEY (`song_id`),
  ADD KEY `genre_id` (`genre_id`);

--
-- Indexes for table `song_artists`
--
ALTER TABLE `song_artists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `song_id` (`song_id`),
  ADD KEY `artist_id` (`artist_id`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`);

--
-- Indexes for table `user_artists_follow`
--
ALTER TABLE `user_artists_follow`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_follow` (`user_id`,`artist_id`),
  ADD KEY `artist_id` (`artist_id`);

--
-- Indexes for table `user_favorite_artists`
--
ALTER TABLE `user_favorite_artists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `artist_id` (`artist_id`);

--
-- Indexes for table `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `chk_user_sub_unique` (`user_id`,`subscription_plan_id`,`status`),
  ADD KEY `subscription_plan_id` (`subscription_plan_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ads_songs`
--
ALTER TABLE `ads_songs`
  MODIFY `ad_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `albums`
--
ALTER TABLE `albums`
  MODIFY `album_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `artists`
--
ALTER TABLE `artists`
  MODIFY `artist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=139;

--
-- AUTO_INCREMENT for table `downloaded_songs`
--
ALTER TABLE `downloaded_songs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `favorite_albums`
--
ALTER TABLE `favorite_albums`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `genres`
--
ALTER TABLE `genres`
  MODIFY `genre_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT for table `listening_history`
--
ALTER TABLE `listening_history`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=325;

--
-- AUTO_INCREMENT for table `playlists`
--
ALTER TABLE `playlists`
  MODIFY `playlist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `songs`
--
ALTER TABLE `songs`
  MODIFY `song_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `song_artists`
--
ALTER TABLE `song_artists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `user_artists_follow`
--
ALTER TABLE `user_artists_follow`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `user_favorite_artists`
--
ALTER TABLE `user_favorite_artists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT for table `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `albums`
--
ALTER TABLE `albums`
  ADD CONSTRAINT `albums_ibfk_1` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`artist_id`) ON DELETE CASCADE;

--
-- Constraints for table `album_songs`
--
ALTER TABLE `album_songs`
  ADD CONSTRAINT `album_songs_ibfk_1` FOREIGN KEY (`album_id`) REFERENCES `albums` (`album_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `album_songs_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE;

--
-- Constraints for table `downloaded_songs`
--
ALTER TABLE `downloaded_songs`
  ADD CONSTRAINT `downloaded_songs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `downloaded_songs_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE;

--
-- Constraints for table `favorites_songs`
--
ALTER TABLE `favorites_songs`
  ADD CONSTRAINT `favorites_songs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_songs_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE;

--
-- Constraints for table `favorite_albums`
--
ALTER TABLE `favorite_albums`
  ADD CONSTRAINT `favorite_albums_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorite_albums_ibfk_2` FOREIGN KEY (`album_id`) REFERENCES `albums` (`album_id`) ON DELETE CASCADE;

--
-- Constraints for table `listening_history`
--
ALTER TABLE `listening_history`
  ADD CONSTRAINT `listening_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `listening_history_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE;

--
-- Constraints for table `playlists`
--
ALTER TABLE `playlists`
  ADD CONSTRAINT `playlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `playlist_songs`
--
ALTER TABLE `playlist_songs`
  ADD CONSTRAINT `playlist_songs_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`playlist_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `playlist_songs_ibfk_2` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE;

--
-- Constraints for table `songs`
--
ALTER TABLE `songs`
  ADD CONSTRAINT `songs_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`genre_id`);

--
-- Constraints for table `song_artists`
--
ALTER TABLE `song_artists`
  ADD CONSTRAINT `song_artists_ibfk_1` FOREIGN KEY (`song_id`) REFERENCES `songs` (`song_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `song_artists_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`artist_id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_artists_follow`
--
ALTER TABLE `user_artists_follow`
  ADD CONSTRAINT `user_artists_follow_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_artists_follow_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`artist_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_favorite_artists`
--
ALTER TABLE `user_favorite_artists`
  ADD CONSTRAINT `user_favorite_artists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_favorite_artists_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`artist_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  ADD CONSTRAINT `user_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_subscriptions_ibfk_2` FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
