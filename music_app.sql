-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 30, 2025 at 08:14 PM
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
        a.name AS artist_name,
        g.name AS genre_name
    FROM songs s
    LEFT JOIN artists a ON s.artist_id = a.artist_id
    LEFT JOIN genres g ON s.genre_id = g.genre_id
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
        s.audio_url,
        s.cover_url,
        a.name AS artist,
        g.name AS genre,
        als.track_number
    FROM album_songs als
    JOIN songs s ON als.song_id = s.song_id
    LEFT JOIN artists a ON s.artist_id = a.artist_id
    LEFT JOIN genres g ON s.genre_id = g.genre_id
    WHERE als.album_id = p_album_id
    ORDER BY als.track_number ASC, s.song_id ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `SmartToggleFavoriteAlbum` (IN `p_user_id` VARCHAR(50), IN `p_album_id` INT)   BEGIN
    -- Check if it already exists
    IF EXISTS (SELECT 1 FROM favorite_albums WHERE user_id = p_user_id AND album_id = p_album_id) THEN
        -- If yes, remove it
        DELETE FROM favorite_albums WHERE user_id = p_user_id AND album_id = p_album_id;
        SELECT 'Đã xóa khỏi yêu thích' AS message, 'removed' AS action_taken, TRUE AS status;
    ELSE
        -- If no, add it
        INSERT INTO favorite_albums (user_id, album_id) VALUES (p_user_id, p_album_id);
        SELECT 'Đã thêm vào yêu thích' AS message, 'added' AS action_taken, TRUE AS status;
    END IF;
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
(12, 'Đen', 12, 'Album', 'http://10.0.2.2:8081/music_API/online_music/album/album_cover/album_1763164837.jpeg', '2025-11-15', '2025-11-15 00:00:37', '2025-11-15 00:00:37');

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
(3, 6, 3, '2025-11-10 07:47:54'),
(3, 7, 2, '2025-11-10 07:47:54'),
(3, 8, 1, '2025-11-10 07:47:54'),
(3, 17, 4, '2025-11-10 07:47:54'),
(4, 1, 5, '2025-11-10 07:33:24'),
(4, 2, 4, '2025-11-10 07:33:24'),
(4, 17, 3, '2025-11-10 07:33:24'),
(4, 18, 2, '2025-11-10 07:33:24'),
(4, 19, 1, '2025-11-10 07:33:24'),
(5, 15, 1, '2025-11-10 07:52:30'),
(5, 16, 2, '2025-11-10 07:52:30'),
(6, 13, 4, '2025-11-11 21:23:22'),
(6, 31, 6, '2025-11-11 21:23:22'),
(6, 32, 1, '2025-11-11 21:23:22'),
(6, 33, 5, '2025-11-11 21:23:22'),
(6, 34, 3, '2025-11-11 21:23:22'),
(6, 35, 2, '2025-11-11 21:23:22'),
(9, 2, 5, '2025-11-12 00:33:36'),
(9, 3, 3, '2025-11-12 00:33:36'),
(9, 41, 4, '2025-11-12 00:33:36'),
(9, 42, 1, '2025-11-12 00:33:36'),
(9, 43, 2, '2025-11-12 00:33:36'),
(12, 36, 5, '2025-11-15 00:00:37'),
(12, 37, 3, '2025-11-15 00:00:37'),
(12, 38, 2, '2025-11-15 00:00:37'),
(12, 39, 4, '2025-11-15 00:00:37'),
(12, 40, 1, '2025-11-15 00:00:37');

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
(16, 'Kiều Phong, RyoT', NULL, NULL, '2025-11-08 22:20:26', '2025-11-08 22:20:26'),
(18, 'Hngle,  Ari', NULL, NULL, '2025-11-10 14:21:02', '2025-11-10 14:21:02'),
(19, 'Binz', NULL, NULL, '2025-11-10 14:30:34', '2025-11-10 14:30:34'),
(20, 'Low G ,  JustaTee', NULL, NULL, '2025-11-10 15:12:21', '2025-11-10 15:12:21'),
(21, 'MiiNa,  RIN9,  DREAMeR', NULL, NULL, '2025-11-10 15:14:00', '2025-11-10 15:14:00'),
(22, 'Nal', NULL, NULL, '2025-11-10 15:31:05', '2025-11-10 15:31:05'),
(23, 'Juky San ,  buitruonglinh', NULL, NULL, '2025-11-10 15:33:21', '2025-11-10 15:33:21'),
(24, 'Việt Anh', NULL, NULL, '2025-11-10 15:49:12', '2025-11-10 15:49:12'),
(25, 'ANH TRAI \"SAY HI\",  Vũ Cát Tường,  Karik', NULL, NULL, '2025-11-10 15:53:59', '2025-11-10 15:53:59'),
(27, 'ICM, Jack - J97, K-ICM', NULL, NULL, '2025-11-11 21:18:05', '2025-11-11 21:18:05'),
(28, 'Đen', NULL, NULL, '2025-11-12 00:03:24', '2025-11-12 00:03:24'),
(29, 'Đen, PiaLinh', NULL, NULL, '2025-11-12 00:04:32', '2025-11-12 00:04:32'),
(30, 'Hoàng Dũng, Đen, Bạn Nhạc.', NULL, NULL, '2025-11-12 00:05:57', '2025-11-12 00:05:57'),
(31, 'Đen, Giang Phạm, Triple D', NULL, NULL, '2025-11-12 00:07:40', '2025-11-12 00:07:40'),
(32, 'Hoàng Thùy Linh, Đen', NULL, NULL, '2025-11-12 00:08:34', '2025-11-12 00:08:34'),
(33, 'Taylor Swift, Ed Sheeran, Future', NULL, NULL, '2025-11-12 00:25:14', '2025-11-12 00:25:14'),
(79, 'Michael Jackson', 'Nghệ sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/michael_jackson.jpeg', '2025-11-16 17:19:53', '2025-11-16 17:22:33'),
(80, 'Shakira', 'Nghệ sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/shakira.webp', '2025-11-16 17:36:04', '2025-11-16 17:36:04'),
(81, 'Halsey', 'Nghệ Sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/halsey.jpeg', '2025-11-16 17:42:16', '2025-11-16 17:43:07'),
(82, 'Lana Del Rey', 'Nghệ sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/lana_del_rey.jpeg', '2025-11-16 17:44:02', '2025-11-16 17:44:02'),
(83, 'Westlife', 'Nhóm nghễ sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/westlife.jpeg', '2025-11-16 17:45:18', '2025-11-16 17:45:18'),
(84, 'P!nk,  Nate Ruess', '', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/p_nk_nate_ruess.jpeg', '2025-11-16 17:46:34', '2025-11-16 17:55:09'),
(85, 'Mark Ronson, Bruno Mars', '', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/mark_ronson_bruno_mars.jpeg', '2025-11-16 17:47:20', '2025-11-16 17:47:20'),
(86, 'The Chainsmokers, Halsey', '', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/the_chainsmokers_halsey.jpeg', '2025-11-16 17:49:56', '2025-11-16 17:49:56'),
(87, 'Michita, 愛海', '', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/michita.jpeg', '2025-11-16 18:06:50', '2025-11-16 18:06:50'),
(88, 'Wanting (Khúc Uyển Đình)', 'Nghệ Sĩ Châu Âu', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/wanting_khuc_uyen_inh.webp', '2025-11-16 18:08:42', '2025-11-16 18:08:42'),
(89, 'Kenshi Yonezu', 'Nghệ sĩ Nhật Bản', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/kenshi_yonezu.jpeg', '2025-11-16 18:11:16', '2025-11-16 18:11:16'),
(90, 'Kenshi Yonezu, Hikaru Utada', '', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/kenshi_yonezu_hikaru_utada.jpeg', '2025-11-16 18:11:50', '2025-11-16 18:11:50'),
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
(103, 'Taylor Swift', 'Nữ ca sĩ, nhạc sĩ người Mỹ nổi tiếng với các ca khúc pop và country, từng đạt nhiều giải Grammy.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/taylor_swift.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(104, 'Ed Sheeran', 'Ca sĩ, nhạc sĩ người Anh với phong cách pop, acoustic, nổi tiếng với các bản hit như \"Shape of You\" và \"Perfect\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/ed_sheeran.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(105, 'Adele', 'Ca sĩ người Anh sở hữu giọng hát nội lực, được biết đến với các ca khúc ballad đầy cảm xúc như \"Hello\" và \"Someone Like You\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/adele.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(106, 'The Weeknd', 'Ca sĩ người Canada với phong cách R&B pha lẫn pop, nổi bật với album \"After Hours\" và ca khúc \"Blinding Lights\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/the_weeknd.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(107, 'Billie Eilish', 'Ca sĩ kiêm nhạc sĩ trẻ người Mỹ, nổi tiếng với phong cách âm nhạc độc đáo và chất giọng trầm đặc trưng.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/billie_eilish.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(109, 'Ariana Grande', 'Nữ ca sĩ người Mỹ nổi tiếng với giọng hát 4 quãng tám và phong cách pop-R&B hiện đại.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/ariana_grande.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(110, 'Justin Bieber', 'Nam ca sĩ người Canada nổi lên từ YouTube, sở hữu nhiều bản hit quốc tế như \"Sorry\" và \"Peaches\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/justin_bieber.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(111, 'Olivia Rodrigo', 'Ca sĩ, nhạc sĩ trẻ người Mỹ nổi tiếng với các ca khúc pop-rock đầy cảm xúc như \"drivers license\" và \"vampire\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/olivia_rodrigo.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(112, 'Shawn Mendes', 'Ca sĩ, nhạc sĩ người Canada với phong cách pop và acoustic, nổi bật với các ca khúc \"Stitches\" và \"Treat You Better\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/shawn_mendes.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(113, 'Sơn Tùng M-TP', 'Ca sĩ, nhạc sĩ và nhà sản xuất người Việt Nam, nổi bật với các ca khúc \"Lạc Trôi\", \"Hãy Trao Cho Anh\" và \"Chúng Ta Của Hiện Tại\".', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/son_tung_m_tp.jpg', '2025-11-19 02:31:43', '2025-11-20 17:35:41'),
(114, 'Đen Vâu', 'Rapper và nhạc sĩ người Việt Nam, nổi tiếng với phong cách rap sâu lắng, truyền cảm.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/den_vau.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(115, 'Hoàng Thùy Linh', 'Ca sĩ, diễn viên người Việt Nam, nổi bật với phong cách âm nhạc dân gian đương đại.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/hoang_thuy_linh.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43'),
(117, 'Mỹ Tâm', 'Nữ ca sĩ hàng đầu Việt Nam, được mệnh danh là \"Họa mi tóc nâu\", sở hữu lượng người hâm mộ đông đảo.', 'http://10.0.2.2:8081/music_API/online_music/artist_avatar/my_tam.jpg', '2025-11-19 02:31:43', '2025-11-19 02:31:43');

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
(1, 8, 18, 'Tình Phai', 'Kiều Phong, RyoT', 'http://10.0.2.2:8081/music_API/online_music/cover/kieu_phong_ryot_tinh_phai.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/audio/18_Tình_Phai.mp3', '2025-11-09 08:23:47'),
(2, 8, 17, 'Nắng Ấm Xa Dần', 'Sơn Tùng M-TP', 'http://10.0.2.2:8081/music_API/online_music/cover/son_tung_m_tp_nang_am_xa_dan.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/audio/17_Nắng_Ấm_Xa_Dần.mp3', '2025-11-09 08:26:16'),
(3, 8, 16, 'Nếu Anh Đi', 'Mỹ Tâm', 'http://10.0.2.2:8081/music_API/online_music/cover/my_tam_neu_anh_di.jpg', 0, '/data/user/0/com.example.music_app/app_flutter/audio/16_Nếu_Anh_Đi.mp3', '2025-11-09 08:27:02'),
(4, 8, 13, 'Sóng Gió', 'Jack - J97', 'http://10.0.2.2:8081/music_API/online_music/cover/jack_j97_song_gio.jpg', 0, '/data/user/0/com.example.music_app/app_flutter/audio/13_Sóng_Gió.mp3', '2025-11-10 06:49:29'),
(5, 8, 12, 'Để Mị Nói Cho Mà Nghe', 'Hoàng Thùy Linh', 'http://10.0.2.2:8081/music_API/online_music/cover/hoang_thuy_linh_de_mi_noi_cho_ma_nghe.jpg', 0, '/data/user/0/com.example.music_app/app_flutter/audio/12_Để_Mị_Nói_Cho_Mà_Nghe.mp3', '2025-11-10 07:10:22'),
(6, 14, 27, 'Cưới Chính', 'Nal', 'http://10.0.2.2:8081/music_API/online_music/cover/nal_cuoi_chinh.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/27_Cưới_Chính.mp3', '2025-11-13 11:07:21'),
(7, 14, 26, 'Quyền Yếu Đuối', 'MiiNa,  RIN9,  DREAMeR', 'http://10.0.2.2:8081/music_API/online_music/cover/miina_rin9_dreamer_quyen_yeu_duoi.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/26_Quyền_Yếu_Đuối.mp3', '2025-11-13 10:31:02'),
(9, 14, 25, 'In Love', 'Low G ,  JustaTee', 'http://10.0.2.2:8081/music_API/online_music/cover/low_g_justatee_in_love.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/25_In_Love.mp3', '2025-11-13 11:07:34'),
(10, 14, 24, 'Em', 'Binz', 'http://10.0.2.2:8081/music_API/online_music/cover/binz_em.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/24_Em.mp3', '2025-11-13 11:09:11'),
(11, 24, 26, 'Quyền Yếu Đuối', 'MiiNa,  RIN9,  DREAMeR', 'http://10.0.2.2:8081/music_API/online_music/cover/miina_rin9_dreamer_quyen_yeu_duoi.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/26_Quyền_Yếu_Đuối.mp3', '2025-11-14 18:34:10'),
(12, 24, 25, 'In Love', 'Low G ,  JustaTee', 'http://10.0.2.2:8081/music_API/online_music/cover/low_g_justatee_in_love.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/25_In_Love.mp3', '2025-11-14 18:34:23'),
(14, 24, 27, 'Cưới Chính', 'Nal', 'http://10.0.2.2:8081/music_API/online_music/cover/nal_cuoi_chinh.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/27_Cưới_Chính.mp3', '2025-11-14 18:34:36'),
(31, 24, 29, 'Ngày Này Năm Ấy', 'Việt Anh', 'http://10.0.2.2:8081/music_API/online_music/cover/viet_anh_ngay_nay_nam_ay.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/29_Ngày_Này_Năm_Ấy.mp3', '2025-11-18 01:00:16'),
(32, 24, 24, 'Em', 'Binz', 'http://10.0.2.2:8081/music_API/online_music/cover/binz_em.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/24_Em.mp3', '2025-11-18 00:17:11'),
(33, 24, 3, 'Perfect', 'Ed Sheeran', 'http://10.0.2.2:8081/music_API/online_music/cover/ed_sheeran_perfect.jpg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/3_Perfect.mp3', '2025-11-18 00:17:16'),
(34, 24, 2, 'Shape of You', 'Ed Sheeran', 'http://10.0.2.2:8081/music_API/online_music/cover/ed_sheeran_shape_of_you.jpg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/2_Shape_of_You.mp3', '2025-11-18 00:18:15'),
(41, 32, 28, 'Người Đầu Tiên', 'Juky San ,  buitruonglinh', 'http://10.0.2.2:8081/music_API/online_music/cover/juky_san_buitruonglinh_nguoi_dau_tien.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/28_Người_Đầu_Tiên.mp3', '2025-11-20 17:00:37'),
(42, 32, 43, 'End Game', 'Taylor Swift, Ed Sheeran, Future', 'http://10.0.2.2:8081/music_API/online_music/cover/taylor_swift_ed_sheeran_future_end_game.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/43_End_Game.mp3', '2025-11-20 17:11:42'),
(43, 32, 19, 'Chắc Ai Đó Sẽ Về', 'Sơn Tùng M-TP', 'http://10.0.2.2:8081/music_API/online_music/cover/son_chac_ai_do_se_ve.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/19_Chắc_Ai_Đó_Sẽ_Về.mp3', '2025-11-20 17:13:16'),
(44, 32, 35, 'Em Gì Ơi', 'Jack - J97', 'http://10.0.2.2:8081/music_API/online_music/cover/jack_j97_em_gi_oi.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/35_Em_Gì_Ơi.mp3', '2025-11-20 17:18:44'),
(45, 32, 64, 'Cry For Me', 'Michita, 愛海', 'http://10.0.2.2:8081/music_API/online_music/cover/_cry_for_me.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/64_Cry_For_Me.mp3', '2025-11-20 17:19:19'),
(46, 32, 0, 'NGƯỜI NHƯ ANH XỨNG ĐÁNG CÔ ĐƠN', 'ANH TRAI \"SAY HI\",  Vũ Cát Tường,  Karik', 'http://10.0.2.2:8081/music_API/online_music/cover/anh_trai_say_hi_vu_cat_tuong_karik_nguoi_nhu_anh_xung_dang_co_don.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/null_NGƯỜI_NHƯ_ANH_XỨNG_ĐÁNG_CÔ_ĐƠN.mp3', '2025-11-20 17:30:12'),
(47, 32, 57, 'Night Dancer', 'imase', 'http://10.0.2.2:8081/music_API/online_music/cover/_night_dancer.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/57_Night_Dancer.mp3', '2025-11-20 17:37:35'),
(48, 32, 55, 'IRIS OUT', 'Kenshi Yonezu', 'http://10.0.2.2:8081/music_API/online_music/cover/_iris_out.jpeg', 0, '/data/user/0/com.example.music_app/app_flutter/MusicApp/downloads/55_IRIS_OUT.mp3', '2025-11-20 17:37:45');

-- --------------------------------------------------------

--
-- Table structure for table `favorite_albums`
--

CREATE TABLE `favorite_albums` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `album_id` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `favorite_albums`
--

INSERT INTO `favorite_albums` (`id`, `user_id`, `album_id`, `created_at`) VALUES
(15, '8', '3', '2025-11-09 18:05:51'),
(17, '26', '9', '2025-11-13 19:48:42'),
(18, '32', '12', '2025-11-17 05:23:45'),
(20, '32', '9', '2025-11-17 11:14:27'),
(21, '32', '5', '2025-11-17 11:26:18'),
(22, '32', '4', '2025-11-17 11:30:30'),
(24, '32', '3', '2025-11-19 23:59:36'),
(25, '45', '6', '2025-11-20 00:00:50'),
(26, '45', '12', '2025-11-20 00:01:08'),
(27, '46', '12', '2025-11-30 18:06:25'),
(28, '46', '6', '2025-11-30 18:06:30'),
(29, '46', '5', '2025-11-30 18:06:30');

-- --------------------------------------------------------

--
-- Table structure for table `favorite_songs`
--

CREATE TABLE `favorite_songs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `added_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favorite_songs`
--

INSERT INTO `favorite_songs` (`id`, `user_id`, `song_id`, `added_at`) VALUES
(4, 46, 77, '2025-11-29 13:33:45'),
(5, 46, 71, '2025-11-29 13:33:47'),
(8, 46, 75, '2025-11-29 13:59:28'),
(9, 46, 76, '2025-12-01 01:06:14'),
(10, 46, 78, '2025-12-01 01:06:15'),
(11, 46, 67, '2025-12-01 01:06:18'),
(12, 46, 66, '2025-12-01 01:06:18'),
(13, 46, 65, '2025-12-01 01:06:19'),
(14, 46, 64, '2025-12-01 01:06:20');

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
(30, 'Children', 'Nhạc thiếu nhi, vui tươi, trong sáng, dành cho trẻ em.', '2025-11-08 21:08:20'),
(31, '25', NULL, '2025-11-08 22:12:46'),
(32, 'V', NULL, '2025-11-10 15:02:00'),
(94, 'p', NULL, '2025-11-16 17:50:54');

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
(152, 32, 37, '2025-11-16 16:49:32'),
(153, 32, 17, '2025-11-16 16:49:34'),
(154, 32, 2, '2025-11-16 16:54:45'),
(155, 32, 3, '2025-11-16 16:54:46'),
(156, 32, 13, '2025-11-16 16:54:54'),
(157, 32, 31, '2025-11-16 16:54:55'),
(158, 32, 33, '2025-11-16 16:54:56'),
(159, 32, 35, '2025-11-16 16:54:57'),
(160, 32, 34, '2025-11-16 16:54:58'),
(161, 32, 11, '2025-11-16 16:55:09'),
(162, 32, 71, '2025-11-17 04:23:05'),
(163, 32, 64, '2025-11-17 04:23:14'),
(164, 32, 32, '2025-11-17 04:26:08'),
(165, 32, 57, '2025-11-17 04:40:37'),
(166, 32, 55, '2025-11-17 04:50:06'),
(167, 32, 56, '2025-11-17 04:52:43'),
(168, 32, 44, '2025-11-17 04:53:35'),
(169, 32, 45, '2025-11-17 04:57:53'),
(170, 32, 46, '2025-11-17 05:01:21'),
(171, 32, 31, '2025-11-17 05:12:08'),
(172, 32, 35, '2025-11-17 05:22:53'),
(173, 32, 38, '2025-11-17 05:23:53'),
(174, 32, 72, '2025-11-17 10:02:06'),
(175, 32, 45, '2025-11-17 10:03:16'),
(176, 32, 26, '2025-11-17 10:04:03'),
(177, 32, 3, '2025-11-17 10:04:04'),
(178, 32, 38, '2025-11-17 10:04:16'),
(179, 32, 6, '2025-11-17 10:39:12'),
(180, 32, 1, '2025-11-17 11:01:38'),
(181, 32, 37, '2025-11-17 11:01:52'),
(182, 32, 49, '2025-11-17 11:05:32'),
(183, 32, 30, '2025-11-17 11:09:01'),
(184, 32, 19, '2025-11-17 11:09:05'),
(185, 32, 13, '2025-11-17 11:25:25'),
(186, 32, 18, '2025-11-17 11:30:41'),
(187, 32, 38, '2025-11-17 11:31:54'),
(188, 32, 7, '2025-11-17 11:33:51'),
(189, 32, 35, '2025-11-17 11:36:52'),
(190, 32, 25, '2025-11-17 11:38:49'),
(191, 32, 3, '2025-11-17 11:39:23'),
(192, 32, 72, '2025-11-17 12:30:49'),
(193, 32, 35, '2025-11-17 12:49:27'),
(194, 32, 64, '2025-11-17 13:16:08'),
(195, 32, 64, '2025-11-17 14:24:23'),
(196, 32, 35, '2025-11-17 14:24:32'),
(197, 32, 7, '2025-11-17 14:31:27'),
(198, 32, 64, '2025-11-17 23:18:52'),
(199, 32, 8, '2025-11-17 23:50:40'),
(200, 32, 7, '2025-11-17 23:50:42'),
(202, 32, 24, '2025-11-18 15:10:56'),
(203, 32, 45, '2025-11-18 16:31:02'),
(204, 32, 18, '2025-11-18 17:00:11'),
(205, 32, 64, '2025-11-18 17:14:32'),
(206, 32, 8, '2025-11-18 17:50:40'),
(207, 32, 17, '2025-11-18 17:54:38'),
(208, 32, 35, '2025-11-19 03:15:06'),
(209, 32, 13, '2025-11-19 03:15:09'),
(210, 32, 64, '2025-11-19 03:29:29'),
(211, 32, 44, '2025-11-19 03:29:40'),
(212, 32, 31, '2025-11-19 03:30:15'),
(213, 32, 32, '2025-11-19 03:30:28'),
(214, 32, 33, '2025-11-19 03:30:29'),
(215, 32, 34, '2025-11-19 03:30:30'),
(216, 32, 7, '2025-11-19 03:33:09'),
(218, 45, 64, '2025-11-19 23:08:47'),
(219, 32, 22, '2025-11-19 23:38:41'),
(220, 32, 3, '2025-11-19 23:38:47'),
(221, 32, 26, '2025-11-19 23:51:34'),
(222, 32, 28, '2025-11-19 23:52:10'),
(223, 32, 18, '2025-11-19 23:52:38'),
(224, 32, 19, '2025-11-19 23:52:42'),
(225, 32, 38, '2025-11-19 23:52:48'),
(226, 32, 44, '2025-11-19 23:52:56'),
(227, 45, 26, '2025-11-20 00:01:15'),
(228, 32, 8, '2025-11-20 16:33:24'),
(229, 32, 28, '2025-11-20 16:49:07'),
(230, 32, 43, '2025-11-20 17:11:33'),
(231, 32, 35, '2025-11-20 17:13:37'),
(232, 32, 55, '2025-11-20 17:37:41'),
(233, 32, 29, '2025-11-20 17:45:00'),
(234, 32, 64, '2025-11-20 17:45:17'),
(235, 32, 38, '2025-11-20 17:45:26'),
(236, 32, 25, '2025-11-20 17:47:02'),
(237, 32, 28, '2025-11-20 17:50:02'),
(238, 32, 26, '2025-11-20 17:50:04'),
(239, 32, 30, '2025-11-20 17:54:21'),
(240, 32, 22, '2025-11-20 17:54:31'),
(241, 32, 2, '2025-11-20 17:54:34'),
(242, 32, 24, '2025-11-20 18:23:48'),
(243, 32, 8, '2025-11-20 18:28:03'),
(244, 32, 52, '2025-11-20 18:37:16'),
(245, 32, 13, '2025-11-20 18:37:19'),
(246, 32, 51, '2025-11-20 18:37:21'),
(247, 32, 50, '2025-11-20 18:37:23'),
(248, 32, 45, '2025-11-20 18:39:21'),
(249, 32, 32, '2025-11-20 23:07:25'),
(250, 32, 35, '2025-11-20 23:07:33'),
(251, 32, 34, '2025-11-20 23:07:35'),
(252, 32, 13, '2025-11-20 23:07:36'),
(253, 32, 33, '2025-11-20 23:07:37'),
(254, 32, 31, '2025-11-20 23:07:39'),
(255, 32, 8, '2025-11-20 23:07:54'),
(256, 32, 43, '2025-11-20 23:08:01'),
(257, 32, 19, '2025-11-20 23:10:03'),
(258, 32, 17, '2025-11-20 23:10:07'),
(259, 32, 7, '2025-11-20 23:10:32'),
(260, 32, 6, '2025-11-20 23:10:34'),
(261, 32, 30, '2025-11-20 23:16:30'),
(262, 32, 64, '2025-11-20 23:23:42'),
(263, 32, 42, '2025-11-20 23:26:04'),
(264, 32, 28, '2025-11-20 23:32:25'),
(265, 32, 26, '2025-11-20 23:32:30'),
(266, 32, 3, '2025-11-20 23:32:31'),
(267, 32, 44, '2025-11-20 23:32:33'),
(268, 32, 55, '2025-11-20 23:33:19'),
(269, 32, 35, '2025-11-21 03:11:35'),
(270, 32, 48, '2025-11-21 04:13:07'),
(271, 32, 48, '2025-11-21 12:16:30'),
(272, 32, 44, '2025-11-21 12:16:43'),
(273, 32, 35, '2025-11-21 12:16:58');

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
(46, 45, 'concat', 0, '2025-11-21 13:48:49', '2025-11-21 13:48:49'),
(48, 46, '123', 0, '2025-11-25 21:36:13', '2025-11-25 21:36:13'),
(53, 46, '3213', 1, '2025-11-28 00:33:24', '2025-11-28 00:33:24'),
(54, 46, '123', 0, '2025-11-29 03:17:28', '2025-11-29 03:17:28');

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
(4, 6, '2025-11-17 12:49:54'),
(4, 31, '2025-11-17 05:22:43'),
(4, 64, '2025-11-17 05:23:01'),
(5, 6, '2025-11-17 05:22:29'),
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
(35, 8, '2025-11-20 16:42:52'),
(35, 26, '2025-11-20 17:00:49'),
(35, 28, '2025-11-20 16:57:00'),
(35, 64, '2025-11-19 03:45:53'),
(36, 35, '2025-11-20 17:18:33'),
(36, 38, '2025-11-20 17:13:24'),
(36, 43, '2025-11-20 17:11:22'),
(36, 64, '2025-11-20 17:19:16'),
(37, 8, '2025-11-20 17:36:38'),
(37, 18, '2025-11-20 23:40:30'),
(37, 30, '2025-11-20 23:40:20'),
(37, 35, '2025-11-20 23:40:22'),
(37, 55, '2025-11-20 17:37:49'),
(37, 64, '2025-11-20 17:37:27'),
(46, 73, '2025-11-21 13:48:55'),
(46, 74, '2025-11-21 13:49:05'),
(46, 75, '2025-11-21 13:49:08'),
(46, 76, '2025-11-21 13:49:12'),
(48, 73, '2025-11-27 21:08:54'),
(48, 74, '2025-11-27 21:08:51'),
(48, 75, '2025-11-27 21:08:43'),
(48, 76, '2025-11-27 21:08:48'),
(48, 78, '2025-11-28 00:16:05'),
(53, 74, '2025-11-29 06:22:44'),
(53, 78, '2025-11-29 02:13:32'),
(54, 75, '2025-11-29 03:56:06'),
(54, 78, '2025-11-29 03:53:13');

-- --------------------------------------------------------

--
-- Table structure for table `songs`
--

CREATE TABLE `songs` (
  `song_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `artist_id` int(11) NOT NULL,
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

INSERT INTO `songs` (`song_id`, `title`, `artist_id`, `genre_id`, `duration`, `audio_url`, `cover_url`, `release_date`, `play_count`, `created_at`, `updated_at`, `is_top`) VALUES
(1, 'Love Story', 1, 1, 230, 'http://10.0.2.2:8081/music_API/online_music/audio/love_story.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/taylor_swift_love_story.jpg', NULL, 1, '2025-11-08 21:08:26', '2025-11-17 11:01:38', 0),
(2, 'Shape of You', 2, 1, 240, 'http://10.0.2.2:8081/music_API/online_music/audio/shape_of_you.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/ed_sheeran_shape_of_you.jpg', NULL, 13, '2025-11-08 21:08:26', '2025-11-20 17:54:34', 1),
(3, 'Perfect', 2, 1, 263, 'http://10.0.2.2:8081/music_API/online_music/audio/perfect.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/ed_sheeran_perfect.jpg', NULL, 15, '2025-11-08 21:08:26', '2025-11-20 23:32:31', 1),
(4, 'Blinding Lights', 4, 4, 201, 'http://10.0.2.2:8081/music_API/online_music/audio/blinding_lights.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/the_weeknd_blinding_lights.jpg', NULL, 0, '2025-11-08 21:08:26', '2025-11-08 21:08:26', 0),
(5, 'Save Your Tears', 4, 4, 215, 'http://10.0.2.2:8081/music_API/online_music/audio/save_your_tears.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/the_weeknd_save_your_tears.jpg', NULL, 0, '2025-11-08 21:08:26', '2025-11-08 21:08:26', 0),
(6, 'Lạc Trôi', 11, 25, 250, 'http://10.0.2.2:8081/music_API/online_music/audio/lac_troi.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/son_tung_mtp_lac_troi.jpg', NULL, 19, '2025-11-08 21:08:26', '2025-11-20 23:10:34', 0),
(7, 'Hãy Trao Cho Anh', 11, 25, 270, 'http://10.0.2.2:8081/music_API/online_music/audio/hay_trao_cho_anh.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/son_tung_mtp_hay_trao_cho_anh.jpg', NULL, 19, '2025-11-08 21:08:26', '2025-11-20 23:10:32', 0),
(8, 'Chúng Ta Của Hiện Tại', 11, 25, 280, 'http://10.0.2.2:8081/music_API/online_music/audio/chung_ta_cua_hien_tai.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/son_tung_mtp_chung_ta_cua_hien_tai.jpg', NULL, 23, '2025-11-08 21:08:26', '2025-11-20 23:33:03', 0),
(11, 'See Tình', 13, 25, 220, 'http://10.0.2.2:8081/music_API/online_music/audio/see_tinh.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/hoang_thuy_linh_see_tinh.jpg', NULL, 10, '2025-11-08 21:08:26', '2025-11-16 16:55:11', 0),
(12, 'Để Mị Nói Cho Mà Nghe', 13, 25, 240, 'http://10.0.2.2:8081/music_API/online_music/audio/de_mi_noi_cho_ma_nghe.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/hoang_thuy_linh_de_mi_noi_cho_ma_nghe.jpg', NULL, 1, '2025-11-08 21:08:26', '2025-11-14 19:59:51', 0),
(13, 'Sóng Gió', 14, 25, 250, 'http://10.0.2.2:8081/music_API/online_music/audio/song_gio.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/jack_j97_song_gio.jpg', NULL, 17, '2025-11-08 21:08:26', '2025-11-20 23:32:35', 0),
(15, 'Họa Mi Tóc Nâu', 15, 11, 260, 'http://10.0.2.2:8081/music_API/online_music/audio/hoa_mi_toc_nau.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/my_tam_hoa_mi_toc_nau.jpg', NULL, 3, '2025-11-08 21:08:26', '2025-11-15 21:45:52', 0),
(16, 'Nếu Anh Đi', 15, 11, 245, 'http://10.0.2.2:8081/music_API/online_music/audio/neu_anh_di.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/my_tam_neu_anh_di.jpg', NULL, 5, '2025-11-08 21:08:26', '2025-11-15 21:56:57', 0),
(17, 'Nắng Ấm Xa Dần', 11, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/nang_am_xa_dan.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/son_tung_m_tp_nang_am_xa_dan.jpeg', NULL, 13, '2025-11-08 22:12:47', '2025-11-20 23:21:14', 0),
(18, 'Tình Phai', 16, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/tinh_phai.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/kieu_phong_ryot_tinh_phai.jpeg', NULL, 22, '2025-11-08 22:20:26', '2025-11-19 23:52:38', 0),
(19, 'Chắc Ai Đó Sẽ Về', 11, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/chac_ai_do_se_ve.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/son_chac_ai_do_se_ve.jpeg', NULL, 8, '2025-11-08 22:29:14', '2025-11-20 23:10:26', 0),
(22, 'Không Buông', 18, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/khong_buong.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/hngle_ari_khong_buong.jpeg', NULL, 11, '2025-11-10 14:21:55', '2025-11-20 18:08:16', 1),
(24, 'Em', 19, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/em.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/binz_em.jpeg', '2025-11-10', 19, '2025-11-10 15:08:38', '2025-11-20 18:31:02', 1),
(25, 'In Love', 20, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/in_love.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/low_g_justatee_in_love.jpeg', NULL, 13, '2025-11-10 15:12:21', '2025-11-20 18:30:59', 1),
(26, 'Quyền Yếu Đuối', 21, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/quyen_yeu_duoi.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/miina_rin9_dreamer_quyen_yeu_duoi.jpeg', NULL, 15, '2025-11-10 15:14:00', '2025-11-20 23:32:30', 1),
(28, 'Người Đầu Tiên', 23, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/nguoi_dau_tien.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/juky_san_buitruonglinh_nguoi_dau_tien.jpeg', NULL, 13, '2025-11-10 15:33:22', '2025-11-20 23:32:25', 1),
(29, 'Ngày Này Năm Ấy', 24, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/ngay_nay_nam_ay.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/viet_anh_ngay_nay_nam_ay.jpeg', NULL, 19, '2025-11-10 15:49:13', '2025-11-20 18:29:37', 1),
(30, 'NGƯỜI NHƯ ANH XỨNG ĐÁNG CÔ ĐƠN', 25, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/nguoi_nhu_anh_xung_dang_co_don.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/anh_trai_say_hi_vu_cat_tuong_karik_nguoi_nhu_anh_xung_dang_co_don.jpeg', NULL, 77, '2025-11-10 15:54:00', '2025-11-20 23:37:46', 1),
(31, 'Về Bên Anh', 14, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/ve_ben_anh.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/jack_j97_ve_ben_anh.jpeg', NULL, 20, '2025-11-11 21:16:32', '2025-11-20 23:16:17', 0),
(32, 'Bạc Phận', 27, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/bac_phan.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/icm_jack_j97_k_icm_bac_phan.jpeg', NULL, 11, '2025-11-11 21:18:05', '2025-11-20 23:07:41', 0),
(33, 'Trạm Dừng Chân', 14, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/tram_dung_chan.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/jack_j97_tram_dung_chan.jpeg', NULL, 9, '2025-11-11 21:19:06', '2025-11-20 23:16:18', 0),
(34, 'Mẹ Ơi 2', 14, 5, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/me_oi_2.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/jack_j97_me_oi_2.jpeg', NULL, 7, '2025-11-11 21:20:31', '2025-11-20 23:07:35', 0),
(35, 'Em Gì Ơi', 14, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/em_gi_oi.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/jack_j97_em_gi_oi.jpeg', NULL, 38, '2025-11-11 21:21:20', '2025-11-21 12:16:58', 0),
(36, 'Vị Nhà', 28, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/vi_nha.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/en_vi_nha.jpeg', NULL, 5, '2025-11-12 00:03:25', '2025-11-15 00:17:00', 0),
(37, 'Nấu Ăn Cho Em', 29, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/nau_an_cho_em.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/en_pialinh_nau_an_cho_em.jpeg', NULL, 12, '2025-11-12 00:04:32', '2025-11-17 11:01:52', 0),
(38, 'Một Ngày Nào Đó', 30, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/mot_ngay_nao_do.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/hoang_dung_en_ban_nhac_mot_ngay_nao_do.jpeg', NULL, 17, '2025-11-12 00:05:57', '2025-11-20 17:45:25', 0),
(39, 'Người Khác Lạ', 31, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/nguoi_khac_la.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/en_giang_pham_triple_d_nguoi_khac_la.jpeg', NULL, 6, '2025-11-12 00:07:40', '2025-11-15 00:00:47', 0),
(40, 'Gieo Quẻ', 32, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/gieo_que.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/hoang_thuy_linh_en_gieo_que.jpeg', NULL, 8, '2025-11-12 00:08:34', '2025-11-15 00:00:46', 0),
(41, 'Photograph', 2, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/photograph.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/ed_sheeran_photograph.jpeg', NULL, 2, '2025-11-12 00:23:01', '2025-11-14 20:23:12', 0),
(42, 'Bad Habits', 2, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/bad_habits.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/ed_sheeran_bad_habits.jpeg', NULL, 2, '2025-11-12 00:23:55', '2025-11-20 23:26:04', 0),
(43, 'End Game', 33, 25, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/end_game.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/taylor_swift_ed_sheeran_future_end_game.jpeg', NULL, 7, '2025-11-12 00:25:14', '2025-11-20 23:26:01', 0),
(44, 'Beat It', 79, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/beat_it.mp3', 'https://upload.wikimedia.org/wikipedia/vi/6/65/Michael_Jackson_-_Beat_It_cover.jpg', NULL, 8, '2025-11-16 17:19:54', '2025-11-21 12:16:43', 0),
(45, 'Waka Waka', 80, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/waka_waka.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_waka_waka.jpeg', NULL, 5, '2025-11-16 17:38:30', '2025-11-20 18:39:21', 0),
(46, 'Sorry', 8, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/sorry.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_sorry.jpeg', NULL, 1, '2025-11-16 17:41:14', '2025-11-17 05:01:21', 0),
(47, 'Without Me', 81, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/without_me.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_without_me.jpeg', NULL, 0, '2025-11-16 17:50:55', '2025-11-16 18:00:39', 0),
(48, 'Young And Beautiful', 82, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/young_and_beautiful.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_young_and_beautiful.jpeg', NULL, 2, '2025-11-16 17:51:33', '2025-11-21 12:16:30', 0),
(49, 'You Belong With Me', 1, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/you_belong_with_me.mp3', 'https://upload.wikimedia.org/wikipedia/vi/b/b9/Taylor_Swift_-_You_Belong_with_Me.png', NULL, 1, '2025-11-16 17:52:12', '2025-11-17 11:05:32', 0),
(50, 'You Raise Me Up', 83, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/you_raise_me_up.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_you_raise_me_up.jpeg', NULL, 2, '2025-11-16 17:52:51', '2025-11-20 18:39:08', 0),
(51, 'Just Give Me a Reason', 84, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/just_give_me_a_reason.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_just_give_me_a_reason.jpeg', NULL, 1, '2025-11-16 17:55:54', '2025-11-20 18:37:21', 0),
(52, 'Uptown Funk', 85, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/uptown_funk.mp3', 'https://upload.wikimedia.org/wikipedia/en/a/a7/Mark_Ronson_-_Uptown_Funk_%28feat._Bruno_Mars%29_%28Official_Single_Cover%29.png', NULL, 1, '2025-11-16 17:56:30', '2025-11-20 18:37:16', 0),
(53, 'Closer', 86, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/closer.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_closer.jpeg', NULL, 0, '2025-11-16 17:58:02', '2025-11-16 17:58:33', 0),
(54, 'Jar Of Love', 88, 1, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/jar_of_love.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_jar_of_love.jpeg', NULL, 0, '2025-11-16 18:09:42', '2025-11-16 18:09:42', 0),
(55, 'IRIS OUT', 89, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/iris_out.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_iris_out.jpeg', NULL, 15, '2025-11-16 18:18:24', '2025-11-20 23:33:19', 0),
(56, 'JANE DOE', 90, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/jane_doe.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_jane_doe.jpeg', NULL, 1, '2025-11-16 18:19:14', '2025-11-17 04:52:43', 0),
(57, 'Night Dancer', 91, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/night_dancer.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_night_dancer.jpeg', NULL, 5, '2025-11-16 18:20:26', '2025-11-20 23:29:23', 0),
(58, 'Tabun', 92, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/tabun.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_tabun.jpeg', NULL, 0, '2025-11-16 18:21:07', '2025-11-16 18:21:07', 0),
(59, 'Lemon', 89, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/lemon.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_lemon.jpeg', NULL, 0, '2025-11-16 18:21:50', '2025-11-16 18:21:50', 0),
(60, 'Shinunoga E-Wa', 93, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/shinunoga_e_wa.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_shinunoga_e_wa.jpeg', NULL, 0, '2025-11-16 18:22:31', '2025-11-16 18:22:31', 0),
(61, 'Yoru Ni Kakeru / 夜に駆ける', 92, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/yoru_ni_kakeru_夜に駆ける.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_yoru_ni_kakeru.jpeg', NULL, 0, '2025-11-16 18:23:08', '2025-11-16 18:23:08', 0),
(62, 'Idol / アイドル', 92, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/idoi_アイドル.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_idoi.jpeg', NULL, 0, '2025-11-16 18:23:50', '2025-11-16 18:23:50', 0),
(63, 'まつり', 93, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/まつり.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_.jpeg', NULL, 0, '2025-11-16 18:24:57', '2025-11-16 18:24:57', 0),
(64, 'Cry For Me', 87, 15, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/cry_for_me.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_cry_for_me.jpeg', NULL, 32, '2025-11-16 18:29:32', '2025-11-20 23:44:02', 0),
(65, 'Fiction', 95, 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/fiction.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_fiction.jpeg', NULL, 0, '2025-11-16 18:38:22', '2025-11-16 18:38:22', 0),
(66, 'Love Lee', 96, 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/love_lee.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_love_lee.jpeg', NULL, 0, '2025-11-16 18:39:19', '2025-11-16 18:39:19', 0),
(67, 'The Boys', 97, 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/the_boys.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_the_boys.jpeg', NULL, 0, '2025-11-16 18:40:02', '2025-11-16 18:40:02', 0),
(68, 'Fantastic Baby', 98, 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/fantastic_baby.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_fantastic_baby.jpeg', NULL, 0, '2025-11-16 18:40:42', '2025-11-16 18:40:42', 0),
(69, 'Island', 99, 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/island.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_island.jpeg', NULL, 0, '2025-11-16 18:41:28', '2025-11-16 18:41:28', 0),
(70, 'FAKE LOVE', 100, 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/fake_love.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_fake_love.jpeg', NULL, 0, '2025-11-16 18:42:01', '2025-11-16 18:42:01', 0),
(71, 'Gangnam Style', 101, 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/gangnam_style.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_gangnam_style.jpeg', NULL, 1, '2025-11-16 18:42:33', '2025-11-17 04:23:05', 0),
(72, 'Nobody', 102, 14, 0, 'http://10.0.2.2:8081/music_API/online_music/audio/nobody.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/_nobody.jpeg', NULL, 3, '2025-11-16 18:43:18', '2025-11-17 12:30:50', 0),
(73, 'Shinunoga E-Wa', 93, 31, 0, 'http://localhost:8081/music_API/online_music/audio/shinunoga_e_wa.mp3', 'http://localhost:8081/music_API/online_music/cover/_shinunoga_e_wa.jpeg', NULL, 0, '2025-11-21 13:48:55', '2025-11-21 13:48:55', 0),
(74, 'Sorry', 8, 31, 0, 'http://localhost:8081/music_API/online_music/audio/sorry.mp3', 'http://localhost:8081/music_API/online_music/cover/_sorry.jpeg', NULL, 0, '2025-11-21 13:49:05', '2025-11-21 13:49:05', 0),
(75, 'Waka Waka', 80, 31, 0, 'http://localhost:8081/music_API/online_music/audio/waka_waka.mp3', 'http://localhost:8081/music_API/online_music/cover/_waka_waka.jpeg', NULL, 0, '2025-11-21 13:49:08', '2025-11-21 13:49:08', 0),
(76, 'Gieo Quẻ', 32, 31, 0, 'http://localhost:8081/music_API/online_music/audio/gieo_que.mp3', 'http://localhost:8081/music_API/online_music/cover/hoang_thuy_linh_en_gieo_que.jpeg', NULL, 0, '2025-11-21 13:49:12', '2025-11-21 13:49:12', 0),
(77, 'Anh Sai Rồi', 11, 10, 205, 'http://10.0.2.2:8081/music_API/online_music/audio/son_tung_m_tp_anh_sai_roi_1764245079.mp3', 'http://10.0.2.2:8081/music_API/online_music/cover/son_tung_m_tp_anh_sai_roi_cover_1764245079.jpg', NULL, 0, '2025-11-27 12:04:39', '2025-11-27 12:04:39', 0),
(78, 'Anh Sai Rồi', 11, 31, 0, 'http://localhost:8081/music_API/online_music/audio/son_tung_m_tp_anh_sai_roi_1764245079.mp3', 'http://localhost:8081/music_API/online_music/cover/son_tung_m_tp_anh_sai_roi_cover_1764245079.jpg', NULL, 0, '2025-11-28 00:16:05', '2025-11-28 00:16:05', 0);

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
) ;

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
  `transaction_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `plan_id`, `plan_name`, `amount`, `status`, `payment_method`, `transaction_date`, `created_at`) VALUES
('1763463943954', 32, 1, '1 tháng', 49000, 'completed', 'VNPay', '2025-11-18 18:05:43', '2025-11-18 18:05:43'),
('1763586499716', 32, 1, '1 tháng', 49000, 'pending', 'VNPay', '2025-11-20 04:08:19', '2025-11-20 04:08:19'),
('1763586510962', 32, 1, '1 tháng', 49000, 'pending', 'VNPay', '2025-11-20 04:08:30', '2025-11-20 04:08:30'),
('1763588495778', 36, 1, '1 tháng', 49000, 'completed', 'VNPay', '2025-11-20 04:42:15', '2025-11-20 04:41:35'),
('1763588923204', 36, 1, '1 tháng', 49000, 'completed', 'VNPay', '2025-11-20 04:49:31', '2025-11-20 04:48:43'),
('1763872513391', 46, 1, '1 tháng', 49000, 'pending', 'VNPay', '2025-11-23 04:35:13', '2025-11-23 11:35:13'),
('POnlineMusicWeb_1764527420079_57', 46, 1, '1 tháng', 49000, 'pending', 'VNPay', NULL, '2025-12-01 01:30:20'),
('POnlineMusicWeb_1764527601155_337', 46, 3, '1 năm', 499000, 'completed', 'VNPay', '2025-12-01 01:34:43', '2025-12-01 01:33:21');

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
  `status` enum('active','banned') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `phone_number`, `password_hash`, `avatar_url`, `date_of_birth`, `role`, `status`, `created_at`, `updated_at`) VALUES
(32, 'Thanh Đình', 'thanhdinh1806.tphcm@gmail.com', NULL, '#', 'https://lh3.googleusercontent.com/a/ACg8ocLB1hb9PlcCAsBXVLL5121WlKlpe8hulQkAyto4nEYhPJjpcQ=s96-c', NULL, 'user', 'active', '2025-11-16 16:47:58', '2025-11-28 00:09:18'),
(36, 'Đình Thanh', 'dangthanhdinh.1806@gmail.com', NULL, '#', 'https://lh3.googleusercontent.com/a/ACg8ocI-qcPPlV369oRzT9J0EGoqU8jrfHxLFfTdue7czOSzHRWLtA=s96-c', NULL, 'user', 'active', '2025-11-19 21:41:00', '2025-11-19 21:41:00'),
(45, 'Thanh Đình Nguyễn Ngô', 'nguyenngothanhdinh.hvt@gmail.com', NULL, '#', 'https://lh3.googleusercontent.com/a/ACg8ocKYNfyZ4lXvrH2w4nQ1Xwu7AVk-pHcwzF5R3AmxuazRfliC_GM=s96-c', NULL, 'user', 'active', '2025-11-19 23:07:04', '2025-11-19 23:07:04'),
(46, 'Nguyễn Hồng Huy Bảo', 'huybaonguyenhong@gmail.com', NULL, '$2a$10$GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER', 'https://lh3.googleusercontent.com/a/ACg8ocJV4KAFwgJWm_3xNMcT3zT9w7CwEWizjzsKwwkTkgXwcjuxQoFh=s96-c', NULL, 'user', 'active', '2025-11-21 14:41:09', '2025-11-27 22:43:38'),
(47, 'admin1', 'admin1@example.com', '0329944649', '$2b$10$bqTFQg8QYxoqhh7LaeRpfuiobv7QlyseH3ARrB/Fi4rfYkvuF0wYK', '/uploads/avatars/avatar-1764070203040-179363556.jpg', '1989-12-31', 'admin', 'active', '2025-11-23 05:12:24', '2025-11-25 11:30:03'),
(48, 'Nguyen Huy Bao', 'huybaonguyen2004@gmail.com', NULL, '$2a$10$GOOGLE_OAUTH_USER_NO_PASSWORD_HASH_PLACEHOLDER', 'https://lh3.googleusercontent.com/a/ACg8ocLLZvAeSvdwNdFrUEqw7lrMfTWItaavMQGUg3w9SbTmYqQr8w=s96-c', NULL, 'user', 'banned', '2025-11-27 21:42:25', '2025-11-28 00:09:14'),
(49, NULL, '123asd@gmail.com', NULL, '$2b$10$FRXXEwJTPfMGQaIZp5uOMOysSke1/GAn7jCdRJchvZVpa//Fc6t5u', NULL, NULL, 'user', 'active', '2025-11-28 00:13:19', '2025-11-28 00:13:19');

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
(8, 32, 14, '2025-11-19 02:31:38');

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
(75, 36, 14, '2025-11-19 21:41:28'),
(76, 36, 11, '2025-11-19 21:41:28'),
(77, 36, 80, '2025-11-19 21:41:28'),
(78, 36, 15, '2025-11-19 21:41:28'),
(104, 45, 11, '2025-11-19 23:07:08'),
(105, 45, 12, '2025-11-19 23:07:08'),
(106, 45, 14, '2025-11-19 23:07:08');

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
(1, 32, 1, '2025-11-18 11:06:44', 30, NULL, 'active', 0, 0, NULL, 'completed', NULL, NULL, 0.00, '2025-11-18 11:06:44', '2025-11-18 11:06:44'),
(5, 36, 1, '2025-11-19 21:42:15', 30, NULL, 'active', 0, 0, NULL, 'completed', NULL, 'vnpay', 0.00, '2025-11-19 21:42:15', '2025-11-19 21:49:31'),
(12, 46, 3, '2025-11-30 18:35:10', 365, NULL, 'active', 0, 0, NULL, 'completed', NULL, 'vnpay', 0.00, '2025-11-30 18:35:10', '2025-11-30 18:35:10');

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
  ADD UNIQUE KEY `unique_song` (`user_id`,`song_id`);

--
-- Indexes for table `favorite_albums`
--
ALTER TABLE `favorite_albums`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_favorite` (`user_id`,`album_id`);

--
-- Indexes for table `favorite_songs`
--
ALTER TABLE `favorite_songs`
  ADD PRIMARY KEY (`id`);

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
  ADD KEY `artist_id` (`artist_id`),
  ADD KEY `genre_id` (`genre_id`);

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
  MODIFY `album_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `artists`
--
ALTER TABLE `artists`
  MODIFY `artist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=118;

--
-- AUTO_INCREMENT for table `downloaded_songs`
--
ALTER TABLE `downloaded_songs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `favorite_albums`
--
ALTER TABLE `favorite_albums`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `favorite_songs`
--
ALTER TABLE `favorite_songs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `genres`
--
ALTER TABLE `genres`
  MODIFY `genre_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `listening_history`
--
ALTER TABLE `listening_history`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=274;

--
-- AUTO_INCREMENT for table `playlists`
--
ALTER TABLE `playlists`
  MODIFY `playlist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `songs`
--
ALTER TABLE `songs`
  MODIFY `song_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `user_artists_follow`
--
ALTER TABLE `user_artists_follow`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user_favorite_artists`
--
ALTER TABLE `user_favorite_artists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=114;

--
-- AUTO_INCREMENT for table `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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
  ADD CONSTRAINT `songs_ibfk_1` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`artist_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `songs_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`genre_id`);

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
